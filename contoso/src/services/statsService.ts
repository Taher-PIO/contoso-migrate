import { db } from '../config/drizzle';
import { students } from '../db/schema';
import { sql } from 'drizzle-orm';

export interface EnrollmentDateGroup {
    EnrollmentDate: string;
    StudentCount: number;
}

export class StatsService {
    /**
     * Get student enrollment statistics grouped by enrollment date
     * Returns array of {EnrollmentDate, StudentCount} ordered by date
     */
    async getStudentEnrollmentStats(): Promise<EnrollmentDateGroup[]> {
        // Use SQL to group by date and count students
        // SQLite date function to extract date from timestamp
        const result = await db
            .select({
                EnrollmentDate: sql<string>`DATE(${students.EnrollmentDate})`.as('EnrollmentDate'),
                StudentCount: sql<number>`COUNT(*)`.as('StudentCount'),
            })
            .from(students)
            .groupBy(sql`DATE(${students.EnrollmentDate})`)
            .orderBy(sql`DATE(${students.EnrollmentDate})`);

        return result;
    }
}

export const statsService = new StatsService();
