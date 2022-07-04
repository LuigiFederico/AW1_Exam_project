import { Form, Button, Alert, Card, Container, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();


  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');
    const credentials = { username, password };

    if (username === '') { // email format control inside the Form.Control
      setErrorMessage('Inserisci la tua email.');
      setShow(true);
      return;
    }

    if (password === '') {
      setErrorMessage('Inserisci una password.');
      setShow(true);
      return;
    }

    props.login(credentials)
      .then(() => navigate('/'))
      .catch((err) => {
        setErrorMessage(err);
        setShow(true);
      })

  };


  return (
    <Container fluid><Row>
      <Col />
      <Col>
        <Card border='success'>
          <Form onSubmit={handleSubmit}>
            <Card.Header>
              <Card.Title>Login</Card.Title>
            </Card.Header>
            <Card.Body>
              <Alert
                dismissible
                show={show}
                onClose={() => setShow(false)}
                variant='danger'>
                {errorMessage}
              </Alert>
              <Form.Group controlId='username'>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type='email'
                  value={username}
                  onChange={(ev) => setUsername(ev.target.value)}
                />
              </Form.Group>
              <Form.Group controlId='password'>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type='password'
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                />
              </Form.Group>
            </Card.Body>
            <Card.Footer>
              <Button type='submit' variant='success'>Login</Button>
              {' '}
              <Button variant='danger' onClick={() => navigate('/')}>Annulla</Button>
            </Card.Footer>
          </Form>
        </Card>
      </Col>
      <Col />
    </Row></Container>
  );
}

function LogoutButton(props) {
  return (
    <Button variant="outline-light" onClick={() => props.logout()}>Logout</Button>
  )
}

export { LoginForm, LogoutButton };

