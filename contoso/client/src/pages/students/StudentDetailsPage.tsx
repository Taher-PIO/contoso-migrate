import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Table, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchStudentById,
  clearCurrentStudent,
  clearError,
} from '../../store/slices/studentsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { gradeToString } from '../../types/student';

export const StudentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentStudent, loading, error } = useAppSelector(
    (state) => state.students
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchStudentById(parseInt(id)));
    }

    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div>
        <Alert
          variant='danger'
          dismissible
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
        <Button variant='secondary' onClick={() => navigate('/students')}>
          Back to List
        </Button>
      </div>
    );
  }

  if (!currentStudent) {
    return null;
  }

  return (
    <div>
      <h1>Student Details</h1>

      <Card className='mb-3'>
        <Card.Body>
          <Card.Title>
            {currentStudent.FirstMidName} {currentStudent.LastName}
          </Card.Title>
          <dl className='row'>
            <dt className='col-sm-3'>Last Name</dt>
            <dd className='col-sm-9'>{currentStudent.LastName}</dd>

            <dt className='col-sm-3'>First Name</dt>
            <dd className='col-sm-9'>{currentStudent.FirstMidName}</dd>

            <dt className='col-sm-3'>Enrollment Date</dt>
            <dd className='col-sm-9'>
              {formatDate(currentStudent.EnrollmentDate)}
            </dd>
          </dl>
        </Card.Body>
      </Card>

      <h3>Enrollments</h3>
      {currentStudent.Enrollments && currentStudent.Enrollments.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Course Title</th>
              <th>Credits</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {currentStudent.Enrollments.map((enrollment) => (
              <tr key={enrollment.EnrollmentID}>
                <td>{enrollment.Course?.Title}</td>
                <td>{enrollment.Course?.Credits}</td>
                <td>{gradeToString(enrollment.Grade ?? null)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant='info'>No enrollments found for this student.</Alert>
      )}

      <div className='mt-3'>
        <Link to={`/students/${id}/edit`} className='btn btn-warning me-2'>
          Edit
        </Link>
        <Link to='/students' className='btn btn-secondary'>
          Back to List
        </Link>
      </div>
    </div>
  );
};
