import React from "react";
import { UserAuth } from "../../services/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./Home.css";
import { 
  Users, 
  BookOpen, 
  Star, 
  Calendar,
  PlusCircle,
  TrendingUp,
  Award,
  Clock,
  PlayCircle,
  Search
} from "lucide-react";

function Home() {
  const { session, name, role } = UserAuth();
  const user = session?.user;
  const displayName = name || user?.email?.split("@")[0] || "User";
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleComingSoon = () => {
    toast("This feature is coming soon!", {
      icon: "🚀",
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  // --- Doctor View Component ---
  const DoctorHome = () => {
    const stats = [
      { 
        title: "Total Students", 
        value: "1,234", 
        icon: <Users size={24} />, 
        color: "#0a58ca", 
        bg: "#e7f1ff" 
      },
      { 
        title: "Active Courses", 
        value: "12", 
        icon: <BookOpen size={24} />, 
        color: "#198754", 
        bg: "#d1e7dd" 
      },
      { 
        title: "Average Rating", 
        value: "4.8", 
        icon: <Star size={24} />, 
        color: "#ffc107", 
        bg: "#fff3cd" 
      },
    ];

    return (
      <div className="home-container">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="welcome-title">Welcome back, Dr. {displayName}! 👋</h1>
              <p className="welcome-subtitle mb-0">
                Manage your courses and students efficiently.
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <span className="badge bg-white text-primary px-3 py-2 rounded-pill fs-6 shadow-sm">
                <Calendar size={16} className="me-2" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="row g-4 mb-5">
          {stats.map((stat, index) => (
            <div className="col-12 col-md-4" key={index}>
              <div className="stat-card">
                <div 
                  className="stat-icon-wrapper" 
                  style={{ color: stat.color, backgroundColor: stat.bg }}
                >
                  {stat.icon}
                </div>
                <div className="stat-content">
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="content-card">
              <h2 className="section-title">
                <TrendingUp size={20} className="text-primary" />
                Quick Actions
              </h2>
              <div className="row g-3">
                <div className="col-md-4">
                  <button 
                    className="action-btn mb-0 h-100"
                    onClick={() => handleNavigate('/cources')}
                  >
                    <PlusCircle size={20} />
                    Create New Course
                  </button>
                </div>
                <div className="col-md-4">
                  <button 
                    className="action-btn mb-0 h-100"
                    onClick={handleComingSoon}
                  >
                    <Calendar size={20} />
                    Schedule Class
                  </button>
                </div>
                <div className="col-md-4">
                  <button 
                    className="action-btn mb-0 h-100"
                    onClick={handleComingSoon}
                  >
                    <Users size={20} />
                    Manage Students
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Student View Component ---
  const StudentHome = () => {
    const stats = [
      { 
        title: "Enrolled Courses", 
        value: "4", 
        icon: <BookOpen size={24} />, 
        color: "#0a58ca", 
        bg: "#e7f1ff" 
      },
      { 
        title: "Hours Learned", 
        value: "26", 
        icon: <Clock size={24} />, 
        color: "#6610f2", 
        bg: "#e0cffc" 
      },
      { 
        title: "Certificates", 
        value: "2", 
        icon: <Award size={24} />, 
        color: "#198754", 
        bg: "#d1e7dd" 
      },
    ];

    const activeCourses = [
      {
        id: 1,
        title: "Complete Web Development Bootcamp",
        instructor: "Dr. Angela Yu",
        progress: 75,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: 2,
        title: "Python for Data Science",
        instructor: "Jose Portilla",
        progress: 30,
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: 3,
        title: "UI/UX Design Masterclass",
        instructor: "Gary Simon",
        progress: 10,
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80"
      }
    ];

    return (
      <div className="home-container">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="welcome-title">Welcome back, {displayName}! 👋</h1>
              <p className="welcome-subtitle mb-0">
                Ready to continue your learning journey?
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <span className="badge bg-white text-primary px-3 py-2 rounded-pill fs-6 shadow-sm">
                <Calendar size={16} className="me-2" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="row g-4 mb-5">
          {stats.map((stat, index) => (
            <div className="col-12 col-md-4" key={index}>
              <div className="stat-card">
                <div 
                  className="stat-icon-wrapper" 
                  style={{ color: stat.color, backgroundColor: stat.bg }}
                >
                  {stat.icon}
                </div>
                <div className="stat-content">
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Learning Section */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title mb-0">
                <PlayCircle size={24} className="text-primary" />
                Continue Learning
              </h2>
            </div>
            <div className="row g-4">
              {activeCourses.map((course, index) => (
                <div className="col-12 col-md-6 col-lg-4" key={index}>
                  <div className="course-progress-card">
                    <img src={course.image} alt={course.title} className="course-image" />
                    <h4 className="course-title">{course.title}</h4>
                    <p className="course-instructor">By {course.instructor}</p>
                    
                    <div className="progress-container">
                      <div className="progress-label">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="progress">
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{ width: `${course.progress}%` }}
                          aria-valuenow={course.progress} 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <button 
                        className="btn-continue"
                        onClick={() => handleNavigate('/cources')}
                      >
                        Continue Lesson
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions / Explore */}
        <div className="row">
          <div className="col-12">
            <div className="content-card bg-light border-0">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div>
                  <h3 className="fw-bold mb-2">Explore New Skills</h3>
                  <p className="text-muted mb-0">Discover thousands of courses from top instructors.</p>
                </div>
                <button 
                  className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2"
                  onClick={() => handleNavigate('/cources')}
                >
                  <Search size={18} />
                  Browse Courses
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // Render based on role
  // Assuming role is 'teacher' for doctors and anything else (or 'student') for students
  return role === 'teacher' ? <DoctorHome /> : <StudentHome />;
}

export default Home;
