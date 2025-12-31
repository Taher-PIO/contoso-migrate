import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createStudent, clearError } from '../../store/slices/studentsSlice';
import type { StudentFormData } from '../../types/student';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: yupResolver(studentSchema),
    defaultValues: {
      FirstMidName: '',
      LastName: '',
      EnrollmentDate: new Date().toISOString().split('T')[0], // Today's date
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    const result = await dispatch(createStudent(data));
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
