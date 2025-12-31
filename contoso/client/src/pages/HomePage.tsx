import { Link } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';

export const HomePage: React.FC = () => {
  return (
    <Container className='mt-5'>
      <div className='text-center mb-5'>
        <h1 className='display-4'>Welcome to Contoso University</h1>
        <p className='lead'>Student Management System</p>
      </div>

      <Row className='g-4'>
        <Col md={6}>
          <Card className='h-100'>
            <Card.Body>
              <Card.Title>
                <i className='bi bi-people-fill me-2'></i>
                Students
              </Card.Title>
              <Card.Text>
                View, create, edit, and manage student records. Search and
                filter students by name and enrollment date.
              </Card.Text>
              <Link to='/students' className='btn btn-primary'>
                View Students
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className='h-100'>
            <Card.Body>
              <Card.Title>
                <i className='bi bi-book-fill me-2'></i>
                Courses
              </Card.Title>
              <Card.Text>
                Browse available courses, view course details, and manage course
                enrollments.
              </Card.Text>
              <Link to='/courses' className='btn btn-primary'>
                View Courses
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className='h-100'>
            <Card.Body>
              <Card.Title>
                <i className='bi bi-building me-2'></i>
                Departments
              </Card.Title>
              <Card.Text>
                Manage academic departments, budgets, and department
                administrators.
              </Card.Text>
              <Link to='/departments' className='btn btn-primary'>
                View Departments
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className='h-100'>
            <Card.Body>
              <Card.Title>
                <i className='bi bi-person-badge-fill me-2'></i>
                Instructors
              </Card.Title>
              <Card.Text>
                View instructor information, office assignments, and course
                teaching assignments.
              </Card.Text>
              <Link to='/instructors' className='btn btn-primary'>
                View Instructors
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
