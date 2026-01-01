import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  createDepartmentThunk,
  fetchInstructorsThunk,
  clearError,
} from '../../store/slices/departmentsSlice';
import type { DepartmentFormData } from '../../types/department';

// Form-specific type that matches the yup schema - use yup's inferred type
type DepartmentFormInput = yup.InferType<typeof departmentSchema>;

// Enhanced validation schema matching backend constraints
const departmentSchema = yup.object({
  Name: yup
    .string()
    .required('Name is required')
    .min(1, 'Name must be at least 1 character')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(
      /^[a-zA-Z\s\-&]+$/,
      'Name can only contain letters, spaces, hyphens, and ampersands'
    )
    .test('no-xss', 'Name contains invalid characters', (value) => {
      if (!value) return true;
      return !/<|>|script|javascript:/i.test(value);
    }),
  Budget: yup
    .number()
    .required('Budget is required')
    .min(0, 'Budget must be at least 0')
    .max(999999999, 'Budget cannot exceed 999,999,999')
    .typeError('Budget must be a valid number'),
  StartDate: yup
    .string()
    .required('Start Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in yyyy-MM-dd format')
    .test('valid-date', 'Start Date must be a valid date', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test(
      'date-range',
      'Start Date must be between 1900 and today',
      (value) => {
        if (!value) return false;
        const date = new Date(value);
        const minDate = new Date('1900-01-01');
        const maxDate = new Date();
        return date >= minDate && date <= maxDate;
      }
    ),
  InstructorID: yup
    .mixed()
    .transform((value) => (value === '' ? undefined : Number(value)))
    .optional()
    .test('valid-instructor', 'Invalid instructor selection', (value) => {
      return value === undefined || (typeof value === 'number' && value >= 1);
    }),
});

export const DepartmentCreatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { instructors, loading, error } = useAppSelector(
    (state) => state.departments
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormInput>({
    resolver: yupResolver(departmentSchema),
    defaultValues: {
      Name: '',
      Budget: 0,
      StartDate: new Date().toISOString().split('T')[0], // Today's date
      InstructorID: '',
    },
  });

  useEffect(() => {
    // Fetch instructors for dropdown
    dispatch(fetchInstructorsThunk());
  }, [dispatch]);

  const onSubmit = async (data: DepartmentFormInput) => {
    // Convert InstructorID from string to number or undefined
    const submitData = {
      Name: data.Name,
      Budget: data.Budget,
      StartDate: data.StartDate,
      InstructorID:
        data.InstructorID === '' ? undefined : Number(data.InstructorID),
    };

    const result = await dispatch(createDepartmentThunk(submitData));
    if (createDepartmentThunk.fulfilled.match(result)) {
      navigate('/departments');
    }
  };

  return (
    <div>
      <h1>Create Department</h1>

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
            <Form.Group className='mb-3' controlId='Name'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                {...register('Name')}
                isInvalid={!!errors.Name}
                placeholder='Enter department name'
              />
              <Form.Control.Feedback type='invalid'>
                {errors.Name?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className='mb-3' controlId='Budget'>
              <Form.Label>Budget</Form.Label>
              <Form.Control
                type='number'
                step='0.01'
                {...register('Budget')}
                isInvalid={!!errors.Budget}
                placeholder='Enter budget amount'
              />
              <Form.Control.Feedback type='invalid'>
                {errors.Budget?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className='mb-3' controlId='StartDate'>
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type='date'
                {...register('StartDate')}
                isInvalid={!!errors.StartDate}
                max={new Date().toISOString().split('T')[0]}
              />
              <Form.Control.Feedback type='invalid'>
                {errors.StartDate?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className='mb-3' controlId='InstructorID'>
              <Form.Label>Administrator</Form.Label>
              <Form.Select
                {...register('InstructorID')}
                isInvalid={!!errors.InstructorID}
              >
                <option value=''>No Administrator</option>
                {instructors.map((instructor) => (
                  <option key={instructor.ID} value={instructor.ID}>
                    {instructor.FirstMidName} {instructor.LastName}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type='invalid'>
                {errors.InstructorID?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className='d-flex gap-2'>
              <Button variant='primary' type='submit' disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
              <Button
                variant='secondary'
                onClick={() => navigate('/departments')}
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
