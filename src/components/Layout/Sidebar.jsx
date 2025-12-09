import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';

const Sidebar = () => {
  const location = useLocation();
  const { user, profile: contextProfile, loading: authLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(contextProfile);
  const [role, setRole] = useState(contextProfile?.role || 'user');

  useEffect(() => {
    if (!profile && user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setRole(data?.role || 'user');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      setRole('user');
    }
  };

  // ------------------------
  // Menu Items
  // ------------------------
  const adminMenuItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/user-management', label: 'User Management', icon: '👥' },
    { path: '/surveys', label: 'Surveys', icon: '📋' },
    { path: '/ai-analytics', label: 'AI Analytics', icon: '🤖' },
    { path: '/reports', label: 'Reports', icon: '📄' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const staffMenuItems = [
    { path: '/staff-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/surveys', label: 'My Surveys', icon: '📋' },
    { path: '/surveys/create', label: 'Create Survey', icon: '➕' },
    { path: '/responses', label: 'Responses', icon: '📝' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
  ];

  const studentMenuItems = [
    { path: '/student-dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/available-surveys', label: 'Available Surveys', icon: '📋' },
    { path: '/my-responses', label: 'My Responses', icon: '📝' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
  ];

  const defaultMenuItems = [{ path: '/dashboard', label: 'Dashboard', icon: '🏠' }];

  const menuItems = role === 'admin'
    ? adminMenuItems
    : role === 'staff'
    ? staffMenuItems
    : role === 'student'
    ? studentMenuItems
    : defaultMenuItems;

  const isActive = (path) => location.pathname === path;

  if (authLoading) return null;

  return (
    <aside
      className={`fixed left-0 top-0 h-full transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'}`}
      style={{ backgroundColor: '#1A1F36' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          {!collapsed && <span className="text-white font-bold text-lg">InsightHub</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-gray-700 ${collapsed ? 'text-center' : ''}`}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-2">
          <span className="text-white text-xl font-bold">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
        </div>
        {!collapsed && (
          <>
            <p className="text-white font-medium text-center truncate">{profile?.full_name || 'User'}</p>
            <p
              className="text-xs text-center px-2 py-1 rounded-full mt-1 inline-block"
              style={{
                backgroundColor: role === 'admin' ? '#5EE6C5' : role === 'staff' ? '#60A5FA' : '#F59E0B',
                color: '#1A1F36',
              }}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </p>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <Link
          to="/logout"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="text-xl">🚪</span>
          {!collapsed && <span className="font-medium">Logout</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
