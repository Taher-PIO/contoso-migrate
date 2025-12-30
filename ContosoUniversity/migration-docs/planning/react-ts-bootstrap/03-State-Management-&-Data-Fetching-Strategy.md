# State Management & Data Fetching Strategy - React + TypeScript + Bootstrap

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Engineering Team  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Current Architecture Analysis](#current-architecture-analysis)
- [Store Architecture Decision](#store-architecture-decision)
- [Data Fetching Strategy](#data-fetching-strategy)
- [State Management Patterns](#state-management-patterns)
- [Loading & Error Patterns](#loading--error-patterns)
- [Store Design & Slices](#store-design--slices)
- [Request Lifecycle Patterns](#request-lifecycle-patterns)
- [Component Examples](#component-examples)
- [Migration Roadmap](#migration-roadmap)

---

## Executive Summary

This document defines the state management and data fetching strategy for migrating Contoso University from ASP.NET Core Razor Pages to a React + TypeScript + Bootstrap application.

### Key Decisions

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| **State Management** | **Zustand** | Lightweight, minimal boilerplate, TypeScript-first, sufficient for app complexity |
| **Data Fetching** | **TanStack Query (React Query)** | Industry standard, built-in caching/invalidation, excellent DevTools, decouples from state management |
| **API Layer** | **Axios with typed interceptors** | Better TypeScript support than fetch, request/response interceptors for auth/errors |
| **Loading States** | **Bootstrap Spinners** | Native Bootstrap components, consistent with design system |
| **Error Display** | **Bootstrap Alerts + Toasts** | Bootstrap alerts for inline errors, toasts for global notifications |
| **Form Management** | **React Hook Form** | Performance-focused, built-in validation, minimal re-renders |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Application                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Components (UI Layer)                                      │ │
│  │  • StudentList, CourseDetails, InstructorForm, etc.        │ │
│  │  • Bootstrap components for layout and feedback            │ │
│  └────────────┬───────────────────────────┬───────────────────┘ │
│               │                           │                      │
│               │ Use Hooks                 │ Use Hooks            │
│               ▼                           ▼                      │
│  ┌────────────────────────┐   ┌─────────────────────────────┐  │
│  │  TanStack Query        │   │  Zustand Store              │  │
│  │  (Server State)        │   │  (Client State)             │  │
│  │                        │   │                             │  │
│  │  • Student queries     │   │  • UI state (modals, etc.)  │  │
│  │  • Course queries      │   │  • User preferences         │  │
│  │  • Mutations (CRUD)    │   │  • Navigation state         │  │
│  │  • Cache management    │   │  • Global notifications     │  │
│  └────────────┬───────────┘   └─────────────────────────────┘  │
│               │                                                  │
│               │ HTTP Requests                                    │
│               ▼                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Client (Axios)                                         │ │
│  │  • Request interceptors (auth, logging)                    │ │
│  │  • Response interceptors (error handling, transformations) │ │
│  │  • TypeScript types for all endpoints                      │ │
│  └────────────┬───────────────────────────────────────────────┘ │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ REST API Calls
                ▼
   ┌────────────────────────────┐
   │  Node.js Express API       │
   │  or ASP.NET Core API       │
   │  • /api/students           │
   │  • /api/courses            │
   │  • /api/instructors        │
   │  • /api/departments        │
   └────────────────────────────┘
```

---

## Current Architecture Analysis

### ASP.NET Core Razor Pages Patterns

**State Management:**
- Server-side page models hold state
- State passed via ViewData, model binding
- No client-side state management
- Form state managed by ASP.NET Core ModelState

**Data Fetching:**
- Direct EF Core queries in page handlers
- Synchronous (blocking) page rendering
- No caching beyond SQL Server query cache
- Pagination via custom `PaginatedList<T>` class

**Side Effects:**
```csharp
// Current pattern - tightly coupled to EF Core
public async Task OnGetAsync(string sortOrder, string searchString, int? pageIndex)
{
    IQueryable<Student> studentsIQ = from s in _context.Students select s;
    
    if (!String.IsNullOrEmpty(searchString))
    {
        studentsIQ = studentsIQ.Where(s => s.LastName.Contains(searchString));
    }
    
    Students = await PaginatedList<Student>.CreateAsync(
        studentsIQ.AsNoTracking(), pageIndex ?? 1, pageSize);
}
```

**Key Findings:**
- ✅ Simple, predictable data flow
- ✅ Strong typing via C# models
- ❌ No client-side caching
- ❌ Full page reloads for all interactions
- ❌ No optimistic updates
- ❌ Limited user feedback during operations

### Authentication & Authorization Patterns

**Current State:** ❌ No authentication implemented

**Future Requirements:**
- JWT token-based authentication
- Role-based access control (Student, Faculty, Admin)
- Protected routes in React
- Token refresh mechanism

---

## Store Architecture Decision

### Decision: Zustand + TanStack Query

**Why Not Redux Toolkit?**

Redux Toolkit is excellent but overkill for this application:
- ❌ More boilerplate (actions, reducers, slices)
- ❌ Steeper learning curve
- ❌ RTK Query tightly couples data fetching to Redux
- ❌ Larger bundle size

**Why Zustand?**

Zustand is ideal for this migration:
- ✅ Minimal boilerplate (~30 lines per store)
- ✅ No providers needed (unless you need context isolation)
- ✅ TypeScript-first design
- ✅ Excellent DevTools
- ✅ Works perfectly with TanStack Query
- ✅ Small bundle size (~1KB)
- ✅ Easy to learn for team members

**Why TanStack Query for Data Fetching?**

- ✅ Industry standard (used by 1M+ projects)
- ✅ Automatic caching and cache invalidation
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Parallel and dependent queries
- ✅ Infinite queries for pagination
- ✅ Excellent DevTools
- ✅ Framework agnostic (can be used outside React)
- ✅ Decoupled from state management

### State Separation Strategy

**Server State (TanStack Query):**
- Student data
- Course data
- Instructor data
- Department data
- Enrollment data
- Any data fetched from API

**Client State (Zustand):**
- UI state (modal open/closed, sidebar expanded)
- User preferences (theme, language, items per page)
- Navigation state (current page, breadcrumbs)
- Global notifications (toast messages)
- Form draft state (unsaved changes)
- Selection state (selected rows in tables)

---

## Data Fetching Strategy

### API Client Setup

**Technology:** Axios with TypeScript

```typescript
// src/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
```

### TanStack Query Setup

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

---

## State Management Patterns

### Zustand Store Structure

**Global UI Store:**

```typescript
// src/store/uiStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIStore {
  // Modals
  isCreateStudentModalOpen: boolean;
  isDeleteConfirmModalOpen: boolean;
  
  // Toasts
  toasts: Toast[];
  
  // User Preferences
  itemsPerPage: number;
  theme: 'light' | 'dark';
  
  // Actions
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setItemsPerPage: (count: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // Initial state
      isCreateStudentModalOpen: false,
      isDeleteConfirmModalOpen: false,
      toasts: [],
      itemsPerPage: 10,
      theme: 'light',
      
      // Actions
      openModal: (modalName) =>
        set((state) => ({ [`is${modalName}Open`]: true })),
        
      closeModal: (modalName) =>
        set((state) => ({ [`is${modalName}Open`]: false })),
        
      addToast: (toast) =>
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id: Date.now().toString() }],
        })),
        
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
        
      setItemsPerPage: (count) => set({ itemsPerPage: count }),
      
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ui-store' }
  )
);
```

**Navigation Store:**

```typescript
// src/store/navigationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface NavigationStore {
  breadcrumbs: BreadcrumbItem[];
  selectedStudentId: number | null;
  selectedCourseId: number | null;
  
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  setSelectedStudent: (id: number | null) => void;
  setSelectedCourse: (id: number | null) => void;
}

export const useNavigationStore = create<NavigationStore>()(
  devtools(
    (set) => ({
      breadcrumbs: [],
      selectedStudentId: null,
      selectedCourseId: null,
      
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      setSelectedStudent: (id) => set({ selectedStudentId: id }),
      setSelectedCourse: (id) => set({ selectedCourseId: id }),
    }),
    { name: 'navigation-store' }
  )
);
```

---

## Loading & Error Patterns

### Bootstrap Components for Feedback

#### 1. Loading Spinners

**Inline Spinner (for buttons):**

```typescript
// src/components/common/LoadingButton.tsx
import { Button, Spinner } from 'react-bootstrap';
import { ButtonProps } from 'react-bootstrap/Button';

interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading,
  loadingText = 'Loading...',
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={disabled || loading}>
      {loading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

**Full Page Loader:**

```typescript
// src/components/common/PageLoader.tsx
import { Spinner } from 'react-bootstrap';

export function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading data...</p>
      </div>
    </div>
  );
}
```

**Skeleton Loader (for content):**

```typescript
// src/components/common/SkeletonCard.tsx
import { Card, Placeholder } from 'react-bootstrap';

export function SkeletonCard() {
  return (
    <Card>
      <Card.Body>
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={6} />
        </Placeholder>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={4} />{' '}
          <Placeholder xs={6} /> <Placeholder xs={8} />
        </Placeholder>
        <Placeholder.Button variant="primary" xs={4} />
      </Card.Body>
    </Card>
  );
}
```

#### 2. Error Alerts

**Inline Alert Component:**

```typescript
// src/components/common/ErrorAlert.tsx
import { Alert } from 'react-bootstrap';
import { XCircle } from 'react-bootstrap-icons';

interface ErrorAlertProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorAlert({ error, onRetry, onDismiss }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="danger" dismissible={!!onDismiss} onClose={onDismiss}>
      <Alert.Heading>
        <XCircle className="me-2" />
        Error Loading Data
      </Alert.Heading>
      <p className="mb-0">{error.message || 'An unexpected error occurred.'}</p>
      {onRetry && (
        <div className="mt-3">
          <Button variant="outline-danger" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </Alert>
  );
}
```

#### 3. Toast Notifications

**Toast Manager Component:**

```typescript
// src/components/common/ToastManager.tsx
import { Toast, ToastContainer } from 'react-bootstrap';
import { useUIStore } from '@/store/uiStore';
import { useEffect } from 'react';

export function ToastManager() {
  const { toasts, removeToast } = useUIStore();

  useEffect(() => {
    // Auto-remove toasts after duration
    toasts.forEach((toast) => {
      if (toast.duration) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removeToast]);

  return (
    <ToastContainer position="top-end" className="p-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          onClose={() => removeToast(toast.id)}
          bg={toast.type}
          autohide
          delay={toast.duration || 3000}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toast.type === 'success' && 'Success'}
              {toast.type === 'error' && 'Error'}
              {toast.type === 'warning' && 'Warning'}
              {toast.type === 'info' && 'Info'}
            </strong>
          </Toast.Header>
          <Toast.Body className={toast.type === 'success' || toast.type === 'info' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
```

---

## Store Design & Slices

### Entity Data Models (TypeScript)

```typescript
// src/types/models.ts

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  enrollmentDate: string; // ISO date string
  enrollments?: Enrollment[];
}

export interface Course {
  courseID: number;
  title: string;
  credits: number;
  departmentID: number;
  department?: Department;
  enrollments?: Enrollment[];
  instructors?: Instructor[];
}

export interface Enrollment {
  enrollmentID: number;
  courseID: number;
  studentID: number;
  grade?: Grade;
  course?: Course;
  student?: Student;
}

export enum Grade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}

export interface Instructor {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  hireDate: string; // ISO date string
  officeAssignment?: OfficeAssignment;
  courses?: Course[];
}

export interface Department {
  departmentID: number;
  name: string;
  budget: number;
  startDate: string; // ISO date string
  instructorID?: number;
  administrator?: Instructor;
  concurrencyToken: string; // For optimistic concurrency
}

export interface OfficeAssignment {
  instructorID: number;
  location: string;
  instructor?: Instructor;
}

// Pagination wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### Query Keys Pattern

```typescript
// src/api/queryKeys.ts

export const queryKeys = {
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: StudentFilters) => 
      [...queryKeys.students.lists(), filters] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.students.details(), id] as const,
  },
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: CourseFilters) => 
      [...queryKeys.courses.lists(), filters] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.courses.details(), id] as const,
  },
  instructors: {
    all: ['instructors'] as const,
    lists: () => [...queryKeys.instructors.all, 'list'] as const,
    list: (filters: InstructorFilters) => 
      [...queryKeys.instructors.lists(), filters] as const,
    details: () => [...queryKeys.instructors.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.instructors.details(), id] as const,
  },
  departments: {
    all: ['departments'] as const,
    lists: () => [...queryKeys.departments.all, 'list'] as const,
    list: () => [...queryKeys.departments.lists()] as const,
    details: () => [...queryKeys.departments.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.departments.details(), id] as const,
  },
} as const;

