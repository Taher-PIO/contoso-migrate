import { configureStore } from '@reduxjs/toolkit';
import studentsReducer from './slices/studentsSlice';
import coursesReducer from './slices/coursesSlice';
import departmentsReducer from './slices/departmentsSlice';
import instructorsReducer from './slices/instructorsSlice';

export const store = configureStore({
  reducer: {
    students: studentsReducer,
    courses: coursesReducer,
    departments: departmentsReducer,
    instructors: instructorsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
