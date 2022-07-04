const URL = 'http://localhost:3001/';

/*** COURSE API ***/

// Propagate the json or handle the error
function getJson(httpResponse) {
  return new Promise((resolve, reject) => {
    httpResponse // http responce from a fatch
      .then((response) => {
        if (response.ok) {
          response.json()
            .then(json => resolve(json))
            .catch(err => reject({ error: "Cannot parse server responce" })) // error not identified

        } else { // http responce faied
          response.json()
            .then(obj => reject(obj)) // error message in the response body
            .catch(err => reject({ error: `ERROR: Cannot parse server response! ${err}` })) // error not identified
        }
      })
      .catch(err => reject({ error: "Connection error: cannot communicate" })) // connection error
  });
}

// Get all courses
async function getCourses() {
  return getJson(
    fetch(URL + 'api/courses', { credentials: 'include' })
  ).then(courses => courses.map(c => ({
    id: c.id,
    name: c.name,
    cfu: c.cfu,
    signed_up: c.signed_up,
    max_students: c.max_students ? c.max_students : null,
    preparatory: c.preparatory ? c.preparatory : null,
    incompatibility: c.incompatibility ? c.incompatibility : null
  })));
}

// Get the study plan
async function getStudyPlan(getCourse) { // getCourse is a callback
  return getJson(
    fetch(URL + 'api/study_plan', { credentials: 'include' })
  ).then(course_ids => course_ids.map(id => getCourse(id)));
}

// Create or modify a study plan type
async function setPlanType(type) {
  return getJson(
    fetch(URL + 'api/study_plan/' + type, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-type': 'application/json', }
    })
  );
}

// Delete a study plan
async function deleteStudyPlan() {
  return getJson(
    fetch(URL + 'api/study_plan/erase', {
      method: 'DELETE',
      credentials: 'include',
    })
  );
}

// Modify the study plan
async function modifyStudyPlan(study_plan) {
  // Prepare the JSON format for the server -> {courses: [course ids]}
  const proposed_plan = study_plan.map(course => course.id);
  
  return getJson(
    fetch(URL + 'api/study_plan', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-type': 'application/json', },
      body: JSON.stringify({ courses: proposed_plan })
    })
  );
}


/*** USER API ***/

async function logIn(credentials) {
  let response = await fetch(URL + 'api/sessions', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify(credentials),
  });

  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    try {
      const errDetail = await response.json();
      throw errDetail.message;
    }
    catch (err) {
      throw err;
    }
  }
}

async function logOut() {
  await fetch(URL + 'api/sessions/current', {
    method: 'DELETE',
    credentials: 'include',
  });
}

async function getUserInfo() {
  const response = await fetch(URL + 'api/sessions/current', { credentials: 'include' });
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;  // an object with the error coming from the server
  }
}

const API = { getCourses, getStudyPlan, setPlanType, deleteStudyPlan, modifyStudyPlan, logIn, logOut, getUserInfo };
export default API;





