import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1A1F36',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#666666',
    width: 150,
  },
  value: {
    fontSize: 11,
    color: '#1A1F36',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '23%',
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F36',
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  questionBlock: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  questionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 8,
  },
  responseItem: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  responseLabel: {
    fontSize: 10,
    color: '#666666',
    width: 120,
  },
  responseBar: {
    height: 12,
    backgroundColor: '#5EE6C5',
    borderRadius: 4,
  },
  responsePercent: {
    fontSize: 10,
    color: '#1A1F36',
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#999999',
  },
  insight: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  insightText: {
    fontSize: 10,
    color: '#166534',
  },
});

// PDF Document Component
const SurveyReportPDF = ({ survey, responses, analysis }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>{survey.title}</Text>
        <Text style={pdfStyles.subtitle}>Survey Analysis Report • Generated on {new Date().toLocaleDateString()}</Text>
      </View>

      {/* Summary Stats */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Summary Statistics</Text>
        <View style={pdfStyles.statsGrid}>
          <View style={pdfStyles.statBox}>
            <Text style={pdfStyles.statValue}>{responses.total}</Text>
            <Text style={pdfStyles.statLabel}>Total Responses</Text>
          </View>
          <View style={pdfStyles.statBox}>
            <Text style={pdfStyles.statValue}>{responses.completionRate}%</Text>
            <Text style={pdfStyles.statLabel}>Completion Rate</Text>
          </View>
          <View style={pdfStyles.statBox}>
            <Text style={pdfStyles.statValue}>{responses.avgTime}</Text>
            <Text style={pdfStyles.statLabel}>Avg. Time</Text>
          </View>
          <View style={pdfStyles.statBox}>
            <Text style={pdfStyles.statValue}>{analysis.sentiment}</Text>
            <Text style={pdfStyles.statLabel}>Sentiment</Text>
          </View>
        </View>
      </View>

      {/* Survey Details */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Survey Details</Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Created By:</Text>
          <Text style={pdfStyles.value}>{survey.createdBy}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Department:</Text>
          <Text style={pdfStyles.value}>{survey.department}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Survey Period:</Text>
          <Text style={pdfStyles.value}>{survey.startDate} - {survey.endDate}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Total Questions:</Text>
          <Text style={pdfStyles.value}>{survey.questions}</Text>
        </View>
      </View>

      {/* Key Insights */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Key Insights</Text>
        {analysis.insights.map((insight, index) => (
          <View key={index} style={pdfStyles.insight}>
            <Text style={pdfStyles.insightText}>• {insight}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>InsightHub Survey Management System</Text>
        <Text style={pdfStyles.footerText}>Page 1 of 1</Text>
      </View>
    </Page>

    {/* Question Results Page */}
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>Question Analysis</Text>
        <Text style={pdfStyles.subtitle}>{survey.title}</Text>
      </View>

      {survey.questionResults.map((question, qIndex) => (
        <View key={qIndex} style={pdfStyles.questionBlock}>
          <Text style={pdfStyles.questionText}>Q{qIndex + 1}. {question.text}</Text>
          {question.responses.map((response, rIndex) => (
            <View key={rIndex} style={pdfStyles.responseItem}>
              <Text style={pdfStyles.responseLabel}>{response.label}</Text>
              <View style={[pdfStyles.responseBar, { width: `${response.percent * 2}%` }]} />
              <Text style={pdfStyles.responsePercent}>{response.percent}%</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>InsightHub Survey Management System</Text>
        <Text style={pdfStyles.footerText}>Page 2 of 2</Text>
      </View>
    </Page>
  </Document>
);

const Reports = () => {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [generating, setGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);

  useEffect(() => {
    fetchSurveys();
    fetchGeneratedReports();
  }, []);

  // --- Fetch surveys from Supabase ---
  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSurveys(data);
    } catch (error) {
      console.error('Error fetching surveys:', error.message);
    }
  };

  // --- Fetch generated reports (you can also fetch from a Supabase table if storing them) ---
  const fetchGeneratedReports = async () => {
    // Example: Could be stored in Supabase `generated_reports` table
    setGeneratedReports([
      { id: 1, survey: 'CS101 Course Evaluation', type: 'Summary', date: '2024-12-06', size: '245 KB' },
      { id: 2, survey: 'Campus Facilities Feedback', type: 'Detailed', date: '2024-12-01', size: '512 KB' },
    ]);
  };

  // --- Fetch survey responses for PDF generation ---
  const getSurveyReportData = async (surveyId) => {
    try {
      // Fetch survey details
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
        .order('id', { ascending: true });
      if (questionsError) throw questionsError;

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId);
      if (responsesError) throw responsesError;

      // Prepare aggregated stats
      const totalResponses = responsesData.length;
      const completionRate = totalResponses > 0 ? Math.round((totalResponses / totalResponses) * 100) : 0;
      const avgTime = totalResponses > 0
        ? (responsesData.reduce((acc, r) => acc + (r.completion_time || 0), 0) / totalResponses).toFixed(1) + ' min'
        : 'N/A';

      // Basic mock analysis for demo; could use AI for real insights
      const analysis = {
        sentiment: 'Positive',
        insights: [
          `Total responses: ${totalResponses}`,
          'Overall feedback is positive.',
        ]
      };

      // Format question results
      const questionResults = questionsData.map((q) => {
        const responseCounts = {};
        responsesData.forEach(r => {
          const ans = r.answers[q.id];
          if (Array.isArray(ans)) {
            ans.forEach(a => responseCounts[a] = (responseCounts[a] || 0) + 1);
          } else if (ans) {
            responseCounts[ans] = (responseCounts[ans] || 0) + 1;
          }
        });

        const responses = q.options?.map(opt => ({
          label: opt.option_text,
          percent: totalResponses > 0 ? Math.round((responseCounts[opt.id] || 0) / totalResponses * 100) : 0
        })) || [];

        return { text: q.question_text, responses };
      });

      return {
        survey: {
          title: surveyData.title,
          createdBy: surveyData.created_by,
          department: surveyData.department,
          startDate: surveyData.start_date,
          endDate: surveyData.end_date,
          questions: questionsData.length,
          questionResults,
        },
        responses: {
          total: totalResponses,
          completionRate,
          avgTime,
        },
        analysis
      };
    } catch (error) {
      console.error('Error preparing report data:', error.message);
      return null;
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedSurvey) return;
    setGenerating(true);
    await getSurveyReportData(selectedSurvey.id);
    setGenerating(false);
  };

  const reportTypes = [
    { value: 'summary', label: 'Summary Report', description: 'Overview with key statistics and insights', icon: '📊' },
    { value: 'detailed', label: 'Detailed Report', description: 'Full analysis with all responses', icon: '📋' },
    { value: 'department', label: 'Department Report', description: 'Comparison across departments', icon: '🏢' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">PDF Report Generation</h1>
        <p className="text-gray-500">Export professional survey reports for documentation</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Generator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Survey */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4">1. Select Survey</h3>
              <div className="space-y-3">
                {surveys.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSurvey(s)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedSurvey?.id === s.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{s.title}</h4>
                        <p className="text-xs text-gray-500">{s.status} • {s.start_date}</p>
                      </div>
                      {selectedSurvey?.id === s.id && <span className="text-teal-500">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Report Type */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4">2. Select Report Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setReportType(type.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${reportType === type.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl mb-2 block">{type.icon}</span>
                    <h4 className="font-medium">{type.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate & Download */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4">3. Generate & Download</h3>
              {selectedSurvey ? (
                <PDFDownloadLink
                  document={<SurveyReportPDF {...getMockReportData(selectedSurvey.id)} />}
                  fileName={`${selectedSurvey.title.replace(/\s+/g, '_')}_Report.pdf`}
                >
                  {({ loading: pdfLoading }) => (
                    <button
                      disabled={pdfLoading}
                      className="px-6 py-3 rounded-xl font-medium text-white"
                      style={{ backgroundColor: '#1A1F36' }}
                    >
                      {pdfLoading ? 'Generating...' : 'Download PDF'}
                    </button>
                  )}
                </PDFDownloadLink>
              ) : (
                <p className="text-gray-500 text-center py-4">Please select a survey to generate a report</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Reports */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4">Recent Reports</h3>
              {generatedReports.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{r.survey}</h4>
                      <p className="text-xs text-gray-500">{r.type} • {r.date} • {r.size}</p>
                    </div>
                    <button className="text-teal-500 hover:text-teal-600 text-sm">⬇️</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="font-semibold mb-3">💡 Report Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Summary reports are best for quick overviews</li>
                <li>• Detailed reports include all individual responses</li>
                <li>• Department reports help compare across units</li>
                <li>• Reports include AI-generated insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
