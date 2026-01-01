import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchDepartmentByIdThunk,
  updateDepartmentThunk,
  fetchInstructorsThunk,
  clearCurrentDepartment,
  clearError,
  clearConflict,
} from '../../store/slices/departmentsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { DepartmentFormData } from '../../types/department';

// Validation schema for edit
const departmentEditSchema = yup.object({
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
    .string()
    .optional()
    .transform((value) => (value === '' ? undefined : value))
    .test('valid-instructor', 'Invalid instructor selection', (value) => {
      if (value === undefined || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 1;
    }),
});

export const DepartmentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    currentDepartment,
    instructors,
    conflictingDepartment,
    loading,
    error,
  } = useAppSelector((state) => state.departments);

  const [attemptedValues, setAttemptedValues] =
    useState<DepartmentFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: yupResolver(departmentEditSchema) as any,
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchDepartmentByIdThunk(parseInt(id)));
    }
    dispatch(fetchInstructorsThunk());

    return () => {
      dispatch(clearCurrentDepartment());
      dispatch(clearConflict());
    };
  }, [dispatch, id]);

  // Pre-populate form when department data loads
  useEffect(() => {
    if (currentDepartment) {
      const startDateString = new Date(currentDepartment.StartDate)
        .toISOString()
        .split('T')[0];
      reset({
        Name: currentDepartment.Name,
        Budget: currentDepartment.Budget,
        StartDate: startDateString,
        InstructorID: currentDepartment.InstructorID?.toString() || '',
        version: currentDepartment.version,
      });
    }
  }, [currentDepartment, reset]);

  const onSubmit = async (data: DepartmentFormData) => {
    if (!id || !currentDepartment) return;

    // Store attempted values for conflict comparison
    setAttemptedValues(data);

    // Convert InstructorID from string to number or undefined
    const submitData = {
      Name: data.Name,
      Budget: data.Budget,
      StartDate: data.StartDate,
      InstructorID:
        data.InstructorID === '' ? undefined : Number(data.InstructorID),
      version: currentDepartment.version, // CRITICAL: Include version for concurrency
    };

    const result = await dispatch(
      updateDepartmentThunk({ id: parseInt(id), data: submitData })
    );

    if (updateDepartmentThunk.fulfilled.match(result)) {
      navigate('/departments');
    }
    // If rejected with 409, conflictingDepartment will be set in Redux state
  };

  const handleOverwrite = async () => {
    if (!id || !conflictingDepartment) return;

    // Refetch current department to get latest version
    const refetchResult = await dispatch(
      fetchDepartmentByIdThunk(parseInt(id))
    );

    if (fetchDepartmentByIdThunk.fulfilled.match(refetchResult)) {
      const latestDepartment = refetchResult.payload;

      // Resubmit with attempted values and new version
      const submitData = {
        Name: attemptedValues?.Name || latestDepartment.Name,
        Budget: attemptedValues?.Budget || latestDepartment.Budget,
        StartDate:
          attemptedValues?.StartDate ||
          new Date(latestDepartment.StartDate).toISOString().split('T')[0],
        InstructorID:
          attemptedValues?.InstructorID === ''
            ? undefined
            : Number(attemptedValues?.InstructorID),
        version: latestDepartment.version, // Use new version
      };

      const result = await dispatch(
        updateDepartmentThunk({ id: parseInt(id), data: submitData })
      );

      if (updateDepartmentThunk.fulfilled.match(result)) {
        dispatch(clearConflict());
        navigate('/departments');
      }
    }
  };

  const handleCancelConflict = () => {
    dispatch(clearConflict());
    navigate('/departments');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !currentDepartment) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1>Edit Department</h1>

      {/* Concurrency Conflict Alert */}
      {conflictingDepartment && attemptedValues && (
        <Alert variant='warning' className='mb-3'>
          <Alert.Heading>⚠️ Concurrency Conflict Detected</Alert.Heading>
          <p>
            This department was modified by another user while you were editing.
            The current values in the database are:
          </p>
          <ul className='mb-3'>
            {conflictingDepartment.Name !== attemptedValues.Name && (
              <li>
                <strong>Name:</strong> {conflictingDepartment.Name}
                <span className='text-muted'>
                  {' '}
                  (you entered: {attemptedValues.Name})
                </span>
              </li>
            )}
            {conflictingDepartment.Budget !== attemptedValues.Budget && (
              <li>
                <strong>Budget:</strong>{' '}
                {formatCurrency(conflictingDepartment.Budget)}
                <span className='text-muted'>
                  {' '}
                  (you entered: {formatCurrency(attemptedValues.Budget)})
                </span>
              </li>
            )}
            {new Date(conflictingDepartment.StartDate)
              .toISOString()
              .split('T')[0] !== attemptedValues.StartDate && (
              <li>
                <strong>Start Date:</strong>{' '}
                {formatDate(conflictingDepartment.StartDate)}
                <span className='text-muted'>
                  {' '}
                  (you entered: {formatDate(attemptedValues.StartDate)})
                </span>
              </li>
            )}
            {conflictingDepartment.InstructorID !==
              Number(attemptedValues.InstructorID || 0) && (
              <li>
                <strong>Administrator:</strong>{' '}
                {conflictingDepartment.administrator
                  ? `${conflictingDepartment.administrator.FirstMidName} ${conflictingDepartment.administrator.LastName}`
                  : 'None'}
                <span className='text-muted'>
                  {' '}
                  (you selected:{' '}
                  {instructors.find(
                    (i) => i.ID === Number(attemptedValues.InstructorID)
                  )
                    ? `${
                        instructors.find(
                          (i) => i.ID === Number(attemptedValues.InstructorID)
                        )?.FirstMidName
                      } ${
                        instructors.find(
                          (i) => i.ID === Number(attemptedValues.InstructorID)
                        )?.LastName
                      }`
                    : 'None'}
                  )
                </span>
              </li>
            )}
          </ul>
          <p>What would you like to do?</p>
          <div className='d-flex gap-2'>
            <Button variant='danger' onClick={handleOverwrite}>
              Overwrite Changes
            </Button>
            <Button variant='secondary' onClick={handleCancelConflict}>
              Cancel and Go Back
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <Card.Body>
          {error && !conflictingDepartment && (
            <Alert
              variant='danger'
              dismissible
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            {/* Hidden version field - CRITICAL for concurrency */}
            <input type='hidden' {...register('version')} />

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
                {loading ? 'Saving...' : 'Save'}
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
