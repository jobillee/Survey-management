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
  const [openMenu, setOpenMenu] = useState(null); // ✅ controls menu

  // ✅ Fetch surveys
  useEffect(() => {
    const fetchSurveys = async () => {
      if (!user) return;

      setLoading(true);

      let query = supabase
        .from('surveys')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          end_date,
          user_id,
          questions_count,
          responses_count
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (!error) setSurveys(data || []);
      else console.error(error);

      setLoading(false);
    };

    fetchSurveys();
  }, [user, isAdmin]);

  // ✅ Delete survey
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return;

    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    if (!error) {
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      setOpenMenu(null);
    } else {
      alert('Delete failed: ' + error.message);
    }
  };

  // ✅ Update survey status
  const handleStatusChange = async (id, status) => {
    const { error } = await supabase
      .from('surveys')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setSurveys((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
      setOpenMenu(null);
    } else {
      alert('Update failed: ' + error.message);
    }
  };

  // ✅ Colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredSurveys = surveys.filter((s) => {
    const searchMatch =
      s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch =
      filterStatus === 'all' || s.status === filterStatus;

    return searchMatch && statusMatch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isAdmin ? 'All Surveys' : 'My Surveys'}
            </h1>
            <p className="text-gray-500">Manage and monitor your surveys</p>
          </div>

          <Link
            to="/surveys/create"
            className="px-6 py-3 rounded-xl font-medium text-white"
            style={{ backgroundColor: '#1A1F36' }}
          >
            ➕ Create Survey
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search surveys..."
              className="px-4 py-2 border rounded-lg w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {['all', 'active', 'draft', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg ${
                  filterStatus === status
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <p>Loading...</p>
        ) : filteredSurveys.length === 0 ? (
          <p>No surveys found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSurveys.map((survey) => (
              <div key={survey.id} className="bg-white p-5 rounded-xl border shadow">

                {/* Status + menu */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(survey.status)}`}>
                    {survey.status}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === survey.id ? null : survey.id)
                      }
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      ⋮
                    </button>

                    {openMenu === survey.id && (
                      <div className="absolute right-0 mt-1 bg-white border shadow rounded-lg w-44 z-50">
                        <Link
                          to={`/surveys/${survey.id}/edit`}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          ✏️ Edit
                        </Link>

                        {survey.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(survey.id, 'active')}
                            className="w-full text-left px-4 py-2 text-green-600 hover:bg-gray-100"
                          >
                            🚀 Publish
                          </button>
                        )}

                        {survey.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(survey.id, 'closed')}
                            className="w-full text-left px-4 py-2 text-yellow-600 hover:bg-gray-100"
                          >
                            🔒 Close
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(survey.id)}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 mb-1">{survey.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{survey.description}</p>

                <div className="text-sm text-gray-500 space-y-1 mb-4">
                  <div>📝 {survey.responses_count || 0} responses</div>
                  <div>❓ {survey.questions_count || 0} questions</div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/surveys/${survey.id}/responses`}
                    className="flex-1 text-center py-2 border rounded-lg text-sm"
                  >
                    View Results
                  </Link>
                  <Link
                    to={`/surveys/${survey.id}/edit`}
                    className="flex-1 text-center py-2 rounded-lg text-sm text-white"
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
