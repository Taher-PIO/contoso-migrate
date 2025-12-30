---
title: 'React + TypeScript + Bootstrap - Architecture & Project Structure'
last_updated: '2025-12-30'
owner: 'Frontend Architecture Team'
status: 'Proposed'
related_docs: 
  - '../../Architecture-Overview.md'
  - '../../Project-Overview.md'
  - '../../UI-&-Accessibility-Notes.md'
  - '../../ADR-Index.md'
---

# React + TypeScript + Bootstrap - Architecture & Project Structure

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Frontend Migration Engineering Team  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Architectural Decision: CSR vs SSR](#architectural-decision-csr-vs-ssr)
- [Proposed Project Structure](#proposed-project-structure)
- [Directory Layout Rationale](#directory-layout-rationale)
- [Routing Strategy](#routing-strategy)
- [Configuration Management](#configuration-management)
- [Code Quality & Standards](#code-quality--standards)
- [Import Management](#import-management)
- [Environment Configuration](#environment-configuration)
- [Build & Bundle Configuration](#build--bundle-configuration)
- [Migration Path from Razor Pages](#migration-path-from-razor-pages)
- [Deployment Considerations](#deployment-considerations)

---

## Executive Summary

This document outlines the proposed architecture and project structure for migrating Contoso University from ASP.NET Core 6.0 Razor Pages (server-side rendered MPA) to a modern **React + TypeScript + Bootstrap** single-page application (SPA).

### Key Decisions

**Rendering Strategy:** **Client-Side Rendering (CSR)**  
**Framework:** React 18+ with TypeScript 5+  
**UI Framework:** React-Bootstrap (React bindings for Bootstrap 5)  
**Routing:** React Router v6  
**State Management:** React Context API + React Query (TanStack Query)  
**Build Tool:** Vite  
**Package Manager:** npm (aligned with existing CI/CD)

### Goals

- ✅ **Maintainability:** Clear separation of concerns with feature-based architecture
- ✅ **Type Safety:** Full TypeScript coverage with strict mode enabled
- ✅ **Developer Experience:** Fast HMR, absolute imports, auto-formatting
- ✅ **Code Quality:** Automated linting, formatting, and pre-commit hooks
- ✅ **Scalability:** Structure that supports growth from 10 to 100+ components
- ✅ **Accessibility:** WCAG 2.1 Level AA compliance through semantic React-Bootstrap components

---

## Architectural Decision: CSR vs SSR

### Decision: Client-Side Rendering (CSR)

**Rationale:**

1. **Current State Analysis:**
   - Existing application is server-rendered ASP.NET Core Razor Pages
   - No SEO requirements (internal university management system - authenticated users only)
   - No public-facing content requiring search engine indexing
   - Performance baseline: 200ms server response time for 95th percentile (adequate)

2. **Application Characteristics:**
   - **User Profile:** Authenticated faculty, staff, and students (not public)
   - **Network Profile:** Campus network (reliable, low-latency)
   - **Interaction Model:** High interactivity (CRUD operations, forms, pagination)
   - **Data Freshness:** Real-time updates important for enrollment management

3. **CSR Advantages for This Use Case:**
   - ✅ **Rich Interactivity:** Instant UI updates, optimistic rendering, smooth transitions
   - ✅ **API Reuse:** Backend becomes pure REST API (enables future mobile apps)
   - ✅ **Developer Velocity:** Modern React ecosystem, component libraries, tooling
   - ✅ **State Management:** Client-side caching reduces server load
   - ✅ **Deployment Simplicity:** Static assets to CDN + API server separation
   - ✅ **Cost Efficiency:** Lower server compute requirements (static hosting)

4. **CSR Trade-offs (Acceptable for This Use Case):**
   - ⚠️ **Initial Load Time:** ~2-3 seconds for bundle download (mitigated by code splitting)
   - ⚠️ **SEO Impact:** Not applicable (no public search requirements)
   - ⚠️ **JavaScript Dependency:** Progressive enhancement not required (authenticated app)

### Alternative Considered: Server-Side Rendering (SSR)

**SSR with Next.js or Remix was considered but rejected:**

- ❌ **Complexity:** SSR adds server-side rendering infrastructure (Node.js server, hydration complexity)
- ❌ **Deployment:** Requires always-on Node.js server (vs. static CDN for CSR)
- ❌ **Cost:** Higher infrastructure costs (compute + memory for SSR)
- ❌ **Team Expertise:** Team familiar with .NET backend, not Node.js server operations
- ❌ **Minimal Benefit:** No SEO requirements, authenticated users tolerate initial load

**Decision Status:** ✅ **Accepted** - CSR with React SPA  
**ADR Reference:** ADR-021 (Frontend Architecture - React CSR)

---
## Proposed Project Structure

### Complete Directory Tree

```
contoso-university-web/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Build, lint, test on PR
│       └── deploy.yml                # Deploy to Azure Static Web Apps
├── .vscode/
│   ├── settings.json                 # Workspace settings (format on save)
│   ├── extensions.json               # Recommended extensions
│   └── launch.json                   # Debug configurations
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── index.html                    # Entry HTML
├── src/
│   ├── features/                     # Feature modules (domain-driven)
│   │   ├── students/
│   │   │   ├── components/
│   │   │   │   ├── StudentList.tsx
│   │   │   │   ├── StudentDetail.tsx
│   │   │   │   ├── StudentForm.tsx
│   │   │   │   └── StudentSearch.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useStudents.ts
│   │   │   │   ├── useStudentById.ts
│   │   │   │   └── useCreateStudent.ts
│   │   │   ├── services/
│   │   │   │   └── studentApi.ts
│   │   │   ├── types/
│   │   │   │   └── student.types.ts
│   │   │   └── index.ts              # Public API
│   │   ├── courses/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── instructors/
│   │   │   └── ...                   # Same structure
│   │   ├── departments/
│   │   │   └── ...
│   │   ├── enrollments/
│   │   │   └── ...
│   │   └── auth/                     # Authentication feature
│   │       ├── components/
│   │       │   ├── LoginForm.tsx
│   │       │   └── ProtectedRoute.tsx
│   │       ├── hooks/
│   │       │   └── useAuth.ts
│   │       ├── contexts/
│   │       │   └── AuthContext.tsx
│   │       └── types/
│   │           └── auth.types.ts
│   ├── shared/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── forms/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   └── FormGroup.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── Alert.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   ├── data-display/
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Badge.tsx
│   │   │   └── navigation/
│   │   │       ├── Breadcrumb.tsx
│   │   │       └── Tabs.tsx
│   │   ├── hooks/                    # Shared custom hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── usePagination.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useQueryParams.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── api.ts                # Axios instance & interceptors
│   │   │   ├── validation.ts         # Validation helpers
│   │   │   ├── formatting.ts         # Date, number formatters
│   │   │   ├── constants.ts          # App-wide constants
│   │   │   └── errors.ts             # Error handling utilities
│   │   ├── types/                    # Shared TypeScript types
│   │   │   ├── api.types.ts          # API response structures
│   │   │   ├── common.types.ts       # Generic utility types
│   │   │   └── pagination.types.ts
│   │   └── styles/                   # Global styles
│   │       ├── variables.scss        # Bootstrap variable overrides
│   │       ├── mixins.scss           # Custom Sass mixins
│   │       └── global.scss           # Global CSS
│   ├── pages/                        # Route-level components
│   │   ├── Home.tsx
│   │   ├── NotFound.tsx
│   │   ├── Unauthorized.tsx
│   │   └── ServerError.tsx
│   ├── router/
│   │   ├── AppRouter.tsx             # Router configuration
│   │   ├── routes.tsx                # Route definitions
│   │   └── guards.tsx                # Route guards
│   ├── config/
│   │   ├── env.ts                    # Environment variable access
│   │   └── queryClient.ts            # React Query configuration
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Application entry point
│   └── vite-env.d.ts                 # Vite type definitions
├── tests/
│   ├── setup.ts                      # Test setup & global mocks
│   ├── unit/                         # Unit tests (co-located preferred)
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests (Playwright)
├── .env.development                  # Dev environment variables
├── .env.production                   # Prod environment variables (template)
├── .env.example                      # Example environment file
├── .eslintrc.cjs                     # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── .gitignore
├── index.html                        # Vite entry HTML
├── package.json
├── tsconfig.json                     # TypeScript root config
├── tsconfig.app.json                 # App-specific TS config
├── tsconfig.node.json                # Node-specific TS config
├── vite.config.ts                    # Vite configuration
└── README.md
```

---

## Directory Layout Rationale

### 1. Feature-Based Architecture (`src/features/`)

**Principle:** Organize by business domain, not technical layer.

**Benefits:**
- ✅ **Cohesion:** Related code lives together (components, hooks, services, types)
- ✅ **Scalability:** Add new features without touching existing code
- ✅ **Team Velocity:** Multiple developers can work on different features independently
- ✅ **Discoverability:** Easy to find student-related code in `features/students/`
- ✅ **Ownership:** Clear boundaries for code reviews and testing

**Example: Students Feature**

```typescript
// src/features/students/index.ts (Public API)
export { StudentList, StudentDetail, StudentForm } from './components';
export { useStudents, useStudentById } from './hooks';
export type { Student, CreateStudentDto } from './types';
```

**Usage from other features:**
```typescript
// src/features/enrollments/components/EnrollmentForm.tsx
import { useStudents, Student } from '@/features/students';
```

### 2. Shared Components (`src/shared/components/`)

**Categorized by Purpose:**

| Category | Purpose | Examples |
|----------|---------|----------|
| **layout/** | Page structure | Header, Footer, Sidebar, MainLayout |
| **forms/** | Form controls | Input, Select, DatePicker, validation |
| **feedback/** | User notifications | Alert, Toast, LoadingSpinner, ErrorBoundary |
| **data-display/** | Data presentation | Table, Pagination, Card, Badge |
| **navigation/** | Navigation UI | Breadcrumb, Tabs, NavBar |

**Design Principle:** Build on React-Bootstrap, add custom wrappers for consistency.

```typescript
// src/shared/components/forms/Input.tsx
import { Form } from 'react-bootstrap';
import { Controller, Control, FieldError } from 'react-hook-form';

interface InputProps {
  name: string;
  label: string;
  control: Control<any>;
  error?: FieldError;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  name, label, control, error, type = 'text', placeholder, required 
}) => (
  <Form.Group className="mb-3">
    <Form.Label>
      {label} {required && <span className="text-danger">*</span>}
    </Form.Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Form.Control
          {...field}
          type={type}
          placeholder={placeholder}
          isInvalid={!!error}
        />
      )}
    />
    {error && <Form.Control.Feedback type="invalid">{error.message}</Form.Control.Feedback>}
  </Form.Group>
);
```

### 3. Shared Hooks (`src/shared/hooks/`)

**Purpose:** Reusable React hooks for cross-cutting concerns.

```typescript
// src/shared/hooks/usePagination.ts
import { useQueryParams } from './useQueryParams';

export const usePagination = (defaultPageSize = 10) => {
  const { queryParams, setQueryParam } = useQueryParams();
  
  const currentPage = parseInt(queryParams.get('page') || '1', 10);
  const pageSize = parseInt(queryParams.get('pageSize') || String(defaultPageSize), 10);

  const setPage = (page: number) => setQueryParam('page', String(page));
  const setPageSize = (size: number) => {
    setQueryParam('pageSize', String(size));
    setQueryParam('page', '1'); // Reset to first page
  };

  return { currentPage, pageSize, setPage, setPageSize };
};
```

### 4. Router Configuration (`src/router/`)

**Centralized Route Definitions:**

```typescript
// src/router/routes.tsx
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth';
import { MainLayout } from '@/shared/components/layout';

// Lazy-loaded route components for code splitting
const Home = lazy(() => import('@/pages/Home'));
const StudentList = lazy(() => import('@/features/students').then(m => ({ default: m.StudentList })));
const StudentDetail = lazy(() => import('@/features/students').then(m => ({ default: m.StudentDetail })));
const StudentCreate = lazy(() => import('@/features/students').then(m => ({ default: m.StudentForm })));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'students',
        element: <ProtectedRoute requiredRole="Faculty" />,
        children: [
          { index: true, element: <StudentList /> },
          { path: 'create', element: <StudentCreate /> },
          { path: ':id', element: <StudentDetail /> },
          { path: ':id/edit', element: <StudentCreate /> }, // Reuse form component
        ],
      },
      // ... other routes
    ],
  },
  { path: '*', element: <NotFound /> },
];
```

### 5. Configuration Management (`src/config/`)

**Centralized Configuration:**

```typescript
// src/config/env.ts
interface EnvConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  enableMocks: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  version: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
  apiTimeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000'), 10),
  enableMocks: getEnvVar('VITE_ENABLE_MOCKS', 'false') === 'true',
  logLevel: (getEnvVar('VITE_LOG_LEVEL', 'info') as EnvConfig['logLevel']),
  version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
};
```

---

## Routing Strategy

### React Router v6 - Declarative Routing

**Key Features:**
- ✅ Nested routes with `<Outlet />` for layout composition
- ✅ Lazy loading for code splitting
- ✅ Route guards for authentication/authorization
- ✅ URL-based state management (query params for pagination, filtering)

### Route Structure

```
/                                 → Home page
/students                         → Student list (paginated, searchable)
/students/create                  → Create new student
/students/:id                     → Student detail view
/students/:id/edit                → Edit student
/students/:id/enrollments         → Student enrollments
/courses                          → Course list
/courses/:id                      → Course detail
/courses/:id/edit                 → Edit course
/instructors                      → Instructor list
/instructors/:id                  → Instructor detail
/departments                      → Department list
/departments/:id                  → Department detail
/login                            → Login page (if not using external auth)
/unauthorized                     → 403 page
/not-found                        → 404 page
```

### Protected Routes Example

```typescript
// src/features/auth/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '@/shared/components/feedback';

interface ProtectedRouteProps {
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

## Configuration Management

### ESLint Configuration

**File:** `.eslintrc.cjs`

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended', // Accessibility linting
    'prettier', // Must be last to override conflicting rules
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['react-refresh', 'jsx-a11y'],
  rules: {
    // React Refresh for HMR
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    
    // React best practices
    'react/prop-types': 'off', // Using TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    
    // Accessibility
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/no-autofocus': 'warn',
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### Prettier Configuration

**File:** `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "quoteProps": "as-needed"
}
```

### TypeScript Configuration

**File:** `tsconfig.json` (Root)

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**File:** `tsconfig.app.json` (Application)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "allowSyntheticDefaultImports": true,

    /* Path Mapping (Absolute Imports) */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/router/*": ["./src/router/*"],
      "@/config/*": ["./src/config/*"]
    }
  },
  "include": ["src"]
}
```

**File:** `tsconfig.node.json` (Build Tools)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

---

## Code Quality & Standards

### Pre-commit Hooks (Husky + lint-staged)

**File:** `package.json` (excerpt)

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,scss,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,scss,md}\"",
    "type-check": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
npx lint-staged
```

### VS Code Workspace Settings

**File:** `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

**File:** `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---
## Import Management

### Absolute Imports with Path Aliases

**Benefits:**
- ✅ No relative path hell (`../../../../shared/components`)
- ✅ Refactoring-friendly (move files without fixing imports)
- ✅ Clear intent (`@/features/students` vs `../../students`)

### Path Alias Configuration

**Vite Configuration:** (see `vite.config.ts` below)

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
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/router': path.resolve(__dirname, './src/router'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // ASP.NET Core API
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### Import Examples

**Before (Relative Imports):**
```typescript
import { Button } from '../../../shared/components/forms/Button';
import { useStudents } from '../../students/hooks/useStudents';
import { Student } from '../../students/types/student.types';
```

**After (Absolute Imports):**
```typescript
import { Button } from '@/shared/components/forms/Button';
import { useStudents } from '@/features/students/hooks/useStudents';
import type { Student } from '@/features/students/types/student.types';
```

### Feature Module Public API (Barrel Exports)

**File:** `src/features/students/index.ts`

```typescript
// Components
export { StudentList } from './components/StudentList';
export { StudentDetail } from './components/StudentDetail';
export { StudentForm } from './components/StudentForm';
export { StudentSearch } from './components/StudentSearch';

// Hooks
export { useStudents } from './hooks/useStudents';
export { useStudentById } from './hooks/useStudentById';
export { useCreateStudent } from './hooks/useCreateStudent';
export { useUpdateStudent } from './hooks/useUpdateStudent';
export { useDeleteStudent } from './hooks/useDeleteStudent';

// Types
export type { 
  Student, 
  CreateStudentDto, 
  UpdateStudentDto,
  StudentListResponse 
} from './types/student.types';

// Services (internal, not exported by default)
// Import as: import { studentApi } from '@/features/students/services/studentApi'
```

**Usage:**
```typescript
// Clean imports from feature modules
import { StudentList, useStudents, type Student } from '@/features/students';
```

---

## Environment Configuration

### Environment Files

**Development:** `.env.development`
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_MOCKS=false
VITE_ENABLE_DEBUG=true

# Logging
VITE_LOG_LEVEL=debug

# Application
VITE_APP_VERSION=1.0.0-dev
VITE_APP_NAME=Contoso University
```

**Production:** `.env.production` (template)
```bash
# API Configuration
VITE_API_BASE_URL=https://api.contoso.edu/api
VITE_API_TIMEOUT=15000

# Feature Flags
VITE_ENABLE_MOCKS=false
VITE_ENABLE_DEBUG=false

# Logging
VITE_LOG_LEVEL=error

# Application
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Contoso University
```

**Example File:** `.env.example`
```bash
# Copy this file to .env.development and fill in the values

# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_MOCKS=false
VITE_ENABLE_DEBUG=true

# Logging (debug | info | warn | error)
VITE_LOG_LEVEL=debug

# Application
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Contoso University
```

### Environment Variable Access

**File:** `src/config/env.ts`

```typescript
interface EnvConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  enableMocks: boolean;
  enableDebug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  version: string;
  appName: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseBoolean = (value: string): boolean => {
  return value === 'true' || value === '1';
};

export const env: EnvConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
  apiTimeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000'), 10),
  enableMocks: parseBoolean(getEnvVar('VITE_ENABLE_MOCKS', 'false')),
  enableDebug: parseBoolean(getEnvVar('VITE_ENABLE_DEBUG', 'false')),
  logLevel: getEnvVar('VITE_LOG_LEVEL', 'info') as EnvConfig['logLevel'],
  version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  appName: getEnvVar('VITE_APP_NAME', 'Contoso University'),
};

// Type-safe environment access
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
```

**Usage:**
```typescript
import { env, isDevelopment } from '@/config/env';

console.log(`API URL: ${env.apiBaseUrl}`);
console.log(`App Version: ${env.version}`);

if (isDevelopment) {
  console.log('Running in development mode');
}
```

---

## Build & Bundle Configuration

### Vite Configuration

**File:** `vite.config.ts`

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Enable Fast Refresh
        fastRefresh: true,
        // Babel plugins for React
        babel: {
          plugins: [
            // Add any Babel plugins here if needed
          ],
        },
      }),
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/router': path.resolve(__dirname, './src/router'),
        '@/config': path.resolve(__dirname, './src/config'),
      },
    },
    
    server: {
      port: 3000,
      open: true,
      proxy: {
        // Proxy API requests to ASP.NET Core backend
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor splitting for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'bootstrap-vendor': ['react-bootstrap', 'bootstrap'],
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // KB
    },
    
    preview: {
      port: 3000,
      open: true,
    },
  };
});
```

### Package.json Scripts

```json
{
  "name": "contoso-university-web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:dev": "tsc && vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,scss,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,scss,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky install"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.21.0",
    "react-bootstrap": "^2.9.2",
    "bootstrap": "^5.3.2",
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-query-devtools": "^5.17.0",
    "axios": "^1.6.5",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "date-fns": "^3.0.6",
    "react-icons": "^5.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/user-event": "^14.5.2",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "sass": "^1.69.7"
  }
}
```

---
## Migration Path from Razor Pages

### Phase 1: Dual Architecture (Parallel Run)

**Week 1-2: Setup & Foundation**
1. Create new React project in `/contoso-university-web/` directory
2. Set up CI/CD pipeline for React build
3. Configure API proxy to existing ASP.NET Core backend
4. Deploy React app to separate Azure Static Web App subdomain (e.g., `app.contoso.edu`)

**Week 3-4: Feature Migration (Students Module)**
1. Extract student-related API endpoints to RESTful API controller
2. Build Students feature module in React (list, detail, create, edit)
3. Test in isolation with ASP.NET Core API
4. Deploy to staging for UAT

### Phase 2: Progressive Feature Migration

**Week 5-12: Remaining Modules**
- Courses module (Week 5-6)
- Instructors module (Week 7-8)
- Departments module (Week 9-10)
- Enrollments module (Week 11-12)

**Each module follows:**
1. Backend: Extract Razor Page logic → REST API endpoint
2. Frontend: Build React feature module
3. Testing: Unit + Integration + E2E
4. Deployment: Staging → UAT → Production

### Phase 3: Cutover & Decommission

**Week 13-14: Production Cutover**
1. Switch DNS/routing from Razor Pages to React SPA
2. Monitor performance and errors (Application Insights)
3. Hypercare support (2 weeks)
4. Decommission Razor Pages (keep API only)

---

## Deployment Considerations

### Azure Static Web Apps

**Hosting Strategy:**
- **Frontend (React SPA):** Azure Static Web Apps
  - Global CDN distribution
  - Automatic SSL certificates
  - Branch-based staging environments
  - Zero-downtime deployments

- **Backend (ASP.NET Core API):** Azure App Service (existing)
  - Keep current API hosting
  - Add CORS configuration for React app domain
  - Enable Application Insights

### CI/CD Pipeline

**GitHub Actions Workflow:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: "dist"
```

### Environment-Specific Builds

**Development:**
- Local development: `npm run dev` (Vite dev server with HMR)
- Backend API: `http://localhost:5000`

**Staging:**
- Build: `npm run build:dev`
- API: `https://staging-api.contoso.edu`
- URL: `https://staging.contoso.edu`

**Production:**
- Build: `npm run build`
- API: `https://api.contoso.edu`
- URL: `https://app.contoso.edu`

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **First Contentful Paint (FCP)** | <1.5s | CDN + code splitting |
| **Largest Contentful Paint (LCP)** | <2.5s | Lazy loading + image optimization |
| **Time to Interactive (TTI)** | <3.5s | Bundle size < 200KB (gzipped) |
| **Cumulative Layout Shift (CLS)** | <0.1 | Reserved space for dynamic content |
| **Bundle Size** | <500KB (uncompressed) | Code splitting per route |

### CORS Configuration (Backend)

**File:** `Program.cs` (ASP.NET Core)

```csharp
// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",           // Development
            "https://staging.contoso.edu",     // Staging
            "https://app.contoso.edu"          // Production
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// In Configure section
app.UseCors("ReactApp");
```

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Rendering Strategy** | CSR (Client-Side Rendering) | No SEO requirements; authenticated app; rich interactivity |
| **Framework** | React 18 + TypeScript 5 | Mature ecosystem; strong typing; component reusability |
| **UI Library** | React-Bootstrap | Maintains Bootstrap familiarity; accessibility built-in |
| **Routing** | React Router v6 | Declarative routing; nested routes; lazy loading |
| **State Management** | React Query + Context API | Server state caching; optimistic updates; simple global state |
| **Build Tool** | Vite | Fast HMR; modern bundling; great DX |
| **Package Manager** | npm | Aligns with existing CI/CD; team familiarity |
| **Code Quality** | ESLint + Prettier + Husky | Automated formatting; pre-commit hooks; consistent style |
| **Testing** | Vitest + Testing Library + Playwright | Fast unit tests; React-focused; E2E coverage |
| **Deployment** | Azure Static Web Apps | CDN; SSL; branch previews; cost-effective |

---

## Next Steps

1. **Approval:** Review and approve this architecture document (Product Owner + Tech Lead)
2. **Scaffolding:** Create project structure using `npm create vite@latest` + React + TypeScript template
3. **Configuration:** Set up ESLint, Prettier, TypeScript, and path aliases
4. **First Feature:** Build Students module as proof-of-concept
5. **API Alignment:** Refactor ASP.NET Core to expose RESTful API endpoints
6. **CI/CD:** Set up GitHub Actions for automated builds and deployments
7. **Team Training:** Conduct React + TypeScript training sessions

---

## Related Documents

- [02-Component-Library-Guide.md](./02-Component-Library-Guide.md) *(To be created)*
- [03-State-Management-Strategy.md](./03-State-Management-Strategy.md) *(To be created)*
- [04-API-Integration-Patterns.md](./04-API-Integration-Patterns.md) *(To be created)*
- [05-Testing-Strategy.md](./05-Testing-Strategy.md) *(To be created)*
- [../../Architecture-Overview.md](../../Architecture-Overview.md)
- [../../ADR-Index.md](../../ADR-Index.md)

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Frontend Migration Team | Initial architecture proposal |

---

**Status:** ✅ Ready for Review  
**Approvers:** Product Owner, Tech Lead, Senior Frontend Engineer  
**Target Approval Date:** 2026-01-06
