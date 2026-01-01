import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { departmentService, ApiError } from '../../services/departmentService';
import type {
    Department,
    DepartmentCreateData,
    DepartmentUpdateData,
    Instructor,
} from '../../types/department';

// State interface with concurrency conflict handling
interface DepartmentsState {
    departments: Department[];
    currentDepartment: Department | null;
    instructors: Instructor[];
    conflictingDepartment: Department | null; // For 409 concurrency conflicts
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: DepartmentsState = {
    departments: [],
    currentDepartment: null,
    instructors: [],
    conflictingDepartment: null,
    loading: false,
    error: null,
};

// Async thunks

// Fetch all departments
export const fetchDepartmentsThunk = createAsyncThunk<
    Department[],
    void,
    { rejectValue: string }
>('departments/fetchDepartments', async (_, { rejectWithValue }) => {
    try {
        const departments = await departmentService.fetchDepartments();
        return departments;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Fetch department by ID with relationships
export const fetchDepartmentByIdThunk = createAsyncThunk<
    Department,
    number,
    { rejectValue: string }
>('departments/fetchDepartmentById', async (id, { rejectWithValue }) => {
    try {
        const department = await departmentService.fetchDepartmentById(id);
        return department;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Create department
export const createDepartmentThunk = createAsyncThunk<
    Department,
    DepartmentCreateData,
    { rejectValue: string }
>('departments/createDepartment', async (data, { rejectWithValue }) => {
    try {
        const department = await departmentService.createDepartment(data);
        return department;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Update department (with optimistic concurrency control)
export const updateDepartmentThunk = createAsyncThunk<
    Department,
    { id: number; data: DepartmentUpdateData },
    { rejectValue: ApiError }
>('departments/updateDepartment', async ({ id, data }, { rejectWithValue }) => {
    try {
        const department = await departmentService.updateDepartment(id, data);
        return department;
    } catch (error) {
        const apiError = error as ApiError;
        // Return full ApiError for 409 handling in component
        return rejectWithValue(apiError);
    }
});

// Delete department
export const deleteDepartmentThunk = createAsyncThunk<number, number, { rejectValue: string }>(
    'departments/deleteDepartment',
    async (id, { rejectWithValue }) => {
        try {
            await departmentService.deleteDepartment(id);
            return id;
        } catch (error) {
            const apiError = error as ApiError;
            return rejectWithValue(apiError.message);
        }
    }
);

// Fetch instructors for dropdown
export const fetchInstructorsThunk = createAsyncThunk<
    Instructor[],
    void,
    { rejectValue: string }
>('departments/fetchInstructors', async (_, { rejectWithValue }) => {
    try {
        const instructors = await departmentService.fetchInstructors();
        // Sort by last name for dropdown
        return instructors.sort((a, b) => a.LastName.localeCompare(b.LastName));
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Slice
const departmentsSlice = createSlice({
    name: 'departments',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentDepartment: (state) => {
            state.currentDepartment = null;
        },
        clearConflict: (state) => {
            state.conflictingDepartment = null;
        },
        setConflictingDepartment: (state, action: PayloadAction<Department>) => {
            state.conflictingDepartment = action.payload;
        },
        clearDepartments: (state) => {
            state.departments = [];
        },
        resetState: () => initialState,
    },
    extraReducers: (builder) => {
        // Fetch departments
        builder
            .addCase(fetchDepartmentsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDepartmentsThunk.fulfilled, (state, action: PayloadAction<Department[]>) => {
                state.loading = false;
                state.departments = action.payload;
            })
            .addCase(fetchDepartmentsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch departments';
            });

        // Fetch department by ID
        builder
            .addCase(fetchDepartmentByIdThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDepartmentByIdThunk.fulfilled, (state, action: PayloadAction<Department>) => {
                state.loading = false;
                state.currentDepartment = action.payload;
            })
            .addCase(fetchDepartmentByIdThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch department';
            });

        // Create department
        builder
            .addCase(createDepartmentThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createDepartmentThunk.fulfilled, (state, action: PayloadAction<Department>) => {
                state.loading = false;
                state.departments.push(action.payload);
            })
            .addCase(createDepartmentThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to create department';
            });

        // Update department (with concurrency handling)
        builder
            .addCase(updateDepartmentThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.conflictingDepartment = null;
            })
            .addCase(updateDepartmentThunk.fulfilled, (state, action: PayloadAction<Department>) => {
                state.loading = false;
                const index = state.departments.findIndex(d => d.DepartmentID === action.payload.DepartmentID);
                if (index !== -1) {
                    state.departments[index] = action.payload;
                }
                if (state.currentDepartment?.DepartmentID === action.payload.DepartmentID) {
                    state.currentDepartment = action.payload;
                }
            })
            .addCase(updateDepartmentThunk.rejected, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    const apiError = action.payload as ApiError;
                    state.error = apiError.message || 'Failed to update department';
                    // Store conflicting data if 409 Conflict
                    if (apiError.statusCode === 409 && apiError.currentData) {
                        state.conflictingDepartment = apiError.currentData;
                    }
                } else {
                    state.error = 'Failed to update department';
                }
            });

        // Delete department
        builder
            .addCase(deleteDepartmentThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDepartmentThunk.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.departments = state.departments.filter(d => d.DepartmentID !== action.payload);
                if (state.currentDepartment?.DepartmentID === action.payload) {
                    state.currentDepartment = null;
                }
            })
            .addCase(deleteDepartmentThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to delete department';
            });

        // Fetch instructors
        builder
            .addCase(fetchInstructorsThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(fetchInstructorsThunk.fulfilled, (state, action: PayloadAction<Instructor[]>) => {
                state.instructors = action.payload;
            })
            .addCase(fetchInstructorsThunk.rejected, (state, action) => {
                state.error = action.payload || 'Failed to fetch instructors';
            });
    },
});

export const {
    clearError,
    clearCurrentDepartment,
    clearConflict,
    setConflictingDepartment,
    clearDepartments,
    resetState
} = departmentsSlice.actions;

export default departmentsSlice.reducer;
