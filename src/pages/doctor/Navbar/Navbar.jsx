import { useContext } from "react";
import Portfolio from "../../../images/porfolio.png";
import "./Navbar.css";
// React Icons
import { IoSearch } from "react-icons/io5";
import { UserContext } from "../../services/context";

function Navbar() {
  const { isOpen, setIsOpen } = useContext(UserContext);

  return (
    <nav className='navbar navbar-expand-lg  d-blok position-fixed '>
      <div className=' container d-flex  align-items-center  justify-content-between '>
        <a className='navbar-brand text-light' href='#'>
          DEMO LOGO
        </a>
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
