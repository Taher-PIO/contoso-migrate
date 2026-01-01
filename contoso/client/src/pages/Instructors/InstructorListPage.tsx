import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchInstructorsThunk,
  clearError,
} from '../../store/slices/instructorsSlice';

const InstructorListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { instructors, loading, error } = useAppSelector(
    (state) => state.instructors
  );

  useEffect(() => {
    dispatch(fetchInstructorsThunk());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className='container mt-4'>
        <div className='text-center'>
          <div className='spinner-border' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mt-4'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1>Instructors</h1>
        <Link to='/instructors/create' className='btn btn-primary'>
          Create New Instructor
        </Link>
      </div>

      {error && (
        <div className='alert alert-danger' role='alert'>
          {error}
        </div>
      )}

      <div className='table-responsive'>
        <table className='table table-striped table-bordered'>
          <thead className='table-dark'>
            <tr>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Hire Date</th>
              <th>Office Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructors.length === 0 ? (
              <tr>
                <td colSpan={5} className='text-center text-muted'>
                  No instructors found
                </td>
              </tr>
            ) : (
              instructors.map((instructor) => (
                <tr key={instructor.ID}>
                  <td>{instructor.LastName}</td>
                  <td>{instructor.FirstMidName}</td>
                  <td>{new Date(instructor.HireDate).toLocaleDateString()}</td>
                  <td>{instructor.OfficeAssignment?.Location || 'N/A'}</td>
                  <td>
                    <Link
                      to={`/instructors/${instructor.ID}`}
                      className='btn btn-sm btn-info me-1'
                    >
                      Details
                    </Link>
                    <Link
                      to={`/instructors/edit/${instructor.ID}`}
                      className='btn btn-sm btn-warning me-1'
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/instructors/delete/${instructor.ID}`}
                      className='btn btn-sm btn-danger'
                    >
                      Delete
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-3'>
        <Link to='/instructors' className='btn btn-secondary me-2'>
          Index View
        </Link>
        <Link to='/' className='btn btn-outline-secondary'>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default InstructorListPage;
