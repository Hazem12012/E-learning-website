import React, { useContext, useState } from "react";
import { FaHome, FaBook, FaUser, FaBars } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { IoMdArrowRoundBack } from "react-icons/io";

import "./Sidebar.css";
import { UserContext } from "../../services/context";
import { Link, NavLink } from "react-router-dom";
import { DiVim } from "react-icons/di";
import { FaArrowRight } from "react-icons/fa";

export default function Sidebar() {
  const { isOpen, setIsOpen } = useContext(UserContext);

  return (
    <>
      {!isOpen && (
        <button
          className='btn  open_sidepar_icon  '
          onClick={() => setIsOpen(!isOpen)}>
          <FaArrowRight />
        </button>
      )}
      <div className={`d-flex  position-fixed  z-3 `}>
        <div
          className={`sidebar  text-light ${isOpen ? "open" : ""}`}
          style={isOpen ? { width: "240px" } : { width: "0px" }}>
          <h4 className='text-center py-3 border-bottom d-flex align-items-center'>
            <span className=' '>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className='btn  text-white align-items-center d-flex  fs-4'>
                <IoMdArrowRoundBack />
              </button>
            </span>
            Dashboard
          </h4>
          <div className='d-flex flex-column justify-content-between h-75 '>
            <ul className='list-unstyled p-2 mt-3 '>
              <NavLink
                to={`/home`}
                className={"text-white  text-decoration-none  "}>
                <li className='py-2 px-3 d-flex align-items-center cursor-pointer mb-4'>
                  <FaHome className='me-2' /> Home
                </li>
              </NavLink>
              <NavLink
                to={`/profile`}
                className={"text-white  text-decoration-none  "}>
                <li className='py-2 px-3 d-flex align-items-center cursor-pointer mb-4'>
                  <FaUser className='me-2' /> Profile
                </li>
              </NavLink>
              <NavLink
                to={`/cources`}
                className={"text-white  text-decoration-none  "}>
                <li className='py-2 px-3 d-flex align-items-center cursor-pointer mb-4'>
                  <FaBook className='me-2' /> Courses
                </li>
              </NavLink>
            </ul>
            <div className='button_box d-flex align-items-center justify-content-center  mx-3'>
                <Link to={"/login"}>
              <button className='btn  text-white  fs-6 fw-bold  '>
                {" "}
                Logout
              </button>
                </Link>
              <span className='fs-5'>
                <HiOutlineLogout />
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
