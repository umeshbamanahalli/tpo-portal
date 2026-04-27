import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ErrorPage from './pages/ErrorPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard'; // Don't forget these imports!
import CompanyDashboard from './pages/CompanyDashboard';
import './App.css';
import ForgotPassword from './pages/ForgotPassword';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (role !== allowedRole) {
    // If logged in but wrong role, send them to their correct home
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />}/>
        <Route path='/error-page' element={<ErrorPage />} />


        {/* Private Student Route */}
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Private Admin Route */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Private Company Route */}
        <Route path="/company-dashboard" element={
          <ProtectedRoute allowedRole="company">
            <CompanyDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;