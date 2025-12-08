import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./SupabaseClient";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCourses();
  }, []);
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
      // console.log(`✅ Logged in as ${ role }:`, user.email);
      return { success: true, data, role };
    } catch (error) {
      console.error("An error occurred while signing in:", error.message);
      return { success: false, error };
    }
  };

  //  Sign out user
  const signOutUser = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) return false;

      return true;
    } catch {
      toast.error("Error signing out");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Refresh user data after profile update
  const refreshUserData = async () => {
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      setSession(newSession);
      return newSession;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
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
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user || {};

  const {
    email,
    created_at,
    user_metadata: { naturalId, role, name, phone, avatar_url } = {},
  } = user;

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        userId: user?.id,
        user,
        setLoading,
        registerNewUser,
        signInUser,
        signOutUser,
        refreshUserData, // ✅ Add this function
        email,
        created_at,
        naturalId,
        role,
        name,
        phone,
        avatar_url, // ✅ Add avatar_url
        isOpen,
        setIsOpen,
        setSearchTerm,
        searchTerm,
        courses,
        setCourses,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook for easy access
export const UserAuth = () => useContext(AuthContext);
