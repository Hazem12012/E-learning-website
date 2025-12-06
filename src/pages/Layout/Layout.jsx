import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../doctor/Navbar/Navbar";
import Sidebar from "../doctor/Sidebar/Sidebar";
import Loading from "../../components/Loading/Loading.jsx";
import "./Layout.css";
import { UserAuth } from "../services/AuthContext.jsx";

function Layout() {
  const location = useLocation();
  // const { loading, setLoading, session } = UserAuth();

  // useEffect(() => {
  //   setLoading(true);
  //   const timer = setTimeout(() => setLoading(false), 1000);
  //   return () => clearTimeout(timer);
  // }, [location.pathname]);

  return (
    <>

      <div className="page_container">
        <Navbar />
        <Sidebar />
        <div className="layout_content">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default Layout;
