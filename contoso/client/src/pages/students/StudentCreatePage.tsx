import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createStudent, clearError } from '../../store/slices/studentsSlice';
import { fetchCoursesThunk } from '../../store/slices/coursesSlice';
import type { StudentFormData } from '../../types/student';
import { gradeOptions } from '../../types/student';

// Enhanced validation schema with security checks
const studentSchema = yup.object({
  FirstMidName: yup
    .string()
    .required('First name is required')
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(
      /^[a-zA-Z\s\-'\.]+$/,
      'First name can only contain letters, spaces, hyphens, apostrophes, and periods'
    )
    .test('no-xss', 'First name contains invalid characters', (value) => {
      if (!value) return true;
      return !/<|>|script|javascript:/i.test(value);
    }),
  LastName: yup
    .string()
    .required('Last name is required')
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(
      /^[a-zA-Z\s\-'\.]+$/,
      'Last name can only contain letters, spaces, hyphens, apostrophes, and periods'
    )
    .test('no-xss', 'Last name contains invalid characters', (value) => {
      if (!value) return true;
      return !/<|>|script|javascript:/i.test(value);
    }),
  EnrollmentDate: yup
    .string()
    .required('Enrollment date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in yyyy-MM-dd format')
    .test('valid-date', 'Enrollment date must be a valid date', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test(
      'date-range',
      'Enrollment date must be between 1900 and 10 years in the future',
      (value) => {
        if (!value) return false;
        const date = new Date(value);
        const minDate = new Date('1900-01-01');
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 10);
        return date >= minDate && date <= maxDate;
      }
    ),
});

export const StudentCreatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.students);
  const { courses, loading: coursesLoading } = useAppSelector(
    (state) => state.courses
  );
  const [selectedEnrollments, setSelectedEnrollments] = useState<
    Map<number, number | null>
  >(new Map());

  useEffect(() => {
    dispatch(fetchCoursesThunk());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: yupResolver(studentSchema) as any,
    defaultValues: {
      FirstMidName: '',
      LastName: '',
      EnrollmentDate: new Date().toISOString().split('T')[0], // Today's date
    },
  });

  const handleEnrollmentToggle = (courseID: number) => {
    setSelectedEnrollments((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(courseID)) {
        newMap.delete(courseID);
      } else {
        newMap.set(courseID, null); // No grade initially
      }
      return newMap;
    });
  };

  const handleGradeChange = (courseID: number, gradeValue: string) => {
    setSelectedEnrollments((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(courseID)) {
        newMap.set(courseID, gradeValue === '' ? null : parseInt(gradeValue));
      }
      return newMap;
    });
  };

  const onSubmit = async (data: StudentFormData) => {
    const submitData: StudentFormData = {
      ...data,
      Enrollments: Array.from(selectedEnrollments.entries()).map(
        ([CourseID, Grade]) => ({
          CourseID,
          Grade,
        })
      ),
    };

    const result = await dispatch(createStudent(submitData));
    if (createStudent.fulfilled.match(result)) {
      navigate('/students');
    }
  };

  return (
    <div>
      <h1>Create Student</h1>

      <Card>
        <Card.Body>
          {error && (
            <Alert
              variant='danger'
              dismissible
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className='mb-3' controlId='LastName'>
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type='text'
                {...register('LastName')}
                isInvalid={!!errors.LastName}
                placeholder='Enter last name'
              />
              <Form.Control.Feedback type='invalid'>
                {errors.LastName?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className='mb-3' controlId='FirstMidName'>
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type='text'
                {...register('FirstMidName')}
                isInvalid={!!errors.FirstMidName}
                placeholder='Enter first name'
              />
              <Form.Control.Feedback type='invalid'>
                {errors.FirstMidName?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className='mb-3' controlId='EnrollmentDate'>
              <Form.Label>Enrollment Date</Form.Label>
              <Form.Control
                type='date'
                {...register('EnrollmentDate')}
                isInvalid={!!errors.EnrollmentDate}
              />
              <Form.Control.Feedback type='invalid'>
                {errors.EnrollmentDate?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Enrollments Section */}
            <div className='mb-4'>
              <h5>Course Enrollments</h5>
              <p className='text-muted small'>
                Select courses and optionally assign grades
              </p>

              {coursesLoading ? (
                <div className='text-muted'>Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className='text-muted'>No courses available</div>
              ) : (
                <div
                  className='border rounded p-3'
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  {courses.map((course) => {
                    const isSelected = selectedEnrollments.has(course.CourseID);
                    const currentGrade = selectedEnrollments.get(
                      course.CourseID
                    );

                    return (
                      <div
                        key={course.CourseID}
                        className='mb-3 border-bottom pb-3'
                      >
                        <div className='form-check'>
                          <input
                            type='checkbox'
                            className='form-check-input'
                            id={`course-${course.CourseID}`}
                            checked={isSelected}
                            onChange={() =>
                              handleEnrollmentToggle(course.CourseID)
                            }
                          />
                          <label
                            className='form-check-label fw-bold'
                            htmlFor={`course-${course.CourseID}`}
                          >
                            {course.CourseID} - {course.Title}
                            <span className='text-muted ms-2'>
                              ({course.Credits} credits)
                            </span>
                          </label>
                        </div>

                        {isSelected && (
                          <div className='mt-2 ms-4'>
                            <label
                              htmlFor={`grade-${course.CourseID}`}
                              className='form-label small'
                            >
                              Grade (optional)
                            </label>
                            <select
                              id={`grade-${course.CourseID}`}
                              className='form-select form-select-sm'
                              style={{ maxWidth: '150px' }}
                              value={currentGrade === null ? '' : currentGrade}
                              onChange={(e) =>
                                handleGradeChange(
                                  course.CourseID,
                                  e.target.value
                                )
                              }
                            >
                              {gradeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <small className='text-muted d-block mt-2'>
                Selected enrollments: {selectedEnrollments.size}
              </small>
            </div>

            <div className='d-flex gap-2'>
              <Button type='submit' variant='primary' disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
              <Button
                type='button'
                variant='secondary'
                onClick={() => navigate('/students')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};
