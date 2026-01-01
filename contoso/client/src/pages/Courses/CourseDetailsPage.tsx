import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchCourseByIdThunk,
  clearCurrentCourse,
  clearError,
} from '../../store/slices/coursesSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentCourse, loading, error } = useAppSelector(
    (state) => state.courses
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseByIdThunk(parseInt(id)));
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, id]);

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
        <Button variant='secondary' onClick={() => navigate('/courses')}>
          Back to List
        </Button>
      </div>
    );
  }

  if (!currentCourse) {
    return null;
  }

  return (
    <div>
      <h1>Course Details</h1>

      <Card className='mb-3'>
        <Card.Body>
          <Card.Title>{currentCourse.Title}</Card.Title>
          <dl className='row'>
            <dt className='col-sm-3'>Number</dt>
            <dd className='col-sm-9'>{currentCourse.CourseID}</dd>

            <dt className='col-sm-3'>Title</dt>
            <dd className='col-sm-9'>{currentCourse.Title}</dd>

            <dt className='col-sm-3'>Credits</dt>
            <dd className='col-sm-9'>{currentCourse.Credits}</dd>

            <dt className='col-sm-3'>Department</dt>
            <dd className='col-sm-9'>
              {currentCourse.Department?.Name || 'N/A'}
            </dd>
          </dl>
        </Card.Body>
      </Card>

      <div className='mb-3'>
        <Link
          to={`/courses/edit/${currentCourse.CourseID}`}
          className='btn btn-warning me-2'
        >
          Edit
        </Link>
        <Link
          to={`/courses/delete/${currentCourse.CourseID}`}
          className='btn btn-danger me-2'
        >
          Delete
        </Link>
        <Button variant='secondary' onClick={() => navigate('/courses')}>
          Back to List
        </Button>
      </div>
    </div>
  );
};
