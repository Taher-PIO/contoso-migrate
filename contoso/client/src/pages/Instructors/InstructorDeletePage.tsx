import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchInstructorByIdThunk,
  deleteInstructorThunk,
  clearCurrentInstructor,
  clearError,
} from '../../store/slices/instructorsSlice';

const InstructorDeletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const handleDelete = async () => {
    if (!id) return;

    const result = await dispatch(deleteInstructorThunk(Number(id)));

    if (deleteInstructorThunk.fulfilled.match(result)) {
      navigate('/instructors/list');
    }
  };

  if (loading && !currentInstructor) {
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

  if (error && !currentInstructor) {
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
      <h1>Delete Instructor</h1>

      <div className='alert alert-warning mt-4' role='alert'>
        <h5>Are you sure you want to delete this instructor?</h5>
        <p className='mb-0'>This action cannot be undone.</p>
      </div>

      {error && (
        <div className='alert alert-danger' role='alert'>
          <strong>Error:</strong> {error}
          <hr />
          <p className='mb-0'>
            This instructor may be referenced by other records (e.g.,
            departments). Please remove those references before deleting this
            instructor.
          </p>
        </div>
      )}

      <div className='card mt-4'>
        <div className='card-header'>
          <h5 className='mb-0'>Instructor Details</h5>
        </div>
        <div className='card-body'>
          <div className='row mb-2'>
            <div className='col-md-3'>
              <strong>Instructor ID:</strong>
            </div>
            <div className='col-md-9'>{currentInstructor.ID}</div>
          </div>

          <div className='row mb-2'>
            <div className='col-md-3'>
              <strong>Name:</strong>
            </div>
            <div className='col-md-9'>
              {currentInstructor.FirstMidName} {currentInstructor.LastName}
            </div>
          </div>

          <div className='row mb-2'>
            <div className='col-md-3'>
              <strong>Hire Date:</strong>
            </div>
            <div className='col-md-9'>
              {new Date(currentInstructor.HireDate).toLocaleDateString()}
            </div>
          </div>

          <div className='row mb-2'>
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
              <div className='row mb-2'>
                <div className='col-md-3'>
                  <strong>Assigned Courses:</strong>
                </div>
                <div className='col-md-9'>
                  {currentInstructor.Courses.length} course(s)
                  <div className='alert alert-info mt-2 mb-0' role='alert'>
                    <small>
                      <strong>Note:</strong> Course assignments will be removed
                      automatically when this instructor is deleted.
                    </small>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      <div className='mt-4'>
        <button
          type='button'
          className='btn btn-danger me-2'
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className='spinner-border spinner-border-sm me-1'
                role='status'
                aria-hidden='true'
              ></span>
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </button>
        <Link to={`/instructors/${id}`} className='btn btn-secondary'>
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default InstructorDeletePage;
