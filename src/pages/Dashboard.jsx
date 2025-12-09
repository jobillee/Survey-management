import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import AdminDashboard from './dashboards/AdminDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
  try {
    setLoading(true);

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }

    // Fetch profile from your "users" table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    setProfile(data);
    setRole(data?.role || 'user');
  } catch (err) {
    console.error('Error fetching profile:', err);
    setProfile(null);
    setRole(null);
  } finally {
    setLoading(false);
  }
};


  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isStudent = role === 'student';

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to InsightHub!</h2>
          <p className="text-gray-500 mb-6">
            Your profile is not available. Please log in or refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#1A1F36' }}
          >
            Refresh Page
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Role-based dashboards
  return (
    <DashboardLayout>
      {isAdmin && <AdminDashboard />}
      {isStaff && <StaffDashboard />}
      {isStudent && <StudentDashboard />}

      {/* Fallback for unrecognized role */}
      {!isAdmin && !isStaff && !isStudent && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {profile.full_name}!</h2>
          <p className="text-gray-500 mb-4">
            Your role: <span className="font-semibold">{profile.role || 'Not assigned'}</span>
          </p>
          <p className="text-sm text-gray-400">
            Please contact an administrator if you need role assignment.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
