# TypeScript Config & Types Strategy - Contoso University React Migration

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Engineering Team  
**Status:** Planning Document

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [TypeScript Configuration Baseline](#typescript-configuration-baseline)
  - [Compiler Options](#compiler-options)
  - [Module & Target Settings](#module--target-settings)
  - [JSX Configuration](#jsx-configuration)
  - [Path Mappings](#path-mappings)
  - [Strict Mode Settings](#strict-mode-settings)
- [Type Boundaries & Architecture](#type-boundaries--architecture)
  - [DTO Types (Data Transfer Objects)](#dto-types-data-transfer-objects)
  - [UI Types (Component Props & State)](#ui-types-component-props--state)
  - [Type Separation Principles](#type-separation-principles)
- [Type Generation Strategy](#type-generation-strategy)
  - [Backend Contract Review](#backend-contract-review)
  - [OpenAPI/Swagger Generation](#openapiswagger-generation)
  - [GraphQL Code Generation (Future)](#graphql-code-generation-future)
- [Type Mapping Utilities](#type-mapping-utilities)
  - [DTO to UI Model Mappers](#dto-to-ui-model-mappers)
  - [Validation Helpers](#validation-helpers)
  - [Type Guards](#type-guards)
- [Best Practices & Conventions](#best-practices--conventions)
- [Migration Roadmap](#migration-roadmap)

---

## Executive Summary

This document defines the TypeScript configuration baseline and type management strategy for the React + TypeScript migration of Contoso University. The strategy ensures:

1. **Type Safety**: Strict TypeScript configuration with comprehensive type checking
2. **Maintainability**: Clear separation between DTO types (backend contracts) and UI types (component interfaces)
3. **Developer Experience**: Path mappings, intelligent autocomplete, and type inference
4. **Scalability**: Automated type generation from backend contracts (OpenAPI/Swagger)
5. **Performance**: Optimized build configuration for development and production

**Key Decisions:**
- **Module System**: ES2020 modules for tree-shaking and modern bundling
- **Target**: ES2020 for broad browser support with modern features
- **JSX**: React JSX transform (React 17+) for optimal output
- **Strict Mode**: Enabled all strict type-checking options
- **Path Mappings**: Alias imports (`@/components`, `@/types`, `@/api`)

---

## TypeScript Configuration Baseline

### Compiler Options

**Recommended `tsconfig.json` for React Frontend:**

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    
    // Module Resolution
    "module": "ES2020",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    
    // Type Checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    
    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "noEmitOnError": true,
    
    // Interop Constraints
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    
    // Skip Type Checking (Performance)
    "skipLibCheck": true,
    
    // Path Mappings
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/types/*": ["./src/types/*"],
      "@/api/*": ["./src/api/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/styles/*": ["./src/styles/*"]
    }
  },
  "include": [
    "src/**/*",
    "src/**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "**/*.spec.ts",
    "**/*.test.ts"
  ]
}
```

### Module & Target Settings

**Module System: `ES2020`**
- **Rationale**: Modern ES module syntax for optimal tree-shaking with Vite/Webpack
- **Browser Support**: Supported by all modern browsers (Chrome 63+, Firefox 60+, Safari 11.1+, Edge 79+)
- **Benefits**:
  - Native dynamic imports (`import()`)
  - Top-level await support
  - Better code splitting with bundlers
  - Smaller bundle sizes through dead code elimination

**Module Resolution: `bundler`**
- **Rationale**: Optimized for modern bundlers (Vite, Webpack 5+, esbuild)
- **Features**:
  - Automatic `.ts`/`.tsx` extension resolution
  - Package exports field support
  - Faster resolution algorithm

**Target: `ES2020`**
- **Rationale**: Balance between modern features and broad browser compatibility
- **Includes**:
  - Optional chaining (`?.`)
  - Nullish coalescing (`??`)
  - BigInt support
  - Promise.allSettled
  - globalThis
  - Dynamic import
- **Polyfills**: Not required for target browsers (>95% global coverage)

### JSX Configuration

**JSX Transform: `react-jsx`**
- **Rationale**: New JSX transform introduced in React 17
- **Benefits**:
  - No need to import React in every file
  - Smaller bundle sizes (automatic runtime imports)
  - Future-proof for React 18+ features

**Before (Classic Transform):**
```tsx
import React from 'react';

export const Button = () => {
  return <button>Click me</button>;
};
```

**After (New Transform):**
```tsx
// No React import needed!
export const Button = () => {
  return <button>Click me</button>;
};
```

**JSX Factory Configuration** (if needed for custom renderers):
```json
{
  "compilerOptions": {
    "jsxFactory": "h",           // For Preact: h
    "jsxFragmentFactory": "Fragment"
  }
}
```

### Path Mappings

**Alias Configuration:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],                     // Root alias
      "@/components/*": ["./src/components/*"], // Component imports
      "@/types/*": ["./src/types/*"],         // Type definitions
      "@/api/*": ["./src/api/*"],             // API client & services
      "@/hooks/*": ["./src/hooks/*"],         // Custom React hooks
      "@/utils/*": ["./src/utils/*"],         // Utility functions
      "@/styles/*": ["./src/styles/*"],       // Style imports
      "@/assets/*": ["./src/assets/*"]        // Static assets
    }
  }
}
```

**Usage Examples:**

```typescript
// ❌ Before (relative imports - hard to maintain)
import { Student } from '../../../types/models/Student';
import { useAuth } from '../../../../hooks/useAuth';
import { StudentService } from '../../../api/services/StudentService';

// ✅ After (alias imports - clean and maintainable)
import { Student } from '@/types/models/Student';
import { useAuth } from '@/hooks/useAuth';
import { StudentService } from '@/api/services/StudentService';
```

**Bundler Configuration** (Vite example):

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
});
```

### Strict Mode Settings

**All Strict Flags Enabled:**

```json
{
  "compilerOptions": {
    "strict": true,  // Master switch - enables all strict flags
    
    // Individual strict flags (enabled by "strict": true)
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional safety flags
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

**Impact & Benefits:**

| Flag | Impact | Benefit |
|------|--------|---------|
| `strictNullChecks` | Must explicitly handle `null`/`undefined` | Eliminates null reference errors |
| `noImplicitAny` | Must type all function parameters | Prevents accidental `any` types |
| `strictFunctionTypes` | Stricter function parameter checking | Type safety for callbacks |
| `noUnusedLocals` | Error on unused variables | Cleaner codebase |
| `noUncheckedIndexedAccess` | Array/object access returns `T \| undefined` | Prevents index out of bounds errors |
| `noImplicitOverride` | Must use `override` keyword | Prevents accidental method shadowing |

**Example: Strict Null Checks**

```typescript
// ❌ Without strictNullChecks - Runtime error
interface Student {
  id: number;
  name: string;
  email?: string;
}

const student: Student = { id: 1, name: 'John Doe' };
const emailLength = student.email.length; // Runtime error if email is undefined

// ✅ With strictNullChecks - Compile-time error
const emailLength = student.email?.length ?? 0; // Safe optional chaining
```

---

## Type Boundaries & Architecture

### DTO Types (Data Transfer Objects)

**Location**: `src/types/dto/`

DTO types represent the **exact contract** between frontend and backend API. These types mirror the backend C# models and should be automatically generated from OpenAPI/Swagger specs.

**File Structure:**
```
src/types/dto/
  ├── Student.dto.ts
  ├── Course.dto.ts
  ├── Enrollment.dto.ts
  ├── Instructor.dto.ts
  ├── Department.dto.ts
  ├── OfficeAssignment.dto.ts
  └── enums/
      └── Grade.enum.ts
```

**Example: Student DTO**

```typescript
// src/types/dto/Student.dto.ts

/**
 * Student DTO - Backend Contract
 * 
 * Mirrors: ContosoUniversity.Models.Student (C#)
 * Source: Auto-generated from OpenAPI spec
 * 
 * @remarks This type represents the exact API contract.
 * Do not modify manually - regenerate from OpenAPI spec.
 */
export interface StudentDto {
  /**
   * Primary key - Auto-generated identity
   */
  id: number;

  /**
   * Student last name
   * @maxLength 50
   * @required
   */
  lastName: string;

  /**
   * Student first and middle name
   * @maxLength 50
   * @required
   */
  firstMidName: string;

  /**
   * Date student enrolled
   * @format date (ISO 8601: yyyy-MM-dd)
   * @required
   */
  enrollmentDate: string; // ISO 8601 date string from API

  /**
   * Collection of student enrollments
   * @remarks May be null if not included in response
   */
  enrollments?: EnrollmentDto[];
}

/**
 * Student creation request DTO
 * Omits server-generated fields (id)
 */
export type CreateStudentDto = Omit<StudentDto, 'id' | 'enrollments'>;

/**
 * Student update request DTO
 * All fields optional except id
 */
export type UpdateStudentDto = Partial<CreateStudentDto> & Pick<StudentDto, 'id'>;
```

**Example: Grade Enum DTO**

```typescript
// src/types/dto/enums/Grade.enum.ts

/**
 * Grade enumeration - Backend Contract
 * 
 * Mirrors: ContosoUniversity.Models.Grade (C# enum)
 * 
 * @remarks Backend stores as integer (0-4)
 */
export enum GradeDto {
  A = 0,
  B = 1,
  C = 2,
  D = 3,
  F = 4,
}

/**
 * Type guard for GradeDto
 */
export const isGradeDto = (value: unknown): value is GradeDto => {
  return typeof value === 'number' && value >= 0 && value <= 4;
};

/**
 * Grade display labels
 */
export const GradeLabels: Record<GradeDto, string> = {
  [GradeDto.A]: 'A',
  [GradeDto.B]: 'B',
  [GradeDto.C]: 'C',
  [GradeDto.D]: 'D',
  [GradeDto.F]: 'F',
};
```

**Example: Enrollment DTO**

```typescript
// src/types/dto/Enrollment.dto.ts
import { GradeDto } from './enums/Grade.enum';
import { CourseDto } from './Course.dto';
import { StudentDto } from './Student.dto';

/**
 * Enrollment DTO - Backend Contract
 * 
 * Mirrors: ContosoUniversity.Models.Enrollment (C#)
 */
export interface EnrollmentDto {
  enrollmentId: number;
  courseId: number;
  studentId: number;
  
  /**
   * Grade (nullable - may not be assigned yet)
   * Stored as integer enum on backend
   */
  grade: GradeDto | null;

  // Navigation properties (optional - depends on API response)
  course?: CourseDto;
  student?: StudentDto;
}

export type CreateEnrollmentDto = Omit<EnrollmentDto, 'enrollmentId' | 'course' | 'student'>;
export type UpdateEnrollmentDto = Pick<EnrollmentDto, 'enrollmentId' | 'grade'>;
```

### UI Types (Component Props & State)

**Location**: `src/types/ui/`

UI types represent **component-specific interfaces** optimized for React components, forms, and UI state. These types transform DTOs into UI-friendly formats.

**File Structure:**
```
src/types/ui/
  ├── Student.ui.ts
  ├── Course.ui.ts
  ├── Enrollment.ui.ts
  ├── forms/
  │   ├── StudentForm.types.ts
  │   └── EnrollmentForm.types.ts
  └── components/
      ├── StudentList.types.ts
      └── CourseCard.types.ts
```

**Example: Student UI Model**

```typescript
// src/types/ui/Student.ui.ts
import { StudentDto } from '@/types/dto/Student.dto';

/**
 * Student UI Model
 * 
 * Transforms DTO for UI consumption:
 * - Parsed dates (Date objects, not strings)
 * - Computed display values (fullName)
 * - Optional UI-specific fields
 */
export interface StudentUiModel {
  id: number;
  lastName: string;
  firstName: string; // Renamed from firstMidName for clarity
  enrollmentDate: Date; // Parsed from ISO string
  fullName: string; // Computed property
  enrollmentCount?: number; // Computed from enrollments
  gpa?: number; // Computed from grades
}

/**
 * Student list item (minimal fields for list views)
 */
export interface StudentListItem {
  id: number;
  fullName: string;
  enrollmentDate: Date;
  enrollmentCount: number;
}

/**
 * Student form state
 */
export interface StudentFormState {
  lastName: string;
  firstName: string;
  enrollmentDate: Date | null;
}

/**
 * Student form validation errors
 */
export interface StudentFormErrors {
  lastName?: string;
  firstName?: string;
  enrollmentDate?: string;
}
```

**Example: Component Props Types**

```typescript
// src/types/ui/components/StudentList.types.ts
import { StudentListItem } from '../Student.ui';

export interface StudentListProps {
  students: StudentListItem[];
  isLoading: boolean;
  error?: string;
  onStudentClick: (studentId: number) => void;
  onRefresh: () => void;
}

export interface StudentListItemProps {
  student: StudentListItem;
  onClick: (studentId: number) => void;
  isSelected?: boolean;
}
```

**Example: Form Types**

```typescript
// src/types/ui/forms/StudentForm.types.ts
import { StudentFormState, StudentFormErrors } from '../Student.ui';

export interface StudentFormProps {
  /**
   * Initial form values (for edit mode)
   */
  initialValues?: Partial<StudentFormState>;
  
  /**
   * Form submission handler
   */
  onSubmit: (values: StudentFormState) => Promise<void>;
  
  /**
   * Cancel handler
   */
  onCancel: () => void;
  
  /**
   * Form mode
   */
  mode: 'create' | 'edit';
  
  /**
   * Loading state during submission
   */
  isSubmitting?: boolean;
}

export interface UseStudentFormReturn {
  values: StudentFormState;
  errors: StudentFormErrors;
  touched: Record<keyof StudentFormState, boolean>;
  handleChange: (field: keyof StudentFormState, value: unknown) => void;
  handleBlur: (field: keyof StudentFormState) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isValid: boolean;
  isDirty: boolean;
}
```

### Type Separation Principles

**Core Principles:**

1. **DTOs are Immutable Contracts**
   - DTO types reflect backend API contracts exactly
   - Never manually edit DTOs - always regenerate from OpenAPI spec
   - DTOs use backend naming conventions (PascalCase for C# compatibility)

2. **UI Types are Transformation Targets**
   - UI types optimize for frontend consumption (camelCase, Date objects, computed fields)
   - UI types may omit, rename, or combine DTO fields
   - UI types include validation, display logic, and component-specific fields

3. **Mappers Bridge the Gap**
   - Mapping functions transform DTOs → UI models
   - Mappers handle data parsing (date strings → Date objects)
   - Mappers compute derived fields (fullName, gpa)

4. **Single Source of Truth**
   - DTOs are the source of truth for backend contracts
   - UI types derive from DTOs, never define new entities
   - Shared types (enums, constants) live in `src/types/shared/`

**Visualization:**

```
┌─────────────────────────────────────────────────────────────┐
│                         Backend API                          │
│                  (C# Models / OpenAPI Spec)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP JSON Response
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        DTO Layer                             │
│                   (src/types/dto/)                           │
│  • StudentDto, CourseDto, EnrollmentDto                      │
│  • Exact API contract representation                         │
│  • Auto-generated from OpenAPI                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Mapper Functions
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        UI Model Layer                        │
│                   (src/types/ui/)                            │
│  • StudentUiModel, StudentFormState                          │
│  • Optimized for React components                            │
│  • Computed fields, Date objects, display values             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Component Props
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│                   (src/components/)                          │
│  • <StudentList />, <StudentForm />                          │
│  • Consumes UI models & form types                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Type Generation Strategy

### Backend Contract Review

**Current Backend Contracts** (from Data Model Catalog):

| Entity | C# Model | Properties | Relationships |
|--------|----------|------------|---------------|
| Student | `ContosoUniversity.Models.Student` | ID, LastName, FirstMidName, EnrollmentDate | 1:N Enrollments |
| Course | `ContosoUniversity.Models.Course` | CourseID, Title, Credits, DepartmentID | N:M Instructors, 1:N Enrollments |
| Enrollment | `ContosoUniversity.Models.Enrollment` | EnrollmentID, CourseID, StudentID, Grade | N:1 Student, N:1 Course |
| Instructor | `ContosoUniversity.Models.Instructor` | ID, LastName, FirstMidName, HireDate | 1:0..1 OfficeAssignment, N:M Courses |
| Department | `ContosoUniversity.Models.Department` | DepartmentID, Name, Budget, StartDate, InstructorID, ConcurrencyToken | 1:N Courses, N:0..1 Administrator |
| OfficeAssignment | `ContosoUniversity.Models.OfficeAssignment` | InstructorID, Location | 1:1 Instructor |

**API Endpoints** (from API & Service Contracts):

| Resource | Endpoints | Response Format |
|----------|-----------|-----------------|
| Students | GET /Students (list), GET /Students/Details?id={id}, POST /Students/Create, POST /Students/Edit, POST /Students/Delete | HTML (Razor Pages) |
| Courses | GET /Courses, GET /Courses/Details?id={id}, POST /Courses/Create, POST /Courses/Edit, POST /Courses/Delete | HTML (Razor Pages) |
| Instructors | GET /Instructors, GET /Instructors/Details?id={id}, POST /Instructors/Create, POST /Instructors/Edit, POST /Instructors/Delete | HTML (Razor Pages) |
| Departments | GET /Departments, GET /Departments/Details?id={id}, POST /Departments/Create, POST /Departments/Edit, POST /Departments/Delete | HTML (Razor Pages) |

**Gap Analysis:**

❌ **Current State**: No REST API endpoints (server-rendered Razor Pages only)  
✅ **Migration Requirement**: Add REST API Controllers with JSON responses  
✅ **OpenAPI Requirement**: Add Swagger/OpenAPI documentation for type generation

### OpenAPI/Swagger Generation

**Step 1: Add REST API Layer to ASP.NET Core**

```csharp
// Program.cs additions
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add API Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Add OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Contoso University API",
        Version = "v1",
        Description = "REST API for Contoso University student management system",
        Contact = new OpenApiContact
        {
            Name = "Migration Engineering Team",
            Email = "support@contoso.edu"
        }
    });

    // Include XML comments for detailed documentation
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);
});

var app = builder.Build();

// Configure Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Contoso University API v1");
        options.RoutePrefix = "api-docs"; // Access at: /api-docs
    });
}

app.MapControllers();
app.Run();
```

**Step 2: Create API Controllers**

```csharp
// Controllers/StudentsController.cs
using Microsoft.AspNetCore.Mvc;
using ContosoUniversity.Models;
using ContosoUniversity.Data;

namespace ContosoUniversity.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class StudentsController : ControllerBase
{
    private readonly SchoolContext _context;

    public StudentsController(SchoolContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get list of all students with optional filtering and pagination
    /// </summary>
    /// <param name="searchString">Search by last name or first name</param>
    /// <param name="pageIndex">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>Paginated list of students</returns>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<Student>>> GetStudents(
        [FromQuery] string? searchString,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        // Implementation...
    }

    /// <summary>
    /// Get student by ID with enrollments
    /// </summary>
    /// <param name="id">Student ID</param>
    /// <returns>Student details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Student>> GetStudent(int id)
    {
        // Implementation...
    }

    /// <summary>
    /// Create new student
    /// </summary>
    /// <param name="student">Student creation data</param>
    /// <returns>Created student</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Student>> CreateStudent([FromBody] Student student)
    {
        // Implementation...
    }
}
```

**Step 3: Generate OpenAPI Specification**

```bash
# Install Swashbuckle CLI (if not already installed)
dotnet tool install -g Swashbuckle.AspNetCore.Cli

# Generate OpenAPI spec
dotnet swagger tofile --output openapi.json ContosoUniversity/bin/Debug/net6.0/ContosoUniversity.dll v1
```

**Step 4: Generate TypeScript Types from OpenAPI**

**Option A: openapi-typescript (Recommended)**

```bash
# Install openapi-typescript
npm install --save-dev openapi-typescript

# Generate types
npx openapi-typescript ./openapi.json --output ./src/types/dto/generated.ts
```

**Generated Output Example:**

```typescript
// src/types/dto/generated.ts (auto-generated)

export interface paths {
  "/api/v1/Students": {
    get: operations["Students_GetStudents"];
    post: operations["Students_CreateStudent"];
  };
  "/api/v1/Students/{id}": {
    get: operations["Students_GetStudent"];
    put: operations["Students_UpdateStudent"];
    delete: operations["Students_DeleteStudent"];
  };
}

export interface components {
  schemas: {
    Student: {
      id?: number;
      lastName: string;
      firstMidName: string;
      enrollmentDate: string; // date-time
      enrollments?: components["schemas"]["Enrollment"][];
    };
    Enrollment: {
      enrollmentId?: number;
      courseId: number;
      studentId: number;
      grade?: 0 | 1 | 2 | 3 | 4; // Grade enum
      course?: components["schemas"]["Course"];
      student?: components["schemas"]["Student"];
    };
    Grade: 0 | 1 | 2 | 3 | 4;
    PaginatedResponseOfStudent: {
      items: components["schemas"]["Student"][];
      pageIndex: number;
      totalPages: number;
      totalCount: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
}

export interface operations {
  Students_GetStudents: {
    parameters: {
      query: {
        searchString?: string;
        pageIndex?: number;
        pageSize?: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["PaginatedResponseOfStudent"];
        };
      };
    };
  };
  Students_GetStudent: {
    parameters: {
      path: {
        id: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["Student"];
        };
      };
      404: {
        content: never;
      };
    };
  };
}
```

**Option B: openapi-generator-cli**

```bash
# Install openapi-generator
npm install --save-dev @openapitools/openapi-generator-cli

# Generate TypeScript client + types
npx openapi-generator-cli generate \
  -i ./openapi.json \
  -g typescript-fetch \
  -o ./src/api/generated \
  --additional-properties=typescriptThreePlus=true,supportsES6=true
```

**Step 5: Create Type Aliases for DTOs**

```typescript
// src/types/dto/Student.dto.ts
import { components } from './generated';

// Re-export with cleaner naming
export type StudentDto = components['schemas']['Student'];
export type CreateStudentDto = Omit<StudentDto, 'id' | 'enrollments'>;
export type UpdateStudentDto = Partial<CreateStudentDto> & Pick<StudentDto, 'id'>;

// src/types/dto/Enrollment.dto.ts
export type EnrollmentDto = components['schemas']['Enrollment'];
export type GradeDto = components['schemas']['Grade'];

// src/types/dto/Course.dto.ts
export type CourseDto = components['schemas']['Course'];
```

**Step 6: Automate Type Generation**

```json
// package.json scripts
{
  "scripts": {
    "generate:types": "openapi-typescript ../ContosoUniversity/openapi.json --output ./src/types/dto/generated.ts",
    "prebuild": "npm run generate:types",
    "dev": "npm run generate:types && vite"
  }
}
```

### GraphQL Code Generation (Future)

**When to Use GraphQL:**
- Complex nested queries (e.g., Student → Enrollments → Course → Department)
- Flexible field selection (avoid over-fetching)
- Real-time subscriptions (e.g., enrollment updates)

**Setup: Apollo Client + GraphQL Code Generator**

```bash
# Install dependencies
npm install @apollo/client graphql
npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

**GraphQL Schema Example:**

```graphql
# schema.graphql
type Student {
  id: ID!
  lastName: String!
  firstName: String!
  enrollmentDate: Date!
  enrollments: [Enrollment!]!
  gpa: Float
}

type Enrollment {
  id: ID!
  grade: Grade
  course: Course!
  student: Student!
}

enum Grade {
  A
  B
  C
  D
  F
}

type Query {
  students(
    searchString: String
    pageIndex: Int = 1
    pageSize: Int = 10
  ): PaginatedStudents!
  
  student(id: ID!): Student
}

type Mutation {
  createStudent(input: CreateStudentInput!): Student!
  updateStudent(id: ID!, input: UpdateStudentInput!): Student!
  deleteStudent(id: ID!): Boolean!
}

input CreateStudentInput {
  lastName: String!
  firstName: String!
  enrollmentDate: Date!
}
```

**Code Generation Config:**

```yaml
# codegen.yml
schema: "http://localhost:5000/graphql"
documents: "src/**/*.graphql"
generates:
  src/types/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      withHooks: true
      withComponent: false
      withHOC: false
```

**Generated Hooks:**

```typescript
// Auto-generated from GraphQL schema
import { useGetStudentsQuery, useCreateStudentMutation } from '@/types/generated/graphql';

// Usage in component
const StudentList = () => {
  const { data, loading, error } = useGetStudentsQuery({
    variables: { pageIndex: 1, pageSize: 10 }
  });

  const [createStudent] = useCreateStudentMutation();

  // ...
};
```

---

## Type Mapping Utilities

### DTO to UI Model Mappers

**Location**: `src/utils/mappers/`

```typescript
// src/utils/mappers/studentMapper.ts
import { StudentDto } from '@/types/dto/Student.dto';
import { StudentUiModel, StudentListItem } from '@/types/ui/Student.ui';
import { parseISO } from 'date-fns';

/**
 * Map StudentDto to StudentUiModel
 * 
 * Transforms backend DTO to UI-optimized model:
 * - Parse date strings to Date objects
 * - Compute fullName
 * - Calculate enrollment statistics
 */
export const mapStudentDtoToUiModel = (dto: StudentDto): StudentUiModel => {
  const fullName = `${dto.lastName}, ${dto.firstMidName}`;
  const enrollmentCount = dto.enrollments?.length ?? 0;
  
  // Calculate GPA from grades
  const gpa = calculateGpa(dto.enrollments);

  return {
    id: dto.id,
    lastName: dto.lastName,
    firstName: dto.firstMidName,
    enrollmentDate: parseISO(dto.enrollmentDate),
    fullName,
    enrollmentCount,
    gpa,
  };
};

/**
 * Map StudentDto to StudentListItem (minimal fields)
 */
export const mapStudentDtoToListItem = (dto: StudentDto): StudentListItem => {
  return {
    id: dto.id,
    fullName: `${dto.lastName}, ${dto.firstMidName}`,
    enrollmentDate: parseISO(dto.enrollmentDate),
    enrollmentCount: dto.enrollments?.length ?? 0,
  };
};

/**
 * Map array of StudentDtos to StudentListItems
 */
export const mapStudentDtosToListItems = (dtos: StudentDto[]): StudentListItem[] => {
  return dtos.map(mapStudentDtoToListItem);
};

/**
 * Calculate GPA from enrollments
 */
const calculateGpa = (enrollments?: EnrollmentDto[]): number | undefined => {
  if (!enrollments || enrollments.length === 0) {
    return undefined;
  }

  const gradedEnrollments = enrollments.filter(e => e.grade !== null);
  if (gradedEnrollments.length === 0) {
    return undefined;
  }

  const gradePoints: Record<GradeDto, number> = {
    [GradeDto.A]: 4.0,
    [GradeDto.B]: 3.0,
    [GradeDto.C]: 2.0,
    [GradeDto.D]: 1.0,
    [GradeDto.F]: 0.0,
  };

  const totalPoints = gradedEnrollments.reduce((sum, e) => {
    return sum + (e.grade !== null ? gradePoints[e.grade] : 0);
  }, 0);

  return Number((totalPoints / gradedEnrollments.length).toFixed(2));
};
```

**Reverse Mapper: UI Model to DTO**

```typescript
// src/utils/mappers/studentMapper.ts (continued)

import { StudentFormState } from '@/types/ui/Student.ui';
import { CreateStudentDto } from '@/types/dto/Student.dto';
import { formatISO } from 'date-fns';

/**
 * Map StudentFormState to CreateStudentDto
 * 
 * Prepares form data for API submission:
 * - Convert Date to ISO 8601 string
 * - Map UI field names to DTO field names
 */
export const mapStudentFormToCreateDto = (form: StudentFormState): CreateStudentDto => {
  if (!form.enrollmentDate) {
    throw new Error('Enrollment date is required');
  }

  return {
    lastName: form.lastName.trim(),
    firstMidName: form.firstName.trim(),
    enrollmentDate: formatISO(form.enrollmentDate, { representation: 'date' }), // "yyyy-MM-dd"
  };
};

/**
 * Map StudentUiModel to UpdateStudentDto
 */
export const mapStudentUiToUpdateDto = (
  student: StudentUiModel
): UpdateStudentDto => {
  return {
    id: student.id,
    lastName: student.lastName,
    firstMidName: student.firstName,
    enrollmentDate: formatISO(student.enrollmentDate, { representation: 'date' }),
  };
};
```

### Validation Helpers

```typescript
// src/utils/validation/studentValidation.ts
import { StudentFormState, StudentFormErrors } from '@/types/ui/Student.ui';
import { isValid as isValidDate, isBefore, startOfToday } from 'date-fns';

/**
 * Validate student form
 * 
 * @returns Object with field-level error messages (empty if valid)
 */
export const validateStudentForm = (values: StudentFormState): StudentFormErrors => {
  const errors: StudentFormErrors = {};

  // Last name validation
  if (!values.lastName || values.lastName.trim().length === 0) {
    errors.lastName = 'Last name is required';
  } else if (values.lastName.length > 50) {
    errors.lastName = 'Last name cannot exceed 50 characters';
  }

  // First name validation
  if (!values.firstName || values.firstName.trim().length === 0) {
    errors.firstName = 'First name is required';
  } else if (values.firstName.length > 50) {
    errors.firstName = 'First name cannot exceed 50 characters';
  }

  // Enrollment date validation
  if (!values.enrollmentDate) {
    errors.enrollmentDate = 'Enrollment date is required';
  } else if (!isValidDate(values.enrollmentDate)) {
    errors.enrollmentDate = 'Invalid date format';
  } else if (isBefore(values.enrollmentDate, new Date('1900-01-01'))) {
    errors.enrollmentDate = 'Enrollment date cannot be before 1900';
  } else if (isBefore(startOfToday(), values.enrollmentDate)) {
    errors.enrollmentDate = 'Enrollment date cannot be in the future';
  }

  return errors;
};

/**
 * Check if form has any errors
 */
export const hasErrors = (errors: StudentFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};
```

### Type Guards

```typescript
// src/utils/typeGuards/studentGuards.ts
import { StudentDto } from '@/types/dto/Student.dto';
import { StudentUiModel } from '@/types/ui/Student.ui';

/**
 * Type guard: Check if value is StudentDto
 */
export const isStudentDto = (value: unknown): value is StudentDto => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'number' &&
    typeof obj.lastName === 'string' &&
    typeof obj.firstMidName === 'string' &&
    typeof obj.enrollmentDate === 'string'
  );
};

/**
 * Type guard: Check if value is StudentUiModel
 */
export const isStudentUiModel = (value: unknown): value is StudentUiModel => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'number' &&
    typeof obj.lastName === 'string' &&
    typeof obj.firstName === 'string' &&
    obj.enrollmentDate instanceof Date &&
    typeof obj.fullName === 'string'
  );
};

/**
 * Type guard: Check if array is StudentDto[]
 */
export const isStudentDtoArray = (value: unknown): value is StudentDto[] => {
  return Array.isArray(value) && value.every(isStudentDto);
};
```

**Usage in API Client:**

```typescript
// src/api/services/studentService.ts
import { isStudentDto, isStudentDtoArray } from '@/utils/typeGuards/studentGuards';

export const fetchStudent = async (id: number): Promise<StudentDto> => {
  const response = await fetch(`/api/v1/students/${id}`);
  const data = await response.json();

  if (!isStudentDto(data)) {
    throw new Error('Invalid student data received from API');
  }

  return data;
};

export const fetchStudents = async (): Promise<StudentDto[]> => {
  const response = await fetch('/api/v1/students');
  const data = await response.json();

  if (!isStudentDtoArray(data.items)) {
    throw new Error('Invalid students data received from API');
  }

  return data.items;
};
```

---

## Best Practices & Conventions

### Naming Conventions

| Type Category | Naming Convention | Example |
|--------------|-------------------|---------|
| DTO Interface | `{Entity}Dto` | `StudentDto`, `CourseDto` |
| UI Model Interface | `{Entity}UiModel` | `StudentUiModel`, `CourseUiModel` |
| Form State Interface | `{Entity}FormState` | `StudentFormState` |
| Form Errors Interface | `{Entity}FormErrors` | `StudentFormErrors` |
| Component Props | `{Component}Props` | `StudentListProps` |
| Mapper Function | `map{From}To{To}` | `mapStudentDtoToUiModel` |
| Type Guard | `is{Type}` | `isStudentDto` |
| Enum | `{Name}` (no suffix) | `Grade`, `EnrollmentStatus` |

### File Organization

```
src/
├── types/
│   ├── dto/                    # Backend contracts (auto-generated)
│   │   ├── generated.ts        # OpenAPI generated types
│   │   ├── Student.dto.ts      # Type aliases & exports
│   │   ├── Course.dto.ts
│   │   ├── Enrollment.dto.ts
│   │   └── enums/
│   │       └── Grade.enum.ts
│   ├── ui/                     # UI models & component types
│   │   ├── Student.ui.ts
│   │   ├── Course.ui.ts
│   │   ├── forms/
│   │   │   └── StudentForm.types.ts
│   │   └── components/
│   │       └── StudentList.types.ts
│   └── shared/                 # Shared types
│       ├── Pagination.types.ts
│       └── ApiResponse.types.ts
├── utils/
│   ├── mappers/                # DTO ↔ UI model mappers
│   │   ├── studentMapper.ts
│   │   └── courseMapper.ts
│   ├── validation/             # Form validation
│   │   └── studentValidation.ts
│   └── typeGuards/             # Runtime type checks
│       └── studentGuards.ts
└── api/
    ├── clients/                # API client setup
    │   └── apiClient.ts
    └── services/               # API service methods
        ├── studentService.ts
        └── courseService.ts
```

### Comments & Documentation

**JSDoc for Public APIs:**

```typescript
/**
 * Fetches a student by ID with related enrollments
 * 
 * @param id - Student ID (positive integer)
 * @returns Promise resolving to StudentDto
 * @throws {ApiError} If student not found (404) or server error (500)
 * 
 * @example
 * ```typescript
 * const student = await fetchStudent(123);
 * console.log(student.fullName);
 * ```
 */
export const fetchStudent = async (id: number): Promise<StudentDto> => {
  // ...
};
```

**Inline Comments for Complex Logic:**

```typescript
// Calculate GPA: Sum of grade points divided by number of graded enrollments
// Note: Enrollments with null grades are excluded from calculation
const gpa = gradedEnrollments.reduce((sum, e) => {
  return sum + gradePoints[e.grade!]; // ! is safe - filtered nulls above
}, 0) / gradedEnrollments.length;
```

### Type Safety Best Practices

1. **Avoid `any`** - Use `unknown` and type guards instead
2. **Prefer `interface` over `type`** for object shapes (better error messages)
3. **Use `readonly` for immutable props** (especially in Redux/state)
4. **Discriminated unions** for state machines and variants
5. **Template literal types** for string unions with patterns

**Example: Discriminated Union for API State**

```typescript
type ApiState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Usage with type narrowing
const StudentList = () => {
  const [state, setState] = useState<ApiState<StudentDto[]>>({ status: 'idle' });

  if (state.status === 'loading') {
    return <Spinner />;
  }

  if (state.status === 'error') {
    return <ErrorMessage error={state.error} />; // ✅ TypeScript knows error exists
  }

  if (state.status === 'success') {
    return <List items={state.data} />; // ✅ TypeScript knows data exists
  }

  return null;
};
```

---

## Migration Roadmap

### Phase 1: Foundation (Week 1-2)

- [x] Define TypeScript configuration baseline
- [ ] Set up project structure (Vite + React + TypeScript)
- [ ] Configure path mappings and alias imports
- [ ] Install type-generation tooling (openapi-typescript)
- [ ] Create initial type directory structure

### Phase 2: Backend API Development (Week 3-4)

- [ ] Add REST API Controllers to ASP.NET Core
- [ ] Configure Swagger/OpenAPI documentation
- [ ] Define API response models (DTOs)
- [ ] Generate OpenAPI specification file
- [ ] Test API endpoints with Postman/Thunder Client

### Phase 3: Type Generation & DTOs (Week 5)

- [ ] Generate TypeScript DTOs from OpenAPI spec
- [ ] Create DTO type aliases and exports
- [ ] Set up automated type generation pipeline
- [ ] Add type guards for runtime validation
- [ ] Document DTO types and API contracts

### Phase 4: UI Types & Mappers (Week 6)

- [ ] Define UI model interfaces for all entities
- [ ] Create form state and error types
- [ ] Implement DTO → UI model mappers
- [ ] Implement UI model → DTO mappers
- [ ] Add unit tests for mappers

### Phase 5: Validation & Utilities (Week 7)

- [ ] Implement form validation helpers
- [ ] Create reusable type guards
- [ ] Add error handling utilities
- [ ] Document validation rules and constraints

### Phase 6: Integration & Testing (Week 8)

- [ ] Integrate types with React components
- [ ] Test type safety in forms and API calls
- [ ] Add E2E tests with typed API mocks
- [ ] Performance testing and optimization

### Phase 7: Refinement (Ongoing)

- [ ] Refactor types based on feedback
- [ ] Add GraphQL support (if needed)
- [ ] Optimize build performance
- [ ] Update documentation

---

## Related Documents

- [API & Service Contracts](../../API-&-Service-Contracts.md) - Backend API documentation
- [Data Model Catalog](../../Data-Model-Catalog.md) - Database schema and entity models
- [Architecture Overview](../../Architecture-Overview.md) - System architecture and component design

---

**Document Status:** ✅ Complete - Ready for Implementation  
**Next Steps:**
1. Review with frontend team
2. Set up React + TypeScript project with recommended tsconfig
3. Add REST API Controllers to backend
4. Generate OpenAPI spec and TypeScript types
5. Begin component development with typed models
