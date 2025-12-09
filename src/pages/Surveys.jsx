import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';

const Surveys = () => {
  const { user, isAdmin } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Fetch surveys from Supabase
  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        let query = supabase.from('surveys').select(`
          id, title, description, status, created_at, end_date, user_id, questions_count,
          responses_count
        `).order('created_at', { ascending: false });

        // If not admin, show only user's surveys
        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        setSurveys(data);
      } catch (error) {
        console.error('Error fetching surveys:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [user, isAdmin]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return;

    try {
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      if (error) throw error;

      setSurveys(surveys.filter(s => s.id !== id));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting survey:', error.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { error } = await supabase.from('surveys').update({ status }).eq('id', id);
      if (error) throw error;

      setSurveys(surveys.map(s => (s.id === id ? { ...s, status } : s)));
    } catch (error) {
      console.error('Error updating status:', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'archived': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredSurveys = surveys.filter(s => {
    const search = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const status = filterStatus === 'all' || s.status === filterStatus;
    return search && status;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isAdmin ? 'All Surveys' : 'My Surveys'}
            </h1>
            <p className="text-gray-500">Manage and monitor your surveys</p>
          </div>
          <Link
            to="/surveys/create"
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105 flex items-center gap-2 w-fit"
            style={{ backgroundColor: '#1A1F36' }}
          >
            <span>➕</span>
            <span>Create Survey</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'draft', 'closed', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Surveys Grid */}
        {loading ? (
          <p className="text-gray-500">Loading surveys...</p>
        ) : filteredSurveys.length === 0 ? (
          <p className="text-gray-500">No surveys found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSurveys.map((survey) => (
              <div key={survey.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(survey.status)}`}>
                    {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                  </span>
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">⋮</button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden group-hover:block z-10">
                      <Link
                        to={`/surveys/${survey.id}/edit`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        ✏️ Edit Survey
                      </Link>
                      <Link
                        to={`/surveys/${survey.id}/responses`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        📊 View Responses
                      </Link>
                      {survey.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(survey.id, 'active')}
                          className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                        >
                          🚀 Publish
                        </button>
                      )}
                      {survey.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(survey.id, 'closed')}
                          className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-gray-50"
                        >
                          🔒 Close Survey
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteModal(survey)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{survey.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{survey.description}</p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <span>📝</span>
                    <span>{survey.responses_count || 0} responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>❓</span>
                    <span>{survey.questions_count || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>{survey.created_by}</span>
                  </div>
                  {survey.end_date && (
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Ends: {survey.end_date}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/surveys/${survey.id}/responses`}
                    className="flex-1 py-2 text-center rounded-lg font-medium text-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    View Results
                  </Link>
                  <Link
                    to={`/surveys/${survey.id}/edit`}
                    className="flex-1 py-2 text-center rounded-lg font-medium text-sm text-white"
                    style={{ backgroundColor: '#1A1F36' }}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Surveys;
