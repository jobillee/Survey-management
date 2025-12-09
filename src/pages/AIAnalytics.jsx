import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../lib/supabase'; // your Supabase client

const AIAnalytics = () => {
  const { session, user, isAdmin, isStaff } = useAuth(); // get user info
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSurveys(); // only fetch if logged in
  }, [user]);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      let query = supabase.from('surveys').select('*').order('created_at', { ascending: false });

      // Optional: filter surveys by role
      if (!isAdmin && isStaff) {
        query = query.eq('department', user.department); // staff see only their department
      } else if (!isAdmin && !isStaff) {
        query = query.eq('status', 'active'); // regular users see active surveys only
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

  const runAnalysis = async () => {
    if (!selectedSurvey) return;
    
    setAnalyzing(true);
    
    // Here you would call your AI API in production
    setTimeout(() => {
      setAnalysis({
        summary: {
          totalResponses: selectedSurvey.responses || 0,
          completionRate: 87,
          averageTime: '4.5 minutes',
          sentiment: 'Positive'
        },
        sentimentBreakdown: {
          positive: 68,
          neutral: 22,
          negative: 10
        },
        keyInsights: [
          {
            type: 'positive',
            title: 'High Course Satisfaction',
            description: '78% of students rated the course quality as "Good" or "Excellent".'
          },
          {
            type: 'suggestion',
            title: 'More Practice Exercises Requested',
            description: '45% suggested adding more coding practice exercises.'
          },
          {
            type: 'warning',
            title: 'Office Hours Accessibility',
            description: '32% had difficulty accessing office hours.'
          }
        ],
        topicAnalysis: [
          { topic: 'Course Content', sentiment: 82, mentions: 156 },
          { topic: 'Instructor Teaching', sentiment: 89, mentions: 134 }
        ],
        wordCloud: [
          { word: 'helpful', count: 89 },
          { word: 'clear', count: 76 }
        ],
        recommendations: [
          'Add more interactive coding exercises.',
          'Expand office hours or virtual Q&A sessions.'
        ]
      });
      setAnalyzing(false);
    }, 2500);
  };

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Please log in to access analytics</h2>
          <p className="text-gray-500">You must be logged in to view surveys and AI insights.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              AI-Powered Analytics
            </h1>
            <p className="text-gray-500">Get intelligent insights from your survey responses</p>
          </div>
        </div>

        {/* Survey Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Select a Survey to Analyze</h3>
          {loading ? (
            <p className="text-gray-500">Loading surveys...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey) => (
                <button
                  key={survey.id}
                  onClick={() => setSelectedSurvey(survey)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedSurvey?.id === survey.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-800 mb-1">{survey.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>📝 {survey.responses || 0} responses</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      survey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {survey.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={runAnalysis}
              disabled={!selectedSurvey || analyzing}
              className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#1A1F36' }}
            >
              {analyzing ? <>⏳ Analyzing...</> : <>🤖 Generate AI Analysis</>}
            </button>
          </div>
        </div>

        {/* Empty State */}
        {analysis &&  (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Analyze</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Select a survey above and click "Generate AI Analysis" to get intelligent insights, sentiment analysis, and actionable recommendations.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIAnalytics;

