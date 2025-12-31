import { db } from '../config/drizzle';
import { students, enrollments, courses } from '../db/schema';
import { eq, or, like, asc, desc, sql, count } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '../utils/errors';

export type StudentListParams = {
    page?: number;
    pageSize?: number;
    sortBy?: 'LastName' | 'EnrollmentDate';
    sortOrder?: 'asc' | 'desc';
    search?: string;
};

export class StudentService {
    async findAll(params: StudentListParams = {}) {
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
        const sortBy = params.sortBy ?? 'LastName';
        const sortOrder = params.sortOrder ?? 'asc';
        const search = (params.search ?? '').trim();

        // Build where condition for search (case-insensitive)
        const whereCondition = search
            ? or(
                sql`lower(${students.LastName}) like ${'%' + search.toLowerCase() + '%'}`,
                sql`lower(${students.FirstMidName}) like ${'%' + search.toLowerCase() + '%'}`
            )
            : undefined;

        // Build order by clause
        const orderByColumn = sortBy === 'LastName' ? students.LastName : students.EnrollmentDate;
        const orderByDirection = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

        // Execute count and query in parallel
        const [totalResult, items] = await Promise.all([
            db
                .select({ count: count() })
                .from(students)
                .where(whereCondition)
                .then((result) => result[0]?.count ?? 0),
            db
                .select()
                .from(students)
                .where(whereCondition)
                .orderBy(orderByDirection)
                .limit(pageSize)
                .offset((page - 1) * pageSize),
        ]);

        return {
            items,
            total: totalResult,
            page,
            pageSize,
            sortBy,
            sortOrder,
            search: search || undefined,
        };
    }

    async findById(id: number) {
        const student = await db.query.students.findFirst({
            where: eq(students.ID, id),
            with: {
                enrollments: {
                    with: {
                        course: true,
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundError(`Student with ID ${id} not found`);
        }

        return student;
    }

    async create(data: { FirstMidName: string; LastName: string; EnrollmentDate: Date | string }) {
        const { FirstMidName, LastName, EnrollmentDate } = data;

        if (!FirstMidName || !FirstMidName.trim()) {
            throw new ValidationError('FirstMidName is required');
        }
        if (!LastName || !LastName.trim()) {
            throw new ValidationError('LastName is required');
        }

        const enrollmentDate = new Date(EnrollmentDate);
        if (isNaN(enrollmentDate.getTime())) {
            throw new ValidationError('EnrollmentDate must be a valid date');
        }

        const result = await db
            .insert(students)
            .values({
                FirstMidName: FirstMidName.trim(),
                LastName: LastName.trim(),
                EnrollmentDate: enrollmentDate,
            })
            .returning();

        return result[0];
    }

    async update(
        id: number,
        data: { FirstMidName?: string; LastName?: string; EnrollmentDate?: Date | string }
    ) {
        const student = await db.query.students.findFirst({
            where: eq(students.ID, id),
        });

        if (!student) {
            throw new NotFoundError(`Student with ID ${id} not found`);
        }

        const updateData: { FirstMidName?: string; LastName?: string; EnrollmentDate?: Date } = {};

        if (data.FirstMidName !== undefined) {
            if (!data.FirstMidName.trim()) {
                throw new ValidationError('FirstMidName cannot be empty');
            }
            updateData.FirstMidName = data.FirstMidName.trim();
        }

        if (data.LastName !== undefined) {
            if (!data.LastName.trim()) {
                throw new ValidationError('LastName cannot be empty');
            }
            updateData.LastName = data.LastName.trim();
        }

        if (data.EnrollmentDate !== undefined) {
            const d = new Date(data.EnrollmentDate);
            if (isNaN(d.getTime())) {
                throw new ValidationError('EnrollmentDate must be a valid date');
            }
            updateData.EnrollmentDate = d;
        }

        const result = await db.update(students).set(updateData).where(eq(students.ID, id)).returning();

        return result[0];
    }

    async delete(id: number) {
        const student = await db.query.students.findFirst({
            where: eq(students.ID, id),
        });

        if (!student) {
            throw new NotFoundError(`Student with ID ${id} not found`);
        }

        await db.delete(students).where(eq(students.ID, id));
        return { message: 'Student deleted successfully' };
    }
}
