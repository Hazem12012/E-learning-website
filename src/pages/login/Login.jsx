import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserAuth } from "../services/AuthContext";
import toast from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teacher, setTeacher] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else setEmailError("");

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    } else setPasswordError("");

    if (!valid) return;

    // ✅ Call Supabase login
    const result = await signInUser(email, password, teacher);

    if (result.success) {
      toast.success("Login successful");
      setPassword("");
      setEmail("");
      setTeacher(false);
      navigate("/home");
    } else {
      toast.error(`${result.error.message}`);
    }
  };

  return (
    <div className='form_box register'>
      {/* Message */}
      {/* {message && <p>{message}</p>} */}
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className='form-group'>
          <label htmlFor='email'>Email</label>
          <input
            type='email'
            id='email'
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

        {/* Teacher checkbox */}
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
