import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchStudentById,
  deleteStudent,
  clearCurrentStudent,
  clearError,
} from '../../store/slices/studentsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const StudentDeletePage: React.FC = () => {
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

  const handleDelete = async () => {
    if (!id) return;

    const result = await dispatch(deleteStudent(parseInt(id)));
    if (deleteStudent.fulfilled.match(result)) {
      navigate('/students');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !currentStudent) {
    return <LoadingSpinner />;
  }

  if (!currentStudent) {
    return null;
  }

  return (
    <div>
      <h1>Delete Student</h1>

      <Alert variant='warning'>
        <Alert.Heading>
          Are you sure you want to delete this student?
        </Alert.Heading>
        <p>This action cannot be undone.</p>
      </Alert>

      {error && (
        <Alert
          variant='danger'
          dismissible
          onClose={() => dispatch(clearError())}
        >
          <strong>Error:</strong> {error}
          {error.includes('foreign key') || error.includes('enrollments') ? (
            <p className='mt-2 mb-0'>
              This student cannot be deleted because they have enrollments.
              Please remove the enrollments first.
            </p>
          ) : null}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <h3>Student Information</h3>
          <dl className='row'>
            <dt className='col-sm-3'>Name</dt>
            <dd className='col-sm-9'>
              {currentStudent.FirstMidName} {currentStudent.LastName}
            </dd>

            <dt className='col-sm-3'>Enrollment Date</dt>
            <dd className='col-sm-9'>
              {formatDate(currentStudent.EnrollmentDate)}
            </dd>
          </dl>

          {currentStudent.enrollments &&
            currentStudent.enrollments.length > 0 && (
              <Alert variant='info'>
                This student has {currentStudent.enrollments.length}{' '}
                enrollment(s).
              </Alert>
            )}

          <div className='d-flex gap-2 mt-3'>
            <Button variant='danger' onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant='secondary'
              onClick={() => navigate('/students')}
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
