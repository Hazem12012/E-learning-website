import { useEffect, useRef, useState } from "react";
import "./Login.css";

function Login() {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const orangeRef = useRef(null);
  useEffect(() => {
    const orangeHalf = orangeRef.current;
    if (!orangeHalf) return;

    const eyes = orangeHalf.querySelectorAll(".eye");

    function handleMouseMove(e) {
      const rect = orangeHalf.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const maxMove = 8;

      const moveX = Math.max(Math.min(deltaX / 30, maxMove), -maxMove);
      const moveY = Math.max(Math.min(deltaY / 30, maxMove), -maxMove);

      eyes.forEach((eye) => {
        eye.style.setProperty(
          "--eye-transform",
          `translate(${moveX}px, ${moveY}px)`
        );
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  return (
    <div className='login_box d-flex'>
      {/* Left Section */}
      <div className='left-section'>
        <div className='characters-container' id='characters'>
          <div className={`character orange-half ${"fjlsdkf"}`} ref={orangeRef}>
            <div className='head d-flex align-items-center justify-content-center'>
              <div className='eyes'>
                <div className='eye eye_1'></div>
                <div className='eye eye_2'></div>
              </div>
              <div className='mouth'></div>
            </div>
          </div>
          <div className='character purple-rect'></div>
          <div className='character black-rect'></div>
          <div className='character yellow-pill'></div>
        </div>
      </div>

      {/* Right Section */}
      <div className='right-section'>
        <div className='login-container'>
          <div
            id='toggle-container'
            className='d-flex position-relative rounded-pill p-2 shadow-lg'>
            <div
              id='active-pill'
              className='position-absolute rounded-pill'></div>

            <button
              id='login-button'
              className='toggle-button active-text'
              data-target='login'>
              Login
            </button>
            <button
              id='register-button'
              className='toggle-button inactive-text'
              data-target='register'>
              Register
            </button>
          </div>

          <h1>Welcome back!</h1>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className='form-group'>
              <label htmlFor='email'>Email</label>
              <input
                type='email'
                id='email'
                ref={emailRef}
                placeholder='email@gmail.com'
              />
              {emailError && <div className='error-message'>{emailError}</div>}
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
                <span>Remember Me</span>
              </label>
              <a href='#' className='forgot-password'>
                Forgot Password?
              </a>
            </div>

            <button type='submit' className='login-btn'>
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
