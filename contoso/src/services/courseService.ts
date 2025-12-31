import { db } from '../config/database';
import { courses, departments, enrollments, courseInstructors } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '../utils/errors';

export class CourseService {
    async findAll() {
        return db.query.courses.findMany({
            with: {
                department: true,
                instructors: {
                    with: {
                        instructor: true,
                    },
                },
            },
        });
    }

    async findById(courseId: number) {
        const course = await db.query.courses.findFirst({
            where: eq(courses.CourseID, courseId),
            with: {
                department: true,
                instructors: {
                    with: {
                        instructor: true,
                    },
                },
                enrollments: {
                    with: {
                        student: true,
                    },
                },
            },
        });

        if (!course) {
            throw new NotFoundError(`Course with ID ${courseId} not found`);
        }

        return course;
    }

    // Manual CourseID validation
    async create(data: {
        CourseID: number;
        Title: string;
        Credits: number;
        DepartmentID: number;
    }) {
        // Validate CourseID is provided (manual assignment)
        if (!data.CourseID) {
            throw new ValidationError('CourseID must be provided manually');
        }

        // Check for duplicate CourseID
        const existing = await db.query.courses.findFirst(
{
            where: eq(courses.CourseID, data.CourseID),
        });

        if (existing) {
            throw new ValidationError(`Course with ID ${data.CourseID} already exists`);
        }

        // Validate Credits range (0-5 from EF Core model)
        if (data.Credits < 0 || data.Credits > 5) {
            throw new ValidationError('Credits must be between 0 and 5');
        }

        const result = await db.insert(courses).values({
            CourseID: data.CourseID,
            Title: data.Title,
            Credits: data.Credits,
            DepartmentID: data.DepartmentID,
        }).returning();

        return result[0];
    }

    async update(
        courseId: number,
        data: {
            Title?: string;
            Credits?: number;
            DepartmentID?: number;
        }
    ) {
        const course = await db.query.courses.findFirst({
            where: eq(courses.CourseID, courseId),
        });

        if (!course) {
            throw new NotFoundError(`Course with ID ${courseId} not found`);
        }

        // Validate Credits if provided
        if (data.Credits !== undefined && (data.Credits < 0 || data.Credits > 5)) {
            throw new ValidationError('Credits must be between 0 and 5');
        }

        const updateData: any = {};
        if (data.Title !== undefined) updateData.Title = data.Title;
        if (data.Credits !== undefined) updateData.Credits = data.Credits;
        if (data.DepartmentID !== undefined) updateData.DepartmentID = data.DepartmentID;

        const result = await db.update(courses)
            .set(updateData)
            .where(eq(courses.CourseID, courseId))
            .returning();

        return result[0];
    }

    async delete(courseId: number) {
        const course = await db.query.courses.findFirst({
            where: eq(courses.CourseID, courseId),
        });

        if (!course) {
            throw new NotFoundError(`Course with ID ${courseId} not found`);
        }

        await db.delete(courses).where(eq(courses.CourseID, courseId));

        return { message: 'Course deleted successfully' };
    }

    async assignInstructor(courseId: number, instructorId: number) {
        await this.findById(courseId);

        await db.insert(courseInstructors).values({
            CourseID: courseId,
            InstructorID: instructorId,
        });

        return this.findById(courseId);
    }

    async removeInstructor(courseId: number, instructorId: number) {
        await this.findById(courseId);

        await db.delete(courseInstructors)
            .where(and(
                eq(courseInstructors.CourseID, courseId),
                eq(courseInstructors.InstructorID, instructorId)
            ));

        return this.findById(courseId);
    }
}
