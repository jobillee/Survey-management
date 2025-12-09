import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';


export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  // Auto redirect if already logged in
  useEffect(() => {
  if (user) {
    if (user.role === 'admin') navigate('/admin-dashboard');
    else if (user.role === 'staff') navigate('/staff-dashboard');
    else navigate('/student-dashboard');
  }
}, [user, navigate]);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Login failed');

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (userError) throw userError;

      const role = user?.role || 'student';
      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'staff') navigate('/staff-dashboard');
      else navigate('/student-dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Signup failed');

      const { error: insertError } = await supabase.from('users').insert([
        {
          id: userId,
          full_name: signupData.fullName,
          email: signupData.email,
          role: signupData.role,
        },
      ]);
      if (insertError) throw insertError;

      alert('Account created! Please login.');
      setShowSignup(false);
      setShowLogin(true);
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const switchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-auto m-0 p-0">
      {/* Header */}
      <header className="w-full py-3 md:py-4 px-4 md:px-6 flex items-center justify-between bg-[#1A1F36] flex-shrink-0">
        <div className="flex items-center">
          <div className="w-20 h-20 md:w-12 md:h-12 flex items-center justify-center">
            <img src="logo.png" alt="Logo" className="object-contain w-full h-full" />
          </div>
          <span className="ml-2 md:ml-3 text-lg md:text-xl font-bold text-white" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Survey Management
          </span>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button onClick={() => setShowLogin(true)}
            className="px-3 py-1.5 md:px-6 md:py-2 text-sm md:text-base rounded-lg border-2 transition-all hover:bg-opacity-10 text-white"
            style={{ borderColor: '#FFFFFF', fontFamily: 'Open Sans, sans-serif', backgroundColor: 'transparent' }}
          >
            Log In
          </button>
          <button onClick={() => setShowSignup(true)}
            className="px-3 py-1.5 md:px-6 md:py-2 text-sm md:text-base rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: '#5EE6C5', color: '#1A1F36', fontFamily: 'Open Sans, sans-serif' }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-0" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="mb-6 md:mb-8">
          <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <img src="logo.png" alt="Logo" className="object-contain w-48 h-48 md:w-64 md:h-64" />
          </div>
        </div>
        <p className="text-lg md:text-xl lg:text-2xl text-center max-w-2xl leading-relaxed px-4" style={{ fontFamily: 'Quicksand', color: '#1A1F36' }}>
          Welcome to InsightHub where every response tells a story; every insight drives better decisions.
        </p>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50" onClick={() => setShowLogin(false)}>
          <div className="w-full max-w-md p-6 md:p-8 rounded-2xl shadow-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Log In</h2>
            <div className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Email</label>
                <input type="email" placeholder="Your email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500" style={{ fontFamily: 'Open Sans, sans-serif', borderColor: '#A7B0C2' }} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Password</label>
                <input type="password" placeholder="Your password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500" style={{ fontFamily: 'Open Sans, sans-serif', borderColor: '#A7B0C2' }} />
              </div>
              <button onClick={handleLogin} disabled={loading} className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90 mt-6 disabled:opacity-50" style={{ fontFamily: 'Open Sans, sans-serif', backgroundColor: '#1A1F36', color: '#FFFFFF' }}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <p className="text-center text-sm mt-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <span style={{ color: '#1A1F36' }}>Don't have an account? </span>
                <button onClick={switchToSignup} className="font-semibold hover:underline text-[#5EE6C5]">Sign Up</button>
              </p>
              <button onClick={() => setShowLogin(false)} className="w-full mt-4 py-2 text-sm hover:opacity-70 text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SignUp Modal */}
      {showSignup && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50" onClick={() => setShowSignup(false)}>
          <div className="w-full max-w-md p-6 md:p-8 rounded-2xl shadow-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Sign Up</h2>
            <div className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Full Name</label>
                <input type="text" placeholder="Your full name" value={signupData.fullName} onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500" style={{ fontFamily: 'Open Sans, sans-serif', borderColor: '#A7B0C2' }} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Email</label>
                <input type="email" placeholder="Your email" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500" style={{ fontFamily: 'Open Sans, sans-serif', borderColor: '#A7B0C2' }} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Password</label>
                <input type="password" placeholder="Password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500" style={{ fontFamily: 'Open Sans, sans-serif', borderColor: '#A7B0C2' }} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Confirm Password</label>
                <input type="password" placeholder="Confirm password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500" style={{ fontFamily: 'Open Sans, sans-serif', borderColor: '#A7B0C2' }} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Role</label>
                <select value={signupData.role} onChange={(e) => setSignupData({ ...signupData, role: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500" style={{ fontFamily: 'Open Sans, sans-serif', borderColor: '#A7B0C2', color: '#1A1F36' }}>
                  <option value="student">Student</option>
                  <option value="staff">Teacher/Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={handleSignup} disabled={loading} className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90 mt-6 disabled:opacity-50" style={{ backgroundColor: '#1A1F36', color: '#FFFFFF', fontFamily: 'Open Sans, sans-serif' }}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <p className="text-center text-sm mt-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <span style={{ color: '#1A1F36' }}>Already have an account? </span>
                <button onClick={switchToLogin} className="font-semibold hover:underline text-[#5EE6C5]">Login</button>
              </p>
              <button onClick={() => setShowSignup(false)} className="w-full mt-4 py-2 text-sm hover:opacity-70 text-[#1A1F36]" style={{ fontFamily: 'Open Sans, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
