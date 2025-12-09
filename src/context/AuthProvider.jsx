import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async (session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('id', session.user.id)
          .single();
        setUser(userData || null);
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

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
