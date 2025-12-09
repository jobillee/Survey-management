import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const StaffDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ mySurveys: 0, totalResponses: 0, pendingReviews: 0, completionRate: 0 });
  const [mySurveys, setMySurveys] = useState([]);
  const [recentResponses, setRecentResponses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.id) fetchDashboardData();
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch surveys, responses, notifications, stats (same as your existing code)
      const { data: surveys } = await supabase.from('surveys').select('*').eq('user_id', user.id);
      setMySurveys(surveys || []);

      const surveyIds = (surveys || []).map(s => s.id);
      let responses = [];
      if (surveyIds.length > 0) {
        const { data: responsesData } = await supabase.from('survey_responses').select('*').in('survey_id', surveyIds);
        responses = responsesData || [];
      }

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setNotifications(notificationsData || []);

      setStats({
        mySurveys: surveys?.length || 0,
        totalResponses: responses.length,
        pendingReviews: responses.filter(r => !r.reviewed).length,
        completionRate: surveyIds.length > 0 ? Math.round((responses.length / (surveyIds.length * 10)) * 100) : 0
      });

      setRecentResponses(responses.slice(0, 3).map(r => ({
        id: r.id,
        survey: r.survey_title || 'Untitled Survey',
        student: r.student_name || 'Anonymous',
        time: r.created_at ? new Date(r.created_at).toLocaleString() : 'Just now'
      })));
    } catch (err) {
      console.error(err);
      setMySurveys([]);
      setStats({ mySurveys: 0, totalResponses: 0, pendingReviews: 0, completionRate: 0 });
      setRecentResponses([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <DashboardLayout><p>Loading dashboard...</p></DashboardLayout>;

  return (
    <DashboardLayout> 
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'My Surveys', value: stats.mySurveys, icon: '📋', color: 'from-blue-500 to-indigo-600' },
          { label: 'Total Responses', value: stats.totalResponses, icon: '📝', color: 'from-teal-400 to-cyan-500' },
          { label: 'Pending Reviews', value: stats.pendingReviews, icon: '👁️', color: 'from-orange-400 to-amber-500' },
          { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: '📊', color: 'from-green-400 to-emerald-500' }
        ].map((stat, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg">
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color}`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{stat.icon}</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</h3>
              <p className="text-white/80 text-sm">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Surveys & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Surveys */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">My Surveys</h3>
            <Link to="/my-surveys" className="text-teal-500 hover:text-teal-600 text-sm font-medium">View All →</Link>
          </div>
          <div className="space-y-4">
            {mySurveys.length === 0 && <p className="text-gray-500">No surveys found.</p>}
            {mySurveys.map(survey => (
              <div key={survey.id} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{survey.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(survey.status)}`}>
                    {survey.status?.charAt(0).toUpperCase() + survey.status?.slice(1)}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>{survey.responses || 0} / {survey.target || 0} responses</span>
                    <span>{Math.round(((survey.responses || 0) / (survey.target || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(((survey.responses || 0) / (survey.target || 1)) * 100, 100)}%` }}>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📅 Deadline: {survey.deadline}</span>
                  <Link to={`/survey/${survey.id}`} className="text-teal-500 hover:text-teal-600 font-medium ml-auto">View Details →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Responses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Responses</h3>
            {recentResponses.length === 0 && <p className="text-gray-500">No recent responses.</p>}
            {recentResponses.map(resp => (
              <div key={resp.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center text-white text-sm">👤</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{resp.survey}</p>
                  <p className="text-xs text-gray-500">{resp.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
            {notifications.length === 0 && <p className="text-gray-500">No notifications.</p>}
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <span className="text-lg">{getNotificationIcon(n.type)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            <Link to="/notifications" className="block text-center text-teal-500 hover:text-teal-600 text-sm font-medium mt-4">
              View All Notifications →
            </Link>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>  
  );
};

export default StaffDashboard;
