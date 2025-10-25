import React, { useState } from "react";
import { FaHome, FaBook, FaUser, FaBars } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";

import "./Sidebar.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='d-flex  position-relative'>
      <div className={`sidebar  text-light ${isOpen ? "open" : ""}`}>
        <h4 className='text-center py-3 border-bottom'>Dashboard</h4>
        <div className='d-flex flex-column justify-content-between h-75 '>
          <ul className='list-unstyled p-2 mt-1'>
            <li className='py-2 px-3 d-flex align-items-center cursor-pointer'>
              <FaUser className='me-2' /> Profile
            </li>
            <li className='py-2 px-3 d-flex align-items-center cursor-pointer'>
              <FaBook className='me-2' /> Courses
            </li>
            <li className='py-2 px-3 d-flex align-items-center cursor-pointer'>
              <FaHome className='me-2' /> Home
            </li>
          </ul>
          <div className='button_box d-flex align-items-center justify-content-center  mx-3'>
            <button className='btn  text-white  fs-6 fw-bold  '> Logout</button>
            <span className='fs-5'>
              <HiOutlineLogout />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
