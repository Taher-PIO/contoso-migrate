# Getting Started with Contoso University

## Prerequisites

- Node.js 18+ installed
- npm installed

## Initial Setup

### 1. Install Dependencies

Open PowerShell/Command Prompt and navigate to the project:

```powershell
cd d:\Projects\copilot\contoso
```

Install backend dependencies:

```powershell
npm.cmd install
```

Install frontend dependencies:

```powershell
cd client
npm.cmd install
cd ..
```

### 2. Initialize Database

From the `d:\Projects\copilot\contoso` directory:

```powershell
# Push Drizzle schema to database
npm.cmd run db:push

# Seed with sample data
npm.cmd run db:seed
```

### 3. Start Development Servers

**Option A: Start Backend and Frontend Separately (Recommended for Windows)**

Open **two terminal windows**:

**Terminal 1 - Backend Server:**

```powershell
cd d:\Projects\copilot\contoso
npm.cmd run dev
```

Backend will run on: http://localhost:5000

**Terminal 2 - Frontend Server:**

```powershell
cd d:\Projects\copilot\contoso\client
npm.cmd run dev
```

Frontend will run on: http://localhost:3000

**Option B: Use Concurrently (if permissions allow)**

```powershell
cd d:\Projects\copilot\contoso
npm.cmd run dev:all
```

### 4. Access the Application

1. Open your browser to: **http://localhost:3000**
2. Click on "Students" in the navigation menu
3. Try the following features:
   - Search for students by name
   - Sort by name or enrollment date
   - Navigate through pages
   - Click "Create New" to add a student
   - Click "Details" to view student enrollments
   - Click "Edit" to update a student
   - Click "Delete" to remove a student

## Verify Everything is Working

### Check Backend Health

Visit: http://localhost:5000/api/health

You should see:

```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": {
    "connected": true,
    "type": "SQLite",
    "serverTime": "..."
  }
}
```

### Check Frontend

Visit: http://localhost:3000

You should see the Contoso University homepage with navigation menu.

### Check Students API

Visit: http://localhost:5000/api/students

You should see paginated student data.

## Common Issues

### Issue: "Cannot load npm.ps1"

**Solution**: Use `npm.cmd` instead of `npm` in all commands on Windows.

### Issue: Frontend shows "Network Error"

**Solution**: Make sure backend server is running on http://localhost:5000

### Issue: Database file not found

**Solution**: Run `npm.cmd run db:push` to create the database.

### Issue: No students showing

**Solution**: Run `npm.cmd run db:seed` to populate sample data.

### Issue: Port already in use

**Solutions**:

- For backend (port 5000): Stop any other services using port 5000
- For frontend (port 3000): Vite will prompt to use an alternative port

## Development Workflow

### Making Changes

**Backend Changes** (src/):

1. Edit files in `src/`
2. Server auto-restarts with nodemon
3. Test endpoints with browser or Postman

**Frontend Changes** (client/src/):

1. Edit files in `client/src/`
2. Changes hot-reload in browser automatically
3. Check console for any errors

**Database Schema Changes**:

1. Edit `src/db/schema.ts`
2. Run `npm.cmd run db:push`
3. Update services/controllers if needed
4. Update TypeScript types in frontend

### Running Tests

**Backend Tests:**

```powershell
cd d:\Projects\copilot\contoso
npm.cmd test
```

**Frontend Tests:**

```powershell
cd d:\Projects\copilot\contoso\client
npm.cmd test
```

## Exploring the Application

### Student Module Features

1. **List Page** (`/students`)

   - Pagination (10 per page)
   - Search by name
   - Sort by name or enrollment date
   - View, Edit, Delete buttons

2. **Details Page** (`/students/:id`)

   - Student information
   - List of enrollments with courses and grades

3. **Create Page** (`/students/create`)

   - Form with validation
   - First name, Last name, Enrollment date
   - Success feedback

4. **Edit Page** (`/students/:id/edit`)

   - Pre-populated form
   - Same validation as create
   - Updates student information

5. **Delete Page** (`/students/:id/delete`)
   - Confirmation dialog
   - Warning about foreign key constraints
   - Error handling for students with enrollments

## Database GUI

To explore the database visually:

```powershell
cd d:\Projects\copilot\contoso
npm.cmd run db:studio
```

This opens Drizzle Studio in your browser where you can:

- View all tables and data
- Edit records
- See relationships
- Run queries

## API Documentation

See the main [README.md](README.md) for complete API endpoint documentation.

## Next Steps

- Explore the code in `src/` (backend) and `client/src/` (frontend)
- Try implementing the Courses module following the Student module pattern
- Review the planning docs in `../Docs/planning/`
- Check out the Drizzle migration guide in `../Docs/migration/`

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review planning docs in [../Docs/planning/](../Docs/planning/)
- Check console logs for errors
- Verify all dependencies are installed
- Ensure database is initialized and seeded
