import './components.css';
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import React from 'react';
import { useState } from 'react';

import Course from './Courses';

function WrapperCourses(props) {
  const [showErase, setShowErase] = useState(false);

  const CFUmap = {
    full_time: { max: 80, min: 60 },
    part_time: { max: 40, min: 20 }
  }

  /*** FUNCTIONALITIES ***/
  function actualCFU() {
    if (props.courses.length !== 0) {
      return props.courses
        .map(c => c.cfu)
        .reduce((cfu1, cfu2) => cfu1 + cfu2);
    }
    return 0
  }

  function maxCFU() {
    return props.planType === 'full-time'
      ? CFUmap.full_time.max
      : CFUmap.part_time.max;
  }

  function minCFU() {
    return props.planType === 'full-time'
      ? CFUmap.full_time.min
      : CFUmap.part_time.min;
  }

  function compare(a, b) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }  

  /*** GRAPHIC ***/
  function handleCFUborder() {
    if (actualCFU() < minCFU() || actualCFU() > maxCFU())
      return 'danger';
    else return 'success';
  }


  return (
    <Col>
      <Card border='success'>
        <Card.Header>
          <Container fluid><Row>
            <Col xs={4}>
              <h3>{props.title}</h3>
            </Col>

            {showErase
              ? <EraseStudyPlanModal erasePlan={props.erasePlan} setShowErase={setShowErase} />
              : <></>
            }

            {props.loggedIn && props.isPlan
              ? (<>
                <Col xs={4}>
                  <Card border={handleCFUborder()}>
                    <Card.Header className='text-align-center'>
                      <b>CFU</b>: {`${actualCFU()} su ${minCFU()}-${maxCFU()} `}
                    </Card.Header>
                  </Card>
                </Col>

                {props.form
                  ? <>
                    <Col xs={2} className='d-flex justify-content-left'>
                      <Button variant='outline-success' onClick={() => props.showTypeForm()}>Cambia tipologia</Button>
                    </Col>
                    <Col xs={1} className='d-flex justify-content-between'>
                      <Button variant='success' onClick={() => props.handleSubmit()}>Salva</Button>
                    </Col>
                    <Col xs={1} className='d-flex justify-content-between'>
                      <Button variant='outline-danger' onClick={() => props.cancelModify()}>Annulla</Button>
                    </Col>
                  </>

                  : <Col xs={1} className='d-flex justify-content-between'>
                    <Button variant='light' onClick={() => props.setForm(true)}>
                      <FiEdit color='green' size='20' />
                    </Button>
                    <Button variant='light' onClick={() => setShowErase(true)}>
                      <FiTrash2 color='red' size='20' />
                    </Button>
                  </Col>
                }


              </>)
              : <></>}

          </Row></Container>
        </Card.Header>

        <Card.Body>
          <Card bg='warning'> <Card.Header>
            <Container fluid><Row>
              <Col md={1} className='text-align-center'><b>Codice</b> </Col>
              <Col md={6} className='text-align-center'><b>Nome corso</b> </Col>
              <Col md={1} className='text-align-center'><b>CFU</b> </Col>
              <Col md={2} className='text-align-center'><b>Iscritti</b></Col>
              <Col md={2} />
            </Row></Container>
          </Card.Header> </Card>

          {props.courses.sort(compare).map(c => {
            return (
              <Course
                key={c.id}
                course={c}
                loggedIn={props.loggedIn}
                form={props.form}
                isPlan={props.isPlan}
                getCourse={props.getCourse}
                addCourse={props.addCourse}
                removeCourse={props.removeCourse}
                intoPlan={props.intoPlan}
                isCourseInsertable={props.isCourseInsertable}
                isCourseRemovable={props.isCourseRemovable}
              />
            );
          }
          )}
        </Card.Body>
      </Card>
    </Col >

  );
}

function EraseStudyPlanModal(props) {
  return (
    <Modal show size='sm' centered>
      <Modal.Header>
        <Modal.Title>
          <div className='text-align-center'>Eliminare permanentemente il piano di studi?</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container fluid className='d-flex justify-content-center'>
          <Row >
            <Col>
           <Button variant='danger' onClick={() => { props.erasePlan(); props.setShowErase(false) }}>Elimina</Button>
           </Col>
           <Col>
            <Button variant='success' onClick={() => props.setShowErase(false)}>Annulla</Button>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  );
}




export default WrapperCourses;