import { useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [isLogin, setisLogin] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConrirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
          {emailError && <div className='error-message'>{emailError}</div>}
        </div>

        <button type='submit' className='login-btn'>
          Reset Password
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;
