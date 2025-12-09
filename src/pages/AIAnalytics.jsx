import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { supabase } from '../lib/supabase';

const AIAnalytics = () => {
  const [user, setUser] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    fetchUserAndSurveys();
  }, []);

  // Fetch logged-in user and active surveys from Supabase
  const fetchUserAndSurveys = async () => {
    try {
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      setUser(user);

      // Fetch surveys (optionally filter based on role or status)
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('id, title, status, responses_count') // assuming `responses_count` is a column or use a related query
        .order('created_at', { ascending: false })
        .limit(10);

      if (surveyError) throw surveyError;

      setSurveys(surveyData || []);
    } catch (err) {
      console.error('Error fetching surveys or user:', err);
    }
  };

  const runAnalysis = async () => {
    if (!selectedSurvey) return;
    setAnalyzing(true);

    try {
      // Fetch survey responses for the selected survey
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', selectedSurvey.id);

      if (error) throw error;

      // Simulate AI analysis
      setTimeout(() => {
        const totalResponses = responses?.length || 0;
        setAnalysis({
          summary: {
            totalResponses,
            completionRate: totalResponses > 0 ? Math.floor(Math.random() * 100) : 0,
            averageTime: `${(Math.random() * 5 + 2).toFixed(1)} minutes`,
            sentiment: ['Positive', 'Neutral', 'Negative'][Math.floor(Math.random() * 3)]
          },
          sentimentBreakdown: {
            positive: Math.floor(Math.random() * 80),
            neutral: Math.floor(Math.random() * 50),
            negative: Math.floor(Math.random() * 30)
          },
          keyInsights: [
            {
              type: 'positive',
              title: 'High Course Satisfaction',
              description: 'Most students rated this survey positively.'
            },
            {
              type: 'suggestion',
              title: 'Room for Improvement',
              description: 'Some feedback suggests improvements in course content.'
            },
            {
              type: 'warning',
              title: 'Low Participation in Some Sections',
              description: 'Consider sending reminders to increase responses.'
            }
          ],
          topicAnalysis: [
            { topic: 'Content', sentiment: 80, mentions: 45 },
            { topic: 'Instructor', sentiment: 90, mentions: 38 },
          ],
          wordCloud: [
            { word: 'helpful', count: 30 },
            { word: 'clear', count: 25 },
            { word: 'challenging', count: 20 },
          ],
          recommendations: [
            'Provide additional resources to students',
            'Encourage more participation in surveys',
            'Analyze trends over multiple semesters'
          ]
        });
        setAnalyzing(false);
      }, 2500);
    } catch (err) {
      console.error('Error fetching responses:', err);
      setAnalyzing(false);
    }
  };

  const getSentimentColor = (type) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-700 border-green-200';
      case 'suggestion': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'negative': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSentimentIcon = (type) => {
    switch (type) {
      case 'positive': return '✅';
      case 'suggestion': return '💡';
      case 'warning': return '⚠️';
      case 'negative': return '❌';
      default: return '📌';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold">AI-Powered Analytics</h1>
        <p className="text-gray-500">Get intelligent insights from your survey responses</p>

        {/* Survey Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Select a Survey</h3>
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
                  <span>📝 {survey.responses_count || 0} responses</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    survey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>{survey.status}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={runAnalysis}
              disabled={!selectedSurvey || analyzing}
              className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1A1F36' }}
            >
              {analyzing ? 'Analyzing...' : 'Generate AI Analysis'}
            </button>
          </div>
        </div>

        {/* Render analysis if available */}
        {analysis && (
          <div className="space-y-6 mt-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-teal-500 text-white p-5 rounded-2xl">
                <div>Total Responses</div>
                <div className="text-2xl font-bold">{analysis.summary.totalResponses}</div>
              </div>
              <div className="bg-violet-500 text-white p-5 rounded-2xl">
                <div>Completion Rate</div>
                <div className="text-2xl font-bold">{analysis.summary.completionRate}%</div>
              </div>
              <div className="bg-orange-400 text-white p-5 rounded-2xl">
                <div>Avg. Response Time</div>
                <div className="text-2xl font-bold">{analysis.summary.averageTime}</div>
              </div>
              <div className="bg-green-400 text-white p-5 rounded-2xl">
                <div>Overall Sentiment</div>
                <div className="text-2xl font-bold">{analysis.summary.sentiment}</div>
              </div>
            </div>
            {/* Key Insights */}
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.keyInsights.map((insight, idx) => (
                <div key={idx} className={`p-4 border rounded-xl ${getSentimentColor(insight.type)}`}>
                  <div className="flex gap-2">
                    <span>{getSentimentIcon(insight.type)}</span>
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIAnalytics;
