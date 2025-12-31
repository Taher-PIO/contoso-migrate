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

              {/* Placeholder routes for other modules */}
              <Route
                path='courses'
                element={
                  <div>
                    <h1>Courses</h1>
                    <p>Coming soon...</p>
                  </div>
                }
              />
              <Route
                path='departments'
                element={
                  <div>
                    <h1>Departments</h1>
                    <p>Coming soon...</p>
                  </div>
                }
              />
              <Route
                path='instructors'
                element={
                  <div>
                    <h1>Instructors</h1>
                    <p>Coming soon...</p>
                  </div>
                }
              />

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