export interface StudentFilters {
  sortOrder?: string;
  searchString?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface CourseFilters {
  departmentID?: number;
  pageIndex?: number;
  pageSize?: number;
}

export interface InstructorFilters {
  pageIndex?: number;
  pageSize?: number;
}
```

---

## Request Lifecycle Patterns

### Query Pattern (GET Requests)

**Student List Query:**

```typescript
// src/api/students/useStudentsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Student, PaginatedResponse } from '@/types/models';
import { queryKeys, StudentFilters } from '@/api/queryKeys';

async function fetchStudents(
  filters: StudentFilters
): Promise<PaginatedResponse<Student>> {
  const { data } = await apiClient.get<PaginatedResponse<Student>>('/students', {
    params: filters,
  });
  return data;
}

export function useStudentsQuery(filters: StudentFilters) {
  return useQuery({
    queryKey: queryKeys.students.list(filters),
    queryFn: () => fetchStudents(filters),
    keepPreviousData: true, // Keep old data while fetching new page
  });
}
```

**Student Detail Query:**

```typescript
// src/api/students/useStudentQuery.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Student } from '@/types/models';
import { queryKeys } from '@/api/queryKeys';

async function fetchStudent(id: number): Promise<Student> {
  const { data } = await apiClient.get<Student>(`/students/${id}`);
  return data;
}

export function useStudentQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: () => fetchStudent(id),
    enabled: !!id, // Only run if id exists
  });
}
```

### Mutation Pattern (POST, PUT, DELETE Requests)

**Create Student Mutation:**

```typescript
// src/api/students/useCreateStudentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Student } from '@/types/models';
import { queryKeys } from '@/api/queryKeys';
import { useUIStore } from '@/store/uiStore';

