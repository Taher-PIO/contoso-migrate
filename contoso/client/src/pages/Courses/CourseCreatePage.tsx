import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  createCourseThunk,
  fetchDepartmentsThunk,
  clearError,
} from '../../store/slices/coursesSlice';
import type { CourseFormData } from '../../types/course';

// Enhanced validation schema matching backend constraints
const courseSchema = yup.object({
  CourseID: yup
    .number()
    .required('Course number is required')
    .integer('Course number must be an integer')
    .min(1, 'Course number must be at least 1')
    .max(99999, 'Course number cannot exceed 99999')
    .typeError('Course number must be a valid number'),
  Title: yup
    .string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title cannot exceed 50 characters')
    .matches(
      /^[a-zA-Z0-9\s\-'\.,:&()]+$/,
      'Title can only contain letters, numbers, spaces, and common punctuation'
    )
    .test('no-xss', 'Title contains invalid characters', (value) => {
      if (!value) return true;
      return !/<|>|script|javascript:/i.test(value);
    }),
  Credits: yup
    .number()
    .required('Credits is required')
    .integer('Credits must be an integer')
    .min(0, 'Credits must be at least 0')
    .max(5, 'Credits cannot exceed 5')
    .typeError('Credits must be a valid number'),
  DepartmentID: yup
    .number()
    .required('Department is required')
    .integer('Department must be selected')
    .min(1, 'Department must be selected')
    .typeError('Department must be selected'),
});

export const CourseCreatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { departments, loading, error } = useAppSelector(
    (state) => state.courses
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      CourseID: undefined,
      Title: '',
      Credits: 3,
      DepartmentID: undefined,
    },
  });

  useEffect(() => {
    // Fetch departments for dropdown
    dispatch(fetchDepartmentsThunk());
  }, [dispatch]);

  const onSubmit = async (data: CourseFormData) => {
    const result = await dispatch(createCourseThunk(data));
    if (createCourseThunk.fulfilled.match(result)) {
      navigate('/courses');
    }
  };

  return (
    <div>
      <h1>Create Course</h1>

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
            <Form.Group className='mb-3' controlId='CourseID'>
              <Form.Label>Number</Form.Label>
              <Form.Control
                type='number'
                {...register('CourseID')}
                isInvalid={!!errors.CourseID}
                placeholder='Enter course number (1-99999)'
              />
              <Form.Control.Feedback type='invalid'>
                {errors.CourseID?.message}
              </Form.Control.Feedback>
              <Form.Text className='text-muted'>
                Enter a unique course number manually (1-99999).
              </Form.Text>
            </Form.Group>

            <Form.Group className='mb-3' controlId='Title'>
              <Form.Label>Title</Form.Label>
              <Form.Control
                type='text'
                {...register('Title')}
                isInvalid={!!errors.Title}
                placeholder='Enter course title'
              />
              <Form.Control.Feedback type='invalid'>
                {errors.Title?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className='mb-3' controlId='Credits'>
              <Form.Label>Credits</Form.Label>
              <Form.Control
                type='number'
                {...register('Credits')}
                isInvalid={!!errors.Credits}
                placeholder='Enter credits (0-5)'
              />
              <Form.Control.Feedback type='invalid'>
                {errors.Credits?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className='mb-3' controlId='DepartmentID'>
              <Form.Label>Department</Form.Label>
              <Form.Select
                {...register('DepartmentID')}
                isInvalid={!!errors.DepartmentID}
              >
                <option value=''>Select a department...</option>
                {departments.map((dept) => (
                  <option key={dept.DepartmentID} value={dept.DepartmentID}>
                    {dept.Name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type='invalid'>
                {errors.DepartmentID?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className='d-flex gap-2'>
              <Button variant='primary' type='submit' disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
              <Button
                variant='secondary'
                onClick={() => navigate('/courses')}
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
