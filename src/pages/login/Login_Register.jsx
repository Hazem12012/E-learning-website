import { useEffect, useReducer, useRef, useState } from "react";
import "./Login.css";
import Eyes from "./Eyes";

function reducer(state, action) {
  switch (action.type) {
    case "FOCUS_EMAIL":
      return {
        state,
      };
    case "FOCUS_PASSWORD":
      return {
        state,
      };
    case "HIDDEN_PASSWORD":
      return {
        state,
      };
    case "WRONG_INPUT":
      return {
        state,
      };
    case "SUBMIT_FORM":
      return {
        state,
      };
    case "CHANGE_FORM":
      return {
        state,
      };
    default:
      return state;
  }
}

function Login_Register() {
  const [isLogin, setisLogin] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConrirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ****************************************************

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e) => {
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

  const initialState = {};

  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div className='login_box d-flex'>
      {/* Left Section */}
      <div className='left-section'>
        <div className='characters-container' id='characters'>
          {/* Satrt orange */}
          <div className={`character orange-half ${"fjlsdkf"}  `}>
            <div className='head d-flex align-items-center justify-content-center'>
              <Eyes color={"black"} width={"10px"} height={"10px"} />
              <div className='mouth'></div>
            </div>
          </div>
          {/* end orange */}
          {/* Start blue */}
          <div className='character purple-rect'>
            <div className=' d-flex align-items-center justify-content-center'>
              <div className='blue_head'>
                <Eyes
                  color={"white"}
                  width={"10px"}
                  height={"9px"}
                  delay={"2s"}
                />
                <div className='mouth_blue'></div>
              </div>
            </div>
          </div>
          {/* End blue */}
          {/* Start black */}
          <div className='character black-rect'>
            <div className='head d-flex align-items-center justify-content-center'>
              <Eyes
                color={"white"}
                width={"9px"}
                height={"9px"}
                delay={".6s"}
              />
            </div>
          </div>
          {/* End Black */}
          {/* Start yellow */}
          <div className='character yellow-pill'>
            <div className='head d-flex align-items-center justify-content-center'>
              <Eyes
                color={"black"}
                width={"10px"}
                height={"10px"}
                delay={"2.3s"}
              />
              <div className="mouth_yellow"></div>
            </div>
          </div>
          {/* End yellow */}
        </div>
      </div>
      {/*  */}
      {/* Right Section */}
      <div className='right-section'>
        <div className='login-container'>
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
              onClick={() => setisLogin(false)}>
              Login
            </button>
            <button
              id='register-button'
              className={`toggle-button ${
                isLogin ? "active-text" : "inactive-text"
              } `}
              data-target='register'
              onClick={() => setisLogin(true)}>
              Register
            </button>
          </div>

          <h1
            className={`${
              isLogin ? "title_animation_1" : "title_animation_2"
            }`}>
            {isLogin ? "Welcome back" : "Welcome"}
          </h1>
          <div className='forms_container'>
            <div
              className={`forms_box ${
                isLogin ? "slide_right" : "slide_left"
              } `}>
              <div className='form_box login'>
                <form onSubmit={handleSubmit} className=''>
                  {/* Email */}
                  <div className='form-group'>
                    <label htmlFor='email'>Email</label>
                    <input
                      type='email'
                      id='email'
                      ref={emailRef}
                      placeholder='email@gmail.com'
                    />
                    {emailError && (
                      <div className='error-message'>{emailError}</div>
                    )}
                  </div>

                  {/* Password */}
                  <div className='form-group'>
                    <label htmlFor='password'>Password</label>
                    <div className='password-container'>
                      <input
                        type={showPassword ? "text" : "password"}
                        id='password'
                        ref={passwordRef}
                        placeholder='***************'
                      />
                      <button
                        type='button'
                        className='toggle-password'
                        onClick={() => setShowPassword((prev) => !prev)}>
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {passwordError && (
                      <div className='error-message'>{passwordError}</div>
                    )}
                  </div>
                  {/* Password */}
                  <div className='form-group'>
                    <label htmlFor='password confirm-password'>
                      Confirm Password
                    </label>
                    <div className='password-container'>
                      <input
                        type={showConrirmPassword ? "text" : "password"}
                        id='password'
                        ref={passwordRef}
                        placeholder='***************'
                      />
                      <button
                        type='button'
                        className='toggle-password'
                        onClick={() => setShowConfirmPassword((prev) => !prev)}>
                        {showConrirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {passwordError && (
                      <div className='error-message'>{passwordError}</div>
                    )}
                  </div>

                  {/* <div className='remember-forgot'>
                    <a href='#' className='forgot-password'>
                      Forgot Password?
                    </a>
                  </div> */}

                  <button type='submit' className='login-btn'>
                    Register
                  </button>
                </form>
              </div>
              <div className='form_box register'>
                <form onSubmit={handleSubmit} className=''>
                  {/* Email */}
                  <div className='form-group'>
                    <label htmlFor='email'>Email</label>
                    <input
                      type='email'
                      id='email'
                      ref={emailRef}
                      placeholder='email@gmail.com'
                    />
                    {emailError && (
                      <div className='error-message'>{emailError}</div>
                    )}
                  </div>

                  {/* Password */}
                  <div className='form-group'>
                    <label htmlFor='password'>Password</label>
                    <div className='password-container'>
                      <input
                        type={showPassword ? "text" : "password"}
                        id='password'
                        ref={passwordRef}
                        placeholder='***************'
                      />
                      <button
                        type='button'
                        className='toggle-password'
                        onClick={() => setShowPassword((prev) => !prev)}>
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {passwordError && (
                      <div className='error-message'>{passwordError}</div>
                    )}
                  </div>

                  <div className='remember-forgot'>
                    <label className='remember-me'>
                      <input type='checkbox' />
                      <span>I am a teacher</span>
                    </label>
                    <a href='#' className='forgot-password'>
                      Forgot Password?
                    </a>
                  </div>

                  <button type='submit' className='login-btn'>
                    Log in
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login_Register;