interface CreateStudentData {
  firstName: string;
  lastName: string;
  enrollmentDate: string;
}

async function createStudent(data: CreateStudentData): Promise<Student> {
  const { data: response } = await apiClient.post<Student>('/students', data);
  return response;
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: (newStudent) => {
      // Invalidate student list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      
      // Show success toast
      addToast({
        type: 'success',
        message: `Student ${newStudent.fullName} created successfully!`,
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      // Show error toast
      addToast({
        type: 'error',
        message: error.message || 'Failed to create student',
        duration: 5000,
      });
    },
  });
}
```

**Update Student Mutation:**

```typescript
// src/api/students/useUpdateStudentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Student } from '@/types/models';
import { queryKeys } from '@/api/queryKeys';
import { useUIStore } from '@/store/uiStore';

interface UpdateStudentData {
  id: number;
  firstName: string;
  lastName: string;
  enrollmentDate: string;
}

async function updateStudent(data: UpdateStudentData): Promise<Student> {
  const { id, ...updateData } = data;
  const { data: response } = await apiClient.put<Student>(`/students/${id}`, updateData);
  return response;
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: updateStudent,
    onMutate: async (updatedStudent) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.detail(updatedStudent.id) 
      });

      // Snapshot previous value
      const previousStudent = queryClient.getQueryData<Student>(
        queryKeys.students.detail(updatedStudent.id)
      );

      // Optimistically update cache
      queryClient.setQueryData<Student>(
        queryKeys.students.detail(updatedStudent.id),
        (old) => (old ? { ...old, ...updatedStudent } : undefined)
      );

      return { previousStudent };
    },
    onError: (error, updatedStudent, context) => {
      // Rollback on error
      if (context?.previousStudent) {
        queryClient.setQueryData(
          queryKeys.students.detail(updatedStudent.id),
          context.previousStudent
        );
      }
      
      addToast({
        type: 'error',
        message: error.message || 'Failed to update student',
        duration: 5000,
      });
    },
    onSuccess: (updatedStudent) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.detail(updatedStudent.id) 
      });
      
      addToast({
        type: 'success',
        message: `Student ${updatedStudent.fullName} updated successfully!`,
        duration: 3000,
      });
    },
  });
}
```

**Delete Student Mutation:**

```typescript
// src/api/students/useDeleteStudentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useUIStore } from '@/store/uiStore';

