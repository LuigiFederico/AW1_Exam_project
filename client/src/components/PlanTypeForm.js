import { Container, Row, Col, Modal, Card, Button } from "react-bootstrap";
import './components.css';


function PlanType(props) {
  return (
    <Modal show size='lg' >
      <Modal.Header 
  
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Modal.Title>
            Scegli la tipologia del piano di studi
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Container><Row>
          <Col>
            <Card border='success'>
              <Card.Header >
                <Row><Col className='d-grid gap-2'>
                  <Button variant='light' onClick={() => props.chooseType('full-time')}>Full-time</Button>
                </Col></Row></Card.Header>
              <Card.Body>
                <Card.Text className='text-align-center'>Sarà possibile inserire 60-80 CFU.</Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col>
            <Card border='warning'>
              <Card.Header >
                <Row><Col className='d-grid gap-2'>
                  <Button variant='light' onClick={() => props.chooseType('part-time')}>Part-time</Button>
                </Col></Row></Card.Header>
              <Card.Body>
                <Card.Text className='text-align-center'>Sarà possibile inserire 20-40 CFU.</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row></Container>
      </Modal.Body>

    </Modal>



  );
}

export default PlanType;