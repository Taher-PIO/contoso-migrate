import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { instructorService, ApiError } from '../../services/instructorService';
import type {
    Instructor,
    InstructorIndexData,
    InstructorCreateData,
    InstructorUpdateData,
    Course,
    Enrollment,
} from '../../types/instructor';

// State interface with special indexState for 3-panel view
interface InstructorsState {
    instructors: Instructor[];
    currentInstructor: Instructor | null;
    indexState: {
        instructors: Instructor[];
        courses: Course[];
        enrollments: Enrollment[];
        selectedInstructorID: number | null;
        selectedCourseID: number | null;
    };
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: InstructorsState = {
    instructors: [],
    currentInstructor: null,
    indexState: {
        instructors: [],
        courses: [],
        enrollments: [],
        selectedInstructorID: null,
        selectedCourseID: null,
    },
    loading: false,
    error: null,
};

// Async thunks

// Fetch all instructors
export const fetchInstructorsThunk = createAsyncThunk<
    Instructor[],
    void,
    { rejectValue: string }
>('instructors/fetchInstructors', async (_, { rejectWithValue }) => {
    try {
        const instructors = await instructorService.fetchInstructors();
        return instructors;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Fetch data for Index view (3-panel)
export const fetchIndexViewDataThunk = createAsyncThunk<
    InstructorIndexData,
    { instructorID?: number; courseID?: number },
    { rejectValue: string }
>('instructors/fetchIndexViewData', async ({ instructorID, courseID }, { rejectWithValue }) => {
    try {
        const data = await instructorService.fetchIndexViewData(instructorID, courseID);
        return data;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Fetch instructor by ID
export const fetchInstructorByIdThunk = createAsyncThunk<
    Instructor,
    number,
    { rejectValue: string }
>('instructors/fetchInstructorById', async (id, { rejectWithValue }) => {
    try {
        const instructor = await instructorService.fetchInstructorById(id);
        return instructor;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Create instructor
export const createInstructorThunk = createAsyncThunk<
    Instructor,
    InstructorCreateData,
    { rejectValue: string }
>('instructors/createInstructor', async (data, { rejectWithValue }) => {
    try {
        const instructor = await instructorService.createInstructor(data);
        return instructor;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Update instructor
export const updateInstructorThunk = createAsyncThunk<
    Instructor,
    { id: number; data: InstructorUpdateData },
    { rejectValue: string }
>('instructors/updateInstructor', async ({ id, data }, { rejectWithValue }) => {
    try {
        const instructor = await instructorService.updateInstructor(id, data);
        return instructor;
    } catch (error) {
        const apiError = error as ApiError;
        return rejectWithValue(apiError.message);
    }
});

// Delete instructor
export const deleteInstructorThunk = createAsyncThunk<number, number, { rejectValue: string }>(
    'instructors/deleteInstructor',
    async (id, { rejectWithValue }) => {
        try {
            await instructorService.deleteInstructor(id);
            return id;
        } catch (error) {
            const apiError = error as ApiError;
            return rejectWithValue(apiError.message);
        }
    }
);

// Slice
const instructorsSlice = createSlice({
    name: 'instructors',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentInstructor: (state) => {
            state.currentInstructor = null;
        },
        setSelectedInstructor: (state, action: PayloadAction<number | null>) => {
            state.indexState.selectedInstructorID = action.payload;
            if (!action.payload) {
                // Clear courses and enrollments when deselecting instructor
                state.indexState.courses = [];
                state.indexState.enrollments = [];
                state.indexState.selectedCourseID = null;
            }
        },
        setSelectedCourse: (state, action: PayloadAction<number | null>) => {
            state.indexState.selectedCourseID = action.payload;
            if (!action.payload) {
                // Clear enrollments when deselecting course
                state.indexState.enrollments = [];
            }
        },
        clearInstructors: (state) => {
            state.instructors = [];
        },
        resetState: () => initialState,
    },
    extraReducers: (builder) => {
        // Fetch instructors
        builder
            .addCase(fetchInstructorsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInstructorsThunk.fulfilled, (state, action: PayloadAction<Instructor[]>) => {
                state.loading = false;
                state.instructors = action.payload;
            })
            .addCase(fetchInstructorsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch instructors';
            });

        // Fetch index view data
        builder
            .addCase(fetchIndexViewDataThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIndexViewDataThunk.fulfilled, (state, action: PayloadAction<InstructorIndexData>) => {
                state.loading = false;
                state.indexState.instructors = action.payload.instructors;
                state.indexState.courses = action.payload.courses;
                state.indexState.enrollments = action.payload.enrollments;
            })
            .addCase(fetchIndexViewDataThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch index view data';
            });

        // Fetch instructor by ID
        builder
            .addCase(fetchInstructorByIdThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInstructorByIdThunk.fulfilled, (state, action: PayloadAction<Instructor>) => {
                state.loading = false;
                state.currentInstructor = action.payload;
            })
            .addCase(fetchInstructorByIdThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch instructor';
            });

        // Create instructor
        builder
            .addCase(createInstructorThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createInstructorThunk.fulfilled, (state, action: PayloadAction<Instructor>) => {
                state.loading = false;
                state.instructors.push(action.payload);
            })
            .addCase(createInstructorThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to create instructor';
            });

        // Update instructor
        builder
            .addCase(updateInstructorThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateInstructorThunk.fulfilled, (state, action: PayloadAction<Instructor>) => {
                state.loading = false;
                const index = state.instructors.findIndex(i => i.ID === action.payload.ID);
                if (index !== -1) {
                    state.instructors[index] = action.payload;
                }
                if (state.currentInstructor?.ID === action.payload.ID) {
                    state.currentInstructor = action.payload;
                }
            })
            .addCase(updateInstructorThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to update instructor';
            });

        // Delete instructor
        builder
            .addCase(deleteInstructorThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteInstructorThunk.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.instructors = state.instructors.filter(i => i.ID !== action.payload);
                if (state.currentInstructor?.ID === action.payload) {
                    state.currentInstructor = null;
                }
            })
            .addCase(deleteInstructorThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to delete instructor';
            });
    },
});

export const {
    clearError,
    clearCurrentInstructor,
    setSelectedInstructor,
    setSelectedCourse,
    clearInstructors,
    resetState,
} = instructorsSlice.actions;

export default instructorsSlice.reducer;
