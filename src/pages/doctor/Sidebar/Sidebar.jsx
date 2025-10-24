
import React, { useState } from "react";
import { FaHome, FaBook, FaUser, FaBars } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='d-flex'>
      <div className={`sidebar bg-dark text-light ${isOpen ? "open" : ""}`}>
        <h4 className='text-center py-3 border-bottom'>Dashboard</h4>
        <ul className='list-unstyled p-2'>
          <li className='py-2 px-3 d-flex align-items-center cursor-pointer'>
            <FaHome className='me-2' /> Home
          </li>
          <li className='py-2 px-3 d-flex align-items-center cursor-pointer'>
            <FaBook className='me-2' /> Courses
          </li>
          <li className='py-2 px-3 d-flex align-items-center cursor-pointer'>
            <FaUser className='me-2' /> Profile
          </li>
        </ul>
      </div>

    </div>
  );
}
