import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';

import Navigation from './components/Navigation';
import WrapperCourses from './components/WrapperCourses';
import PlanType from './components/PlanTypeForm';
import { LoginForm } from './components/Login';
import API from './API';

function App() {
  return (
    <Router>
      <App2 />
    </Router>
  );
}

function App2() {
  const [courses, setCourses] = useState([]);       // List of courses
  const [plan, setPlan] = useState([]);             // Study plan
  const [planType, setPlanType] = useState(null);   // 'full-time' or 'part-time' or null
  const [form, setForm] = useState(true);           // Used in WrapperCorsi to show the FormButtons component
  const [typeForm, setTypeForm] = useState(false);  // Used to show the PlanTypeForm component

  const [dirty, setDirty] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});

  // Error handler
  function handleErrors(err) {
    console.log(err);
  }

  /*** APPLICATION ***/

  // Courses and study plan
  useEffect(() => {
    if (dirty) {
      API.getCourses() // get courses
        .then(courses => { // set local courses
          setCourses(courses);
          setDirty(false);
          setInitialLoading(false);
        })
        .catch(err => {
          handleErrors(err);
          setMessage('Impossibile comunicare col server.');
          setInitialLoading(false);
        });
    }
  }, [loggedIn, dirty, planType]);


  useEffect(() => {
    if (loggedIn && planType) {
      // getCourse is a needed callback but it's wrong to iclude it in the dependences (this is why there is a warning)
      API.getStudyPlan(getCourse) 
        .then(study_plan => {
          setPlan(study_plan);
          setInitialLoading(false);
        })
        .catch(err => {
          handleErrors(err);
          setMessage('Impossibile comunicare col server.');
          setInitialLoading(false);
        })
    }
  }, [loggedIn, dirty, courses, planType])


  /*** SERVER INTERACTION ***/

  async function erasePlan() {
    if (loggedIn) {
      setPlan([]);
      setPlanType(null);

      API.deleteStudyPlan()
        .then(() => setDirty(true))
        .catch(err => handleErrors(err));
    }
  }

  async function modifyStudyPlan() {
    if (!loggedIn || !planType) { // It should not happen but just in case..
      return 'ERRORE';
    }
    if (plan.length === 0) {
      setMessage('Il piano di studi non può essere vuoto.');
      return;
    }

    // Wrong number of cfu
    const cfu = plan.map(course => course.cfu).reduce((a, b) => a + b);

    if (planType === 'full-time' && (cfu < 60 || cfu > 80)) {
      setMessage('Numero di cfu non lecito. Un piano di studi full-time deve avere i 60 e gli 80 cfu.');
      return;
    }
    if (planType === 'part-time' && (cfu < 20 || cfu > 40)) {
      setMessage('Numero di cfu non lecito. Un piano di studi part-time deve avere i 20 e gli 40 cfu.');
      return;
    }

    // The preparatory and incompatibility constraints are managed by disabling the form buttons

    // Propose the new study plan to the server
    const lastPlanType = planType;

    await API.setPlanType(planType) // user's type = 'full-time' or 'part-time'
      .then(type => setPlanType(type)) // Propagate the change locally
      .catch(err => handleErrors(err));

    await API.modifyStudyPlan(plan) // Propose the new study plan to the server
      .then(() => { // New study plan accepted
        setForm(false);
        setDirty(true);
      })
      .catch(async (err) => {
        await API.setPlanType(lastPlanType) // New study plan rejected -> undo the previous change on the server
          .then(type => setPlanType(type))
          .catch(err => handleErrors(err));
        setMessage('Modifica non riuscita, ritentare.');
        handleErrors(err);
      })
  }

  function cancelModify() {
    if (loggedIn) {
      setForm(false);
      setPlanType(user.type);
      if (user.type === null)
        setPlan([]);

      setDirty(true); // Force a refresh of info
    }
  }


  /*** LOCAL ***/

  // Add the course to the study plan
  function addCourse(course) {
    if (plan.find(c => c.id === course.id))
      return;
    setPlan(actualPlan => [...actualPlan, course]);
  }

  // Removes a course from the study plan
  function removeCourse(courseId) {
    setPlan(courses => courses.filter(c => c.id !== courseId));
  }

  // Check if a course is insertable into the study plan
  function isCourseInsertable(course) {
    let errstr = 'Incompatibile con';

    // Course full
    if (course.max_students && course.signed_up === course.max_students) {
      return 'Il corso ha raggiunto il numero massimo di studenti';
    }

    // Incompatible course alrady in the study plan
    if (course.incompatibility) {
      const inc = course.incompatibility
        .map(c_id => {
          const attendant = intoPlan(c_id);
          if (attendant) errstr += ` "${c_id}"`;
          return attendant;
        })
        .includes(true);

      if (inc) return errstr;
    }

    // Preparatory course absent in the study plan
    if (course.preparatory && intoPlan(course.preparatory) === false) {
      return `Il corso propedeutico ${course.preparatory} non è nel piano di studi`;
    }

    return true;
  }

  // Check if a course is removable from the study plan
  function isCourseRemovable(course) {
    const whoNeedIt = getPreparatories(course.id);

    if (whoNeedIt.length > 0) {
      let errstr = 'Questo corso è propedeutico per ' + whoNeedIt.join(', ');
      return errstr;
    }

    return true;
  }

  function getPreparatories(courseId) {
    return plan.filter((c) => c.preparatory && c.preparatory === courseId).map(c => `${c.id}`);
  }

  function getCourse(courseId) {
    return courses.find(c => c.id === courseId)
  }

  // Is the course inside the study plan?
  function intoPlan(courseId) {
    return plan.find(c => c.id === courseId) ? true : false;
  }

  // Choose the type of the study plan (locally, no server interaction)
  function chooseType(choose) {
    if (choose === 'full-time')
      setPlanType('full-time');
    else if (choose === 'part-time')
      setPlanType('part-time');
    else return;

    setTypeForm(false);
    setForm(true);
  }

  function showTypeForm() {
    if (typeForm)
      return;
    else setTypeForm(true);
  }


  /*** USER ***/

  async function doLogIn(credentials) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await API.logIn(credentials);
        setUser(user);
        setPlanType(user.type);
        if (user.type) setForm(false);

        setDirty(true);
        setLoggedIn(true);
        setInitialLoading(true);
        resolve(null);
      }
      catch (err) {
        reject(`Login non riuscito`);
      }
    });

  }

  async function doLogOut() {
    await API.logOut();
    setUser({});
    setPlan([]);
    setLoggedIn(false);
    setInitialLoading(true);
    setDirty(true);
  }

  return (
    <Container fluid>
      <Row>
        <Navigation
          loggedIn={loggedIn}
          user={user}
          onLogOut={doLogOut} />
      </Row>
      {message ?
        <Row><Col>
          <Alert variant='danger' onClose={() => setMessage('')} dismissible>{message}</Alert>
        </Col></Row>
        : <></>
      }



      <Routes>
        <Route
          path='/'
          element=
          {<>
            {initialLoading
              ? <Loading />
              : <></>}
            {loggedIn && !initialLoading
              ? (planType ?
                <><Row>
                  <WrapperCourses
                    title='Piano di studi'
                    loggedIn={loggedIn}
                    courses={plan}
                    isPlan={true}
                    form={form && planType}
                    setForm={setForm}
                    getCourse={getCourse}
                    addCourse={addCourse}
                    removeCourse={removeCourse}
                    intoPlan={intoPlan}
                    planType={planType}
                    showTypeForm={showTypeForm}
                    isCourseInsertable={isCourseInsertable}
                    erasePlan={erasePlan}
                    cancelModify={cancelModify}
                    handleSubmit={modifyStudyPlan}
                    isCourseRemovable={isCourseRemovable}
                  />
                </Row><br /></>
                : <><Row>
                  <Col xs={3} />
                  <Col xs={6} className='d-grid gap-2'>
                    <Button variant='outline-success' size='lg' onClick={() => setTypeForm(true)}>
                      <b>Compila il piano di studi</b>
                    </Button>
                  </Col>
                  <Col xs={3} />
                </Row><br /></>
              )
              : <></>
            }
            {typeForm
              ? <PlanType show={planType ? true : false} chooseType={chooseType} />
              : <></>
            }
            {!initialLoading
              ? <><Row>
                <WrapperCourses
                  title='Corsi'
                  loggedIn={loggedIn}
                  courses={courses}
                  isPlan={false}
                  form={form && planType}
                  setForm={setForm}
                  getCourse={getCourse}
                  addCourse={addCourse}
                  removeCourse={removeCourse}
                  intoPlan={intoPlan}
                  planType={planType}
                  isCourseInsertable={isCourseInsertable}
                />
              </Row><br /></>
              : <></>
            }
          </>
          }

        />

        <Route
          path='/login'
          element={
            loggedIn
              ? <Navigate to='/' />
              : <LoginForm login={doLogIn} setInitialLoading={setInitialLoading} />
          }
        />
      </Routes>
    </Container >
  );
}

function Loading(props) {
  return (
    <>
      <Container fluid>
        <Row >
          <Col lg='4' />
          <Col>
            <Alert variant="success">
              <h3><Spinner
                as="span"
                animation="grow"
                size="xl"
                role="status"
                aria-hidden="true"
              />
                {' Loading data...'}</h3>
            </Alert>
          </Col>
          <Col lg='4' />
        </Row>

      </Container>
    </>
  )
}


export default App;
