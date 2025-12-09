import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Surveys from './pages/Surveys';
import SurveyCreate from './pages/SurveyCreate';
import SurveyAnswer from './pages/SurveyAnswer';
import AvailableSurveys from './pages/AvailableSurveys';
import MyResponses from './pages/MyResponses';
import AIAnalytics from './pages/AIAnalytics';
import Reports from './pages/Reports';
import Logout from './pages/Logout';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';

// ProtectedRoute component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>; // or a spinner

  if (!user) return <Navigate to="/landing" replace />;

  // Optionally check role if passed
  if (role && user?.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />

      {/* Public routes */}
      <Route path="/logout" element={<Logout />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management"
        element={
          <ProtectedRoute role="admin">
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/surveys"
        element={
          <ProtectedRoute>
            <Surveys />
          </ProtectedRoute>
        }
      />
      <Route
        path="/surveys/create"
        element={
          <ProtectedRoute role="admin">
            <SurveyCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/surveys/answer/:surveyId"
        element={
          <ProtectedRoute>
            <SurveyAnswer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/available-surveys"
        element={
          <ProtectedRoute>
            <AvailableSurveys />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-responses"
        element={
          <ProtectedRoute>
            <MyResponses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-analytics"
        element={
          <ProtectedRoute role="admin">
            <AIAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute role="admin">
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Role-based dashboards */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute role="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
