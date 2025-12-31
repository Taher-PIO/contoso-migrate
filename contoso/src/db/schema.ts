import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Student entity
export const students = sqliteTable('Students', {
    ID: integer('ID').primaryKey({ autoIncrement: true }),
    LastName: text('LastName').notNull(),
    FirstMidName: text('FirstMidName').notNull(),
    EnrollmentDate: integer('EnrollmentDate', { mode: 'timestamp' }).notNull(),
});

// Instructor entity
export const instructors = sqliteTable('Instructors', {
    ID: integer('ID').primaryKey({ autoIncrement: true }),
    LastName: text('LastName').notNull(),
    FirstMidName: text('FirstMidName').notNull(),
    HireDate: integer('HireDate', { mode: 'timestamp' }).notNull(),
});

// Course entity (manual CourseID assignment - no autoincrement)
export const courses = sqliteTable('Courses', {
    CourseID: integer('CourseID').primaryKey(),
    Title: text('Title'),
    Credits: integer('Credits').notNull(),
    DepartmentID: integer('DepartmentID').notNull().references(() => departments.DepartmentID, { onDelete: 'cascade' }),
});

// Department entity with version for optimistic locking
export const departments = sqliteTable('Departments', {
    DepartmentID: integer('DepartmentID').primaryKey({ autoIncrement: true }),
    Name: text('Name'),
    Budget: real('Budget').notNull(),
    StartDate: integer('StartDate', { mode: 'timestamp' }).notNull(),
    InstructorID: integer('InstructorID').references(() => instructors.ID),
    version: integer('version').notNull().default(1),
});

// Enrollment entity (junction with Grade)
export const enrollments = sqliteTable('Enrollments', {
    EnrollmentID: integer('EnrollmentID').primaryKey({ autoIncrement: true }),
    CourseID: integer('CourseID').notNull().references(() => courses.CourseID, { onDelete: 'cascade' }),
    StudentID: integer('StudentID').notNull().references(() => students.ID, { onDelete: 'cascade' }),
    Grade: integer('Grade'),
});

// OfficeAssignment entity (one-to-one with Instructor)
export const officeAssignments = sqliteTable('OfficeAssignments', {
    InstructorID: integer('InstructorID').primaryKey().references(() => instructors.ID, { onDelete: 'cascade' }),
    Location: text('Location'),
});

// Course-Instructor many-to-many junction
export const courseInstructors = sqliteTable('CourseInstructor', {
    CourseID: integer('CourseID').notNull().references(() => courses.CourseID, { onDelete: 'cascade' }),
    InstructorID: integer('InstructorID').notNull().references(() => instructors.ID, { onDelete: 'cascade' }),
});

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
    enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    student: one(students, {
        fields: [enrollments.StudentID],
        references: [students.ID],
    }),
    course: one(courses, {
        fields: [enrollments.CourseID],
        references: [courses.CourseID],
    }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
    department: one(departments, {
        fields: [courses.DepartmentID],
        references: [departments.DepartmentID],
    }),
    enrollments: many(enrollments),
    instructors: many(courseInstructors),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
    administrator: one(instructors, {
        fields: [departments.InstructorID],
        references: [instructors.ID],
    }),
    courses: many(courses),
}));

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
    officeAssignment: one(officeAssignments, {
        fields: [instructors.ID],
        references: [officeAssignments.InstructorID],
    }),
    courses: many(courseInstructors),
    departments: many(departments),
}));

export const courseInstructorsRelations = relations(courseInstructors, ({ one }) => ({
    course: one(courses, {
        fields: [courseInstructors.CourseID],
        references: [courses.CourseID],
    }),
    instructor: one(instructors, {
        fields: [courseInstructors.InstructorID],
        references: [instructors.ID],
    }),
}));
