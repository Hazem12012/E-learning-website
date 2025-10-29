import Navbar from "./../doctor/Navbar/Navbar";
import Sidebar from "../doctor/Sidebar/Sidebar";
import { useContext } from "react";
import { UserContext } from "../services/context";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <Navbar />
      <div className='d-flex  page_container'>
        <Sidebar />
        {/* ********{ Home /  Profile / Cources }************ */}
        <Outlet />
        {/* **********{End}********** */}
      </div>
    </>
  );
}

export default Layout;
