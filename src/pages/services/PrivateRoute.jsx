import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { session, loading } = UserAuth();

  // 1️⃣ If still loading, don't redirect yet
  if (loading) return <p>Loading...</p>;

  // 2️⃣ If no session, redirect to login
  if (!session) return <Navigate to='/login' />;

  // 3️⃣ Optional: role-based protection
  if (roles && !roles.includes(session.user.user_metadata.role)) {
    return <Navigate to='/login' />; // or some "Not Authorized" page
  }

  // 4️⃣ User is logged in → render children
  return children;
};

export default PrivateRoute;
