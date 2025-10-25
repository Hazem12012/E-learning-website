import Portfolio from "../../../images/porfolio.png";
import "./Navbar.css";
// React Icons
import { IoSearch } from "react-icons/io5";

function Navbar() {
  return (
    <nav className='navbar navbar-expand-lg   d-block'>
      <div className=' container d-flex  align-items-center  justify-content-between '>
        <a className='navbar-brand text-light' href='#'>
          DEMO LOGO
        </a>
        <div className='menu_button'>
          <button
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
            <button className='border-0'>
              <img
                className=' rounded-circle '
                src={Portfolio}
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
