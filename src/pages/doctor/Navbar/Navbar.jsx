import { useContext } from "react";
import "./Navbar.css";
import Logo from "../../../assets/Logo.png";
// React Icons
import { IoSearch } from "react-icons/io5";
import { UserAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";

function Navbar() {
  const { isOpen, setIsOpen } = UserAuth();
  const demo_avatar =
    "https://kkidlguxawdxyygsjxmo.supabase.co/storage/v1/object/sign/avatars/demo-Image.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMDlhYjhjNS1hYWZmLTQ0MTMtOWNmZi1mODhlMDc1NmIyMTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2RlbW8tSW1hZ2UuanBnIiwiaWF0IjoxNzY0NDIxNjc3LCJleHAiOjE3NjUwMjY0Nzd9.POp0c0cBh5Sf1uXJre9poejU-0YW1YVjxUIDL5kCQtg";
  const { avatar_url } = UserAuth();
  return (
    <nav className='navbar navbar-expand-lg  d-blok position-fixed '>
      <div className=' container d-flex  align-items-center  justify-content-between '>
        <Link className='navbar-brand text-light' to='/home'>
          <img src={Logo} alt='Logo' width={"160px"} />
        </Link>
        <div className='menu_button'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='navbar-toggler bg-white'
            type='button'
            data-bs-toggle='collapse'
            data-bs-target='#navbarSupportedContent'
            aria-controls='navbarSupportedContent'
            aria-expanded='false'
            aria-label='Toggle navigation'>
            <span className='navbar-toggler-icon'></span>
          </button>
        </div>

        <div
          className='collapse  navbar-collapse d-flex align-items-center justify-content-end gap-1'
          id='navbarSupportedContent'>
          <form className='d-flex position-relative' role='search'>
            <input
              className='form-control me-2  h-auto '
              type='search'
              placeholder='Search'
              aria-label='Search'
            />
            <span className='search_icon btn-pointer text-light  d-flex  align-items-center   justify-content-between'>
              <IoSearch className='fs-4' />
            </span>
          </form>
          <div className='profile px-4 '>
            <button className='border-0' onClick={() => setIsOpen(!isOpen)}>
              <img
                className=' rounded-circle '
                src={avatar_url || demo_avatar}
                alt='Logo'
                width={"40px"}
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
