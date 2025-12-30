# Component & Route Mapping

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Migration Target:** React + TypeScript + Bootstrap  
**Source Application:** Contoso University (ASP.NET Core Razor Pages)

---

## Table of Contents

- [Overview](#overview)
- [Route Mapping Strategy](#route-mapping-strategy)
- [Component Hierarchy](#component-hierarchy)
- [Legacy View to React Component Mapping](#legacy-view-to-react-component-mapping)
- [Bootstrap Primitives Inventory](#bootstrap-primitives-inventory)
- [Migration Phases](#migration-phases)
- [Shared Components Library](#shared-components-library)

---

## Overview

This document maps each legacy ASP.NET Core Razor Page to its corresponding React route and component tree. It identifies reusable Bootstrap primitives and establishes a phased migration plan.

**Migration Approach:** Single Page Application (SPA) using React Router v6+ with TypeScript

**Key Principles:**
- Maintain URL structure parity where possible for SEO and user familiarity
- Create reusable component library leveraging Bootstrap 5
- Implement TypeScript interfaces matching backend DTOs
- Use React Router for client-side routing
- Separate presentation components from container (smart) components

---

## Route Mapping Strategy

### Routing Conversion Pattern

**Legacy Razor Pages Pattern:**
```
/Pages/{Entity}/{Action}.cshtml → /{entity}/{action}[/{id}]
```

**React Router Pattern:**
```tsx
/{entity}          → List/Index view
/{entity}/create   → Create form
/{entity}/:id      → Details view
/{entity}/:id/edit → Edit form
/{entity}/:id/delete → Delete confirmation
```

### Route Parameters
- `:id` - Entity identifier (numeric)
- `?page=N` - Pagination query parameter
- `?sort=field` - Sort order query parameter
- `?search=term` - Search filter query parameter

---

## Component Hierarchy

```
App (Root)
├── Layout
│   ├── Header
│   │   └── Navbar (Bootstrap)
│   ├── Main (Container)
│   │   └── [Route Components]
│   └── Footer
├── Routes
│   ├── Home (Dashboard)
│   ├── About (Statistics)
│   ├── Students/*
│   ├── Courses/*
│   ├── Instructors/*
│   ├── Departments/*
│   ├── Privacy
│   └── Error
└── Shared Components
    ├── DataTable
    ├── Pagination
    ├── SearchBar
    ├── Form Components
    ├── Modal
    └── ConfirmDialog
```

---

## Legacy View to React Component Mapping

### Core Application Pages

| Legacy View | React Route | Component(s) | Bootstrap Primitives | Phase |
|-------------|-------------|--------------|---------------------|-------|
| **Layout** |
| `Shared/_Layout.cshtml` | `/` (Layout wrapper) | `AppLayout`<br/>`Navbar`<br/>`Footer` | `navbar`, `navbar-expand-sm`, `navbar-light`, `bg-white`, `container`, `nav-item`, `nav-link` | Phase 1 |
| **Home & Info** |
| `Index.cshtml` | `/` | `HomePage`<br/>`DashboardCard` | `row`, `col-md-4`, `card`, `card-text`, `border`, `mb-4` | Phase 1 |
| `About.cshtml` | `/about` | `AboutPage`<br/>`StatisticsTable` | `table`, `thead`, `tbody`, `tr`, `th`, `td` | Phase 1 |
| `Privacy.cshtml` | `/privacy` | `PrivacyPage` | `container`, typography classes | Phase 1 |
| `Error.cshtml` | `/error` | `ErrorPage` | `text-danger`, `container`, typography classes | Phase 1 |
| **Students** |
| `Students/Index.cshtml` | `/students` | `StudentsPage`<br/>`StudentList`<br/>`SearchBar`<br/>`Pagination` | `table`, `thead`, `tbody`, `form-control`, `btn`, `btn-primary` | Phase 2 |
| `Students/Create.cshtml` | `/students/create` | `StudentCreatePage`<br/>`StudentForm` | `form-group`, `form-control`, `control-label`, `text-danger`, `btn-primary`, `row`, `col-md-4` | Phase 2 |
| `Students/Edit.cshtml` | `/students/:id/edit` | `StudentEditPage`<br/>`StudentForm` | `form-group`, `form-control`, `control-label`, `text-danger`, `btn-primary`, `row`, `col-md-4` | Phase 2 |
| `Students/Details.cshtml` | `/students/:id` | `StudentDetailsPage`<br/>`DetailsList`<br/>`EnrollmentTable` | `row`, `col-sm-2`, `col-sm-10`, `table`, `dl`, `dt`, `dd` | Phase 2 |
| `Students/Delete.cshtml` | `/students/:id/delete` | `StudentDeletePage`<br/>`ConfirmDialog` | `row`, `col-sm-2`, `col-sm-10`, `btn-danger`, `dl`, `dt`, `dd` | Phase 2 |
| **Courses** |
| `Courses/Index.cshtml` | `/courses` | `CoursesPage`<br/>`CourseList` | `table`, `thead`, `tbody`, `btn`, `btn-primary` | Phase 2 |
| `Courses/Create.cshtml` | `/courses/create` | `CourseCreatePage`<br/>`CourseForm` | `form-group`, `form-control`, `control-label`, `text-danger`, `btn-primary`, `row`, `col-md-4` | Phase 2 |
| `Courses/Edit.cshtml` | `/courses/:id/edit` | `CourseEditPage`<br/>`CourseForm` | `form-group`, `form-control`, `control-label`, `text-danger`, `btn-primary`, `row`, `col-md-4` | Phase 2 |
| `Courses/Details.cshtml` | `/courses/:id` | `CourseDetailsPage`<br/>`DetailsList` | `row`, `col-sm-2`, `col-sm-10`, `dl`, `dt`, `dd` | Phase 2 |
| `Courses/Delete.cshtml` | `/courses/:id/delete` | `CourseDeletePage`<br/>`ConfirmDialog` | `row`, `col-sm-2`, `col-sm-10`, `btn-danger`, `dl`, `dt`, `dd` | Phase 2 |
| **Instructors** |
| `Instructors/Index.cshtml` | `/instructors[/:id]` | `InstructorsPage`<br/>`InstructorList`<br/>`CourseList`<br/>`EnrollmentList` | `table`, `table-success`, `thead`, `tbody`, row highlighting | Phase 3 |
| `Instructors/Create.cshtml` | `/instructors/create` | `InstructorCreatePage`<br/>`InstructorForm`<br/>`CourseCheckboxList` | `form-group`, `form-control`, `checkbox`, `table`, `btn-primary`, `row`, `col-md-4` | Phase 3 |
| `Instructors/Edit.cshtml` | `/instructors/:id/edit` | `InstructorEditPage`<br/>`InstructorForm`<br/>`CourseCheckboxList` | `form-group`, `form-control`, `checkbox`, `table`, `btn-primary`, `row`, `col-md-4` | Phase 3 |
| `Instructors/Details.cshtml` | `/instructors/:id` | `InstructorDetailsPage`<br/>`DetailsList` | `row`, `col-sm-2`, `col-sm-10`, `table`, `dl`, `dt`, `dd` | Phase 3 |
| `Instructors/Delete.cshtml` | `/instructors/:id/delete` | `InstructorDeletePage`<br/>`ConfirmDialog` | `row`, `col-sm-2`, `col-sm-10`, `btn-danger`, `dl`, `dt`, `dd` | Phase 3 |
| **Departments** |
| `Departments/Index.cshtml` | `/departments` | `DepartmentsPage`<br/>`DepartmentList` | `table`, `thead`, `tbody`, `btn`, `btn-primary` | Phase 3 |
| `Departments/Create.cshtml` | `/departments/create` | `DepartmentCreatePage`<br/>`DepartmentForm` | `form-group`, `form-control`, `control-label`, `text-danger`, `btn-primary`, `row`, `col-md-4` | Phase 3 |
| `Departments/Edit.cshtml` | `/departments/:id/edit` | `DepartmentEditPage`<br/>`DepartmentForm` | `form-group`, `form-control`, `control-label`, `text-danger`, `btn-primary`, `row`, `col-md-4` | Phase 3 |
| `Departments/Details.cshtml` | `/departments/:id` | `DepartmentDetailsPage`<br/>`DetailsList` | `row`, `col-sm-2`, `col-sm-10`, `dl`, `dt`, `dd` | Phase 3 |
| `Departments/Delete.cshtml` | `/departments/:id/delete` | `DepartmentDeletePage`<br/>`ConfirmDialog` | `row`, `col-sm-2`, `col-sm-10`, `btn-danger`, `dl`, `dt`, `dd` | Phase 3 |

---

## Bootstrap Primitives Inventory

### Grid System
**Usage Pattern:** Responsive layout across all pages

```tsx
// Common patterns found in legacy views
<div className="container">
  <div className="row">
    <div className="col-md-4">...</div>
  </div>
</div>

// Description list pattern (Details views)
<dl className="row">
  <dt className="col-sm-2">Label</dt>
  <dd className="col-sm-10">Value</dd>
</dl>
```

**Components Using:**
- All Create/Edit forms (`.col-md-4`)
- Details pages (`.col-sm-2`, `.col-sm-10`)
- Home dashboard (`.col-md-4`)

---

### Typography
**Classes Identified:**
- `text-danger` - Validation errors
- `text-dark` - Navbar links
- `text-muted` - Footer text
- Headings: `h1`, `h2`, `h3`, `h4`

**Components Using:**
- Forms (validation messages)
- Navbar (link styling)
- All page headers

---

### Forms
**Form Components Pattern:**

```tsx
<div className="form-group">
  <label className="control-label">Field Name</label>
  <input type="text" className="form-control" />
  <span className="text-danger">Error message</span>
</div>
```

**Components Needed:**
- `FormGroup` - Wrapper component
- `FormControl` - Input wrapper
- `FormLabel` - Label component
- `FormSelect` - Select dropdown (Departments, Courses)
- `FormCheckbox` - Checkbox inputs (Instructor courses)
- `ValidationMessage` - Error display

**Pages Using:** All Create/Edit forms

---

### Tables
**Table Pattern:**

```tsx
<table className="table">
  <thead>
    <tr>
      <th>Column Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data Cell</td>
    </tr>
  </tbody>
</table>
```

**Enhanced Features:**
- `table-success` - Row highlighting (Instructors page)
- Sortable headers (Students, Instructors)
- Action links per row (Edit | Details | Delete)

**Components Needed:**
- `DataTable` - Base table component
- `TableHeader` - Sortable header component
- `TableRow` - Row component with conditional styling
- `ActionLinks` - Row action buttons

**Pages Using:** All Index pages, Details pages (nested tables)

---

### Buttons & Links
**Button Classes:**
- `btn btn-primary` - Primary actions (Submit, Search, Navigation)
- `btn btn-danger` - Delete actions
- `disabled` - Disabled state (pagination)

**Link Patterns:**
- Navigation links in tables
- "Back to List" links
- Sortable column headers

**Components Needed:**
- `Button` - Generic button component
- `Link` - React Router link wrapper

---

### Navbar
**Current Structure:**

```html
<nav className="navbar navbar-expand-sm navbar-toggleable-sm navbar-light bg-white border-bottom box-shadow mb-3">
  <div className="container">
    <a className="navbar-brand">Contoso University</a>
    <button className="navbar-toggler">...</button>
    <div className="navbar-collapse collapse">
      <ul className="navbar-nav flex-grow-1">
        <li className="nav-item">
          <a className="nav-link text-dark">Link</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
```

**Components Needed:**
- `Navbar` - Main navigation component
- `NavItem` - Navigation link item
- `NavToggler` - Mobile hamburger menu

---

### Pagination
**Current Pattern:**

```tsx
<a className="btn btn-primary disabled">Previous</a>
<a className="btn btn-primary">Next</a>
```

**Component Needed:**
- `Pagination` - Reusable pagination component with disabled states

**Pages Using:** Students Index (with search and sorting)

---

### Modals
**Usage:** Currently using form submissions for confirmations

**Future Enhancement:**
- `Modal` - Bootstrap modal wrapper
- `ConfirmDialog` - Confirmation dialog for delete actions

**Note:** Legacy app uses dedicated delete pages; consider migrating to modal dialogs for better UX

---

## Migration Phases

### Phase 1: Foundation & Layout (Week 1-2)
**Priority:** High  
**Dependencies:** None

**Components:**
- [ ] `AppLayout` with React Router outlet
- [ ] `Navbar` with active link highlighting
- [ ] `Footer`
- [ ] `HomePage` dashboard with cards
- [ ] `AboutPage` statistics table
- [ ] `PrivacyPage`
- [ ] `ErrorPage` / `NotFoundPage`

**Deliverables:**
- Application shell with navigation
- Basic routing structure
- Shared layout components

---

### Phase 2: Core Entities (Week 3-5)
**Priority:** High  
**Dependencies:** Phase 1

**Students Module:**
- [ ] `StudentsPage` with search, sort, pagination
- [ ] `StudentCreatePage` / `StudentEditPage` with form
- [ ] `StudentDetailsPage` with enrollment table
- [ ] `StudentDeletePage` with confirmation

**Courses Module:**
- [ ] `CoursesPage` with data table
- [ ] `CourseCreatePage` / `CourseEditPage` with form
- [ ] `CourseDetailsPage`
- [ ] `CourseDeletePage`

**Shared Components:**
- [ ] `DataTable` with sorting
- [ ] `Pagination` component
- [ ] `SearchBar` component
- [ ] `FormGroup`, `FormControl`, `FormLabel`
- [ ] `ValidationMessage`
- [ ] `ConfirmDialog`

**Deliverables:**
- Working CRUD for Students and Courses
- Reusable form and table components
- TypeScript interfaces for entities

---

### Phase 3: Complex Entities (Week 6-8)
**Priority:** Medium  
**Dependencies:** Phase 2

**Instructors Module:**
- [ ] `InstructorsPage` with master-detail view
- [ ] `InstructorCreatePage` / `InstructorEditPage` with course checkboxes
- [ ] `InstructorDetailsPage`
- [ ] `InstructorDeletePage`

**Departments Module:**
- [ ] `DepartmentsPage`
- [ ] `DepartmentCreatePage` / `DepartmentEditPage` with concurrency handling
- [ ] `DepartmentDetailsPage`
- [ ] `DepartmentDeletePage`

**Enhanced Components:**
- [ ] `CheckboxList` for course assignments
- [ ] `MasterDetailView` for instructor courses
- [ ] Row highlighting in tables
- [ ] Concurrency token handling

**Deliverables:**
- Complete CRUD for all entities
- Advanced interaction patterns
- Optimistic concurrency support

---

## Shared Components Library

### Proposed Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Link.tsx
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── Modal.tsx
│   ├── forms/
│   │   ├── FormGroup.tsx
│   │   ├── FormControl.tsx
│   │   ├── FormLabel.tsx
│   │   ├── FormSelect.tsx
│   │   ├── FormCheckbox.tsx
│   │   ├── CheckboxList.tsx
│   │   └── ValidationMessage.tsx
│   └── details/
│       ├── DetailsList.tsx
│       └── DetailsField.tsx
├── pages/
│   ├── Home/
│   ├── About/
│   ├── Students/
│   ├── Courses/
│   ├── Instructors/
│   └── Departments/
├── types/
│   ├── Student.ts
│   ├── Course.ts
│   ├── Instructor.ts
│   └── Department.ts
└── hooks/
    ├── usePagination.ts
    ├── useSort.ts
    ├── useSearch.ts
    └── useFormValidation.ts
```

---

## TypeScript Interfaces

### Entity Types (Sample)

```typescript
// types/Student.ts
export interface Student {
  id: number;
  lastName: string;
  firstMidName: string;
  enrollmentDate: string; // ISO date string
  enrollments?: Enrollment[];
}

// types/Course.ts
export interface Course {
  courseID: number;
  title: string;
  credits: number;
  departmentID: number;
  department?: Department;
}

// types/Instructor.ts
export interface Instructor {
  id: number;
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeAssignment?: OfficeAssignment;
  courses?: Course[];
}

// types/Department.ts
export interface Department {
  departmentID: number;
  name: string;
  budget: number;
  startDate: string;
  instructorID?: number;
  administrator?: Instructor;
  concurrencyToken: string;
}
```

---

## Bootstrap Integration Strategy

### Installation

```bash
npm install bootstrap@5.x react-bootstrap
npm install --save-dev @types/bootstrap
```

### Import Strategy

**Option 1: Global Import (Recommended)**
```typescript
// src/index.tsx or App.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
```

**Option 2: Component-level (Performance)**
```typescript
// Import only needed Bootstrap JS modules
import { Collapse } from 'bootstrap';
```

### Custom Bootstrap Variables
Create `src/styles/custom-bootstrap.scss`:

```scss
// Override Bootstrap variables
$primary: #0d6efd;
$danger: #dc3545;

@import '~bootstrap/scss/bootstrap';
```

---

## Navigation & Routing

### React Router Configuration

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          
          <Route path="students">
            <Route index element={<StudentsPage />} />
            <Route path="create" element={<StudentCreatePage />} />
            <Route path=":id" element={<StudentDetailsPage />} />
            <Route path=":id/edit" element={<StudentEditPage />} />
            <Route path=":id/delete" element={<StudentDeletePage />} />
          </Route>
          
          {/* Similar patterns for courses, instructors, departments */}
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Next Steps

1. **Review and Approval:** Validate route mappings with stakeholders
2. **API Design:** Define REST endpoints matching component needs (see API-&-Service-Contracts.md)
3. **Component Library Setup:** Initialize React project with TypeScript and Bootstrap
4. **Phase 1 Implementation:** Begin with layout and navigation components
5. **Testing Strategy:** Define component testing approach (see Test-Strategy-&-Coverage.md)

---

## References

- [React Router v6 Documentation](https://reactrouter.com/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [React Bootstrap Components](https://react-bootstrap.github.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- Contoso University Migration Docs: `/migration-docs/`
