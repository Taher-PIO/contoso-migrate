import { db } from '../../../src/config/database';
import { courses, departments } from '../../../src/db/schema';
import { CourseService } from '../../../src/services/courseService';
import { ValidationError, NotFoundError } from '../../../src/utils/errors';

const courseService = new CourseService();

describe('CourseService', () => {
    beforeAll(async () => {
        // Setup test database with a department
        await db.insert(departments).values({
            DepartmentID: 1,
            Name: 'Test Department',
            Budget: 50000,
            StartDate: new Date(),
            version: 1,
        });
    });

    afterAll(async () => {
        // Cleanup
        await db.delete(courses);
        await db.delete(departments);
    });

    afterEach(async () => {
        // Clean courses between tests
        await db.delete(courses);
    });

    describe('create', () => {
        it('should create a course with manual CourseID', async () => {
            const courseData = {
                CourseID: 1050,
                Title: 'Chemistry',
                Credits: 3,
                DepartmentID: 1,
            };

            const course = await courseService.create(courseData);

            expect(course.CourseID).toBe(1050);
            expect(course.Title).toBe('Chemistry');
            expect(course.Credits).toBe(3);
        });

        it('should throw ValidationError if CourseID is not provided', async () => {
            const courseData = {
                CourseID: 0,
                Title: 'Test Course',
                Credits: 3,
                DepartmentID: 1,
            };

            await expect(courseService.create(courseData)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for duplicate CourseID', async () => {
            const courseData = {
                CourseID: 1050,
                Title: 'Chemistry',
                Credits: 3,
                DepartmentID: 1,
            };

            await courseService.create(courseData);

            await expect(courseService.create(courseData)).rejects.toThrow(ValidationError);
            await expect(courseService.create(courseData)).rejects.toThrow('already exists');
        });

        it('should throw ValidationError for invalid Credits range', async () => {
            const courseData = {
                CourseID: 1051,
                Title: 'Test Course',
                Credits: 10, // Invalid: should be 0-5
                DepartmentID: 1,
            };

            await expect(courseService.create(courseData)).rejects.toThrow(ValidationError);
            await expect(courseService.create(courseData)).rejects.toThrow('between 0 and 5');
        });
    });

    describe('findById', () => {
        it('should find a course by ID', async () => {
            const courseData = {
                CourseID: 1050,
                Title: 'Chemistry',
                Credits: 3,
                DepartmentID: 1,
            };

            await courseService.create(courseData);
            const found = await courseService.findById(1050);

            expect(found.CourseID).toBe(1050);
            expect(found.Title).toBe('Chemistry');
            expect(found.department).toBeDefined();
        });

        it('should throw NotFoundError for non-existent course', async () => {
            await expect(courseService.findById(9999)).rejects.toThrow(NotFoundError);
        });
    });

    describe('update', () => {
        it('should update course details', async () => {
            await courseService.create({
                CourseID: 1050,
                Title: 'Chemistry',
                Credits: 3,
                DepartmentID: 1,
            });

            const updated = await courseService.update(1050, {
                Title: 'Advanced Chemistry',
                Credits: 4,
            });

            expect(updated.Title).toBe('Advanced Chemistry');
            expect(updated.Credits).toBe(4);
        });

        it('should throw ValidationError for invalid Credits in update', async () => {
            await courseService.create({
                CourseID: 1050,
                Title: 'Chemistry',
                Credits: 3,
                DepartmentID: 1,
            });

            await expect(
                courseService.update(1050, { Credits: 10 })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('delete', () => {
        it('should delete a course', async () => {
            await courseService.create({
                CourseID: 1050,
                Title: 'Chemistry',
                Credits: 3,
                DepartmentID: 1,
            });

            const result = await courseService.delete(1050);
            expect(result.message).toContain('deleted successfully');

            await expect(courseService.findById(1050)).rejects.toThrow(NotFoundError);
        });
    });
});
