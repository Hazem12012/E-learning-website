import React, { useCallback, useMemo } from "react";
import { UserAuth } from "../pages/services/AuthContext";
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
  Search,
} from "lucide-react";

// Move these outside the component to prevent recreation

const ACTIVE_COURSES = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp",
    instructor: "Dr. Angela Yu",
    progress: 75,
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    title: "Python for Data Science",
    instructor: "Jose Portilla",
    progress: 30,
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    title: "UI/UX Design Masterclass",
    instructor: "Gary Simon",
    progress: 10,
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80",
  },
];

// Separate components to prevent recreation
const WelcomeBanner = React.memo(({ displayName, role }) => {
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  return (
    <div className='welcome-banner'>
      <div className='row align-items-center'>
        <div className='col-md-8'>
          <h1 className='welcome-title'>
            Welcome back, {role === "teacher" ? "Dr. " : ""}
            {displayName}! 👋
          </h1>
          <p className='welcome-subtitle mb-0'>
            {role === "teacher"
              ? "Manage your courses and students efficiently."
              : "Ready to continue your learning journey?"}
          </p>
        </div>
        <div className='col-md-4 text-md-end mt-3 mt-md-0'>
          <span className='badge bg-white text-primary px-3 py-2 rounded-pill fs-6 shadow-sm'>
            <Calendar size={16} className='me-2' />
            {currentDate}
          </span>
        </div>
      </div>
    </div>
  );
});

const StatsGrid = React.memo(({ stats }) => {
  return (
    <div className='row g-4 mb-5'>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div className='col-12 col-md-4' key={index}>
            <div className='stat-card'>
              <div
                className='stat-icon-wrapper'
                style={{ color: stat.color, backgroundColor: stat.bg }}>
                <IconComponent size={24} />
              </div>
              <div className='stat-content'>
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const DoctorQuickActions = React.memo(({ onNavigate, onComingSoon }) => {
  return (
    <div className='row'>
      <div className='col-12'>
        <div className='content-card'>
          <h2 className='section-title'>
            <TrendingUp size={20} className='text-primary' />
            Quick Actions
          </h2>
          <div className='row g-3'>
            <div className='col-md-4'>
              <button
                className='action-btn mb-0 h-100'
                onClick={() => onNavigate("/cources")}>
                <PlusCircle size={20} />
                Create New Course
              </button>
            </div>
            <div className='col-md-4'>
              <button className='action-btn mb-0 h-100' onClick={onComingSoon}>
                <Calendar size={20} />
                Schedule Class
              </button>
            </div>
            <div className='col-md-4'>
              <button className='action-btn mb-0 h-100' onClick={onComingSoon}>
                <Users size={20} />
                Manage Students
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const CourseCard = React.memo(({ course }) => {
  return (
    <div className='col-12 col-md-6 col-lg-4'>
      <div className='course-progress-card'>
        <img src={course.image} alt={course.title} className='course-image' />
        <h4 className='course-title'>{course.title}</h4>
        <p className='course-instructor'>By {course.instructor}</p>
      </div>
    </div>
  );
});

const StudentCourses = React.memo(({ courses }) => {
  return (
    <div className='row mb-5'>
      <div className='col-12'>
        <div className='d-flex justify-content-between align-items-center mb-4'>
          <h2 className='section-title mb-0'>
            <PlayCircle size={24} className='text-primary' />
            Continue Learning
          </h2>
        </div>
        <div className='row g-4'>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
});

const ExploreSection = React.memo(({ onNavigate }) => {
  return (
    <div className='row'>
      <div className='col-12'>
        <div className='content-card bg-light border-0'>
          <div className='d-flex flex-column flex-md-row justify-content-between align-items-center gap-3'>
            <div>
              <h3 className='fw-bold mb-2'>Explore New Skills</h3>
              <p className='text-muted mb-0'>
                Discover thousands of courses from top instructors.
              </p>
            </div>
            <button
              className='btn btn-primary px-4 py-2 d-flex align-items-center gap-2'
              onClick={() => onNavigate("/cources")}>
              <Search size={18} />
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

function Home() {
  const { session, name, role, courses } = UserAuth();
  const STUDENT_STATS = [
    {
      title: "Enrolled Courses",
      value:  courses.length ,
      icon: BookOpen,
      color: "#0a58ca",
      bg: "#e7f1ff",
    },
    {
      title: "Hours Learned",
      value: "26",
      icon: Clock,
      color: "#6610f2",
      bg: "#e0cffc",
    },
    {
      title: "Certificates",
      value: "0",
      icon: Award,
      color: "#198754",
      bg: "#d1e7dd",
    },
  ];
  const DOCTOR_STATS = [
    {
      title: "Total Students",
      value: "1,234",
      icon: Users,
      color: "#0a58ca",
      bg: "#e7f1ff",
    },
    {
      title: "Active Courses",
      value: "12",
      icon: BookOpen,
      color: "#198754",
      bg: "#d1e7dd",
    },
    {
      title: "Average Rating",
      value: "4.8",
      icon: Star,
      color: "#ffc107",
      bg: "#fff3cd",
    },
  ];
  // console.log(courses.length);
  const navigate = useNavigate();
  // Memoize display name to prevent recalculation
  const displayName = useMemo(() => {
    return name || session?.user?.email?.split("@")[0] || "User";
  }, [name, session?.user?.email]);

  // Use useCallback to prevent function recreation
  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  const handleComingSoon = useCallback(() => {
    toast("This feature is coming soon!", {
      icon: "🚀",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  }, []);

  // Memoize stats based on role
  const stats = useMemo(() => {
    return role === "teacher" ? DOCTOR_STATS : STUDENT_STATS;
  }, [role]);

  return (
    <div className='home-container'>
      <WelcomeBanner displayName={displayName} role={role} />
      <StatsGrid stats={stats} />

      {role === "teacher" ? (
        <DoctorQuickActions
          onNavigate={handleNavigate}
          onComingSoon={handleComingSoon}
        />
      ) : (
        <>
          <StudentCourses courses={ACTIVE_COURSES} />
          <ExploreSection onNavigate={handleNavigate} />
        </>
      )}
    </div>
  );
}

export default Home;
