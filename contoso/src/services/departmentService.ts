import { db } from '../config/database';
import { departments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export class DepartmentService {
    async findAll() {
        return db.query.departments.findMany({
            with: {
                administrator: true,
                courses: true,
            },
        });
    }

    async findById(id: number) {
        const department = await db.query.departments.findFirst({
            where: eq(departments.DepartmentID, id),
            with: {
                administrator: true,
                courses: true,
            },
        });

        if (!department) {
            throw new NotFoundError(`Department with ID ${id} not found`);
        }

        return department;
    }

    async create(data: {
        Name: string;
        Budget: number;
        StartDate: Date | string;
        InstructorID?: number;
    }) {
        const startDate = typeof data.StartDate === 'string' ? new Date(data.StartDate) : data.StartDate;
        
        const result = await db.insert(departments).values({
            Name: data.Name,
            Budget: data.Budget,
            StartDate: startDate,
            InstructorID: data.InstructorID || null,
            version: 1,
        }).returning();

        return result[0];
    }

    // Optimistic locking implementation - service layer
    async update(
        id: number,
        data: {
            Name?: string;
            Budget?: number;
            StartDate?: Date | string;
            InstructorID?: number;
            version: number; // Required for optimistic locking
        }
    ) {
        // Check current version
        const current = await db.query.departments.findFirst({
            where: eq(departments.DepartmentID, id),
        });

        if (!current) {
            throw new NotFoundError(`Department with ID ${id} not found`);
        }

        // Version mismatch check (optimistic locking)
        if (current.version !== data.version) {
            throw new ConflictError(
                `Department has been modified by another user. Expected version ${data.version}, but current version is ${current.version}.`
            );
        }

        // Update with incremented version
        const updateData: any = {
            version: current.version + 1,
        };
        if (data.Name !== undefined) updateData.Name = data.Name;
        if (data.Budget !== undefined) updateData.Budget = data.Budget;
        if (data.StartDate !== undefined) {
            updateData.StartDate = typeof data.StartDate === 'string' 
                ? new Date(data.StartDate)
                : data.StartDate;
        }
        if (data.InstructorID !== undefined) updateData.InstructorID = data.InstructorID;

        const result = await db.update(departments)
            .set(updateData)
            .where(eq(departments.DepartmentID, id))
            .returning();

        return result[0];
    }

    async delete(id: number) {
        const department = await db.query.departments.findFirst({
            where: eq(departments.DepartmentID, id),
        });

        if (!department) {
            throw new NotFoundError(`Department with ID ${id} not found`);
        }

        await db.delete(departments).where(eq(departments.DepartmentID, id));

        return { message: 'Department deleted successfully' };
    }
}
