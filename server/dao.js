'use strict';

const sqlite = require('sqlite3');
const crypto = require('crypto');

// open the database
const db = new sqlite.Database('carico_didattico.db', (err) => {
  if (err) throw err;
});

/*** COURSES Data Access Object ***/

// Get all courses
exports.listCourses = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT  c.id, c.name, c.cfu, p.signed_up, c.max_students, c.preparatory, c.incompatibility FROM COURSES c LEFT OUTER JOIN (SELECT course_id, COUNT(*) AS signed_up FROM STUDY_PLAN GROUP BY course_id) p ON c.id = p.course_id';

    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const courses = rows.map((course) => {
        // retrive an array of incompatibilities
        if (course.incompatibility) {
          const incompArray = course.incompatibility.split(',');
          course.incompatibility = incompArray;
        }
        if (!course.signed_up) {
          course.signed_up = 0;
        }
        return Object.assign({}, course)
      });
      resolve(courses);
    });

  });
}

// Get a course by id
exports.getCourse = (courseId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT  c.id, c.name, c.cfu, p.signed_up, c.max_students, c.preparatory, c.incompatibility FROM COURSES c LEFT OUTER JOIN (SELECT course_id, COUNT(*) AS signed_up FROM STUDY_PLAN GROUP BY course_id) p ON c.id = p.course_id WHERE c.id=?';

    db.get(sql, [courseId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      let course = row;
      if (course.incompatibility) {
        const incompArray = course.incompatibility.split(',');
        course.incompatibility = incompArray;
      }
      if (!course.signed_up) {
        course.signed_up = 0;
      }
      resolve(Object.assign({}, course));
    });

  });
}

// Get study plan
exports.getPlan = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT course_id FROM study_plan WHERE student_id=?'

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const plan = rows.map(c_id => c_id.course_id);
      resolve(plan);
    });

  });
}

// Create a study plan or update its type
exports.updatePlanType = (userId, type) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE students SET type=? WHERE id=?';

    db.run(sql, [type, userId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(type);
    });
  });

}

// Delete a study plan
exports.deletePlan = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE students SET type=NULL WHERE id=?';

    db.run(sql, [userId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(null);
    });

  });
}

exports.erasePlan = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM study_plan WHERE student_id=?';

    db.run(sql, [userId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  })
}

// Add courses to the study plan
exports.insertCourse = (userId, courseId) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO study_plan(student_id, course_id) VALUES(?, ?)';

    db.run(sql, [userId, courseId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(null);
    })
  });
};


/*** USER Data Access Object ***/

// Get user by id
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM students WHERE id = ?';

    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
        const user = { id: row.id, username: row.email, name: row.name, surname: row.surname, type: row.type }
        resolve(user);
      }
    });
  });
};

// Autenticate the user
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM students WHERE email = ?';

    db.get(sql, [email], (err, row) => {
      if (err) { reject(err); }
      else if (row === undefined) { resolve(false); }
      else {
        const user = { id: row.id, username: row.email, name: row.name, surname: row.surname, type: row.type };
        const salt = row.salt;

        crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
          if (err) reject(err);

          const passwordHex = Buffer.from(row.password, 'hex');

          if (!crypto.timingSafeEqual(passwordHex, hashedPassword))
            resolve(false);
          else resolve(user);
        });
      }
    });
  });
};





