import axios, { AxiosError } from 'axios';
import type {
    Instructor,
    InstructorIndexData,
    InstructorCreateData,
    InstructorUpdateData,
} from '../types/instructor';

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

// Instructor API service
export const instructorService = {
    // GET /api/instructors - List all instructors
    async fetchInstructors(): Promise<Instructor[]> {
        try {
            const response = await axios.get<Instructor[]>(`${API_BASE_URL}/instructors`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // GET /api/instructors/view - Get data for Index view (3-panel)
    async fetchIndexViewData(instructorID?: number, courseID?: number): Promise<InstructorIndexData> {
        try {
            const params: any = {};
            if (instructorID !== undefined) params.id = instructorID;
            if (courseID !== undefined) params.courseID = courseID;

            const response = await axios.get<InstructorIndexData>(`${API_BASE_URL}/instructors/view`, { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // GET /api/instructors/:id - Get single instructor with relationships
    async fetchInstructorById(id: number): Promise<Instructor> {
        try {
            const response = await axios.get<Instructor>(`${API_BASE_URL}/instructors/${id}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // POST /api/instructors - Create new instructor
    async createInstructor(data: InstructorCreateData): Promise<Instructor> {
        try {
            const response = await axios.post<Instructor>(`${API_BASE_URL}/instructors`, data);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // PUT /api/instructors/:id - Update existing instructor
    async updateInstructor(id: number, data: InstructorUpdateData): Promise<Instructor> {
        try {
            const response = await axios.put<Instructor>(`${API_BASE_URL}/instructors/${id}`, data);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // DELETE /api/instructors/:id - Delete instructor
    async deleteInstructor(id: number): Promise<{ message: string }> {
        try {
            const response = await axios.delete<{ message: string }>(`${API_BASE_URL}/instructors/${id}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },
};
