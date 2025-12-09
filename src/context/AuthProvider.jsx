import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async (session) => {
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Failed to fetch user:', error);
          setUser(null);
        } else {
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => fetchUser(session));

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUser(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Add role helpers
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isStaff, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
