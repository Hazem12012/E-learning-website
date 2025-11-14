import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { session, loading } = UserAuth();

  if (loading) return <p>Loading...</p>;

  if (!session) return <Navigate to='/login' />;

   if (roles && !roles.includes(session.user.user_metadata.role)) {
    return <Navigate to='/login' />;
  }
  return children;
};

export default PrivateRoute;
