import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { StudentListPage } from './pages/students/StudentListPage';
import { StudentDetailsPage } from './pages/students/StudentDetailsPage';
import { StudentCreatePage } from './pages/students/StudentCreatePage';
import { StudentEditPage } from './pages/students/StudentEditPage';
import { StudentDeletePage } from './pages/students/StudentDeletePage';
import { CourseListPage } from './pages/Courses/CourseListPage';
import { CourseDetailsPage } from './pages/Courses/CourseDetailsPage';
import { CourseCreatePage } from './pages/Courses/CourseCreatePage';
import { CourseEditPage } from './pages/Courses/CourseEditPage';
import { CourseDeletePage } from './pages/Courses/CourseDeletePage';
import { DepartmentListPage } from './pages/Departments/DepartmentListPage';
import { DepartmentDetailsPage } from './pages/Departments/DepartmentDetailsPage';
import { DepartmentCreatePage } from './pages/Departments/DepartmentCreatePage';
import { DepartmentEditPage } from './pages/Departments/DepartmentEditPage';
import { DepartmentDeletePage } from './pages/Departments/DepartmentDeletePage';
import InstructorIndexPage from './pages/Instructors/InstructorIndexPage';
import InstructorListPage from './pages/Instructors/InstructorListPage';
import InstructorDetailsPage from './pages/Instructors/InstructorDetailsPage';
import InstructorCreatePage from './pages/Instructors/InstructorCreatePage';
import InstructorEditPage from './pages/Instructors/InstructorEditPage';
import InstructorDeletePage from './pages/Instructors/InstructorDeletePage';
import AboutPage from './pages/About/AboutPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Layout />}>
              <Route index element={<HomePage />} />

              {/* Student routes */}
              <Route path='students'>
                <Route index element={<StudentListPage />} />
                <Route path=':id' element={<StudentDetailsPage />} />
                <Route path='create' element={<StudentCreatePage />} />
                <Route path=':id/edit' element={<StudentEditPage />} />
                <Route path=':id/delete' element={<StudentDeletePage />} />
              </Route>

              {/* Course routes */}
              <Route path='courses'>
                <Route index element={<CourseListPage />} />
                <Route path=':id' element={<CourseDetailsPage />} />
                <Route path='create' element={<CourseCreatePage />} />
                <Route path='edit/:id' element={<CourseEditPage />} />
                <Route path='delete/:id' element={<CourseDeletePage />} />
              </Route>

              {/* Department routes */}
              <Route path='departments'>
                <Route index element={<DepartmentListPage />} />
                <Route path=':id' element={<DepartmentDetailsPage />} />
                <Route path='create' element={<DepartmentCreatePage />} />
                <Route path='edit/:id' element={<DepartmentEditPage />} />
                <Route path='delete/:id' element={<DepartmentDeletePage />} />
              </Route>

              {/* Instructor routes */}
              <Route path='instructors'>
                <Route index element={<InstructorIndexPage />} />
                <Route path='list' element={<InstructorListPage />} />
                <Route path=':id' element={<InstructorDetailsPage />} />
                <Route path='create' element={<InstructorCreatePage />} />
                <Route path='edit/:id' element={<InstructorEditPage />} />
                <Route path='delete/:id' element={<InstructorDeletePage />} />
              </Route>

              {/* About route */}
              <Route path='about' element={<AboutPage />} />

              {/* 404 Not Found */}
              <Route
                path='*'
                element={
                  <div className='text-center mt-5'>
                    <h1>404 - Page Not Found</h1>
                  </div>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
