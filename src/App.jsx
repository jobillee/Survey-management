import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider';

// Pages
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
import EditSurvey from './pages/EditSurvey';

// ------------------------
// ProtectedRoute Component
// ------------------------
const ProtectedRoute = ({ roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/landing" replace state={{ from: location }} />;

  // Only restrict if roles are defined
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// ------------------------
// App Routes
// ------------------------
function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/logout" element={<Logout />} />

      {/* Dashboard - all roles */}
      <Route element={<ProtectedRoute roles={['admin', 'staff', 'student']} />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Admin-only Routes */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/ai-analytics" element={<AIAnalytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Staff-only Routes */}
      <Route element={<ProtectedRoute roles={['staff']} />}>
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
      </Route>

      {/* Student-only Routes */}
      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/available-surveys" element={<AvailableSurveys />} />
        <Route path="/my-responses" element={<MyResponses />} />
      </Route>

      {/* Surveys - accessible by admin & staff */}
      <Route element={<ProtectedRoute roles={['admin', 'staff']} />}>
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/surveys/create" element={<SurveyCreate />} />
        <Route path="/surveys/:id/edit" element={<EditSurvey />} />
        <Route path="/surveys/answer/:surveyId" element={<SurveyAnswer />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}

// ------------------------
// App Component
// ------------------------
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
