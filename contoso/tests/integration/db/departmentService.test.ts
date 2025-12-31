import { db } from '../../../src/config/database';
import { departments, instructors } from '../../../src/db/schema';
import { DepartmentService } from '../../../src/services/departmentService';
import { ConflictError, NotFoundError } from '../../../src/utils/errors';

const departmentService = new DepartmentService();

describe('DepartmentService', () => {
    let instructorId: number;

    beforeAll(async () => {
        // Create a test instructor
        const instructor = await db.insert(instructors).values({
            FirstMidName: 'Test',
            LastName: 'Instructor',
            HireDate: new Date(),
        }).returning();
        instructorId = instructor[0].ID;
    });

    afterAll(async () => {
        await db.delete(departments);
        await db.delete(instructors);
    });

    afterEach(async () => {
        await db.delete(departments);
    });

    describe('create', () => {
        it('should create a department with version 1', async () => {
            const deptData = {
                Name: 'Engineering',
                Budget: 100000,
                StartDate: new Date('2023-01-01'),
                InstructorID: instructorId,
            };

            const dept = await departmentService.create(deptData);

            expect(dept.Name).toBe(deptData.Name);
            expect(dept.version).toBe(1);
            expect(dept.InstructorID).toBe(instructorId);
        });
    });

    describe('optimistic locking', () => {
        it('should successfully update with correct version', async () => {
            const dept = await departmentService.create({
                Name: 'Mathematics',
                Budget: 50000,
                StartDate: new Date('2023-01-01'),
            });

            const updated = await departmentService.update(dept.DepartmentID, {
                Name: 'Advanced Mathematics',
                Budget: 60000,
                version: dept.version, // Correct version
            });

            expect(updated.Name).toBe('Advanced Mathematics');
            expect(updated.version).toBe(2); // Version incremented
            expect(updated.Budget).toBe(60000);
        });

        it('should throw ConflictError on version mismatch', async () => {
            const dept = await departmentService.create({
                Name: 'Economics',
                Budget: 75000,
                StartDate: new Date('2023-01-01'),
            });

            // First update succeeds
            const updated = await departmentService.update(dept.DepartmentID, {
                Budget: 80000,
                version: dept.version,
            });

            // Second update with stale version should fail
            await expect(
                departmentService.update(dept.DepartmentID, {
                    Budget: 90000,
                    version: dept.version, // Stale version
                })
            ).rejects.toThrow(ConflictError);

            await expect(
                departmentService.update(dept.DepartmentID, {
                    Budget: 90000,
                    version: dept.version,
                })
            ).rejects.toThrow('modified by another user');
        });

        it('should handle concurrent updates correctly', async () => {
            const dept = await departmentService.create({
                Name: 'Physics',
                Budget: 120000,
                StartDate: new Date('2023-01-01'),
            });

            // Simulate two users reading the same version
            const user1Read = await departmentService.findById(dept.DepartmentID);
            const user2Read = await departmentService.findById(dept.DepartmentID);

            expect(user1Read.version).toBe(dept.version);
            expect(user2Read.version).toBe(dept.version);

            // User 1 updates successfully
            const user1Update = await departmentService.update(dept.DepartmentID, {
                Budget: 125000,
                version: user1Read.version,
            });

            expect(user1Update.version).toBe(dept.version + 1);

            // User 2's update should fail (stale version)
            await expect(
                departmentService.update(dept.DepartmentID, {
                    Budget: 130000,
                    version: user2Read.version, // Stale version
                })
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('findById', () => {
        it('should find department with administrator', async () => {
            const dept = await departmentService.create({
                Name: 'Chemistry',
                Budget: 90000,
                StartDate: new Date('2023-01-01'),
                InstructorID: instructorId,
            });

            const found = await departmentService.findById(dept.DepartmentID);

            expect(found.Name).toBe('Chemistry');
            expect(found.administrator).toBeDefined();
            expect(found.administrator?.ID).toBe(instructorId);
        });

        it('should throw NotFoundError for non-existent department', async () => {
            await expect(departmentService.findById(9999)).rejects.toThrow(NotFoundError);
        });
    });

    describe('delete', () => {
        it('should delete a department', async () => {
            const dept = await departmentService.create({
                Name: 'History',
                Budget: 40000,
                StartDate: new Date('2023-01-01'),
            });

            const result = await departmentService.delete(dept.DepartmentID);
            expect(result.message).toContain('deleted successfully');

            await expect(departmentService.findById(dept.DepartmentID)).rejects.toThrow(NotFoundError);
        });
    });
});
