import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./SupabaseClient";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  //  Register new user
  const registerNewUser = async (email, password, naturalId, teacher) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            naturalId: naturalId,
            role: teacher ? "teacher" : "student",
          },
        },
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("There was a problem signing up:", error.message);

      toast.error(`${error.message}`);
      return { success: false, error };
    }
  };

  //  Sign in user
  const signInUser = async (email, password, teacher) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;
      const role = user?.user_metadata?.role;
      const expectedRole = teacher ? "teacher" : "student";

      if (!role) {
        throw new Error("No role assigned to this user.");
      }

      // ✅ Check if user role matches checkbox
      if (role !== expectedRole) {
        throw new Error(`This account is not a ${expectedRole}.`);
      }

      // ✅ Success
      console.log(`✅ Logged in as ${role}:`, user.email);
      return { success: true, data, role };
    } catch (error) {
      console.error("An error occurred while signing in:", error.message);
      return { success: false, error };
    }
  };

  //  Sign out user
  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
      return false;
    }
    return true;
  };

  //  Listen to session changes
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
  console.log(session);

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
