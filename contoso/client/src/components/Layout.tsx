import { Outlet, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';

export const Layout: React.FC = () => {
  return (
    <>
      <Navbar bg='dark' variant='dark' expand='lg' className='mb-4'>
        <Container>
          <Navbar.Brand as={Link} to='/'>
            Contoso University
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='me-auto'>
              <Nav.Link as={Link} to='/'>
                Home
              </Nav.Link>
              <Nav.Link as={Link} to='/students'>
                Students
              </Nav.Link>
              <Nav.Link as={Link} to='/courses'>
                Courses
              </Nav.Link>
              <Nav.Link as={Link} to='/departments'>
                Departments
              </Nav.Link>
              <Nav.Link as={Link} to='/instructors'>
                Instructors
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <Outlet />
      </Container>
      <footer className='mt-5 py-3 bg-light'>
        <Container>
          <p className='text-center text-muted mb-0'>
            © {new Date().getFullYear()} Contoso University
          </p>
        </Container>
      </footer>
    </>
  );
};
