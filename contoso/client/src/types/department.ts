// Department entity matching backend Drizzle schema
export interface Department {
    DepartmentID: number;
    Name: string;
    Budget: number;
    StartDate: string;
    InstructorID: number | null;
    version: number;
    administrator?: Instructor;
    courses?: Course[];
}

// Instructor entity (for dropdown and display)
export interface Instructor {
    ID: number;
    FirstMidName: string;
    LastName: string;
    HireDate: string;
    FullName?: string;
}

// Course entity (for department details)
export interface Course {
    CourseID: number;
    Title: string;
    Credits: number;
    DepartmentID: number;
}

// Create department DTO
export interface DepartmentCreateData {
    Name: string;
    Budget: number;
    StartDate: string; // yyyy-MM-dd format
    InstructorID?: number;
}

// Update department DTO (version REQUIRED for optimistic concurrency)
export interface DepartmentUpdateData {
    Name?: string;
    Budget?: number;
    StartDate?: string;
    InstructorID?: number;
    version: number; // CRITICAL - required for concurrency control
}

// Form data for department forms
export interface DepartmentFormData {
    Name: string;
    Budget: number;
    StartDate: string;
    InstructorID: number | string; // string for empty option
    version?: number; // Included on edit forms
}
