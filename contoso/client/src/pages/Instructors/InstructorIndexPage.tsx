import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchIndexViewDataThunk,
  setSelectedInstructor,
  setSelectedCourse,
  clearError,
} from '../../store/slices/instructorsSlice';

const InstructorIndexPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { indexState, loading, error } = useAppSelector(
    (state) => state.instructors
  );

  // Get query params
  const instructorIDParam = searchParams.get('id');
  const courseIDParam = searchParams.get('courseID');

  const selectedInstructorID = instructorIDParam
    ? Number(instructorIDParam)
    : null;
  const selectedCourseID = courseIDParam ? Number(courseIDParam) : null;

  // Fetch data when component mounts or query params change
  useEffect(() => {
    dispatch(
      fetchIndexViewDataThunk({
        instructorID: selectedInstructorID || undefined,
        courseID: selectedCourseID || undefined,
      })
    );
    dispatch(setSelectedInstructor(selectedInstructorID));
    dispatch(setSelectedCourse(selectedCourseID));
  }, [dispatch, selectedInstructorID, selectedCourseID]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle instructor selection
  const handleInstructorClick = (id: number) => {
    if (selectedInstructorID === id) {
      // Deselect instructor
      setSearchParams({});
    } else {
      // Select instructor
      setSearchParams({ id: id.toString() });
    }
  };

  // Handle course selection
  const handleCourseClick = (courseID: number) => {
    if (!selectedInstructorID) return;

    if (selectedCourseID === courseID) {
      // Deselect course
      setSearchParams({ id: selectedInstructorID.toString() });
    } else {
      // Select course
      setSearchParams({
        id: selectedInstructorID.toString(),
        courseID: courseID.toString(),
      });
    }
  };

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
    <div className='container-fluid mt-4'>
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

      <div className='row'>
        {/* Panel 1: All Instructors */}
        <div className='col-md-4'>
          <h3>All Instructors</h3>
          <div className='table-responsive'>
            <table className='table table-bordered table-hover'>
              <thead className='table-light'>
                <tr>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>Hire Date</th>
                  <th>Office</th>
                </tr>
              </thead>
              <tbody>
                {indexState.instructors.map((instructor) => (
                  <tr
                    key={instructor.ID}
                    className={
                      selectedInstructorID === instructor.ID
                        ? 'table-active'
                        : ''
                    }
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleInstructorClick(instructor.ID)}
                  >
                    <td>{instructor.LastName}</td>
                    <td>{instructor.FirstMidName}</td>
                    <td>
                      {new Date(instructor.HireDate).toLocaleDateString()}
                    </td>
                    <td>{instructor.OfficeAssignment?.Location || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Courses Taught by Selected Instructor */}
        {selectedInstructorID && (
          <div className='col-md-4'>
            <h3>Courses</h3>
            {indexState.courses.length === 0 ? (
              <p className='text-muted'>
                No courses assigned to this instructor.
              </p>
            ) : (
              <div className='table-responsive'>
                <table className='table table-bordered table-hover'>
                  <thead className='table-light'>
                    <tr>
                      <th>Course ID</th>
                      <th>Title</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexState.courses.map((course) => (
                      <tr
                        key={course.CourseID}
                        className={
                          selectedCourseID === course.CourseID
                            ? 'table-active'
                            : ''
                        }
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleCourseClick(course.CourseID)}
                      >
                        <td>{course.CourseID}</td>
                        <td>{course.Title}</td>
                        <td>
                          {course.Department ? course.Department.Name : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Panel 3: Enrollments in Selected Course */}
        {selectedCourseID && (
          <div className='col-md-4'>
            <h3>Enrollments</h3>
            {indexState.enrollments.length === 0 ? (
              <p className='text-muted'>
                No enrollments found for this course.
              </p>
            ) : (
              <div className='table-responsive'>
                <table className='table table-bordered'>
                  <thead className='table-light'>
                    <tr>
                      <th>Student Name</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexState.enrollments.map((enrollment) => (
                      <tr key={enrollment.EnrollmentID}>
                        <td>
                          {enrollment.Student
                            ? `${enrollment.Student.LastName}, ${enrollment.Student.FirstMidName}`
                            : 'N/A'}
                        </td>
                        <td>{enrollment.Grade || 'No grade'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className='mt-3'>
        <Link to='/instructors/list' className='btn btn-secondary me-2'>
          View Simple List
        </Link>
        <Link to='/' className='btn btn-outline-secondary'>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default InstructorIndexPage;
