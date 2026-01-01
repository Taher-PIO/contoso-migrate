import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  createInstructorThunk,
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

const InstructorCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.instructors);
  const { courses, loading: coursesLoading } = useAppSelector(
    (state) => state.courses
  );
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstructorFormData>({
    resolver: yupResolver(schema) as any,
  });

  // Fetch courses on mount
  useEffect(() => {
    dispatch(fetchCoursesThunk());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: InstructorFormData) => {
    const createData = {
      ...data,
      OfficeLocation: data.OfficeLocation?.trim() || undefined,
      CourseIDs: selectedCourses.length > 0 ? selectedCourses : undefined,
    };

    const result = await dispatch(createInstructorThunk(createData));

    if (createInstructorThunk.fulfilled.match(result)) {
      navigate('/instructors/list');
    }
  };

  const handleCourseToggle = (courseID: number) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseID)) {
        return prev.filter((id) => id !== courseID);
      } else {
        return [...prev, courseID];
      }
    });
  };

  return (
    <div className='container mt-4'>
      <h1>Create Instructor</h1>

      {error && (
        <div className='alert alert-danger' role='alert'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='mt-4'>
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
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
          <Link to='/instructors/list' className='btn btn-secondary'>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default InstructorCreatePage;
