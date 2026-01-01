import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { courseService, ApiError } from '../../services/courseService';
import type {
    Course,
    CourseCreateData,
    CourseUpdateData,
    Department,
} from '../../types/course';

// State interface (no pagination/search per legacy requirements)
interface CoursesState {
    courses: Course[];
    currentCourse: Course | null;
    departments: Department[];
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: CoursesState = {
    courses: [],
    currentCourse: null,
    departments: [],
    loading: false,
    error: null,
};

// Async thunks

// Fetch all courses (no pagination)
export const fetchCoursesThunk = createAsyncThunk<
    Course[],
    void,
    { rejectValue: string }
>('courses/fetchCourses', async (_, { rejectWithValue }) => {
    try {
        const courses = await courseService.fetchCourses();
        return courses;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Fetch course by ID with relationships
export const fetchCourseByIdThunk = createAsyncThunk<
    Course,
    number,
    { rejectValue: string }
>('courses/fetchCourseById', async (id, { rejectWithValue }) => {
    try {
        const course = await courseService.fetchCourseById(id);
        return course;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Create course (manual CourseID required)
export const createCourseThunk = createAsyncThunk<
    Course,
    CourseCreateData,
    { rejectValue: string }
>('courses/createCourse', async (data, { rejectWithValue }) => {
    try {
        const course = await courseService.createCourse(data);
        return course;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Update course (CourseID immutable)
export const updateCourseThunk = createAsyncThunk<
    Course,
    { id: number; data: CourseUpdateData },
    { rejectValue: string }
>('courses/updateCourse', async ({ id, data }, { rejectWithValue }) => {
    try {
        const course = await courseService.updateCourse(id, data);
        return course;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Delete course (cascade to enrollments)
export const deleteCourseThunk = createAsyncThunk<number, number, { rejectValue: string }>(
    'courses/deleteCourse',
    async (id, { rejectWithValue }) => {
        try {
            await courseService.deleteCourse(id);
            return id;
        } catch (error) {
            const apiError = error as ApiError;
            return rejectWithValue(apiError.message);
        }
    }
);

// Fetch departments for dropdown
export const fetchDepartmentsThunk = createAsyncThunk<
    Department[],
    void,
    { rejectValue: string }
>('courses/fetchDepartments', async (_, { rejectWithValue }) => {
    try {
        const departments = await courseService.fetchDepartments();
        // Sort by Name on frontend
        return departments.sort((a, b) => a.Name.localeCompare(b.Name));
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Slice
const coursesSlice = createSlice({
    name: 'courses',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentCourse: (state) => {
            state.currentCourse = null;
        },
        clearCourses: (state) => {
            state.courses = [];
        },
        resetState: () => initialState,
    },
    extraReducers: (builder) => {
        // Fetch courses
        builder
            .addCase(fetchCoursesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCoursesThunk.fulfilled, (state, action: PayloadAction<Course[]>) => {
                state.loading = false;
                state.courses = action.payload;
            })
            .addCase(fetchCoursesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch courses';
            });

        // Fetch course by ID
        builder
            .addCase(fetchCourseByIdThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourseByIdThunk.fulfilled, (state, action: PayloadAction<Course>) => {
                state.loading = false;
                state.currentCourse = action.payload;
            })
            .addCase(fetchCourseByIdThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch course';
            });

        // Create course
        builder
            .addCase(createCourseThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCourseThunk.fulfilled, (state, action: PayloadAction<Course>) => {
                state.loading = false;
                state.courses.push(action.payload);
            })
            .addCase(createCourseThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to create course';
            });

        // Update course
        builder
            .addCase(updateCourseThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCourseThunk.fulfilled, (state, action: PayloadAction<Course>) => {
                state.loading = false;
                const index = state.courses.findIndex(c => c.CourseID === action.payload.CourseID);
                if (index !== -1) {
                    state.courses[index] = action.payload;
                }
                if (state.currentCourse?.CourseID === action.payload.CourseID) {
                    state.currentCourse = action.payload;
                }
            })
            .addCase(updateCourseThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to update course';
            });

        // Delete course
        builder
            .addCase(deleteCourseThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCourseThunk.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.courses = state.courses.filter(c => c.CourseID !== action.payload);
                if (state.currentCourse?.CourseID === action.payload) {
                    state.currentCourse = null;
                }
            })
            .addCase(deleteCourseThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to delete course';
            });

        // Fetch departments
        builder
            .addCase(fetchDepartmentsThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(fetchDepartmentsThunk.fulfilled, (state, action: PayloadAction<Department[]>) => {
                state.departments = action.payload;
            })
            .addCase(fetchDepartmentsThunk.rejected, (state, action) => {
                state.error = action.payload || 'Failed to fetch departments';
            });
    },
});

export const { clearError, clearCurrentCourse, clearCourses, resetState } = coursesSlice.actions;
export default coursesSlice.reducer;
