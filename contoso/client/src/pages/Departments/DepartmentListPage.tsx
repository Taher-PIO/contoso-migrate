import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchDepartmentsThunk,
  clearError,
} from '../../store/slices/departmentsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const DepartmentListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    departments = [],
    loading,
    error,
  } = useAppSelector((state) => state.departments);

  useEffect(() => {
    // Fetch all departments
    dispatch(fetchDepartmentsThunk());
  }, [dispatch]);

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

  return (
    <div>
      <h1>Departments</h1>

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
        <Button
          variant='primary'
          onClick={() => navigate('/departments/create')}
        >
          Create New Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <Alert variant='info'>No departments found.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Budget</th>
              <th>Start Date</th>
              <th>Administrator</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.DepartmentID}>
                <td>{department.Name}</td>
                <td>{formatCurrency(department.Budget)}</td>
                <td>{formatDate(department.StartDate)}</td>
                <td>
                  {department.administrator
                    ? `${department.administrator.FirstMidName} ${department.administrator.LastName}`
                    : 'None'}
                </td>
                <td>
                  <Link
                    to={`/departments/${department.DepartmentID}`}
                    className='btn btn-sm btn-info me-2'
                  >
                    Details
                  </Link>
                  <Link
                    to={`/departments/edit/${department.DepartmentID}`}
                    className='btn btn-sm btn-warning me-2'
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/departments/delete/${department.DepartmentID}`}
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
