import Navbar from "./../doctor/Navbar/Navbar";
import Sidebar from "../doctor/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

function Layout() {
  return (
    <>
      <div className=' page_container'>
        {/* ********{ Home /  Profile / Cources }************ */}
        <Navbar />
        <Sidebar />
        <div className="layout_content">
          <Outlet />
        </div>
      </div>
      {/* **********{End}********** */}
    </>
  );
}

export default Layout;
