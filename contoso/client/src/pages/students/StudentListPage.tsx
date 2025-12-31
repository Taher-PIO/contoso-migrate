import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Button,
  Form,
  InputGroup,
  Alert,
  Row,
  Col,
} from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchStudents,
  setSearch,
  setSortOrder,
  clearError,
} from '../../store/slices/studentsSlice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';

export const StudentListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    students = [],
    loading,
    error,
    pagination,
    search,
    sortOrder,
  } = useAppSelector((state) => state.students);

  const [localSearch, setLocalSearch] = useState(search || '');

  // Get query params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentSearch = searchParams.get('search') || '';
  const currentSort = (searchParams.get('sort') || 'asc') as typeof sortOrder;

  useEffect(() => {
    // Fetch students when component mounts or params change
    dispatch(
      fetchStudents({
        page: currentPage,
        pageSize: 10,
        search: currentSearch,
        sortOrder: currentSort,
      })
    );
  }, [dispatch, currentPage, currentSearch, currentSort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      page: '1',
      search: localSearch,
      sort: currentSort,
    });
    dispatch(setSearch(localSearch));
  };

  const handleSortToggle = () => {
    const newSort: typeof sortOrder = currentSort === 'asc' ? 'desc' : 'asc';
    setSearchParams({
      page: String(currentPage),
      search: currentSearch,
      sort: newSort,
    });
    dispatch(setSortOrder(newSort));
  };

  const handlePageChange = (page: number) => {
    setSearchParams({
      page: String(page),
      search: currentSearch,
      sort: currentSort,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div>
      <h1>Students</h1>

      {error && (
        <Alert
          variant='danger'
          dismissible
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}

      <Row className='mb-3'>
        <Col md={6}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type='text'
                placeholder='Search by last name or first name...'
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <Button type='submit' variant='primary'>
                Search
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={4}>
          <Button
            variant='outline-secondary'
            onClick={handleSortToggle}
            className='w-100'
          >
            Sort by Name: {currentSort === 'asc' ? '\u2191 A-Z' : '\u2193 Z-A'}
          </Button>
        </Col>
        <Col md={2} className='text-end'>
          <Button
            variant='success'
            onClick={() => navigate('/students/create')}
          >
            Create New
          </Button>
        </Col>
      </Row>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Enrollment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className='text-center'>
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.ID}>
                    <td>{student.LastName}</td>
                    <td>{student.FirstMidName}</td>
                    <td>{formatDate(student.EnrollmentDate)}</td>
                    <td>
                      <Link
                        to={`/students/${student.ID}`}
                        className='btn btn-sm btn-info me-1'
                      >
                        Details
                      </Link>
                      <Link
                        to={`/students/${student.ID}/edit`}
                        className='btn btn-sm btn-warning me-1'
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/students/${student.ID}/delete`}
                        className='btn btn-sm btn-danger'
                      >
                        Delete
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}

          <div className='text-muted'>
            Showing {students.length} of {pagination.total} students
          </div>
        </>
      )}
    </div>
  );
};
