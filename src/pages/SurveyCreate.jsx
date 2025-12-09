import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { id } = useParams(); // survey ID for editing
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    is_anonymous: false,
    start_date: '',
    end_date: '',
    status: user?.role === 'staff' ? 'pending' : 'draft',
  });

  const [questions, setQuestions] = useState([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    is_required: false,
    options: ['', ''],
    settings: { min_rating: 1, max_rating: 5 },
  });

  // Load survey if editing
  useEffect(() => {
  const fetchSurvey = async () => {
    if (!id) return; // creating new survey

    setLoading(true);
    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      alert('Failed to load survey');
      setLoading(false);
      return;
    }

    // STAFF: only allow editing their own surveys
    if (user.role === 'staff' && survey.user_id !== user.id) {
      alert('You cannot edit this survey');
      navigate('/staff-dashboard', { replace: true });
      return;
    }

    setSurveyData({
      title: survey.title,
      description: survey.description,
      is_anonymous: survey.is_anonymous,
      start_date: survey.start_date || '',
      end_date: survey.end_date || '',
      status: survey.status,
    });

    const { data: qs, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index', { ascending: true });

    if (qError) console.error(qError);

    setQuestions(qs || []);
    setLoading(false);
  };

  fetchSurvey();
}, [id, user, navigate]);


  // --- Question Handlers ---
  const resetQuestionForm = () => {
    setNewQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      is_required: false,
      options: ['', ''],
      settings: { min_rating: 1, max_rating: 5 },
    });
    setEditingQuestion(null);
    setShowAddQuestion(false);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question_text.trim()) return alert('Question text cannot be empty');
    const needsOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(newQuestion.question_type);
    if (needsOptions && newQuestion.options.some(o => !o.trim())) return alert('Please fill all options');
    const question = { ...newQuestion, id: Date.now(), order_index: questions.length };
    setQuestions([...questions, question]);
    resetQuestionForm();
  };

  const handleUpdateQuestion = () => {
    if (!newQuestion.question_text.trim()) return alert('Question text cannot be empty');
    const needsOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(newQuestion.question_type);
    if (needsOptions && newQuestion.options.some(o => !o.trim())) return alert('Please fill all options');
    setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...newQuestion, id: q.id, order_index: q.order_index } : q));
    resetQuestionForm();
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id).map((q, i) => ({ ...q, order_index: i })));
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setNewQuestion({
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      options: question.options || ['', ''],
      settings: question.settings || { min_rating: 1, max_rating: 5 },
    });
    setShowAddQuestion(true);
  };

  const addOption = () => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ''] });
  const updateOption = (i, value) => { const opts = [...newQuestion.options]; opts[i] = value; setNewQuestion({ ...newQuestion, options: opts }); };
  const removeOption = (i) => { if (newQuestion.options.length > 2) setNewQuestion({ ...newQuestion, options: newQuestion.options.filter((_, idx) => idx !== i) }); };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < questions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      newQuestions.forEach((q, i) => q.order_index = i);
      setQuestions(newQuestions);
    }
  };

  // --- Save Survey ---
  const handleSaveSurvey = async (statusOverride = null) => {
  if (!surveyData.title.trim()) return alert('Survey title is required');
  if (showAddQuestion && newQuestion.question_text.trim()) handleAddQuestion();
  if (questions.length === 0) return alert('Add at least one question');

  setLoading(true);
  try {
    let surveyId = id;
    let finalStatus = statusOverride || surveyData.status;

    // Staff surveys remain pending
    if (user.role === 'staff') finalStatus = 'pending';

    if (id) {
      await supabase
        .from('surveys')
        .update({ ...surveyData, status: finalStatus })
        .eq('id', id);

      // delete old questions before inserting new
      await supabase.from('questions').delete().eq('survey_id', id);
    } else {
      const { data, error } = await supabase
        .from('surveys')
        .insert([{ ...surveyData, status: finalStatus, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      surveyId = data.id;
    }

    const questionsToInsert = questions.map(q => ({
      survey_id: surveyId,
      question_text: q.question_text.trim(),
      question_type: q.question_type,
      is_required: q.is_required,
      options: q.options?.filter(o => o.trim()) || null,
      settings: q.settings || null,
      order_index: q.order_index,
    }));

    const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
    if (qError) throw qError;

    setLoading(false);

    // Redirect based on role
    if (user.role === 'staff') navigate('/staff-dashboard', { replace: true });
    if (user.role === 'admin') navigate('/admin-dashboard', { replace: true });
  } catch (err) {
    console.error(err);
    alert('Failed to save survey');
    setLoading(false);
  }
};


  // --- Admin Approve Survey ---
  const handleApproveSurvey = async () => {
    if (!id || user.role !== 'admin') return;
    try {
      await supabase.from('surveys').update({ status: 'approved' }).eq('id', id);
      alert('Survey approved!');
      navigate('/admin-dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to approve survey');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{id ? 'Edit Survey' : 'Create Survey'}</h1>

        {/* Buttons */}
        <div className="flex gap-3">
  <button onClick={() => handleSaveSurvey()} className="px-4 py-2 bg-gray-200 rounded">
    Save
  </button>

  {/* Admin can approve staff surveys */}
  {user.role === 'admin' && surveyData.status === 'pending' && (
    <button
      onClick={handleApproveSurvey}
      className="px-4 py-2 bg-green-500 text-white rounded"
    >
      Approve
    </button>
  )}
</div>


        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {['details', 'questions', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'details' && '📋 Survey Details'}
              {tab === 'questions' && `❓ Questions (${questions.length})`}
              {tab === 'settings' && '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* Tabs Content */}
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

        {activeTab === 'questions' && (
  <div className="space-y-5">

    {/* QUESTIONS LIST */}
    {questions.length === 0 && !showAddQuestion && (
      <div className="text-center text-gray-400 py-10">
        No questions added yet.
      </div>
    )}

    {questions.map((question, index) => (
      <div
  key={question.id}
  className="bg-white p-5 rounded-2xl border shadow-sm flex justify-between items-start relative overflow-visible"
>


        <div className="flex gap-4 flex-1">
          {/* ORDER */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => moveQuestion(index, -1)}
              disabled={index === 0}
              className="text-gray-500 hover:text-black disabled:opacity-30"
            >
              ↑
            </button>
            <span className="text-sm text-gray-400">{index + 1}</span>
            <button
              onClick={() => moveQuestion(index, 1)}
              disabled={index === questions.length - 1}
              className="text-gray-500 hover:text-black disabled:opacity-30"
            >
              ↓
            </button>
          </div>

          {/* QUESTION */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {questionTypes.find(t => t.value === question.question_type)?.icon}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {questionTypes.find(t => t.value === question.question_type)?.label}
              </span>
              {question.is_required && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                  Required
                </span>
              )}
            </div>

            <h4 className="font-semibold text-gray-800">
              {question.question_text}
            </h4>

            {/* OPTIONS PREVIEW */}
            {['multiple_choice', 'checkbox', 'dropdown'].includes(question.question_type) && (
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {question.options?.map((opt, i) => (
                  <li key={i} className="flex gap-2 items-center">
                    <span className="w-3 h-3 border rounded-full"></span>
                    {opt}
                  </li>
                ))}
              </ul>
            )}

            {/* RATING PREVIEW */}
            {question.question_type === 'rating_scale' && (
              <div className="flex gap-1 mt-2 text-gray-300 text-xl">
                {Array(question.settings?.max_rating || 5)
                  .fill('★')
                  .map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
<div className="flex gap-2 relative z-20 pointer-events-auto">

          <button
  onClick={() => handleEditQuestion(question)}
  className="p-2 rounded hover:bg-gray-100 relative z-20"
>
  ✏️
</button>

<button
  onClick={() => handleDeleteQuestion(question.id)}
  className="p-2 rounded hover:bg-red-50 text-red-500 relative z-20"
>
  🗑️
</button>

        </div>
      </div>
    ))}

    {/* ADD / EDIT FORM */}
    {showAddQuestion ? (
      <div className="bg-white p-6 rounded-2xl border-2 border-teal-300 space-y-4">
        <h3 className="font-bold text-lg">
          {editingQuestion ? 'Edit Question' : 'Add Question'}
        </h3>

        {/* TYPE SELECT */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {questionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() =>
                setNewQuestion({ ...newQuestion, question_type: type.value })
              }
              className={`p-3 rounded-xl border flex gap-2 items-center ${
                newQuestion.question_type === type.value
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>

        {/* QUESTION TEXT */}
        <input
          type="text"
          value={newQuestion.question_text}
          onChange={(e) =>
            setNewQuestion({ ...newQuestion, question_text: e.target.value })
          }
          placeholder="Enter your question..."
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500"
        />

        {/* OPTIONS */}
        {['multiple_choice', 'checkbox', 'dropdown'].includes(newQuestion.question_type) && (
          <div className="space-y-2">
            {newQuestion.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 p-2 border rounded-xl"
                  placeholder={`Option ${i + 1}`}
                />
                <button
                  disabled={newQuestion.options.length <= 2}
                  onClick={() => removeOption(i)}
                  className="text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addOption}
              className="text-teal-600 text-sm"
            >
              + Add Option
            </button>
          </div>
        )}

        {/* RATING */}
        {newQuestion.question_type === 'rating_scale' && (
          <div className="flex gap-4">
            <input
              type="number"
              min="1"
              max="10"
              value={newQuestion.settings.min_rating}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  settings: {
                    ...newQuestion.settings,
                    min_rating: parseInt(e.target.value),
                  },
                })
              }
              className="w-24 p-2 border rounded-xl"
            />
            <input
              type="number"
              min="2"
              max="10"
              value={newQuestion.settings.max_rating}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  settings: {
                    ...newQuestion.settings,
                    max_rating: parseInt(e.target.value),
                  },
                })
              }
              className="w-24 p-2 border rounded-xl"
            />
          </div>
        )}

        {/* REQUIRED */}
        <label className="flex gap-2 items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={newQuestion.is_required}
            onChange={(e) =>
              setNewQuestion({ ...newQuestion, is_required: e.target.checked })
            }
          />
          Required
        </label>

        {/* FORM ACTIONS */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={resetQuestionForm}
            className="px-4 py-2 border rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={
              editingQuestion ? handleUpdateQuestion : handleAddQuestion
            }
            className="px-6 py-2 bg-black text-white rounded-xl disabled:opacity-40"
            disabled={!newQuestion.question_text.trim()}
          >
            {editingQuestion ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => setShowAddQuestion(true)}
        className="w-full p-6 border-2 border-dashed rounded-2xl text-gray-500 hover:text-teal-600"
      >
        + Add Question
      </button>
    )}
  </div>
)}


        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h4 className="font-medium text-gray-800">Anonymous Responses</h4>
                <p className="text-sm text-gray-500">Respondents' identities will be hidden</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={surveyData.is_anonymous} onChange={(e) => setSurveyData({...surveyData, is_anonymous: e.target.checked})} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SurveyCreate;
