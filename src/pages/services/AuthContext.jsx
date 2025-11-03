import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../SupabaseClient";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Register new user
  const registerNewUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("There was a problem signing up:", error.message);
      return { success: false, error };
    }
  };

  // ✅ Sign in user
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("An error occurred while signing in:", error.message);
      return { success: false, error };
    }
  };

  // ✅ Sign out user
  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("There was an error signing out:", error.message);
  };

  // ✅ Listen to session changes
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        registerNewUser,
        signInUser,
        signOutUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook for easy access
export const UserAuth = () => useContext(AuthContext);
