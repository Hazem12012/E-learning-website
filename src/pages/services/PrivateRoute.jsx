import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import Loading from "../../components/Loading/Loading.jsx";

const PrivateRoute = ({ children, roles }) => {
  const { session, loading } = UserAuth();

  // console.log("🔍 PrivateRoute Check:", {
  //   loading,
  //   hasSession: !!session,
  //   session
  // });

  if (loading) {
    return;
  }

  // Redirect to login if no session exists
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if roles are specified
  if (roles && !roles.includes(session.user.user_metadata.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;