import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';

const DashboardLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // ✅ Fetch user profile safely
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user) return;

      setProfileLoading(true);

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, email')
        .eq('id', user.id)
        .maybeSingle();

      if (isMounted) {
        if (!error) setProfile(data);
        else {
          console.error('Profile fetch failed:', error.message);
          setProfile(null);
        }
        setProfileLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // ✅ Fetch notifications safely
  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('id, message, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (isMounted) {
        if (!error) setNotifications(data || []);
        else {
          console.error('Notification fetch failed:', error.message);
          setNotifications([]);
        }
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex pl-70 bg-gray-100">
      <Sidebar profile={profile} />

      <div className="flex-1 min-h-screen flex flex-col">
        {/* ✅ HEADER */}
        <header className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profileLoading
                ? 'Loading...'
                : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'User'}! 👋`}
            </h1>
            <p className="text-gray-500 text-sm">
              Here's what's happening with your surveys today
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 px-4 py-2 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 rounded-xl hover:bg-gray-100 transition"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 font-bold border-b border-gray-100">
                    Notifications
                  </div>

                  {notifications.length === 0 ? (
                    <p className="p-4 text-gray-400 text-sm">
                      No notifications
                    </p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`p-3 border-b border-gray-100 text-sm cursor-pointer ${
                            !n.read ? 'bg-gray-100 font-medium' : 'bg-white'
                          }`}
                        >
                          <div>{n.message}</div>
                          <div className="text-gray-400 text-xs">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Profile avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center cursor-pointer shadow">
              <span className="text-white font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* ✅ MAIN CONTENT */}
        <main className="p-8 flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
