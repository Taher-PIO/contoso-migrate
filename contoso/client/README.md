# Contoso University - React Frontend

React + TypeScript frontend for Contoso University application.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Bootstrap 5** - UI styling
- **React Hook Form** - Form management
- **Yup** - Form validation
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:5000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Frontend runs on http://localhost:3000 with API proxy to http://localhost:5000

### Build

```bash
npm run build
```

### Project Structure

```
client/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   ├── components/           # Reusable components
│   │   ├── Layout.tsx        # Main layout with navbar
│   │   ├── Pagination.tsx    # Pagination component
│   │   └── LoadingSpinner.tsx
│   ├── pages/                # Page components
│   │   └── students/         # Student module pages
│   │       ├── StudentListPage.tsx
│   │       ├── StudentDetailsPage.tsx
│   │       ├── StudentCreatePage.tsx
│   │       ├── StudentEditPage.tsx
│   │       └── StudentDeletePage.tsx
│   ├── store/                # Redux store
│   │   ├── index.ts          # Store configuration
│   │   └── slices/
│   │       └── studentsSlice.ts
│   ├── services/             # API services
│   │   └── studentService.ts
│   ├── types/                # TypeScript types
│   │   └── student.ts
│   └── styles/               # Custom styles
│       └── main.css
└── package.json
```

## Features

### Student Module (Slice-1)

- ✅ Student list with pagination, search, and sorting
- ✅ Student details with enrollments
- ✅ Create new student
- ✅ Edit existing student
- ✅ Delete student with confirmation
- ✅ Form validation (client-side with Yup)
- ✅ Error handling and user feedback
- ✅ Bootstrap styling

## API Integration

Frontend proxies API requests to backend:

- `GET /api/students` - List with pagination
- `GET /api/students/:id` - Get details
- `POST /api/students` - Create
- `PUT /api/students/:id` - Update
- `DELETE /api/students/:id` - Delete
