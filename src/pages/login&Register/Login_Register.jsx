import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Outlet, useNavigate } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import "./Login_Register.css";

function Login_Register() {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConrirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const location = useLocation();

  const handleClick = (path) => {
    navigate(path); // your target route
  };
  const initialStateSlide = location.pathname === "/register" ? true : false;
  const [isLogin, setisLogin] = useState(initialStateSlide);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // ****************************************************

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else setEmailError("");

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    } else setPasswordError("");

    if (valid) alert("Login successful!");
  };

  return (
    <div className='login_box d-flex'>
      <div className='right-section'>
        <div className='login-container'>
          {location.pathname !== "/forgotpassword" ? (
            <div
              id='toggle-container'
              className='d-flex position-relative rounded-pill p-2 shadow-lg'>
              <div
                id='active-pill'
                className={`position-absolute rounded-pill ${
                  isLogin ? "move-right" : ""
                }`}></div>

              <button
                id='login-button'
                className={`toggle-button ${
                  isLogin ? "inactive-text" : "active-text"
                } `}
                data-target='login'
                onClick={() => {
                  setisLogin(false);
                  handleClick("/login");
                }}>
                Login
              </button>
              <button
                id='register-button'
                className={`toggle-button ${
                  isLogin ? "active-text" : "inactive-text"
                } `}
                data-target='register'
                onClick={() => {
                  setisLogin(true);

                  handleClick("/register");
                }}>
                Register
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => navigate(-1)}
                className='btn text-white fs-3 mb-3'>
                <IoMdArrowRoundBack />
              </button>
            </div>
          )}
          {location.pathname !== "/forgotpassword" && (
            <h1
              className={`${
                isLogin ? "title_animation_1" : "title_animation_2"
              }`}>
              {isLogin ? "Welcome" : "Welcome back"}
            </h1>
          )}
          <div className='forms_container'>
            <div
              className={`forms_box ${
                isLogin ? "slide_right" : "slide_left"
              } `}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login_Register;
