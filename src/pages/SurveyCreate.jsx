import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../lib/supabase';

const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '🔘' },
  { value: 'checkbox', label: 'Checkbox (Multiple)', icon: '☑️' },
  { value: 'rating_scale', label: 'Rating Scale', icon: '⭐' },
  { value: 'text_input', label: 'Short Text', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'dropdown', label: 'Dropdown', icon: '📋' },
];

const SurveyCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    is_anonymous: false,
    start_date: '',
    end_date: '',
    status: 'draft'
  });

  const [questions, setQuestions] = useState([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    is_required: false,
    options: ['', ''],
    settings: { min_rating: 1, max_rating: 5 }
  });

  // --- QUESTION HANDLERS ---
  const handleAddQuestion = () => {
    if (!newQuestion.question_text.trim()) return;
    const question = {
      ...newQuestion,
      id: Date.now(),
      order_index: questions.length
    };
    setQuestions([...questions, question]);
    resetQuestionForm();
  };

  const handleUpdateQuestion = () => {
    if (!newQuestion.question_text.trim()) return;
    setQuestions(questions.map(q =>
      q.id === editingQuestion.id ? { ...newQuestion, id: q.id, order_index: q.order_index } : q
    ));
    resetQuestionForm();
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setNewQuestion({
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      options: question.options || ['', ''],
      settings: question.settings || { min_rating: 1, max_rating: 5 }
    });
    setShowAddQuestion(true);
  };

  const resetQuestionForm = () => {
    setNewQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      is_required: false,
      options: ['', ''],
      settings: { min_rating: 1, max_rating: 5 }
    });
    setEditingQuestion(null);
    setShowAddQuestion(false);
  };

  const addOption = () => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ''] });
  const updateOption = (i, value) => {
    const opts = [...newQuestion.options]; opts[i] = value;
    setNewQuestion({ ...newQuestion, options: opts });
  };
  const removeOption = (i) => {
    if (newQuestion.options.length > 2) {
      setNewQuestion({ ...newQuestion, options: newQuestion.options.filter((_, idx) => idx !== i) });
    }
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < questions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      newQuestions.forEach((q, i) => q.order_index = i);
      setQuestions(newQuestions);
    }
  };

  // --- SAVE SURVEY TO SUPABASE ---
  const handleSaveSurvey = async (status = 'draft') => {
    if (!surveyData.title || questions.length === 0) return;

    setLoading(true);

    try {
      // Insert survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert([{
          title: surveyData.title,
          description: surveyData.description,
          is_anonymous: surveyData.is_anonymous,
          start_date: surveyData.start_date,
          end_date: surveyData.end_date,
          status,
          created_by: user?.id
        }])
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Insert questions linked to survey.id
      const questionsToInsert = questions.map(q => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        options: q.options,
        settings: q.settings,
        order_index: q.order_index
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      setLoading(false);
      navigate('/surveys');
    } catch (error) {
      console.error('Error saving survey:', error.message);
      setLoading(false);
    }
  };

  const needsOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(newQuestion.question_type);


  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Create New Survey
            </h1>
            <p className="text-gray-500">Design your survey with customizable questions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSaveSurvey('draft')}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSaveSurvey('active')}
              disabled={loading || !surveyData.title || questions.length === 0}
              className="px-6 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#5EE6C5', color: '#1A1F36' }}
            >
              Publish Survey
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'details' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Survey Details
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'questions' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ❓ Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'settings' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Survey Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Survey Title *</label>
              <input
                type="text"
                value={surveyData.title}
                onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
                placeholder="Enter survey title..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={surveyData.description}
                onChange={(e) => setSurveyData({ ...surveyData, description: e.target.value })}
                placeholder="Describe the purpose of this survey..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={surveyData.start_date}
                  onChange={(e) => setSurveyData({ ...surveyData, start_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={surveyData.end_date}
                  onChange={(e) => setSurveyData({ ...surveyData, end_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Questions List */}
            {questions.map((question, index) => (
              <div 
                key={question.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => moveQuestion(index, -1)}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <span className="text-center text-sm text-gray-400">{index + 1}</span>
                      <button 
                        onClick={() => moveQuestion(index, 1)}
                        disabled={index === questions.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">
                          {questionTypes.find(t => t.value === question.question_type)?.icon}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                          {questionTypes.find(t => t.value === question.question_type)?.label}
                        </span>
                        {question.is_required && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 rounded-full text-red-600">
                            Required
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-medium text-gray-800">{question.question_text}</h4>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {question.options.filter(o => o).map((option, i) => (
                            <div key={i} className="flex items-center gap-2 text-gray-600">
                              <span className="w-4 h-4 border border-gray-300 rounded-full"></span>
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.question_type === 'rating_scale' && (
                        <div className="mt-3 flex items-center gap-2">
                          {[...Array(question.settings?.max_rating || 5)].map((_, i) => (
                            <span key={i} className="text-2xl text-gray-300">⭐</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-red-500"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Question Form */}
            {showAddQuestion ? (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-teal-200 p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {questionTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setNewQuestion({ ...newQuestion, question_type: type.value })}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                          newQuestion.question_type === type.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                  <input
                    type="text"
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                    placeholder="Enter your question..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                
                {needsOptions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => removeOption(index)}
                            disabled={newQuestion.options.length <= 2}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addOption}
                        className="text-teal-500 hover:text-teal-600 text-sm font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}
                
                {newQuestion.question_type === 'rating_scale' && (
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newQuestion.settings.min_rating}
                        onChange={(e) => setNewQuestion({
                          ...newQuestion,
                          settings: { ...newQuestion.settings, min_rating: parseInt(e.target.value) }
                        })}
                        className="w-20 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Rating</label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={newQuestion.settings.max_rating}
                        onChange={(e) => setNewQuestion({
                          ...newQuestion,
                          settings: { ...newQuestion.settings, max_rating: parseInt(e.target.value) }
                        })}
                        className="w-20 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={newQuestion.is_required}
                    onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500"
                  />
                  <label htmlFor="is_required" className="text-sm text-gray-700">Required question</label>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetQuestionForm}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                    disabled={!newQuestion.question_text.trim()}
                    className="px-6 py-2 rounded-xl font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: '#1A1F36' }}
                  >
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddQuestion(true)}
                className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-teal-400 text-gray-500 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-2xl">➕</span>
                <span className="font-medium">Add Question</span>
              </button>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h4 className="font-medium text-gray-800">Anonymous Responses</h4>
                <p className="text-sm text-gray-500">Respondents' identities will be hidden</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={surveyData.is_anonymous}
                  onChange={(e) => setSurveyData({ ...surveyData, is_anonymous: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="font-medium text-blue-800">Tips for Better Surveys</h4>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Keep surveys focused and concise</li>
                    <li>• Use clear and simple language</li>
                    <li>• Include a mix of question types</li>
                    <li>• Test your survey before publishing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SurveyCreate;

