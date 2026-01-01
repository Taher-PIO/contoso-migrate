import axios, { AxiosError } from 'axios';
import type {
    Department,
    DepartmentCreateData,
    DepartmentUpdateData,
    Instructor,
} from '../types/department';

const API_BASE_URL = '/api';

// API error response interface
export interface ApiError {
    message: string;
    statusCode?: number;
    currentData?: Department; // For 409 Conflict responses
}

// Handle API errors with special handling for 409 Conflict
const handleApiError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string; currentData?: Department }>;
        return {
            message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
            statusCode: axiosError.response?.status,
            currentData: axiosError.response?.data?.currentData, // For concurrency conflicts
        };
    }
    return {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
};

// Department API service
export const departmentService = {
    // GET /api/departments - List all departments
    async fetchDepartments(): Promise<Department[]> {
        try {
            const response = await axios.get<Department[]>(`${API_BASE_URL}/departments`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // GET /api/departments/:id - Get single department with relationships
    async fetchDepartmentById(id: number): Promise<Department> {
        try {
            const response = await axios.get<Department>(`${API_BASE_URL}/departments/${id}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // POST /api/departments - Create new department
    async createDepartment(data: DepartmentCreateData): Promise<Department> {
        try {
            const response = await axios.post<Department>(`${API_BASE_URL}/departments`, data);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // PUT /api/departments/:id - Update existing department (version REQUIRED)
    async updateDepartment(id: number, data: DepartmentUpdateData): Promise<Department> {
        try {
            const response = await axios.put<Department>(`${API_BASE_URL}/departments/${id}`, data);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // DELETE /api/departments/:id - Delete department
    async deleteDepartment(id: number): Promise<{ message: string }> {
        try {
            const response = await axios.delete<{ message: string }>(`${API_BASE_URL}/departments/${id}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // GET /api/instructors - Fetch all instructors for dropdown
    async fetchInstructors(): Promise<Instructor[]> {
        try {
            const response = await axios.get<Instructor[]>(`${API_BASE_URL}/instructors`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },
};
