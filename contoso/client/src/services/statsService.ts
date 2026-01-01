import axios from 'axios';
import type { EnrollmentDateGroup } from '../types/stats';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const statsService = {
    /**
     * Fetch student enrollment statistics grouped by date
     */
    async fetchStudentStats(): Promise<EnrollmentDateGroup[]> {
        try {
            const response = await axios.get<EnrollmentDateGroup[]>(`${API_BASE_URL}/stats`);
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 'Failed to fetch enrollment statistics'
            );
        }
    },
};
