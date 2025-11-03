import { useRef, useState } from "react";
// import "./Login.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
// import Register from "../Register/Register";

function Login() {
  const [isLogin, setisLogin] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConrirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // inpot info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teacher, setTeacher] = useState(false);

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

    if (valid) {
      console.log("Login successful!");
      setPassword("");
      setEmail("");
      setTeacher(false);
    }
  };
  return (
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type='button'
              className='toggle-password'
              onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>
          {passwordError && (
            <div className='error-message'>{passwordError}</div>
          )}
        </div>
        <div className='remember-forgot'>
          <label className='remember-me'>
            <input
              type='checkbox'
              checked={teacher}
              onChange={(e) => setTeacher(e.target.checked)}
            />
            <span>I am a teacher</span>
          </label>
          <Link to={"/forgotpassword"} className='forgot-password'>
            Forgot Password?
          </Link>
        </div>
        <button type='submit' className='login-btn'>
          Log in
        </button>
      </form>
    </div>
  );
}

export default Login;
