import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Link } from 'react-router-dom';

const MyResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        console.warn('No authenticated user');
        setLoading(false);
        return;
      }

      // Fetch profile info
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch responses for this user
      const { data: userResponses, error: responsesError } = await supabase
        .from('survey_responses')
        .select('id, survey_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (responsesError) throw responsesError;

      setResponses(userResponses || []);
    } catch (err) {
      console.error('Error fetching responses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your responses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Hello, {profile?.full_name || 'Student'} 👋</h2>
        {responses.length === 0 ? (
          <p className="text-gray-500">You haven't completed any surveys yet.</p>
        ) : (
          <div className="grid gap-4">
            {responses.map((resp) => (
              <div key={resp.id} className="p-4 border rounded-xl flex justify-between items-center">
                <span>Survey ID: {resp.survey_id}</span>
                <Link to={`/response/${resp.id}`} className="text-teal-600 font-medium">
                  View → 
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyResponses;
