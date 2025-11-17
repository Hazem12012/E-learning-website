import Navbar from "./../doctor/Navbar/Navbar";
import Sidebar from "../doctor/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

function Layout() {
  return (
    <>
      <Navbar />
        <Sidebar />
      <div className=' page_container d-block'>
        {/* ********{ Home /  Profile / Cources }************ */}
        <div className="layout_content">
          <Outlet />
        </div>
        {/* **********{End}********** */}
      </div>
    </>
  );
}

export default Layout;
