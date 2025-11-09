import { useState } from "react";
import "./Register.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { UserAuth } from "../services/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // input values
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [naturalId, setNaturalId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [teacher, setTeacher] = useState(false);

  // error messages
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [naturalIdError, setNaturalIdError] = useState("");

  // Supabase auth
  const { registerNewUser } = UserAuth();

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
    } else if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      valid = false;
    } else setPasswordError("");

    if (naturalId.length !== 14) {
      setNaturalIdError(`Natural ID must be 14 digits (${naturalId.length})`);

      valid = false;
    } else setNaturalIdError("");

    if (!valid) return;

    // call Supabase
    const result = await registerNewUser(email, password, naturalId, teacher);
    const user = result.data.user;
    const userRole = user?.user_metadata?.role;
    if (result.success) {
      await toast.success(`Account created successfully`);
      console.log("Supabase user:", result.data);
      await navigate("/home");
      // console.log(result.data)
    } else {
      toast.error(`${result.error.message}`);
    }
    console.log("User logged in with role:", userRole);

    console.log("User logged in with role:", result);

  };

  return (
    <div className='form_box login'>
      <form onSubmit={handleSubmit}>
        <div className='input_box'>
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

          {/* ID */}
          <div className='form-group'>
            <label htmlFor='id'>ID</label>
            <input
              type='number'
              id='id'
              placeholder='Natural ID'
              value={naturalId}
              onChange={(e) => setNaturalId(e.target.value)}
            />
            {naturalIdError && (
              <div className='error-message'>{naturalIdError}</div>
            )}
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

          {/* Confirm Password */}
          <div className='form-group'>
            <label htmlFor='confirmPassword'>Confirm Password</label>
            <div className='password-container'>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id='confirmPassword'
                placeholder='***************'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type='button'
                className='toggle-password'
                onClick={() => setShowConfirmPassword((prev) => !prev)}>
                {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
          </div>
        </div>

        {/* form footer  */}
        <div className='form_footer'>
          {/* Teacher Checkbox */}
          <div className='remember-forgot'>
            <label className='remember-me'>
              <input
                type='checkbox'
                checked={teacher}
                onChange={(e) => setTeacher(e.target.checked)}
              />
              <span>I am a teacher</span>
            </label>
          </div>

          <button type='submit' className='login-btn'>
            Register
          </button>
        </div>
      </form>
    </div>
  );
}

export default Register;
