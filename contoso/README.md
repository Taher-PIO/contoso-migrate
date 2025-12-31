# Contoso University - Full Stack Application

Modern reimplementation of ASP.NET Core's Contoso University using Node.js, TypeScript, React, and Drizzle ORM.

## 📚 Architecture

```
contoso/
├── src/                  # Backend API (Node.js + Express + TypeScript)
│   ├── controllers/      # Route handlers
│   ├── services/         # Business logic
│   ├── db/              # Drizzle ORM schema
│   └── routes/          # API routes
├── client/              # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── store/       # Redux Toolkit state
│   │   └── services/    # API client
└── data/                # SQLite database
```

## 🚀 Tech Stack

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express
- **ORM**: Drizzle ORM (migrated from Prisma)
- **Database**: SQLite (WAL mode, foreign keys enabled)
- **Testing**: Jest + Mocha + Chai

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Bootstrap 5 + React-Bootstrap
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library

## 🎯 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install
cd ..
```

Or use the helper script:

```bash
npm run install:client
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Default configuration:

```
DATABASE_URL="file:./data/contoso-university.sqlite"
PORT=5000
```

### 3. Initialize Database

```bash
# Push Drizzle schema to database
npm run db:push

# Seed with sample data (8 students, 5 instructors, 4 departments, 7 courses)
npm run db:seed
```

### 4. Start Development Servers

**Option A: Run both backend and frontend together (recommended)**

```bash
npm run dev:all
```

**Option B: Run separately**

```bash
# Terminal 1 - Backend (http://localhost:5000)
npm run dev

# Terminal 2 - Frontend (http://localhost:3000)
npm run dev:client
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Drizzle Studio**: `npm run db:studio` (database GUI)

## 📋 Available Scripts

### Backend

```bash
npm run dev              # Start backend dev server with nodemon
npm run build            # Build TypeScript to JavaScript
npm run start            # Run production build
npm test                 # Run backend tests
npm run db:generate      # Generate Drizzle migrations
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio GUI
npm run db:seed          # Seed database with sample data
```

### Frontend

```bash
npm run dev:client       # Start frontend dev server (Vite)
npm run build:client     # Build frontend for production
npm run test:client      # Run frontend tests
```

### Full Stack

```bash
npm run dev:all          # Run both backend and frontend concurrently
npm run install:client   # Install frontend dependencies
```

## 📡 API Endpoints

### Health

- `GET /api/health` - Health check with database status

### Students

- `GET /api/students` - List students (pagination, search, sort)
- `GET /api/students/:id` - Get student details with enrollments
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Courses

- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (requires manual CourseID)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Departments

- `GET /api/departments` - List departments
- `GET /api/departments/:id` - Get department details
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update (requires version for optimistic locking)
- `DELETE /api/departments/:id` - Delete department

## ✨ Key Features

### Student Module (Slice-1 - Complete)

✅ **List Page** - Pagination, search, and sorting

- Search by first name or last name (case-insensitive)
- Sort by name (A-Z, Z-A) or enrollment date (oldest/newest first)
- 10 students per page with navigation

✅ **Details Page** - View student with enrollments

- Student information display
- Related enrollments with course details and grades

✅ **Create Page** - Add new students

- Form validation (Yup client-side, Zod server-side)
- Date picker for enrollment date
- Success/error feedback

✅ **Edit Page** - Update student information

- Pre-populated form with current data
- Same validation as create
- Optimistic updates with Redux

✅ **Delete Page** - Confirm deletion

- Warning about foreign key constraints
- Error handling for students with enrollments
- Safe cancellation

### 1. Manual CourseID Assignment

Course.CourseID must be provided manually (no autoincrement):

```json
POST /api/courses
{
  "CourseID": 1050,
  "Title": "Chemistry",
  "Credits": 3,
  "DepartmentID": 1
}
```

### 2. Optimistic Locking (Departments)

Department updates require version field to prevent concurrent modification conflicts:

```json
PUT /api/departments/1
{
  "Name": "Engineering",
  "Budget": 150000,
  "version": 2
}
```

Returns 409 Conflict on version mismatch.

### 3. Foreign Key Constraints

Database enforces referential integrity:

- Cannot delete Department with Courses
- Cannot delete Student with Enrollments
- Cannot delete Course with Enrollments

Returns 409 Conflict with descriptive error message.

## 🧪 Testing

### Backend Tests

```bash
npm test                 # Run all backend tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

Test suites:

- ✅ StudentService (7 tests) - CRUD, pagination, search, sort
- ✅ CourseService (9 tests) - Manual CourseID, validation
- ✅ DepartmentService (7 tests) - Optimistic locking, concurrency

### Frontend Tests

```bash
npm run test:client      # Run frontend tests
```

## 📁 Project Structure

### Backend Structure

