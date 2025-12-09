import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const StudentDashboard = () => {
  const [profile, setProfile] = useState({ full_name: 'Student' });
  const [stats, setStats] = useState({
    availableSurveys: 0,
    completedSurveys: 0,
    pendingSurveys: 0
  });
  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [completedSurveys, setCompletedSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        console.warn('No authenticated user');
        setLoading(false);
        return;
      }

      // Fetch profile info from users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch active surveys
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true)
        .limit(3);
      if (surveysError) throw surveysError;

      // Fetch survey responses for this student
      const { data: responses, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', user.id);
      if (responsesError) throw responsesError;

      setAvailableSurveys(surveys || []);
      setCompletedSurveys(responses || []);
      setStats({
        availableSurveys: surveys?.length || 0,
        completedSurveys: responses?.length || 0,
        pendingSurveys: (surveys?.length || 0) - (responses?.length || 0)
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
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

        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #1A1F36 0%, #2D3748 100%)' }}>
          <h2 className="text-2xl font-bold mb-2">Hello, {profile?.full_name} 👋</h2>
          <p className="text-gray-300">Complete surveys and make your voice heard.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Available', value: stats.availableSurveys },
            { label: 'Completed', value: stats.completedSurveys },
            { label: 'Pending', value: stats.pendingSurveys }
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-6 bg-white shadow">
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <p className="text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Available Surveys */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-bold mb-4">Available Surveys</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {availableSurveys.length === 0 ? (
              <p className="text-gray-500">No surveys available yet.</p>
            ) : (
              availableSurveys.map((survey) => (
                <div key={survey.id} className="border p-4 rounded-xl">
                  <h4 className="font-semibold">{survey.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{survey.description}</p>
                  <Link to={`/survey/${survey.id}/answer`} className="text-teal-600 font-medium">
                    Start Survey →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Surveys */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-bold mb-4">Completed Surveys</h3>
          {completedSurveys.length === 0 ? (
            <p className="text-gray-500">No completed surveys yet.</p>
          ) : (
            completedSurveys.map((resp) => (
              <div key={resp.id} className="flex justify-between p-3 border rounded-xl mb-2">
                <span>Survey ID: {resp.survey_id}</span>
                <Link to={`/response/${resp.id}`} className="text-teal-600">View →</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
