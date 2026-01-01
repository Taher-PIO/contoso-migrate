import { db } from '../config/database';
import { instructors, officeAssignments, courseInstructors, courses, enrollments, departments } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '../utils/errors';

export class InstructorService {
    /**
     * Find all instructors with office assignments
     */
    async findAll() {
        return db.query.instructors.findMany({
            with: {
                officeAssignment: true,
                courses: {
                    with: {
                        course: true,
                    },
                },
            },
        });
    }

    /**
     * Find instructor by ID with all relationships
     */
    async findById(id: number) {
        const instructor = await db.query.instructors.findFirst({
            where: eq(instructors.ID, id),
            with: {
                officeAssignment: true,
                courses: {
                    with: {
                        course: true,
                    },
                },
            },
        });

        if (!instructor) {
            throw new NotFoundError(`Instructor with ID ${id} not found`);
        }

        return instructor;
    }

    /**
     * Complex query for Index view (3-panel data)
     * Returns: all instructors, courses for selected instructor, enrollments for selected course
     */
    async findForIndexView(instructorID?: number, courseID?: number) {
        // Always fetch all instructors with office assignments
        const allInstructors = await db.query.instructors.findMany({
            with: {
                officeAssignment: true,
            },
        });

        // Fetch courses for selected instructor (if instructorID provided)
        let instructorCourses: any[] = [];
        if (instructorID) {
            const courseAssignments = await db.query.courseInstructors.findMany({
                where: eq(courseInstructors.InstructorID, instructorID),
                with: {
                    course: {
                        with: {
                            department: true,
                        },
                    },
                },
            });
            instructorCourses = courseAssignments.map((ca) => ca.course);
        }

        // Fetch enrollments for selected course (if courseID provided)
        let courseEnrollments: any[] = [];
        if (courseID) {
            courseEnrollments = await db.query.enrollments.findMany({
                where: eq(enrollments.CourseID, courseID),
                with: {
                    student: true,
                },
            });
        }

        return {
            instructors: allInstructors,
            courses: instructorCourses,
            enrollments: courseEnrollments,
        };
    }

    /**
     * Create instructor with office assignment and course assignments
     */
    async create(data: {
        FirstMidName: string;
        LastName: string;
        HireDate: Date | string;
        OfficeLocation?: string;
        CourseIDs?: number[];
    }) {
        const hireDate = typeof data.HireDate === 'string' ? new Date(data.HireDate) : data.HireDate;

        // Insert instructor
        const [newInstructor] = await db.insert(instructors).values({
            FirstMidName: data.FirstMidName,
            LastName: data.LastName,
            HireDate: hireDate,
        }).returning();

        // Handle office assignment if provided
        await this.syncOfficeAssignment(newInstructor.ID, data.OfficeLocation);

        // Handle course assignments if provided
        if (data.CourseIDs && data.CourseIDs.length > 0) {
            await this.syncCourseAssignments(newInstructor.ID, data.CourseIDs);
        }

        return this.findById(newInstructor.ID);
    }

    /**
     * Update instructor with office assignment and course assignments
     */
    async update(id: number, data: {
        FirstMidName?: string;
        LastName?: string;
        HireDate?: Date | string;
        OfficeLocation?: string;
        CourseIDs?: number[];
    }) {
        // Check if instructor exists
        const existing = await db.query.instructors.findFirst({
            where: eq(instructors.ID, id),
        });

        if (!existing) {
            throw new NotFoundError(`Instructor with ID ${id} not found`);
        }

        // Update instructor fields
        const updateData: any = {};
        if (data.FirstMidName !== undefined) updateData.FirstMidName = data.FirstMidName;
        if (data.LastName !== undefined) updateData.LastName = data.LastName;
        if (data.HireDate !== undefined) {
            updateData.HireDate = typeof data.HireDate === 'string' ? new Date(data.HireDate) : data.HireDate;
        }

        if (Object.keys(updateData).length > 0) {
            await db.update(instructors)
                .set(updateData)
                .where(eq(instructors.ID, id));
        }

        // Sync office assignment (handles create/update/delete)
        if (data.OfficeLocation !== undefined) {
            await this.syncOfficeAssignment(id, data.OfficeLocation);
        }

        // Sync course assignments if provided
        if (data.CourseIDs !== undefined) {
            await this.syncCourseAssignments(id, data.CourseIDs);
        }

        return this.findById(id);
    }

    /**
     * Delete instructor (cascades to office assignment and course assignments via FK)
     */
    async delete(id: number) {
        // Check if instructor exists
        const existing = await db.query.instructors.findFirst({
            where: eq(instructors.ID, id),
        });

        if (!existing) {
            throw new NotFoundError(`Instructor with ID ${id} not found`);
        }

        // Check if instructor is referenced as department administrator
        const departmentCheck = await db.query.departments.findFirst({
            where: eq(departments.InstructorID, id),
        });

        if (departmentCheck) {
            throw new ValidationError(
                `Cannot delete instructor. They are assigned as administrator of ${departmentCheck.Name} department.`
            );
        }

        // Delete instructor (FK cascades handle office and course assignments)
        await db.delete(instructors).where(eq(instructors.ID, id));
    }

    /**
     * Sync office assignment: delete if empty, upsert if value provided
     */
    private async syncOfficeAssignment(instructorId: number, location?: string) {
        const trimmedLocation = location?.trim();

        if (!trimmedLocation) {
            // Delete office assignment if it exists
            await db.delete(officeAssignments)
                .where(eq(officeAssignments.InstructorID, instructorId));
        } else {
            // Check if office assignment exists
            const existing = await db.query.officeAssignments.findFirst({
                where: eq(officeAssignments.InstructorID, instructorId),
            });

            if (existing) {
                // Update existing
                await db.update(officeAssignments)
                    .set({ Location: trimmedLocation })
                    .where(eq(officeAssignments.InstructorID, instructorId));
            } else {
                // Insert new
                await db.insert(officeAssignments).values({
                    InstructorID: instructorId,
                    Location: trimmedLocation,
                });
            }
        }
    }

    /**
     * Sync course assignments: add new, remove deselected (HashSet-based diff logic)
     */
    private async syncCourseAssignments(instructorId: number, selectedCourseIds: number[]) {
        // Get current assignments
        const currentAssignments = await db.query.courseInstructors.findMany({
            where: eq(courseInstructors.InstructorID, instructorId),
        });

        const currentSet = new Set(currentAssignments.map((ca) => ca.CourseID));
        const selectedSet = new Set(selectedCourseIds);

        // Find courses to add and remove
        const toAdd = selectedCourseIds.filter((id) => !currentSet.has(id));
        const toRemove = currentAssignments.filter((ca) => !selectedSet.has(ca.CourseID));

        // Add new assignments
        if (toAdd.length > 0) {
            await db.insert(courseInstructors).values(
                toAdd.map((courseId) => ({
                    InstructorID: instructorId,
                    CourseID: courseId,
                }))
            );
        }

        // Remove deselected assignments
        if (toRemove.length > 0) {
            const courseIdsToRemove = toRemove.map((ca) => ca.CourseID);
            await db.delete(courseInstructors).where(
                and(
                    eq(courseInstructors.InstructorID, instructorId),
                    inArray(courseInstructors.CourseID, courseIdsToRemove)
                )
            );
        }
    }
}