```
src/
├── index.ts                 # Express app entry point
├── config/
│   ├── database.ts         # Database connection (better-sqlite3)
│   └── drizzle.ts          # Drizzle config helper
├── db/
│   └── schema.ts           # Drizzle ORM schema (all entities)
├── controllers/
│   ├── studentController.ts
│   ├── courseController.ts
│   └── departmentController.ts
├── services/
│   ├── studentService.ts   # Business logic
│   ├── courseService.ts
│   └── departmentService.ts
├── routes/
│   ├── students.ts
│   ├── courses.ts
│   ├── departments.ts
│   └── health.ts
├── middleware/
│   └── errorHandler.ts
└── utils/
    └── errors.ts           # Custom error classes
```

### Frontend Structure

```
client/src/
├── main.tsx                # React entry point
├── App.tsx                 # Root component with routing
├── components/             # Reusable components
│   ├── Layout.tsx         # Main layout with navbar
│   ├── Pagination.tsx     # Pagination component
│   └── LoadingSpinner.tsx
├── pages/
│   ├── HomePage.tsx       # Landing page
│   └── students/          # Student module
│       ├── StudentListPage.tsx
│       ├── StudentDetailsPage.tsx
│       ├── StudentCreatePage.tsx
│       ├── StudentEditPage.tsx
│       └── StudentDeletePage.tsx
├── store/
│   ├── index.ts           # Redux store configuration
│   └── slices/
│       └── studentsSlice.ts  # Student state + thunks
├── services/
│   └── studentService.ts  # API client (axios)
├── types/
│   └── student.ts         # TypeScript interfaces
├── hooks/
│   └── redux.ts           # Typed Redux hooks
└── styles/
    └── main.css           # Global styles
```

## 🔧 Database Management

### Drizzle Commands

```bash
npm run db:generate      # Generate migration files
npm run db:push          # Push schema to database (dev)
npm run db:studio        # Open Drizzle Studio GUI
npm run db:seed          # Seed database
```

### Database Schema

- **Students**: ID, FirstMidName, LastName, EnrollmentDate
- **Instructors**: ID, FirstMidName, LastName, HireDate
- **Courses**: CourseID (manual), Title, Credits, DepartmentID
- **Departments**: DepartmentID, Name, Budget, StartDate, InstructorID, version
- **Enrollments**: EnrollmentID, CourseID, StudentID, Grade
- **OfficeAssignments**: InstructorID (PK), Location
- **CourseInstructor**: Many-to-many junction table

## 🎨 UI/UX Features

- **Bootstrap 5** - Responsive design, mobile-friendly
- **Dark navbar** - Professional appearance
- **Form validation** - Real-time feedback
- **Loading states** - Spinner during API calls
- **Error handling** - User-friendly error messages
- **Pagination** - Efficient data browsing
- **Search** - Case-insensitive filtering
- **Sort** - Multiple sort options

## 📝 Migration from .NET

This application migrates ASP.NET Core Razor Pages to React/Node.js while maintaining:

- ✅ Strict functional parity with legacy system
- ✅ Same data models and relationships
- ✅ Same validation rules
- ✅ Same business logic (optimistic locking, manual IDs)
- ✅ Same UI patterns (pagination, search, CRUD)

See [Docs/migration/Drizzle-Migration-Complete.md](../Docs/migration/Drizzle-Migration-Complete.md) for Prisma → Drizzle ORM migration details.

## 🚦 Development Workflow

1. **Backend changes**: Edit files in `src/`, tests run automatically
2. **Frontend changes**: Edit files in `client/src/`, hot reload in browser
3. **Schema changes**:
   - Update `src/db/schema.ts`
   - Run `npm run db:push`
   - Update TypeScript types
4. **API changes**:
   - Update service layer
   - Update controller
   - Update route
   - Update frontend service
   - Update Redux slice if needed

## 🔐 Security Notes

- Input validation on both client and server
- Parameterized queries (Drizzle ORM)
- Error handling with safe error messages
- Foreign key constraints enforced
- CORS configured for localhost development

## 📚 Documentation

- [Planning Docs](../Docs/planning/) - Architecture, phases, module plans
- [Migration Guide](../Docs/migration/) - Drizzle ORM migration
- [ADRs](../Docs/planning/ADRs/) - Architectural decisions
- [Student Module Plan](../Docs/planning/modules/Student/) - Detailed specifications

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Write tests for new features
3. Update documentation
4. Use conventional commits
5. Run linter before committing

## 📄 License

MIT

Coverage target: ≥ 90%

## Scripts

- `npm run dev` - Development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio

## Migration from .NET

Migrated from ASP.NET + EF Core + SQL Server to Node.js + Prisma + SQLite.

See `/planning` folder for phased migration docs.

## Prerequisites

- Node.js 18+
- SQL Server (using existing ContosoUniversity database)
- npm

## Setup

1. Install dependencies:

   ```sh
   npm.cmd install
   ```

2. Copy `.env.example` to `.env` and configure your database connection:

   ```sh
   copy .env.example .env
   ```

3. Update `.env` with your SQL Server credentials

## Running the Application

### Development Mode

```sh
npm.cmd run dev
```

### Production Build

```sh
npm.cmd run build
npm.cmd start
```

## API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check endpoint

## Project Structure

```
contoso-api/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment variables
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Testing

Visit `http://localhost:5000/api/health` to verify the server and database connection.
