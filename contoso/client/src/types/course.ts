// Course entity matching backend Drizzle schema
export interface Course {
    CourseID: number;
    Title: string;
    Credits: number;
    DepartmentID: number;
    Department?: Department;
    Enrollments?: Enrollment[];
    Instructors?: CourseInstructor[];
}

// Department entity (for dropdown and display)
export interface Department {
    DepartmentID: number;
    Name: string;
    Budget: number;
    StartDate: string;
    InstructorID: number | null;
    version: number;
}

// Enrollment entity (for course details)
export interface Enrollment {
    EnrollmentID: number;
    CourseID: number;
    StudentID: number;
    Grade?: number | null;
}

// CourseInstructor join entity
export interface CourseInstructor {
    CourseID: number;
    InstructorID: number;
}

// Create course DTO (manual CourseID entry required)
export interface CourseCreateData {
    CourseID: number;
    Title: string;
    Credits: number;
    DepartmentID: number;
}

// Update course DTO (CourseID immutable, not sent in update)
export interface CourseUpdateData {
    Title?: string;
    Credits?: number;
    DepartmentID?: number;
}

// Form data for course forms (matching frontend validation)
export interface CourseFormData {
    CourseID: number; // Manual entry on create, read-only on edit
    Title: string;
    Credits: number;
    DepartmentID: number;
}
