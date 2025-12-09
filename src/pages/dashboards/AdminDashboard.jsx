import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSurveys: 0,
    totalResponses: 0,
    activeUsers: 0,
  });
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // ✅ Total users
      const { count: totalUsers, error: totalUsersError } = await supabase
        .from('users')
        .select('id', { count: 'exact' });
      if (totalUsersError) throw totalUsersError;

      // ✅ Active users in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('.')[0] + 'Z'; // remove milliseconds for REST filter
      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('last_sign_in_at', sevenDaysAgo);
      if (activeUsersError) throw activeUsersError;

      // ✅ Total surveys
      const { count: totalSurveys, error: totalSurveysError } = await supabase
        .from('surveys')
        .select('id', { count: 'exact' });
      if (totalSurveysError) throw totalSurveysError;

      // ✅ Total responses
      const { count: totalResponses, error: totalResponsesError } = await supabase
        .from('survey_responses')
        .select('id', { count: 'exact' });
      if (totalResponsesError) throw totalResponsesError;

      setStats({ totalUsers, totalSurveys, totalResponses, activeUsers });

      // ✅ Recent surveys
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (surveysError) throw surveysError;
      setRecentSurveys(surveys || []);

      // ✅ Recent users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (usersError) throw usersError;
      setRecentUsers(users || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'staff': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white">
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <div className="text-white/80">Total Users</div>
          </div>
          <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-teal-400 to-cyan-500 text-white">
            <div className="text-3xl font-bold">{stats.totalSurveys}</div>
            <div className="text-white/80">Active Surveys</div>
          </div>
          <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-orange-400 to-pink-500 text-white">
            <div className="text-3xl font-bold">{stats.totalResponses}</div>
            <div className="text-white/80">Total Responses</div>
          </div>
          <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white">
            <div className="text-3xl font-bold">{stats.activeUsers}</div>
            <div className="text-white/80">Active Users</div>
          </div>
        </div>

        {/* Recent Surveys */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">Recent Surveys</h3>
          {recentSurveys.length === 0 && <p className="text-gray-400">No surveys found.</p>}
          {recentSurveys.map((s) => (
            <div key={s.id} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2">
              <span>{s.title}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">Recent Users</h3>
          {recentUsers.length === 0 && <p className="text-gray-400">No users found.</p>}
          {recentUsers.map((u) => (
            <div key={u.id} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2">
              <span>{u.full_name} ({u.email})</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
