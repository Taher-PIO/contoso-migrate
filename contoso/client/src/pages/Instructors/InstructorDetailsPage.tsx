import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchInstructorByIdThunk,
  clearCurrentInstructor,
  clearError,
} from '../../store/slices/instructorsSlice';

const InstructorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentInstructor, loading, error } = useAppSelector(
    (state) => state.instructors
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchInstructorByIdThunk(Number(id)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentInstructor());
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

  if (error) {
    return (
      <div className='container mt-4'>
        <div className='alert alert-danger' role='alert'>
          {error}
        </div>
        <Link to='/instructors/list' className='btn btn-secondary'>
          Back to List
        </Link>
      </div>
    );
  }

  if (!currentInstructor) {
    return (
      <div className='container mt-4'>
        <div className='alert alert-warning' role='alert'>
          Instructor not found
        </div>
        <Link to='/instructors/list' className='btn btn-secondary'>
          Back to List
        </Link>
      </div>
    );
  }

  return (
    <div className='container mt-4'>
      <h1>Instructor Details</h1>

      <div className='card mt-4'>
        <div className='card-body'>
          <h5 className='card-title'>
            {currentInstructor.FirstMidName} {currentInstructor.LastName}
          </h5>
          <hr />

          <div className='row mb-3'>
            <div className='col-md-3'>
              <strong>Instructor ID:</strong>
            </div>
            <div className='col-md-9'>{currentInstructor.ID}</div>
          </div>

          <div className='row mb-3'>
            <div className='col-md-3'>
              <strong>Last Name:</strong>
            </div>
            <div className='col-md-9'>{currentInstructor.LastName}</div>
          </div>

          <div className='row mb-3'>
            <div className='col-md-3'>
              <strong>First Name:</strong>
            </div>
            <div className='col-md-9'>{currentInstructor.FirstMidName}</div>
          </div>

          <div className='row mb-3'>
            <div className='col-md-3'>
              <strong>Hire Date:</strong>
            </div>
            <div className='col-md-9'>
              {new Date(currentInstructor.HireDate).toLocaleDateString()}
            </div>
          </div>

          <div className='row mb-3'>
            <div className='col-md-3'>
              <strong>Office Location:</strong>
            </div>
            <div className='col-md-9'>
              {currentInstructor.OfficeAssignment?.Location ||
                'No office assigned'}
            </div>
          </div>

          {currentInstructor.Courses &&
            currentInstructor.Courses.length > 0 && (
              <>
                <hr />
                <h6>Assigned Courses</h6>
                <div className='table-responsive mt-3'>
                  <table className='table table-sm table-bordered'>
                    <thead className='table-light'>
                      <tr>
                        <th>Course ID</th>
                        <th>Title</th>
                        <th>Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInstructor.Courses.map((courseAssignment) => {
                        // Note: The Courses array contains CourseInstructor join records
                        // We need to display CourseID at minimum
                        return (
                          <tr key={courseAssignment.CourseID}>
                            <td>{courseAssignment.CourseID}</td>
                            <td colSpan={2}>
                              <em className='text-muted'>
                                (Course details not loaded)
                              </em>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </div>
      </div>

      <div className='mt-4'>
        <Link
          to={`/instructors/edit/${currentInstructor.ID}`}
          className='btn btn-warning me-2'
        >
          Edit
        </Link>
        <Link
          to={`/instructors/delete/${currentInstructor.ID}`}
          className='btn btn-danger me-2'
        >
          Delete
        </Link>
        <Link to='/instructors/list' className='btn btn-secondary me-2'>
          Back to List
        </Link>
        <Link to='/' className='btn btn-outline-secondary'>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default InstructorDetailsPage;
