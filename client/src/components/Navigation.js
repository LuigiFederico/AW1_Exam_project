import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap/';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import { FiUserCheck, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Navigation(props) {
  const { onLogOut, loggedIn, user } = props;
  
  return (
    <Navbar bg='success' variant='dark' fixed='top'>
      <Container fluid>

        <Navbar.Brand>
          <HiOutlineAcademicCap className='mr-1' size='30' /> Piano degli studi
        </Navbar.Brand>

        <Nav className='justify-content-end '>
          <Navbar.Text className='mx-2'>
            {loggedIn && user && user.name && `${user?.name} ${user?.surname}, ${user?.id} `}
          </Navbar.Text>
          <UserIcon loggedIn={loggedIn} onLogOut={onLogOut}/>
        </Nav>

      </Container>
    </Navbar>
  );
}

function UserIcon(props) {
  const navigate = useNavigate();
  
  return (
    <Dropdown>
      <Dropdown.Toggle variant='success'>
        {props.loggedIn
          ? <FiUserCheck color='white' className='ml-1' size='30' />
          : <FiUser color='white' className='ml-1' size='30' />
        }
      </Dropdown.Toggle>
      
      <Dropdown.Menu>
        {props.loggedIn
          ? <Dropdown.Item onClick={() => props.onLogOut()}>Logout</Dropdown.Item>
          : <Dropdown.Item onClick={() => navigate('/login')}>Login</Dropdown.Item>
        }
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default Navigation;