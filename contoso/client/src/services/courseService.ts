import axios, { AxiosError } from 'axios';
import type {
    Course,
    CourseCreateData,
    CourseUpdateData,
    Department,
} from '../types/course';

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

// Course API service
export const courseService = {
    // GET /api/courses - List all courses (no pagination)
    async fetchCourses(): Promise<Course[]> {
        try {
            const response = await axios.get<Course[]>(`${API_BASE_URL}/courses`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // GET /api/courses/:id - Get single course with relationships
    async fetchCourseById(id: number): Promise<Course> {
        try {
            const response = await axios.get<Course>(`${API_BASE_URL}/courses/${id}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // POST /api/courses - Create new course (manual CourseID required)
    async createCourse(data: CourseCreateData): Promise<Course> {
        try {
            const response = await axios.post<Course>(`${API_BASE_URL}/courses`, data);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // PUT /api/courses/:id - Update existing course (CourseID immutable)
    async updateCourse(id: number, data: CourseUpdateData): Promise<Course> {
        try {
            const response = await axios.put<Course>(`${API_BASE_URL}/courses/${id}`, data);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // DELETE /api/courses/:id - Delete course (cascade to enrollments)
    async deleteCourse(id: number): Promise<{ message: string }> {
        try {
            const response = await axios.delete<{ message: string }>(`${API_BASE_URL}/courses/${id}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // GET /api/departments - Fetch all departments for dropdown (ordered by Name on frontend)
    async fetchDepartments(): Promise<Department[]> {
        try {
            const response = await axios.get<Department[]>(`${API_BASE_URL}/departments`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },
};
