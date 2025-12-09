import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../lib/supabase';

const SurveyAnswer = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  // --- Fetch survey and questions from Supabase ---
  const fetchSurvey = async () => {
    setLoading(true);
    try {
      // Fetch survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      setSurvey({ ...surveyData, questions: questionsData });
    } catch (error) {
      console.error('Error fetching survey:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleCheckboxChange = (questionId, optionId) => {
    const current = answers[questionId] || [];
    const newAnswers = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    setAnswers({ ...answers, [questionId]: newAnswers });
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // Validate required
    const unansweredRequired = survey.questions.filter(q => q.is_required && !answers[q.id]);
    if (unansweredRequired.length > 0) {
      alert('Please answer all required questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const insertData = survey.questions.map(q => ({
        survey_id: survey.id,
        question_id: q.id,
        user_id: profile?.id || null,
        answer: answers[q.id] || null
      }));

      const { error } = await supabase.from('survey_answers').insert(insertData);

      if (error) throw error;

      navigate('/my-responses', { state: { submitted: true } });
    } catch (error) {
      console.error('Error submitting answers:', error.message);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    if (!survey) return 0;
    const answered = Object.keys(answers).length;
    const total = survey.questions.length;
    return Math.round((answered / total) * 100);
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading survey...</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Survey Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <p className="text-white/90">{survey.description}</p>
          <div className="flex items-center gap-4 text-sm mt-2">
            <span>👨‍🏫 {survey.instructor}</span>
            {survey.is_anonymous && <span className="bg-white/20 px-3 py-1 rounded-full">🔒 Anonymous</span>}
            <span>❓ {survey.questions.length} questions</span>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{getProgress()}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${getProgress()}%` }} />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {survey.questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-400">Question {index + 1}</span>
                    {q.is_required && <span className="text-xs px-2 py-0.5 bg-red-100 rounded-full text-red-600">Required</span>}
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">{q.question_text}</h3>
                </div>
              </div>

              {/* Render based on question type */}
              {q.question_type === 'rating_scale' && (
                <div className="flex items-center gap-4 py-4">
                  {[...Array(q.settings?.max_rating || 5)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswerChange(q.id, i + 1)}
                      className={`text-4xl ${answers[q.id] && answers[q.id] >= i + 1 ? 'text-yellow-400' : 'text-gray-300'}`}
                    >⭐</button>
                  ))}
                </div>
              )}

              {['multiple_choice', 'checkbox'].includes(q.question_type) && (
                <div className="space-y-2">
                  {q.options.map(option => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        q.question_type === 'multiple_choice'
                          ? (answers[q.id] === option.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300')
                          : ((answers[q.id] || []).includes(option.id) ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300')
                      }`}
                    >
                      <input
                        type={q.question_type === 'multiple_choice' ? 'radio' : 'checkbox'}
                        checked={
                          q.question_type === 'multiple_choice'
                            ? answers[q.id] === option.id
                            : (answers[q.id] || []).includes(option.id)
                        }
                        onChange={() =>
                          q.question_type === 'multiple_choice'
                            ? handleAnswerChange(q.id, option.id)
                            : handleCheckboxChange(q.id, option.id)
                        }
                        className="w-4 h-4 text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-gray-700">{option.option_text}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'text_input' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              )}

              {q.question_type === 'textarea' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Type your detailed response here..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
          <p className="text-gray-600">
            {survey.is_anonymous ? '🔒 Your response is anonymous' : `Your response will be submitted as ${profile?.full_name}`}
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1A1F36' }}
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SurveyAnswer;
