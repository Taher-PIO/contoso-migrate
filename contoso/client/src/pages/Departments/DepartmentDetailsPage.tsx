import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Alert, Table } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchDepartmentByIdThunk,
  clearCurrentDepartment,
  clearError,
} from '../../store/slices/departmentsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const DepartmentDetailsPage: React.FC = () => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
        <Button variant='secondary' onClick={() => navigate('/departments')}>
          Back to List
        </Button>
      </div>
    );
  }

  if (!currentDepartment) {
    return null;
  }

  return (
    <div>
      <h1>Department Details</h1>

      <Card className='mb-3'>
        <Card.Body>
          <Card.Title>{currentDepartment.Name}</Card.Title>
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
        </Card.Body>
      </Card>

      {currentDepartment.courses && currentDepartment.courses.length > 0 && (
        <>
          <h3>Courses</h3>
          <Table striped bordered hover className='mb-3'>
            <thead>
              <tr>
                <th>Course Number</th>
                <th>Title</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {currentDepartment.courses.map((course) => (
                <tr key={course.CourseID}>
                  <td>{course.CourseID}</td>
                  <td>{course.Title}</td>
                  <td>{course.Credits}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <div className='mb-3'>
        <Link
          to={`/departments/edit/${currentDepartment.DepartmentID}`}
          className='btn btn-warning me-2'
        >
          Edit
        </Link>
        <Link
          to={`/departments/delete/${currentDepartment.DepartmentID}`}
          className='btn btn-danger me-2'
        >
          Delete
        </Link>
        <Button variant='secondary' onClick={() => navigate('/departments')}>
          Back to List
        </Button>
      </div>
    </div>
  );
};
