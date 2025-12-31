import axios, { AxiosError } from 'axios';
import type {
  Student,
  StudentWithEnrollments,
  StudentFormData,
  StudentListResponse,
  StudentQueryParams,
} from '../types/student';

const API_BASE_URL = '/api';

// API error response interface
export interface ApiError {
  message: string;
  statusCode?: number;
}

// Handle API errors
const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return {
      message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
      statusCode: axiosError.response?.status,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
  };
};

// Student API service
export const studentService = {
  // GET /api/students - List with pagination, search, sort
  async getStudents(params: StudentQueryParams = {}): Promise<StudentListResponse> {
    try {
      const response = await axios.get<StudentListResponse>(`${API_BASE_URL}/students`, {
        params: {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          search: params.search || '',
          sortOrder: params.sortOrder || 'asc',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // GET /api/students/:id - Get single student with enrollments
  async getStudentById(id: number): Promise<StudentWithEnrollments> {
    try {
      const response = await axios.get<StudentWithEnrollments>(`${API_BASE_URL}/students/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // POST /api/students - Create new student
  async createStudent(data: StudentFormData): Promise<Student> {
    try {
      const response = await axios.post<Student>(`${API_BASE_URL}/students`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // PUT /api/students/:id - Update existing student
  async updateStudent(id: number, data: StudentFormData): Promise<Student> {
    try {
      const response = await axios.put<Student>(`${API_BASE_URL}/students/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // DELETE /api/students/:id - Delete student
  async deleteStudent(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/students/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
