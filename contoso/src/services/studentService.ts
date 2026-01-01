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

    async create(data: {
        FirstMidName: string;
        LastName: string;
        EnrollmentDate: Date | string;
        Enrollments?: Array<{ CourseID: number; Grade?: number | null }>;
    }) {
        const { FirstMidName, LastName, EnrollmentDate, Enrollments } = data;

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

        // Use transaction to create student and enrollments
        return await db.transaction(async (tx) => {
            const result = await tx
                .insert(students)
                .values({
                    FirstMidName: FirstMidName.trim(),
                    LastName: LastName.trim(),
                    EnrollmentDate: enrollmentDate,
                })
                .returning();

            const student = result[0];

            // Create enrollments if provided
            if (Enrollments && Enrollments.length > 0) {
                await this.syncEnrollments(student.ID, Enrollments, tx);
            }

            return student;
        });
    }

    async update(
        id: number,
        data: {
            FirstMidName?: string;
            LastName?: string;
            EnrollmentDate?: Date | string;
            Enrollments?: Array<{ CourseID: number; Grade?: number | null }>;
        }
    ) {
        const student = await db.query.students.findFirst({
            where: eq(students.ID, id),
        });

        if (!student) {
            throw new NotFoundError(`Student with ID ${id} not found`);
        }

        return await db.transaction(async (tx) => {
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

            const result = await tx.update(students).set(updateData).where(eq(students.ID, id)).returning();

            // Sync enrollments if provided
            if (data.Enrollments !== undefined) {
                await this.syncEnrollments(id, data.Enrollments, tx);
            }

            return result[0];
        });
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

    /**
     * Sync enrollments for a student - handles create, update, and delete
     * Uses HashSet diff pattern similar to instructor courses
     */
    private async syncEnrollments(
        studentID: number,
        newEnrollments: Array<{ CourseID: number; Grade?: number | null }>,
        tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
    ) {
        // Get current enrollments
        const current = await tx.query.enrollments.findMany({
            where: eq(enrollments.StudentID, studentID),
        });

        const currentMap = new Map<number, typeof current[0]>(current.map((e: typeof current[0]) => [e.CourseID, e]));
        const newMap = new Map(newEnrollments.map(e => [e.CourseID, e]));

        // Find enrollments to delete (in current but not in new)
        const toDelete = current.filter((e: typeof current[0]) => !newMap.has(e.CourseID));

        // Find enrollments to add (in new but not in current)
        const toAdd = newEnrollments.filter(e => !currentMap.has(e.CourseID));

        // Find enrollments to update (in both, but grade changed)
        const toUpdate = newEnrollments.filter(e => {
            const curr = currentMap.get(e.CourseID);
            if (!curr) return false;
            // Update if grade is different (including null/undefined differences)
            const newGrade = e.Grade === undefined ? null : e.Grade;
            const currGrade = curr.Grade;
            return newGrade !== currGrade;
        });

        // Execute deletes
        if (toDelete.length > 0) {
            for (const enrollment of toDelete) {
                await tx.delete(enrollments).where(
                    sql`${enrollments.EnrollmentID} = ${enrollment.EnrollmentID}`
                );
            }
        }

        // Execute inserts
        if (toAdd.length > 0) {
            await tx.insert(enrollments).values(
                toAdd.map(e => ({
                    StudentID: studentID,
                    CourseID: e.CourseID,
                    Grade: e.Grade === undefined ? null : e.Grade,
                }))
            );
        }

        // Execute updates
        if (toUpdate.length > 0) {
            for (const enrollment of toUpdate) {
                const curr = currentMap.get(enrollment.CourseID);
                if (curr) {
                    await tx.update(enrollments)
                        .set({ Grade: enrollment.Grade === undefined ? null : enrollment.Grade })
                        .where(sql`${enrollments.EnrollmentID} = ${curr.EnrollmentID}`);
                }
            }
        }
    }
}
