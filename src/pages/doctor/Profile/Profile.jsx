import React, { useState, useEffect, useMemo } from "react";
import { UserAuth } from "../../services/AuthContext";
import { supabase } from "../../services/SupabaseClient";
import Portfolio from "../../../images/porfolio.png";
import { FiMail, FiUser, FiShield, FiEdit2, FiSave, FiX, FiLock, FiType } from "react-icons/fi";
import toast from "react-hot-toast";
import "./Profile.css";

export default function Profile() {
  const { session } = UserAuth();
  const user = session?.user;
  const userMetadata = useMemo(() => user?.user_metadata || {}, [user?.user_metadata]);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userMetadata?.name || user?.email?.split("@")[0] || "User",
    naturalId: userMetadata?.naturalId || "",
    email: user?.email || "",
    newPassword: "",
    confirmPassword: "",
  });

  // Get display name
  const displayName = userMetadata?.name || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    setFormData({
      name: userMetadata?.name || user?.email?.split("@")[0] || "User",
      naturalId: userMetadata?.naturalId || "",
      email: user?.email || "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [user, userMetadata]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // Validate password if provided
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.newPassword) {
        toast.error("Please enter a new password");
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      // Update profile data
      const updateData = {
        data: {
          name: formData.name,
          naturalId: formData.naturalId,
        },
      };

      // Update password if provided
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const { error } = await supabase.auth.updateUser(updateData);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      
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
      name: userMetadata?.name || user?.email?.split("@")[0] || "User",
      naturalId: userMetadata?.naturalId || "",
      email: user?.email || "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsEditing(false);
  };

  // View Mode - Simple and Pretty Design
  if (!isEditing) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <img src={Portfolio} alt="Profile" />
            </div>
            <h2 className="profile-name">
              {displayName}
            </h2>
            <p className="profile-role">
              {userMetadata?.role === "teacher"
                ? "👨‍🏫 Teacher"
                : "👨‍🎓 Student"}
            </p>
          </div>

          <div className="profile-info">
            <div className="info-item">
              <FiMail className="info-icon" />
              <div className="info-content">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email || "N/A"}</span>
              </div>
            </div>

            <div className="info-item">
              <FiUser className="info-icon" />
              <div className="info-content">
                <span className="info-label">Natural ID</span>
                <span className="info-value">
                  {userMetadata?.naturalId || "N/A"}
                </span>
              </div>
            </div>

            <div className="info-item">
              <FiShield className="info-icon" />
              <div className="info-content">
                <span className="info-label">Role</span>
                <span className="info-value">
                  {userMetadata?.role?.toUpperCase() || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}>
              <FiEdit2 className="me-1" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode - Bootstrap Form Design
  return (
    <div className="profile-container">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4">
                <div className="text-center mb-4 pb-3 border-bottom">
                  <div className="profile-avatar mb-3">
                    <img
                      src={Portfolio}
                      alt="Profile"
                      className="rounded-circle"
                    />
                  </div>
                  <h2 className="card-title mb-2 text-capitalize">
                    {displayName}
                  </h2>
                  <span className="badge bg-primary fs-6">
                    {userMetadata?.role === "teacher"
                      ? "👨‍🏫 Teacher"
                      : "👨‍🎓 Student"}
                  </span>
                </div>

                <div className="profile-info">
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

                  <div className="mb-3">
                    <label className="form-label text-muted small text-uppercase mb-1">
                      <FiShield className="me-2" />
                      Role
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={
                        userMetadata?.role?.toUpperCase() || "N/A"
                      }
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="mb-4 p-3 border rounded bg-light">
                    <h6 className="mb-3 text-muted">
                      <FiLock className="me-2" />
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
                      Leave blank if you don't want to change password
                    </small>
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleCancel}
                      disabled={loading}>
                      <FiX className="me-1" />
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={loading}>
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"></span>
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
        </div>
      </div>
    </div>
  );
}

