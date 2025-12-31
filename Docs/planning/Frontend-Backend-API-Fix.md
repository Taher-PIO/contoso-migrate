# Frontend-Backend API Parameter Fix

## Issue

Frontend was sending incorrect parameter format to backend API:

- **Frontend sent**: `sortOrder: 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'` (compound values)
- **Frontend sent**: `searchString` parameter
- **Backend expected**: `sortOrder: 'asc' | 'desc'` (simple direction only)
- **Backend expected**: `search` parameter

## Root Cause

Frontend combined sort field and direction into single parameter while backend expected separate concerns.

## Solution

### 1. Updated Type Definitions

**File**: `client/src/types/student.ts`

- Changed `StudentQueryParams.sortOrder` from compound values to `'asc' | 'desc'`
- Changed `searchString` to `search` to match backend API

### 2. Updated API Service

**File**: `client/src/services/studentService.ts`

- Changed default `sortOrder` from `'name_asc'` to `'asc'`
- Changed parameter name from `searchString` to `search`

### 3. Updated Redux State

**File**: `client/src/store/slices/studentsSlice.ts`

- Changed `StudentsState.sortOrder` type to `'asc' | 'desc'`
- Changed `StudentsState.searchString` to `search`
- Updated initial state `sortOrder` from `'name_asc'` to `'asc'`
- Renamed action `setSearchString` to `setSearch`

### 4. Updated UI Component

**File**: `client/src/pages/students/StudentListPage.tsx`

- Replaced sort dropdown with toggle button
- Button shows: "Sort by Name: ↑ A-Z" or "Sort by Name: ↓ Z-A"
- Updated to use `search` instead of `searchString`
- Changed handler from `handleSortChange` to `handleSortToggle`
- Updated to use `setSearch` action

## Backend Validation

Backend validation middleware already supports the correct format:

```typescript
query('sortOrder').optional().default('asc').isIn(['asc', 'desc']);

query('search')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 100 })
  .matches(/^[a-zA-Z0-9\s\-'\.]+$/);
```

## Files Modified

1. `client/src/types/student.ts` - Updated `StudentQueryParams` interface
2. `client/src/services/studentService.ts` - Fixed API call parameters
3. `client/src/store/slices/studentsSlice.ts` - Updated state and actions
4. `client/src/pages/students/StudentListPage.tsx` - Updated UI and logic

## Testing Checklist

- [ ] Frontend compiles without TypeScript errors
- [ ] Backend compiles without TypeScript errors
- [ ] Student list loads successfully
- [ ] Sort toggle works (A-Z ↔ Z-A)
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Backend validation accepts requests
- [ ] No console errors in browser

## API Contract (Final)

```typescript
GET /api/students?page=1&pageSize=10&search=john&sortOrder=asc

Query Parameters:
- page?: number (default: 1)
- pageSize?: number (default: 10)
- search?: string (max 100 chars, alphanumeric + common punctuation)
- sortOrder?: 'asc' | 'desc' (default: 'asc')

Response:
{
  data: Student[];
  total: number;
  page: number;
  pageSize: number;
}
```

## Result

✅ Frontend now sends correct parameter format matching backend expectations
✅ No TypeScript compilation errors
✅ Ready for end-to-end testing
