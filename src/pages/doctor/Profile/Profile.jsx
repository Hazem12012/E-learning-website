import React, { useState, useEffect, useRef } from "react";
import { UserAuth } from "../../services/AuthContext";
import { supabase } from "../../services/SupabaseClient";
import toast from "react-hot-toast";
import "./Profile.css";
import {
  FiMail,
  FiUser,
  FiShield,
  FiEdit2,
  FiSave,
  FiX,
  FiType,
  FiCamera
} from "react-icons/fi";
import {
  Mail,
  User,
  CreditCard,
  Phone,
  Shield,
  Calendar,
  Key
} from "lucide-react";
import formatDate from "../../../helper/FormatDate";

export default function Profile() {
  const demo_avatar = "https://kkidlguxawdxyygsjxmo.supabase.co/storage/v1/object/sign/avatars/demo-Image.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMDlhYjhjNS1hYWZmLTQ0MTMtOWNmZi1mODhlMDc1NmIyMTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2RlbW8tSW1hZ2UuanBnIiwiaWF0IjoxNzY0NDIxNjc3LCJleHAiOjE3NjUwMjY0Nzd9.POp0c0cBh5Sf1uXJre9poejU-0YW1YVjxUIDL5kCQtg";

  const {
    session,
    email,
    created_at,
    naturalId,
    role,
    name,
    phone,
    avatar_url,
    refreshUserData, //Get refresh function from context
  } = UserAuth();

  const user = session?.user;
  const displayName = name || user?.email?.split("@")[0] || "User";
  const currentAvatarUrl = avatar_url || demo_avatar;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    naturalId: "",
    email: "",
    phone: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialize form data when user data changes
  useEffect(() => {
    setFormData({
      name: name || user?.email?.split("@")[0] || "User",
      naturalId: naturalId || "",
      email: user?.email || "",
      phone: phone || "",
      newPassword: "",
      confirmPassword: "",
    });
    setAvatarPreview(currentAvatarUrl);
  }, [user, name, naturalId, phone, currentAvatarUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${ user.id }-${ Date.now() }.${ fileExt }`;
      const filePath = `avatars/${ fileName }`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return null;
    }
  };

  const validateForm = () => {
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.newPassword) {
        toast.error("Please enter a new password");
        return false;
      }
      if (formData.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let newAvatarUrl = currentAvatarUrl;

      // Upload avatar if changed
      if (avatarFile) {
        const url = await uploadAvatar();
        if (url) {
          newAvatarUrl = url;
        } else {
          throw new Error("Failed to upload avatar");
        }
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        naturalId: formData.naturalId,
        phone: formData.phone,
        avatar_url: newAvatarUrl,
      };

      // Update auth user metadata
      const authUpdatePayload = {
        data: updateData,
      };

      // Add password if changed
      if (formData.newPassword) {
        authUpdatePayload.password = formData.newPassword;
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdatePayload);
      if (authError) throw authError;

      // ✅ Refresh the session to get updated data
      await refreshUserData();

      toast.success("Profile updated successfully!");

      // Reset state
      setAvatarFile(null);
      setIsEditing(false);
      setAvatarPreview(newAvatarUrl);

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: name || user?.email?.split("@")[0] || "User",
      naturalId: naturalId || "",
      email: user?.email || "",
      phone: phone || "",
      newPassword: "",
      confirmPassword: "",
    });
    setAvatarPreview(currentAvatarUrl);
    setAvatarFile(null);
    setIsEditing(false);
  };

  // View Mode
  if (!isEditing) {
    return (
      <div className="profile-container main-profile-container">
        <div className="profile-card main-profile-card">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              <img src={avatarPreview} alt="Profile" />
            </div>
            <h2 className="profile-name">{displayName}</h2>
            <p className="profile-role" style={{ color: `${ role === "teacher" ? "#102E50" : "#0046FF" }` }}>
              {role === "teacher" ? "Teacher" : "Student"}
            </p>
          </div>

          {/* Profile Information */}
          <div className="profile-card">
            <h2 className="card-title">Profile Information</h2>

            <div className="info-grid">
              <div className="info-item">
                <User className="info-icon" />
                <div>
                  <p className="label">Full Name</p>
                  <p className="value">{name || "Not provided"}</p>
                </div>
              </div>

              <div className="info-item">
                <Mail className="info-icon" />
                <div>
                  <p className="label">Email</p>
                  <p className="value">{email}</p>
                </div>
              </div>

              <div className="info-item">
                <CreditCard className="info-icon" />
                <div>
                  <p className="label">Natural ID</p>
                  <p className="value">{naturalId || "Not provided"}</p>
                </div>
              </div>

              <div className="info-item">
                <Phone className="info-icon" />
                <div>
                  <p className="label">Phone</p>
                  <p className="value">{phone || "Not provided"}</p>
                </div>
              </div>

              <div className="info-item">
                <Shield className="info-icon" />
                <div>
                  <p className="label">Role</p>
                  <p className="value">{role}</p>
                </div>
              </div>

              <div className="info-item">
                <Calendar className="info-icon" />
                <div>
                  <p className="label">Joined Date</p>
                  <p className="value">{formatDate(created_at)}</p>
                </div>
              </div>
            </div>
            <div className="text-center mt-3 edit-button-container">
              <button
                className="btn btn-primary edit-profile-btn mb-2"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit2 className="me-1" />
                Edit Profile
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="profile-container profile-container_edit">
      <div className="card shadow-lg border-0">
        <div className="card-body p-4">
          {/* Header with Avatar Upload */}
          <div className="text-center mb-4 pb-3 border-bottom">
            <div className="position-relative d-inline-block mb-4">
              <div className="profile-avatar m-0">
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="rounded-circle"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={handleAvatarClick}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-circle position-absolute"
                style={{
                  bottom: '0',
                  right: '0',
                  width: '40px',
                  height: '40px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                onClick={handleAvatarClick}
              >
                <FiCamera size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            <h2 className="card-title mb-2 text-capitalize">
              {displayName}
            </h2>
            <span className="badge fs-6" style={{ background: `${ role === "teacher" ? "#102E50" : "#0046FF" }` }}>
              {role === "teacher" ? "Teacher" : "Student"}
            </span>
            {avatarFile && (
              <p className="text-muted small mt-2">
                <FiCamera className="me-1" />
                New avatar selected
              </p>
            )}
          </div>

          {/* Form */}
          <div className="profile-info">
            {/* Name */}
            <div className="mb-3">
              <label className="form-label text-muted small text-uppercase mb-1">
                <FiType className="me-2" />
                Name
              </label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="mb-3">
              <label className="form-label text-muted small text-uppercase mb-1">
                <FiMail className="me-2" />
                Email
              </label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                disabled
                readOnly
              />
              <small className="text-muted">
                Email cannot be changed
              </small>
            </div>

            {/* Natural ID */}
            <div className="mb-3">
              <label className="form-label text-muted small text-uppercase mb-1">
                <FiUser className="me-2" />
                Natural ID
              </label>
              <input
                type="text"
                name="naturalId"
                className="form-control"
                value={formData.naturalId}
                onChange={handleInputChange}
                placeholder="Enter Natural ID"
              />
            </div>

            {/* Phone */}
            <div className="mb-3">
              <label className="form-label text-muted small text-uppercase mb-1">
                <Phone className="me-2" size={14} />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter Phone Number"
              />
            </div>

            {/* Role (Read-only) */}
            <div className="mb-3">
              <label className="form-label text-muted small text-uppercase mb-1">
                <FiShield className="me-2" />
                Role
              </label>
              <input
                type="text"
                className="form-control bg-light"
                value={role?.toUpperCase() || "N/A"}
                disabled
                readOnly
              />
            </div>

            {/* Password Section */}
            <div className="mb-4 p-3 border rounded bg-light">
              <h6 className="mb-3 text-muted">
                <Key className="me-2" size={18} />
                Change Password
              </h6>

              <div className="mb-3">
                <label className="form-label text-muted small text-uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  className="form-control"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                />
              </div>

              <div className="mb-2">
                <label className="form-label text-muted small text-uppercase mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
              <small className="text-muted">
                Leave empty if you don't want to change password
              </small>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-outline-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                <FiX className="me-1" />
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="me-1" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
