import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCoursesThunk, clearError } from '../../store/slices/coursesSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const CourseListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    courses = [],
    loading,
    error,
  } = useAppSelector((state) => state.courses);

  useEffect(() => {
    // Fetch all courses (no pagination per legacy requirements)
    dispatch(fetchCoursesThunk());
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1>Courses</h1>

      {error && (
        <Alert
          variant='danger'
          dismissible
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}

      <div className='mb-3'>
        <Button variant='primary' onClick={() => navigate('/courses/create')}>
          Create New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Alert variant='info'>No courses found.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Number</th>
              <th>Title</th>
              <th>Credits</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.CourseID}>
                <td>{course.CourseID}</td>
                <td>{course.Title}</td>
                <td>{course.Credits}</td>
                <td>{course.Department?.Name || 'N/A'}</td>
                <td>
                  <Link
                    to={`/courses/${course.CourseID}`}
                    className='btn btn-sm btn-info me-2'
                  >
                    Details
                  </Link>
                  <Link
                    to={`/courses/edit/${course.CourseID}`}
                    className='btn btn-sm btn-warning me-2'
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/courses/delete/${course.CourseID}`}
                    className='btn btn-sm btn-danger'
                  >
                    Delete
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className='mt-3'>
        <Link to='/' className='btn btn-secondary'>
          Back to Home
        </Link>
      </div>
    </div>
  );
};
