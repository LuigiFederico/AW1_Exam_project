'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dao = require('./dao'); // module for accessing the DB
const { check, validationResult } = require('express-validator'); // validation middleware
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local'); // username and password for login
const session = require('express-session'); // enable sessions


/*** Set up Passport ***/
passport.use(new LocalStrategy(
  function verify(username, password, done) {
    dao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, user); // valid credentials
    })
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  dao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});


/*** Init express and setup middlewares ***/
const app = new express();
const port = 3001;
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(morgan('dev'));
app.use(express.json());
app.use(cors(corsOptions));

// Custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();
  return res.status(401).json({ error: 'not authenticated' });
}


/*** Set up the session and init passport ***/
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: '- Applicazioni Web I -',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


/*** Other functions ***/

// Format express-validate errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};



/*** APIs ***/

// GET /api/courses --> get all courses
app.get('/api/courses',
  [],
  async (req, res) => {
    dao.listCourses()
      .then(courses => res.json(courses))
      .catch(() => res.status(500).end());
  });

// GET /api/study_plan --> get the logged user's study plan
app.get('/api/study_plan',
  isLoggedIn,
  [],
  async (req, res) => {
    dao.getPlan(req.user.id)
      .then(plan => res.json(plan))
      .catch(() => res.status(500).end())
  }
);

// PUT /api/study_plan/:type --> modify the type of the study plan
app.put('/api/study_plan/:type',
  isLoggedIn,
  [check('type').isString()],
  async (req, res) => {
    const error = validationResult(req).formatWith(errorFormatter); // format error message

    if (!error.isEmpty()) {
      return res.status(422).json({ error: error });
    }
    if (req.params.type !== 'full-time' && req.params.type !== 'part-time') {
      return res.status(422).json({ error: `type ${type} format not valid` });
    }

    dao.updatePlanType(req.user.id, req.params.type)
      .then(type => res.json(type))
      .catch((err) => res.status(503).json({ error: `database error during the update of the type attribute of the logged user: ${err}` }));
  });

// DELETE /api/study_plan/erase --> erase the study plan
app.delete('/api/study_plan/erase',
  isLoggedIn,
  [],
  async (req, res) => {
    dao.deletePlan(req.user.id)
      .then(dao.erasePlan(req.user.id))
      .then(() => res.json({}))
      .catch((err) => res.status(503).json({ error: `database error during the delection of the study plan: ${err}` }));
  });

// PUT /api/study_plan --> modify the study plan
app.put('/api/study_plan',
  isLoggedIn,
  [
    check('courses').isArray({ min: 1 }),
    check('courses.*').isLength({ min: 7, max: 7 }),
    check('courses.*').isString()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message

    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(', ') });
    }
    // Existance of the study plan
    if (!req.user.type) {
      return res.status(422).json({ error: 'The logged user does not have a study plan.' })
    }

    // Check if the proposed study plan is legal
    function isCourseLegal(course, study_plan) {
      return new Promise((resolve, reject) => {
        // prevent to go further if the getCourse() gone wrong
        if (!course.id) {
          reject(`The course does not exist.`);
          return;
        }

        // course fullness
        const countTheUser = study_plan && study_plan.includes(course.id) ? 0 : 1;

        if (course.max_students && course.signed_up + countTheUser > course.max_students) {
          reject(`The course ${course.id} is full.`);
          return;
        }

        // preparatory course not present
        if (course.preparatory && req.body.courses.includes(course.preparatory) === false) {
          reject(`The course ${course.id} require to have the course ${course.preparatory} in the study plan.`);
          console.log('2');
          return;
        }

        // incompatible courses
        if (course.incompatibility) {
          course.incompatibility.forEach(inc => {
            if (req.body.courses.includes(inc)) { // If one is rejected, the next 'reject()' will be ignored and the Promise will be rejected correctly
              reject(`The course ${course.id} is incompatible with the course ${inc}.`);
              console.log('3');
            }
          });
        }

        resolve(course.cfu);
      });
    }

    async function checkCourses(courses) {
      return new Promise(async (resolve, reject) => {
        let cfu = 0;
        let legal = true;

        const incrementCFU = (credits) => {
          cfu = cfu + credits;
        }

        let study_plan;
        try {
          study_plan = await dao.getPlan(req.user.id)
        } catch (err) {
          reject(err);
          return;
        }

        for (let c_id of courses) {
          if (legal) {
            await dao.getCourse(c_id)
              .then(course => isCourseLegal(course, study_plan))
              .then(credits => incrementCFU(credits))
              .catch(err => { legal = false; reject(err); })
          } else break;
        }
        resolve(cfu);
      });
    }

    async function isPlanLegal(courses, type) { // courses is an array of course ids
      return new Promise(async (resolve, reject) => {
        let errstr = 'Illegal number of cfu';
        const minCfu = type === 'full-time' ? 60 : 20;
        const maxCfu = type === 'full-time' ? 80 : 40;

        try {
          const cfu = await checkCourses(courses);
          if (cfu < minCfu || cfu > maxCfu) {
            reject('Illegal number of cfu');
          } else resolve(true);
        } catch (err) {
          reject(err.error);
        }

      });
    }

    let errstr = '';
    await isPlanLegal(req.body.courses, req.user.type)
      .catch(err => {errstr = err});

    if (errstr !== '')
      return res.status(422).json({ error: `The proposed study plan is not legal: ${errstr}` });


    // Now we know that the proposed study plan is legal

    // Insert each course into the study plan
    function insertCourses() {
      return new Promise(async (resolve, reject) => {
        let rejected = false; // prevent new iterations after a reject

        for (let c_id of req.body.courses) {
          if (!rejected) {
            await dao.insertCourse(req.user.id, c_id)
              .catch((err) => { errstr = err; rejected = true; });
          } else break;
        }

        rejected
          ? reject(`An error occurred meanwhile the insertion of a course: ${errstr}`)
          : resolve(null);
      });
    }


    dao.erasePlan(req.user.id) // erase the old study plan
      .then(() => insertCourses()) // load the new study plan
      .then(() => res.json({}))
      .catch(err => res.status(503).json({ error: `database error: ${err}` }))
  }
);


/***  USER APIs ***/

// Login: POST /sessions
app.post('/api/sessions',
  [
    check('username').isEmail()
  ],
  function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
      if (err)
        return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json(info);
      }
      // success, perform the login
      req.login(user, (err) => {
        if (err)
          return next(err);

        // req.user contains the authenticated user, so send all the user info back
        // this is coming from dao.getUser()
        return res.json(req.user);
      });
    })(req, res, next);
  });

// Logout: DELETE /sessions/current
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => { res.end(); });
});

// GET /sessions/current -> check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated())
    res.status(200).json(req.user);
  else
    res.status(401).json({ error: 'Unauthenticated user!' });;
});

/*** Activate the server ***/
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});