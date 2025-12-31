import { db } from '../../../src/config/drizzle';
import { students, enrollments } from '../../../src/db/schema';
import { StudentService } from '../../../src/services/studentService';
import { NotFoundError, ValidationError } from '../../../src/utils/errors';
import { sql } from 'drizzle-orm';

const studentService = new StudentService();

describe('StudentService', () => {
    afterAll(async () => {
        await db.delete(enrollments);
        await db.delete(students);
    });

    afterEach(async () => {
        await db.delete(enrollments);
        await db.delete(students);
    });

    describe('create and findById', () => {
        it('creates a student and retrieves it by ID', async () => {
            const created = await studentService.create({
                FirstMidName: 'Carson',
                LastName: 'Alexander',
                EnrollmentDate: new Date('2016-09-01'),
            });

            const found = await studentService.findById(created.ID);
            expect(found.ID).toBe(created.ID);
            expect(found.LastName).toBe('Alexander');
        });

        it('throws NotFoundError for non-existent student', async () => {
            await expect(studentService.findById(999999)).rejects.toThrow(NotFoundError);
        });
    });

    describe('validation', () => {
        it('rejects empty names and invalid dates', async () => {
            await expect(
                studentService.create({ FirstMidName: '', LastName: 'X', EnrollmentDate: 'bad' })
            ).rejects.toThrow(ValidationError);

            await expect(
                studentService.create({ FirstMidName: 'A', LastName: '', EnrollmentDate: '2020-01-01' })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('list with pagination, search, and sort', () => {
        beforeEach(async () => {
            const data = [
                { FirstMidName: 'Carson', LastName: 'Alexander', EnrollmentDate: new Date('2016-09-01') },
                { FirstMidName: 'Meredith', LastName: 'Alonso', EnrollmentDate: new Date('2018-09-01') },
                { FirstMidName: 'Arturo', LastName: 'Anand', EnrollmentDate: new Date('2019-09-01') },
                { FirstMidName: 'Gytis', LastName: 'Barzdukas', EnrollmentDate: new Date('2018-09-01') },
            ];
            for (const student of data) {
                await db.insert(students).values(student);
            }
        });

        it('paginates results', async () => {
            const list = await studentService.findAll({ page: 1, pageSize: 2, sortBy: 'LastName' });
            expect(list.items.length).toBe(2);
            expect(list.total).toBe(4);
            expect(list.page).toBe(1);
        });

        it('searches case-insensitively over names', async () => {
            const list = await studentService.findAll({ search: 'al', sortBy: 'LastName' });
            expect(list.items.some((s) => /alonso|alexander/i.test(s.LastName))).toBeTruthy();
            expect(list.total).toBeGreaterThan(0);
        });

        it('sorts by EnrollmentDate desc', async () => {
            const list = await studentService.findAll({ sortBy: 'EnrollmentDate', sortOrder: 'desc' });
            expect(new Date(list.items[0].EnrollmentDate).getTime()).toBeGreaterThanOrEqual(
                new Date(list.items[1].EnrollmentDate).getTime()
            );
        });
    });

    describe('update and delete', () => {
        it('updates fields and deletes student', async () => {
            const created = await studentService.create({
                FirstMidName: 'Yan',
                LastName: 'Li',
                EnrollmentDate: new Date('2018-09-01'),
            });

            const updated = await studentService.update(created.ID, { LastName: 'Liang' });
            expect(updated.LastName).toBe('Liang');

            const result = await studentService.delete(created.ID);
            expect(result.message).toContain('deleted');

            await expect(studentService.findById(created.ID)).rejects.toThrow(NotFoundError);
        });
    });
});
