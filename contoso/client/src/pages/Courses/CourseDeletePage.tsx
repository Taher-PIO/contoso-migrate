import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchCourseByIdThunk,
  deleteCourseThunk,
  clearCurrentCourse,
  clearError,
} from '../../store/slices/coursesSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const CourseDeletePage: React.FC = () => {
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

  const handleDelete = async () => {
    if (!id) return;

    const result = await dispatch(deleteCourseThunk(parseInt(id)));
    if (deleteCourseThunk.fulfilled.match(result)) {
      navigate('/courses');
    }
  };

  if (loading && !currentCourse) {
    return <LoadingSpinner />;
  }

  if (!currentCourse) {
    return null;
  }

  return (
    <div>
      <h1>Delete Course</h1>

      <Alert variant='warning'>
        <Alert.Heading>
          Are you sure you want to delete this course?
        </Alert.Heading>
        <p>
          This action cannot be undone. All enrollments for this course will
          also be deleted (cascade delete).
        </p>
      </Alert>

      {error && (
        <Alert
          variant='danger'
          dismissible
          onClose={() => dispatch(clearError())}
        >
          <strong>Error:</strong> {error}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <h3>Course Information</h3>
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

          {currentCourse.Enrollments &&
            currentCourse.Enrollments.length > 0 && (
              <Alert variant='info'>
                This course has {currentCourse.Enrollments.length} enrollment(s)
                that will be deleted.
              </Alert>
            )}

          <div className='d-flex gap-2 mt-3'>
            <Button variant='danger' onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant='secondary'
              onClick={() => navigate('/courses')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
