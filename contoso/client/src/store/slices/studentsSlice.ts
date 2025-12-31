import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { studentService, ApiError } from '../../services/studentService';
import type {
    Student,
    StudentWithEnrollments,
    StudentFormData,
    StudentQueryParams,
} from '../../types/student';

// State interface
interface StudentsState {
    students: Student[];
    currentStudent: StudentWithEnrollments | null;
    loading: boolean;
    error: string | null;
    pagination: {
        total: number;
        page: number;
        pageSize: number;
    };
    search: string;
    sortOrder: 'asc' | 'desc';
}

// Initial state
const initialState: StudentsState = {
    students: [],
    currentStudent: null,
    loading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        pageSize: 10,
    },
    search: '',
    sortOrder: 'asc',
};

// Async thunks

// Fetch students with pagination, search, sort
export const fetchStudents = createAsyncThunk<
    { data: Student[]; total: number; page: number; pageSize: number },
    StudentQueryParams | undefined,
    { rejectValue: string }
>('students/fetchStudents', async (params, { rejectWithValue }) => {
    try {
        const response = await studentService.getStudents(params);
        return response;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Fetch student by ID
export const fetchStudentById = createAsyncThunk<
    StudentWithEnrollments,
    number,
    { rejectValue: string }
>('students/fetchStudentById', async (id, { rejectWithValue }) => {
    try {
        const student = await studentService.getStudentById(id);
        return student;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Create student
export const createStudent = createAsyncThunk<
    Student,
    StudentFormData,
    { rejectValue: string }
>('students/createStudent', async (data, { rejectWithValue }) => {
    try {
        const student = await studentService.createStudent(data);
        return student;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Update student
export const updateStudent = createAsyncThunk<
    Student,
    { id: number; data: StudentFormData },
    { rejectValue: string }
>('students/updateStudent', async ({ id, data }, { rejectWithValue }) => {
    try {
        const student = await studentService.updateStudent(id, data);
        return student;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Delete student
export const deleteStudent = createAsyncThunk<number, number, { rejectValue: string }>(
    'students/deleteStudent',
    async (id, { rejectWithValue }) => {
        try {
            await studentService.deleteStudent(id);
            return id;
        } catch (error) {
            const apiError = error as ApiError;
            return rejectWithValue(apiError.message);
        }
    }
);

// Slice
const studentsSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
        },
        setSortOrder: (
            state,
            action: PayloadAction<'asc' | 'desc'>
        ) => {
            state.sortOrder = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentStudent: (state) => {
            state.currentStudent = null;
        },
        clearStudents: (state) => {
            state.students = [];
            state.pagination = {
                total: 0,
                page: 1,
                pageSize: 10,
            };
        },
        resetState: () => initialState,
    },
    extraReducers: (builder) => {
        // Fetch students
        builder
            .addCase(fetchStudents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStudents.fulfilled, (state, action) => {
                state.loading = false;
                state.students = action.payload.data || [];
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    pageSize: action.payload.pageSize,
                };
            })
            .addCase(fetchStudents.rejected, (state, action) => {
                state.loading = false;
                state.students = [];
                state.error = action.payload || 'Failed to fetch students';
            });

        // Fetch student by ID
        builder
            .addCase(fetchStudentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStudentById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentStudent = action.payload;
            })
            .addCase(fetchStudentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch student';
            });

        // Create student
        builder
            .addCase(createStudent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createStudent.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createStudent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to create student';
            });

        // Update student
        builder
            .addCase(updateStudent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateStudent.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updateStudent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to update student';
            });

        // Delete student
        builder
            .addCase(deleteStudent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteStudent.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deleteStudent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to delete student';
            });
    },
});

export const { setSearch, setSortOrder, clearError, clearCurrentStudent, clearStudents, resetState } =
    studentsSlice.actions;

export default studentsSlice.reducer;
