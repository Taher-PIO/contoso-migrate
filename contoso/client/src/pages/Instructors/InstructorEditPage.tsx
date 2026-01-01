import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchInstructorByIdThunk,
  updateInstructorThunk,
  clearCurrentInstructor,
  clearError,
} from '../../store/slices/instructorsSlice';
import type { InstructorFormData } from '../../types/instructor';
import { fetchCoursesThunk } from '../../store/slices/coursesSlice';

// Validation schema
const schema = yup.object({
  FirstMidName: yup
    .string()
    .required('First name is required')
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(
      /^[a-zA-Z\s'-]+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  LastName: yup
    .string()
    .required('Last name is required')
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(
      /^[a-zA-Z\s'-]+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  HireDate: yup
    .string()
    .required('Hire date is required')
    .test('is-valid-date', 'Hire date must be a valid date', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test('min-date', 'Hire date cannot be before 1900', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return date >= new Date('1900-01-01');
    })
    .test('max-date', 'Hire date cannot be in the future', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return date <= new Date();
    }),
  OfficeLocation: yup
    .string()
    .nullable()
    .notRequired()
    .max(50, 'Office location cannot exceed 50 characters'),
});

const InstructorEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentInstructor, loading, error } = useAppSelector(
    (state) => state.instructors
  );
  const { courses, loading: coursesLoading } = useAppSelector(
    (state) => state.courses
  );
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InstructorFormData>({
    resolver: yupResolver(schema) as any,
  });

  // Fetch instructor and courses on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchInstructorByIdThunk(Number(id)));
      dispatch(fetchCoursesThunk());
    }
  }, [dispatch, id]);

  // Initialize form when instructor is loaded
  useEffect(() => {
    if (currentInstructor && !isInitialized) {
      // Format date for input[type="date"]
      const hireDate = new Date(currentInstructor.HireDate);
      const formattedDate = hireDate.toISOString().split('T')[0];

      reset({
        FirstMidName: currentInstructor.FirstMidName,
        LastName: currentInstructor.LastName,
        HireDate: formattedDate,
        OfficeLocation: currentInstructor.OfficeAssignment?.Location || '',
      });

      // Set selected courses
      if (currentInstructor.Courses) {
        setSelectedCourses(currentInstructor.Courses.map((c) => c.CourseID));
      }

      setIsInitialized(true);
    }
  }, [currentInstructor, reset, isInitialized]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentInstructor());
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: InstructorFormData) => {
    if (!id) return;

    const updateData = {
      ...data,
      OfficeLocation: data.OfficeLocation?.trim() || undefined,
      CourseIDs: selectedCourses.length > 0 ? selectedCourses : undefined,
    };

    const result = await dispatch(
      updateInstructorThunk({
        id: Number(id),
        data: updateData,
      })
    );

    if (updateInstructorThunk.fulfilled.match(result)) {
      navigate(`/instructors/${id}`);
    }
  };

  const handleCourseToggle = (courseID: number) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseID)) {
        return prev.filter((cid) => cid !== courseID);
      } else {
        return [...prev, courseID];
      }
    });
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
      <h1>Edit Instructor</h1>

      {error && (
        <div className='alert alert-danger' role='alert'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='mt-4'>
        <div className='mb-3'>
          <label htmlFor='instructorID' className='form-label'>
            Instructor ID
          </label>
          <input
            type='text'
            id='instructorID'
            className='form-control'
            value={currentInstructor.ID}
            disabled
          />
          <small className='text-muted'>Instructor ID cannot be changed</small>
        </div>

        <div className='mb-3'>
          <label htmlFor='FirstMidName' className='form-label'>
            First Name <span className='text-danger'>*</span>
          </label>
          <input
            type='text'
            id='FirstMidName'
            className={`form-control ${
              errors.FirstMidName ? 'is-invalid' : ''
            }`}
            {...register('FirstMidName')}
          />
          {errors.FirstMidName && (
            <div className='invalid-feedback'>
              {errors.FirstMidName.message}
            </div>
          )}
        </div>

        <div className='mb-3'>
          <label htmlFor='LastName' className='form-label'>
            Last Name <span className='text-danger'>*</span>
          </label>
          <input
            type='text'
            id='LastName'
            className={`form-control ${errors.LastName ? 'is-invalid' : ''}`}
            {...register('LastName')}
          />
          {errors.LastName && (
            <div className='invalid-feedback'>{errors.LastName.message}</div>
          )}
        </div>

        <div className='mb-3'>
          <label htmlFor='HireDate' className='form-label'>
            Hire Date <span className='text-danger'>*</span>
          </label>
          <input
            type='date'
            id='HireDate'
            className={`form-control ${errors.HireDate ? 'is-invalid' : ''}`}
            {...register('HireDate')}
          />
          {errors.HireDate && (
            <div className='invalid-feedback'>{errors.HireDate.message}</div>
          )}
        </div>

        <div className='mb-3'>
          <label htmlFor='OfficeLocation' className='form-label'>
            Office Location
          </label>
          <input
            type='text'
            id='OfficeLocation'
            className={`form-control ${
              errors.OfficeLocation ? 'is-invalid' : ''
            }`}
            {...register('OfficeLocation')}
            placeholder='e.g., Smith 17'
          />
          {errors.OfficeLocation && (
            <div className='invalid-feedback'>
              {errors.OfficeLocation.message}
            </div>
          )}
          <small className='text-muted'>
            Leave blank to remove office assignment
          </small>
        </div>

        <div className='mb-4'>
          <label className='form-label'>Assigned Courses</label>
          {coursesLoading ? (
            <div className='text-muted'>Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className='text-muted'>No courses available</div>
          ) : (
            <div
              className='border rounded p-3'
              style={{ maxHeight: '300px', overflowY: 'auto' }}
            >
              {courses.map((course) => (
                <div key={course.CourseID} className='form-check'>
                  <input
                    type='checkbox'
                    className='form-check-input'
                    id={`course-${course.CourseID}`}
                    checked={selectedCourses.includes(course.CourseID)}
                    onChange={() => handleCourseToggle(course.CourseID)}
                  />
                  <label
                    className='form-check-label'
                    htmlFor={`course-${course.CourseID}`}
                  >
                    {course.CourseID} - {course.Title} ({course.Credits}{' '}
                    credits)
                  </label>
                </div>
              ))}
            </div>
          )}
          <small className='text-muted d-block mt-1'>
            Selected courses: {selectedCourses.length}
          </small>
        </div>

        <div className='mb-3'>
          <button
            type='submit'
            className='btn btn-primary me-2'
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className='spinner-border spinner-border-sm me-1'
                  role='status'
                  aria-hidden='true'
                ></span>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
          <Link to={`/instructors/${id}`} className='btn btn-secondary'>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default InstructorEditPage;
