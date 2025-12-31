// Student entity matching backend Drizzle schema
export interface Student {
    ID: number;
    LastName: string;
    FirstMidName: string;
    EnrollmentDate: string;
    FullName?: string;
    Enrollments?: Enrollment[];
}

// Student with enrollments for details view
export interface StudentWithEnrollments extends Student {
    Enrollments: Enrollment[];
}

// Enrollment entity
export interface Enrollment {
    EnrollmentID: number;
    CourseID: number;
    StudentID: number;
    Grade?: number | null;
    Course?: Course;
}

// Course entity
export interface Course {
    CourseID: number;
    Title: string;
    Credits: number;
    DepartmentID: number;
}

// Grade enum (matching backend)
export type Grade = 0 | 1 | 2 | 3 | 4; // A=0, B=1, C=2, D=3, F=4

// Grade display helper
export const gradeToString = (grade: number | null | undefined): string => {
    if (grade === null || grade === undefined) return 'N/A';
    const grades = ['A', 'B', 'C', 'D', 'F'];
    return grades[grade] ?? 'N/A';
};

// Create/Update student DTO
export interface StudentFormData {
    FirstMidName: string;
    LastName: string;
    EnrollmentDate: string; // yyyy-MM-dd format
}

// API response for paginated list
export interface StudentListResponse {
    data: Student[];
    total: number;
    page: number;
    pageSize: number;
}

// Query parameters for student list
export interface StudentQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    sortOrder?: 'asc' | 'desc';
}

// Paginated student response
export interface PaginatedStudents {
    data: Student[];
    pageIndex: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Sort order type
export type SortOrder = 'asc' | 'desc';