async function deleteStudent(id: number): Promise<void> {
  await apiClient.delete(`/students/${id}`);
}

export function useDeleteStudentMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.students.detail(deletedId) });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      
      addToast({
        type: 'success',
        message: 'Student deleted successfully!',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: error.message || 'Failed to delete student',
        duration: 5000,
      });
    },
  });
}
```

### Dependent Queries Pattern

**Fetch enrollments after student is loaded:**

```typescript
// src/api/enrollments/useStudentEnrollmentsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Enrollment } from '@/types/models';
import { queryKeys } from '@/api/queryKeys';

async function fetchStudentEnrollments(studentId: number): Promise<Enrollment[]> {
  const { data } = await apiClient.get<Enrollment[]>(`/students/${studentId}/enrollments`);
  return data;
}

export function useStudentEnrollmentsQuery(studentId: number | null) {
  return useQuery({
    queryKey: ['enrollments', 'student', studentId],
    queryFn: () => fetchStudentEnrollments(studentId!),
    enabled: !!studentId, // Only fetch when studentId is available
  });
}

// Usage in component
function StudentDetails({ studentId }: { studentId: number }) {
  const studentQuery = useStudentQuery(studentId);
  const enrollmentsQuery = useStudentEnrollmentsQuery(
    studentQuery.isSuccess ? studentId : null
  );
  
  // enrollmentsQuery won't run until studentQuery succeeds
}
```

---

## Component Examples

### Student List Component

```typescript
// src/pages/Students/StudentList.tsx
import { useState } from 'react';
import { Table, Form, InputGroup, Pagination, Button } from 'react-bootstrap';
import { Search, Plus } from 'react-bootstrap-icons';
import { useStudentsQuery } from '@/api/students/useStudentsQuery';
import { useNavigationStore } from '@/store/navigationStore';
import { useUIStore } from '@/store/uiStore';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { Link } from 'react-router-dom';

