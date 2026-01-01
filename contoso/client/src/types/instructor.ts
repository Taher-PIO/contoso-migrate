// Instructor entity matching backend Drizzle schema
export interface Instructor {
    ID: number;
    LastName: string;
    FirstMidName: string;
    HireDate: string;
    FullName?: string; // Computed property
    OfficeAssignment?: OfficeAssignment;
    Courses?: CourseInstructor[];
}

// OfficeAssignment entity (1-to-1 relationship with Instructor)
export interface OfficeAssignment {
    InstructorID: number;
    Location: string | null;
}

// CourseInstructor join entity (many-to-many relationship)
export interface CourseInstructor {
    InstructorID: number;
    CourseID: number;
    Course?: Course;
}

// Course entity (for instructor's course list)
export interface Course {
    CourseID: number;
    Title: string;
    Credits: number;
    DepartmentID: number;
    Department?: Department;
}

// Department entity (for course display)
export interface Department {
    DepartmentID: number;
    Name: string;
}

// Enrollment entity (for course enrollments in Index view)
export interface Enrollment {
    EnrollmentID: number;
    CourseID: number;
    StudentID: number;
    Grade?: number | null;
    Student?: Student;
}

// Student entity (for enrollment display)
export interface Student {
    ID: number;
    LastName: string;
    FirstMidName: string;
    EnrollmentDate: string;
}

// Index view data structure (3-panel view)
export interface InstructorIndexData {
    instructors: Instructor[];
    courses: Course[];
    enrollments: Enrollment[];
}

// Create instructor DTO
export interface InstructorCreateData {
    FirstMidName: string;
    LastName: string;
    HireDate: string; // yyyy-MM-dd format
    OfficeLocation?: string;
    CourseIDs?: number[];
}

// Update instructor DTO
export interface InstructorUpdateData {
    FirstMidName?: string;
    LastName?: string;
    HireDate?: string;
    OfficeLocation?: string;
    CourseIDs?: number[];
}

// Form data for instructor forms
export interface InstructorFormData {
    FirstMidName: string;
    LastName: string;
    HireDate: string;
    OfficeLocation?: string;
    CourseIDs?: number[];
}

// Helper to compute FullName
export const getFullName = (instructor: Instructor): string => {
    return `${instructor.LastName}, ${instructor.FirstMidName}`;
};

// Grade enum (matching backend)
export type Grade = 0 | 1 | 2 | 3 | 4; // A=0, B=1, C=2, D=3, F=4

// Grade display helper
export const gradeToString = (grade: number | null | undefined): string => {
    if (grade === null || grade === undefined) return 'N/A';
    const grades = ['A', 'B', 'C', 'D', 'F'];
    return grades[grade] ?? 'N/A';
};
