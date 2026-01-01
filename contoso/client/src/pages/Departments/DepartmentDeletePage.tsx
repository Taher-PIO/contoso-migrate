import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchDepartmentByIdThunk,
  deleteDepartmentThunk,
  clearCurrentDepartment,
  clearError,
} from '../../store/slices/departmentsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const DepartmentDeletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentDepartment, loading, error } = useAppSelector(
    (state) => state.departments
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchDepartmentByIdThunk(parseInt(id)));
    }

    return () => {
      dispatch(clearCurrentDepartment());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!id) return;

    const result = await dispatch(deleteDepartmentThunk(parseInt(id)));
    if (deleteDepartmentThunk.fulfilled.match(result)) {
      navigate('/departments');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !currentDepartment) {
    return <LoadingSpinner />;
  }

  if (!currentDepartment) {
    return null;
  }

  return (
    <div>
      <h1>Delete Department</h1>

      <Alert variant='warning'>
        <Alert.Heading>
          Are you sure you want to delete this department?
        </Alert.Heading>
        <p>This action cannot be undone.</p>
        {currentDepartment.courses && currentDepartment.courses.length > 0 && (
          <p className='mb-0'>
            <strong>Warning:</strong> This department has{' '}
            {currentDepartment.courses.length} associated course(s). Deletion
            may fail if courses are still assigned.
          </p>
        )}
      </Alert>

      {error && (
        <Alert
          variant='danger'
          dismissible
          onClose={() => dispatch(clearError())}
        >
          <strong>Error:</strong> {error}
          {(error.includes('foreign key') ||
            error.includes('courses') ||
            error.includes('constraint')) && (
            <p className='mt-2 mb-0'>
              This department cannot be deleted because it has associated
              courses. Please reassign or delete the courses first.
            </p>
          )}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <h3>Department Information</h3>
          <dl className='row'>
            <dt className='col-sm-3'>Name</dt>
            <dd className='col-sm-9'>{currentDepartment.Name}</dd>

            <dt className='col-sm-3'>Budget</dt>
            <dd className='col-sm-9'>
              {formatCurrency(currentDepartment.Budget)}
            </dd>

            <dt className='col-sm-3'>Start Date</dt>
            <dd className='col-sm-9'>
              {formatDate(currentDepartment.StartDate)}
            </dd>

            <dt className='col-sm-3'>Administrator</dt>
            <dd className='col-sm-9'>
              {currentDepartment.administrator
                ? `${currentDepartment.administrator.FirstMidName} ${currentDepartment.administrator.LastName}`
                : 'None'}
            </dd>
          </dl>

          {currentDepartment.courses &&
            currentDepartment.courses.length > 0 && (
              <Alert variant='info'>
                This department has {currentDepartment.courses.length}{' '}
                course(s):
                <ul className='mb-0 mt-2'>
                  {currentDepartment.courses.slice(0, 5).map((course) => (
                    <li key={course.CourseID}>
                      {course.CourseID} - {course.Title}
                    </li>
                  ))}
                  {currentDepartment.courses.length > 5 && (
                    <li>... and {currentDepartment.courses.length - 5} more</li>
                  )}
                </ul>
              </Alert>
            )}

          <div className='d-flex gap-2 mt-3'>
            <Button variant='danger' onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant='secondary'
              onClick={() => navigate('/departments')}
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