export function StudentList() {
  const [searchString, setSearchString] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const { itemsPerPage } = useUIStore();

  const { data, isLoading, isError, error, refetch } = useStudentsQuery({
    searchString,
    sortOrder,
    pageIndex,
    pageSize: itemsPerPage,
  });

  if (isLoading) return <PageLoader />;
  
  if (isError) {
    return <ErrorAlert error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Students</h1>
        <Button as={Link} to="/students/create" variant="primary">
          <Plus className="me-2" />
          Create New Student
        </Button>
      </div>

      {/* Search Bar */}
      <InputGroup className="mb-3">
        <InputGroup.Text>
          <Search />
        </InputGroup.Text>
        <Form.Control
          placeholder="Search by name..."
          value={searchString}
          onChange={(e) => {
            setSearchString(e.target.value);
            setPageIndex(1); // Reset to first page on search
          }}
        />
      </InputGroup>

      {/* Student Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>
              <Button
                variant="link"
                className="p-0 text-decoration-none"
                onClick={() => setSortOrder(sortOrder === '' ? 'name_desc' : '')}
              >
                Last Name {sortOrder === 'name_desc' ? '▼' : sortOrder === '' ? '▲' : ''}
              </Button>
            </th>
            <th>First Name</th>
            <th>
              <Button
                variant="link"
                className="p-0 text-decoration-none"
                onClick={() => setSortOrder(sortOrder === 'Date' ? 'date_desc' : 'Date')}
              >
                Enrollment Date {sortOrder === 'Date' ? '▲' : sortOrder === 'date_desc' ? '▼' : ''}
              </Button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((student) => (
            <tr key={student.id}>
              <td>{student.lastName}</td>
              <td>{student.firstName}</td>
              <td>{new Date(student.enrollmentDate).toLocaleDateString()}</td>
              <td>
                <Button
                  as={Link}
                  to={`/students/${student.id}`}
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                >
                  Details
                </Button>
                <Button
                  as={Link}
                  to={`/students/${student.id}/edit`}
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  as={Link}
                  to={`/students/${student.id}/delete`}
                  variant="outline-danger"
                  size="sm"
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      {data && (
        <Pagination className="justify-content-center">
          <Pagination.Prev
            disabled={!data.hasPreviousPage}
            onClick={() => setPageIndex(pageIndex - 1)}
          />
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
            <Pagination.Item
              key={page}
              active={page === pageIndex}
              onClick={() => setPageIndex(page)}
            >
              {page}
            </Pagination.Item>
          ))}
          <Pagination.Next
            disabled={!data.hasNextPage}
            onClick={() => setPageIndex(pageIndex + 1)}
          />
        </Pagination>
      )}
    </div>
  );
}
```

### Student Create/Edit Form

```typescript
// src/pages/Students/StudentForm.tsx
import { useForm } from 'react-hook-form';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudentQuery } from '@/api/students/useStudentQuery';
import { useCreateStudentMutation } from '@/api/students/useCreateStudentMutation';
import { useUpdateStudentMutation } from '@/api/students/useUpdateStudentMutation';
import { LoadingButton } from '@/components/common/LoadingButton';
import { PageLoader } from '@/components/common/PageLoader';
import { useEffect } from 'react';

interface StudentFormData {
  firstName: string;
  lastName: string;
  enrollmentDate: string;
}

export function StudentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StudentFormData>();

  // Fetch student data if editing
  const { data: student, isLoading: isLoadingStudent } = useStudentQuery(
    isEditMode ? parseInt(id!) : 0
  );

  const createMutation = useCreateStudentMutation();
  const updateMutation = useUpdateStudentMutation();

  // Populate form when editing
  useEffect(() => {
    if (student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        enrollmentDate: student.enrollmentDate.split('T')[0], // Convert to YYYY-MM-DD
      });
    }
  }, [student, reset]);

  const onSubmit = async (data: StudentFormData) => {
    if (isEditMode && id) {
      await updateMutation.mutateAsync({ id: parseInt(id), ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    navigate('/students');
  };

  if (isEditMode && isLoadingStudent) {
    return <PageLoader />;
  }

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;
  const submitError = createMutation.error || updateMutation.error;

  return (
    <div className="container py-4">
      <h1>{isEditMode ? 'Edit Student' : 'Create Student'}</h1>

      {submitError && (
        <Alert variant="danger" className="mt-3">
          {(submitError as Error).message || 'Failed to save student'}
        </Alert>
      )}

      <Form onSubmit={handleSubmit(onSubmit)} className="mt-4">
        <Form.Group className="mb-3">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            {...register('firstName', {
              required: 'First name is required',
              maxLength: { value: 50, message: 'First name cannot exceed 50 characters' },
            })}
            isInvalid={!!errors.firstName}
          />
          <Form.Control.Feedback type="invalid">
            {errors.firstName?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="text"
            {...register('lastName', {
              required: 'Last name is required',
              maxLength: { value: 50, message: 'Last name cannot exceed 50 characters' },
            })}
            isInvalid={!!errors.lastName}
          />
          <Form.Control.Feedback type="invalid">
            {errors.lastName?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Enrollment Date</Form.Label>
          <Form.Control
            type="date"
            {...register('enrollmentDate', {
              required: 'Enrollment date is required',
            })}
            isInvalid={!!errors.enrollmentDate}
          />
          <Form.Control.Feedback type="invalid">
            {errors.enrollmentDate?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <div className="d-flex gap-2">
          <LoadingButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            loadingText={isEditMode ? 'Updating...' : 'Creating...'}
          >
            {isEditMode ? 'Update' : 'Create'}
          </LoadingButton>
          <Button variant="secondary" onClick={() => navigate('/students')}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}
```

### Student Delete Confirmation

```typescript
// src/pages/Students/StudentDelete.tsx
import { Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudentQuery } from '@/api/students/useStudentQuery';
import { useDeleteStudentMutation } from '@/api/students/useDeleteStudentMutation';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { LoadingButton } from '@/components/common/LoadingButton';

export function StudentDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading, isError, error } = useStudentQuery(parseInt(id!));
  const deleteMutation = useDeleteStudentMutation();

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorAlert error={error as Error} />;
  if (!student) return <Alert variant="warning">Student not found</Alert>;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(student.id);
    navigate('/students');
  };

  return (
    <div className="container py-4">
      <h1>Delete Student</h1>

      <Alert variant="warning" className="mt-4">
        <Alert.Heading>Are you sure you want to delete this student?</Alert.Heading>
        <p>This action cannot be undone.</p>
      </Alert>

      <Card className="mt-3">
        <Card.Body>
          <dl className="row mb-0">
            <dt className="col-sm-3">Name:</dt>
            <dd className="col-sm-9">{student.fullName}</dd>

            <dt className="col-sm-3">Enrollment Date:</dt>
            <dd className="col-sm-9">
              {new Date(student.enrollmentDate).toLocaleDateString()}
            </dd>
          </dl>
        </Card.Body>
      </Card>

      {deleteMutation.error && (
        <Alert variant="danger" className="mt-3">
          {(deleteMutation.error as Error).message || 'Failed to delete student'}
        </Alert>
      )}

      <div className="d-flex gap-2 mt-4">
        <LoadingButton
          variant="danger"
          loading={deleteMutation.isLoading}
          loadingText="Deleting..."
          onClick={handleDelete}
        >
          Delete
        </LoadingButton>
        <Button variant="secondary" onClick={() => navigate('/students')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
```

---

## Migration Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Setup:**
- [ ] Install dependencies: `zustand`, `@tanstack/react-query`, `axios`, `react-bootstrap`, `react-router-dom`
- [ ] Configure TanStack Query provider
- [ ] Setup Axios client with interceptors
- [ ] Create base TypeScript types from C# models
- [ ] Setup Zustand stores (UI, Navigation)

**Core Patterns:**
- [ ] Create query key structure
- [ ] Implement first query hook (students list)
- [ ] Implement first mutation hook (create student)
- [ ] Create loading components (spinner, skeleton, page loader)
- [ ] Create error components (alert, inline error)
- [ ] Create toast notification system

### Phase 2: Student Module (Weeks 3-4)

- [ ] Implement student list page with pagination
- [ ] Implement student detail page
- [ ] Implement student create form
- [ ] Implement student edit form
- [ ] Implement student delete confirmation
- [ ] Add search and sort functionality
- [ ] Add optimistic updates for edits

### Phase 3: Course Module (Weeks 5-6)

- [ ] Implement course queries and mutations
- [ ] Create course list page
- [ ] Create course detail page with enrollments
- [ ] Create course form (create/edit)
- [ ] Implement course-instructor many-to-many relationship UI
- [ ] Add department dropdown integration

### Phase 4: Instructor Module (Weeks 7-8)

- [ ] Implement instructor queries and mutations
- [ ] Create instructor list page
- [ ] Create instructor detail page
- [ ] Create instructor form with office assignment
- [ ] Implement course assignment UI
- [ ] Add dependent queries for courses taught

### Phase 5: Department Module (Weeks 9-10)

- [ ] Implement department queries and mutations
- [ ] Create department list page
- [ ] Create department form
- [ ] Implement optimistic concurrency handling
- [ ] Add administrator selection UI
- [ ] Handle concurrency conflicts with user feedback

### Phase 6: Polish & Performance (Weeks 11-12)

- [ ] Add infinite scroll for large lists
- [ ] Implement prefetching for common navigations
- [ ] Add request debouncing for search
- [ ] Optimize bundle size
- [ ] Add error boundaries
- [ ] Implement retry logic
- [ ] Add offline detection
- [ ] Performance testing and optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing

---

## Best Practices & Conventions

### Query Hooks

✅ **DO:**
- Use descriptive hook names: `useStudentsQuery`, `useStudentQuery`
- Enable queries conditionally with `enabled` option
- Use `keepPreviousData` for pagination
- Define query keys in a centralized file
- Handle loading and error states in components

❌ **DON'T:**
- Fetch data in `useEffect` (use TanStack Query instead)
- Store server data in Zustand (use TanStack Query cache)
- Forget to handle error states
- Use magic strings for query keys

### Mutation Hooks

✅ **DO:**
- Invalidate related queries after mutations
- Show success/error toasts
- Use optimistic updates for better UX
- Handle rollback on error (with `onMutate` + `onError`)
- Disable buttons during mutations

❌ **DON'T:**
- Forget to invalidate queries after mutations
- Mutate query cache manually without using mutations
- Leave forms enabled during submission
- Ignore mutation errors

### State Management

✅ **DO:**
- Keep server state in TanStack Query
- Keep UI state in Zustand
- Use TypeScript for all stores
- Enable Zustand devtools in development
- Keep stores focused (single responsibility)

❌ **DON'T:**
- Store API data in Zustand
- Create one giant store for everything
- Use global state for component-local state
- Forget to memoize selectors in Zustand

### Loading States

✅ **DO:**
- Show skeleton loaders for content areas
- Show spinners in buttons during submission
- Disable interactive elements during loading
- Provide feedback for long-running operations
- Use optimistic updates when appropriate

❌ **DON'T:**
- Leave users staring at blank screens
- Block the entire UI for partial loads
- Forget to disable buttons during submission
- Use generic "Loading..." everywhere

### Error Handling

✅ **DO:**
- Show specific error messages
- Provide retry functionality
- Log errors for debugging
- Handle network errors gracefully
- Show toast for global errors, inline for form errors

❌ **DON'T:**
- Show technical stack traces to users
- Ignore errors silently
- Use generic "Something went wrong" for everything
- Let errors crash the app

---

## Appendix: Dependencies

### Required npm Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-bootstrap": "^2.9.0",
    "bootstrap": "^5.3.0",
    "react-bootstrap-icons": "^1.10.0",
    "@tanstack/react-query": "^5.12.0",
    "@tanstack/react-query-devtools": "^5.12.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

### Bootstrap Version

Current application uses Bootstrap (version in wwwroot suggests Bootstrap 5.x). Continue using Bootstrap 5.x for consistency.

---

## Conclusion

This strategy provides a robust, scalable, and maintainable approach to state management and data fetching for the React migration of Contoso University. The combination of Zustand for client state and TanStack Query for server state provides an optimal balance of simplicity, performance, and developer experience.

**Key Benefits:**
- ✅ Minimal boilerplate compared to Redux
- ✅ Automatic caching and cache invalidation
- ✅ Optimistic updates for better UX
- ✅ Excellent TypeScript support
- ✅ Built-in loading and error states
- ✅ DevTools for debugging
- ✅ Consistent Bootstrap UI components
- ✅ Clear separation of concerns

**Next Steps:**
1. Review and approve this strategy with the team
2. Setup development environment with all dependencies
3. Begin Phase 1 implementation
4. Conduct code reviews for each phase
5. Update documentation as patterns evolve

---

**Document Status:** ✅ Complete  
**Next Review Date:** After Phase 1 completion  
**Related Documents:**
- Architecture-Overview.md
- API-&-Service-Contracts.md
- Technology-Inventory.md
- UI-&-Accessibility-Notes.md
