import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';

const AvailableSurveys = () => {
  const { session, user } = useAuth(); // get session and user user
  const userId = user?.id; // Supabase user id
  const [surveys, setSurveys] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchSurveys(); // only fetch if user is logged in
  }, [userId]);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      // Fetch surveys that are relevant to the user
      // Optional: You can join with a 'responses' table to filter out completed surveys
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) throw error;

      setSurveys(data);
    } catch (error) {
      console.error('Error fetching surveys:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">New</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Completed</span>;
      default:
        return null;
    }
  };

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'urgent' && survey.is_urgent) ||
      (filterType === 'in_progress' && survey.status === 'in_progress') ||
      (filterType === 'new' && survey.status === 'new');

    return matchesSearch && matchesFilter;
  });

  const urgentSurveys = surveys.filter((s) => s.is_urgent);

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Please log in to view available surveys</h2>
          <p className="text-gray-500">You must be logged in to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Available Surveys
          </h1>
          <p className="text-gray-500">Complete surveys to share your valuable feedback</p>
        </div>

        {/* Urgent Surveys Alert */}
        {urgentSurveys.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-semibold text-red-800">Urgent Surveys</h3>
                <p className="text-sm text-red-600">
                  You have {urgentSurveys.length} survey{urgentSurveys.length > 1 ? 's' : ''} with approaching deadlines
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search, Filters, and Survey Grid */}
        {loading ? (
          <p className="text-gray-500">Loading surveys...</p>
        ) : (
          <>
            {/* Search & Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search surveys by title, description, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'urgent', label: '⚡ Urgent' },
                    { value: 'new', label: 'New' },
                    { value: 'in_progress', label: 'In Progress' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setFilterType(filter.value)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filterType === filter.value
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Surveys Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all ${
                    survey.is_urgent ? 'border-red-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    {getStatusBadge(survey.status)}
                    {survey.is_urgent && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">⚡ Urgent</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{survey.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{survey.description}</p>
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <span>👨‍🏫</span>
                      <span>{survey.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🏢</span>
                      <span>{survey.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className={survey.is_urgent ? 'text-red-600 font-medium' : ''}>Due: {survey.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏱️</span>
                      <span>{survey.estimated_time} • {survey.questions} questions</span>
                    </div>
                  </div>
                  <Link
                    to={`/survey/${survey.id}/answer`}
                    className="block w-full py-3 text-center rounded-xl font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#1A1F36' }}
                  >
                    {survey.status === 'in_progress' ? 'Continue Survey' : 'Start Survey'}
                  </Link>
                </div>
              ))}

              {filteredSurveys.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center col-span-full">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No surveys available</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Check back later for new surveys'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AvailableSurveys;
