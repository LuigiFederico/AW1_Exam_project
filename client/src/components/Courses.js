import './components.css';
import { Container, Row, Col, Card, Button, Collapse, Table } from 'react-bootstrap';
import { FiPlusCircle, FiXCircle, FiAlertCircle, FiChevronDown, FiChevronUp, FiCheckCircle } from 'react-icons/fi';
import { useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

function Course(props) {
  const [open, setOpen] = useState(false);
  const course = props.course;

  function handleSubscribedColor() {
    if (course.signed_up === course.max_students)
      return 'text-red';
    else return '';
  }

  return (
    <Card>
      <Card.Header>
        <Container fluid>
          <Row>
            <Col md={1} className='text-align-center'> {`${course.id}`} </Col>
            <Col md={6} className='text-align-center'> <b>{`${course.name}`}</b> </Col>
            <Col md={1} className='text-align-center'> {`${course.cfu}`} </Col>
            <Col md={2} className={`text-align-center ${handleSubscribedColor()}`}>
              {`${course.signed_up}`.concat(`${course.max_students ? ' / ' + course.max_students : ''}`)}
            </Col>


            <Col className='text-align-center'>
              {props.loggedIn && props.form
                ? <FormButtons
                  isCourseInsertable={props.isCourseInsertable}
                  isCourseRemovable={props.isCourseRemovable}
                  isPlan={props.isPlan}
                  addCourse={props.addCourse}
                  removeCourse={props.removeCourse}
                  intoPlan={props.intoPlan}
                  course={course} />
                : <></>}
            </Col>
            <Col className='text-align-center'>
              {open
                ? <Button variant='light' size='sm' onClick={() => setOpen(false)}><FiChevronUp /></Button>
                : <Button variant='light' size='sm' onClick={() => setOpen(true)}><FiChevronDown /></Button>}
            </Col>
          </Row>

          <Collapse in={open}>
            <Row>
              <Col>
                {course.preparatory
                  ? <CourseConstrains
                    title='Corsi propedeutici:'
                    courseId={course.preparatory}
                    prep={true}
                    getCourse={props.getCourse} />
                  : <Card.Body><Card.Title>Nessun corso propedeutico.</Card.Title></Card.Body>}
              </Col>
              <Col>
                {course.incompatibility
                  ? <CourseConstrains
                    title='Corsi incompatibili:'
                    courseId={course.incompatibility}
                    prep={false}
                    getCourse={props.getCourse} />
                  : <Card.Body><Card.Title>Nessun corso incompatibile.</Card.Title></Card.Body>}
              </Col>
            </Row>

          </Collapse>
        </Container>
      </Card.Header>
    </Card >
  );
}

function CourseConstrains(props) {

  function CourseTuple(props) {
    return (
      <tr>
        <td>{`${props.course.id}`}</td>
        <td>{`${props.course.name}`}</td>
        <td>{`${props.course.cfu}`}</td>
      </tr>)
  }

  return (
    <Card.Body>
      <Card.Title>{props.title}</Card.Title>
      <Table>
        <thead><tr>
          <td><b>Codice</b></td>
          <td><b>Nome</b></td>
          <td><b>CFU</b></td>
        </tr></thead>
        <tbody>
          {props.prep
            ? <CourseTuple course={props.getCourse(props.courseId)} />
            : props.courseId.map(cId => <CourseTuple key={`${cId}-CourseTuple`} course={props.getCourse(cId)} />)
          }
        </tbody>
      </Table>
    </Card.Body>
  );
}

function FormButtons(props) {

  // Inside the study plan card
  if (props.isPlan) {
    const removable = props.isCourseRemovable(props.course);

    if (removable === true) {
      return (
        <Button variant='light' size='sm' onClick={() => props.removeCourse(props.course.id)}>
          <FiXCircle color='red' size='20' />
        </Button>
      );
    } else {
      return (
        <Popup
          trigger={
            <span>
              <Button variant='light' size='sm'>
                < FiAlertCircle color='orange' size='20' />
              </Button >
            </span >}
          on='hover'
          mouseLeaveDelay={150}
          mouseEnterDelay={150}
          position='top center' >
          <div className='text-align-center' >{removable}</div>
        </Popup >
      );

    }

  }

  // Inside the courses card
  if (props.intoPlan(props.course.id)) {
    return (
      <Button variant='light' size='sm' disabled>
        <FiCheckCircle color='green' size='20' />
      </Button>
    );
  }

  const insertable = props.isCourseInsertable(props.course);

  if (insertable === true) {
    return (
      <Button variant='light' size='sm' onClick={() => props.addCourse(props.course)}>
        <FiPlusCircle color='green' size='20' />
      </Button>
    );
  } else {
    return (
      <Popup
        trigger={
          <span>
            <Button variant='light' size='sm'>
              < FiAlertCircle color='orange' size='20' />
            </Button >
          </span >}
        on='hover'
        mouseLeaveDelay={150}
        mouseEnterDelay={150}
        position='top center' >
        <div className='text-align-center' >{insertable}</div>
      </Popup >
    );
  }

}


export default Course;