import { useEffect, useState } from "react";
import "./CourseDetailsPage.css";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading/Loading.jsx";
import toast from "react-hot-toast";
import AddQuestions from "./Addquestions.jsx";
import { TableOfContents } from "lucide-react";
import QuizPage from "./QuizPage.jsx";
import Lectures from "./Lectures.jsx";
import { supabase } from "../pages/services/SupabaseClient.js";
import { UserAuth } from "../pages/services/AuthContext.jsx";
import VideoCam from './../pages/VideoCam/VideoCam';

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const { role } = UserAuth();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("desc");
  const [openLessons, setOpenLessons] = useState({});
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [viewAnswers, setViewAnswers] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const teacherAccess = [
    ["desc", "Course Description"],
    ["lectures", "Lectures"],
    ["students", "Students"],
    // ["attendance", "Attendance"],
    ["quizzes", "Quizzes & Exams"],
    // ["quiz", "Quiz"],
  ];
  const studentAccess = [
    ["desc", "Course Description"],
    ["lectures", "Lectures"],
    ["students", "Students"],
    ["attendance", "Attendance"],
    // ["quizzes", "Quizzes & Exams"],
    ["quiz", "Quiz"],
  ];

  // FIXED: Added all required fields
  const [lessonForm, setLessonForm] = useState({
    title: "",
    content: "",
    video_url: "",
  });

  const [studentForm, setStudentForm] = useState({
    naturalId: "",
  });

  function handleViewAnswers(quizId) {
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
      setViewAnswers(false);
    } else {
      setSelectedQuizId(quizId);
      setViewAnswers(true);
    }
  }

  // Fetch course data and enrolled students
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      setLoading(true);

      try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (courseError) {
          console.error("Course error:", courseError);
          toast.error("Failed to load course");
          return;
        }

        // Fetch enrolled students count
        const { count: studentCount, error: countError } = await supabase
          .from("course_students")
          .select("*", { count: "exact", head: true })
          .eq("course_id", courseId);

        if (countError) {
          console.error("Student count error:", countError);
        }

        // Fetch enrolled students details
        const { data: enrolled, error: studentError } = await supabase
          .from("course_students")
          .select(
            `
            student_id,
            profiles (
              name,
              naturalid
            )
          `
          )
          .eq("course_id", courseId);

        if (!studentError && enrolled) {
          const mappedStudents = enrolled.map((item) => ({
            id: item.student_id,
            name: item.profiles?.name || "Unknown",
            studentId: item.profiles?.naturalid || "N/A",
            email: `${item.profiles?.name
              ?.toLowerCase()
              .replace(/\s+/g, ".")}@university.edu`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              item.profiles?.name || "Unknown"
            )}&background=49bbbd&color=fff&size=128`,
          }));
          setEnrolledStudents(mappedStudents);
        }

        // Map course data
        setCourse({
          id: courseData.id,
          code: courseData.code,
          title: courseData.title,
          instructor: courseData.instructor,
          students: studentCount || 0,
          enrollment: studentCount || 0,
          image: courseData.image,
          category: courseData.category,
          description: courseData.description,
          created_by: courseData.created_by,
          created_at: courseData.created_at,
          updated_at: courseData.updated_at,
        });
      } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("An error occurred while loading the course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data: quizzesData, error } = await supabase
          .from("quizzes")
          .select(
            `
          *,
          quiz_questions:quiz_questions!quiz_questions_quiz_id_fkey (
            id,
            question,
            options,
            answer
          )
        `
          )
          .eq("course_id", courseId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (quizzesData) {
          const formatted = quizzesData.map((q) => ({
            ...q,
            totalQuestions: q.quiz_questions?.length || 0,
            quiz_questions:
              q.quiz_questions?.map((qq) => ({
                ...qq,
                correctAnswer: qq.options.indexOf(qq.answer),
              })) || [],
          }));

          setQuizzes(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
        toast.error("Failed to load quizzes");
      }
    };

    fetchQuizzes();
  }, [courseId]);

  const toggleLesson = (index) => {
    if (activeTab !== "lectures") return;
    setOpenLessons((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${quizTitle}"?`))
      return;

    try {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;

      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete quiz");
    }
  };

  // FIXED: Complete lesson submit handler
  const handleLessonSubmit = async (e) => {
    e.preventDefault();

    if (!lessonForm.title) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("lectures")
        .insert([
          {
            course_id: courseId,
            title: lessonForm.title,
            video_url: lessonForm.video_url || null,
            content: lessonForm.content,
          },
        ])
        .select();

      if (error) {
        console.error(error);
        toast.error("Error saving lecture: " + error.message);
        return;
      }

      setLessons((prev) => [...prev, data[0]]);
      setLessonForm({ title: "", content: "", video_url: "", duration: "" });
      setShowLessonModal(false);
      toast.success("Lesson added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();

    const naturalId = studentForm.naturalId?.trim();
    if (!naturalId) {
      toast.error("Please enter Natural ID");
      return;
    }

    setLoading(true);

    try {
      // Search for student in profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("naturalid", naturalId)
        .single();

      if (profileError || !profile) {
        toast.error("Student not found!");
        setLoading(false);
        return;
      }

      // Check if student is already enrolled
      const { data: existingEnrollment } = await supabase
        .from("course_students")
        .select("*")
        .eq("course_id", courseId)
        .eq("student_id", profile.id)
        .single();

      if (existingEnrollment) {
        toast.error("Student already enrolled!");
        setLoading(false);
        return;
      }

      // Add student to course_students table
      const { error: insertError } = await supabase
        .from("course_students")
        .insert({
          course_id: courseId,
          student_id: profile.id,
        })
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error(`Error adding student: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Update UI
      const newStudent = {
        id: profile.id,
        name: profile.name || "Unknown",
        studentId: profile.naturalid || "N/A",
        email: `${(profile.name || "student")
          .replace(/\s+/g, ".")
          .toLowerCase()}@university.edu`,
        avatar:
          profile.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            profile.name || "Unknown"
          )}&background=49bbbd&color=fff&size=128`,
      };

      setEnrolledStudents((prev) => [...prev, newStudent]);
      toast.success("Student added successfully!");

      setStudentForm({ naturalId: "" });
      setShowStudentModal(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this course?`)) return;

    try {
      const { error } = await supabase
        .from("course_students")
        .delete()
        .eq("course_id", courseId)
        .eq("student_id", studentId);

      if (error) throw error;

      setEnrolledStudents((prev) =>
        prev.filter((student) => student.id !== studentId)
      );
      toast.success(`${studentName} removed successfully`);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to remove student");
    }
  };

  if (loading || !course) {
    return (
      <div className='course-details-page'>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className='course-details-page'>
      {/* Hero Section */}
      <div className='hero-section'>
        <div className='hero-content'>
          <h1>
            {course.code} - {course.title}
          </h1>
          <p>Instructor: {course.instructor}</p>
        </div>
      </div>

      <div className='container course-details-container'>
        <div className='course-info-card'>
          <div className='info-tags'>
            <span>
              <i className='fas fa-users'></i> {course.enrollment} Students
              Enrolled
            </span>
            <span>
              <i className='fas fa-tag'></i> {course.category}
            </span>
          </div>

          {/* Tabs */}
          <div className='tabs'>
            {(role === "teacher" ? teacherAccess : studentAccess).map(
              ([id, label]) => (
                <button
                  key={id}
                  className={`tab ${activeTab === id ? "active" : ""}`}
                  onClick={() => setActiveTab(id)}>
                  {label}
                </button>
              )
            )}
          </div>

          {/* Tab Content */}
          <div className='tab-box'>
            {/* Description Tab */}
            {activeTab === "desc" && (
              <div className='tab-section'>
                <h3>About This Course</h3>
                <p>{course.description || "No description available"}</p>
              </div>
            )}

            {/* Quiz Page Tab */}
            {activeTab === "quiz" && <QuizPage />}

            {/* Lectures Tab */}
            {activeTab === "lectures" && (
              <Lectures
                openLessons={openLessons}
                lessons={lessons}
                setLessons={setLessons}
                setShowLessonModal={setShowLessonModal}
                toggleLesson={toggleLesson}
              />
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && <VideoCam />}

            {/* Students Tab */}
            {activeTab === "students" && (
              <div className='tab-section' id='students'>
                <div className='quizzes-header'>
                  <h3>Students</h3>
                  {role === "teacher" && (
                    <button
                      className='add-quiz-btn'
                      onClick={() => setShowStudentModal(true)}>
                      <svg
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        style={{ marginRight: "8px" }}>
                        <path
                          d='M12 5V19M5 12H19'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                        />
                      </svg>
                      Add Student
                    </button>
                  )}
                </div>

                {enrolledStudents.length === 0 ? (
                  <div className='no-students'>
                    <i className='fas fa-user-graduate'></i>
                    <p>
                      No students enrolled yet. Click "Add Student" to enroll
                      your first student.
                    </p>
                  </div>
                ) : (
                  <div className='students-grid'>
                    {enrolledStudents.map((student) => (
                      <div key={student.id} className='student-card'>
                        <img
                          width='120'
                          src={student.avatar}
                          alt={student.name}
                          className='student-avatar'
                        />
                        <div className='student-info'>
                          <h4>{student.name}</h4>
                          <p className='student-id'>{student.studentId}</p>
                          <p className='student-email'>{student.email}</p>
                        </div>
                        { role === "teacher"&&
                          <button
                            className='student-delete-btn'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudent(student.id, student.name);
                            }}
                            title='Remove student'>
                            <svg
                              width='16'
                              height='16'
                              viewBox='0 0 24 24'
                              fill='none'
                              stroke='currentColor'>
                              <path
                                d='M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </button>
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quizzes Tab */}
            {activeTab === "quizzes" && (
              <div className='tab-section' id='quizzes'>
                <div className='quizzes-header'>
                  <h3>Quizzes & Exams</h3>
                  <button
                    className='add-quiz-btn'
                    onClick={() => setShowQuizModal(true)}>
                    <svg
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      style={{ marginRight: "8px" }}>
                      <path
                        d='M12 5V19M5 12H19'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                      />
                    </svg>
                    Add Quiz
                  </button>
                </div>

                {quizzes.length === 0 ? (
                  <div className='no-students'>
                    <i className='fas fa-clipboard-list'></i>
                    <p>
                      No quizzes added yet. Click "Add Quiz" to create your
                      first quiz.
                    </p>
                  </div>
                ) : (
                  <div className='quizzes-list'>
                    {quizzes.map((quiz) => {
                      return (
                        <div key={quiz.id} className='quiz-card-wrapper'>
                          <div className='quiz-card'>
                            <div className='quiz-info'>
                              <h4>{quiz.title}</h4>
                              <div className='quiz-meta'>
                                <span>
                                  <i className='fas fa-question-circle'></i>{" "}
                                  {quiz.quiz_questions?.length || 0} Questions
                                </span>
                                <span>
                                  <i className='fas fa-clock'></i>{" "}
                                  {quiz.duration || 0} Minutes
                                </span>
                              </div>
                            </div>
                            <div className='quiz-actions'>
                              <button
                                className='quiz-view-btn'
                                onClick={() => handleViewAnswers(quiz.id)}>
                                <i className='fas fa-eye'></i> View{" "}
                                <TableOfContents />
                              </button>
                              <button
                                className='quiz-delete-btn'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuiz(quiz.id, quiz.title);
                                }}>
                                <svg
                                  width='16'
                                  height='16'
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='currentColor'>
                                  <path
                                    d='M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Questions Section */}
                          {viewAnswers &&
                            selectedQuizId === quiz.id &&
                            quiz.quiz_questions &&
                            quiz.quiz_questions.length > 0 && (
                              <div className='quiz-questions-section'>
                                {quiz.quiz_questions.map((question, qIndex) => (
                                  <div
                                    key={question.id || qIndex}
                                    className='bg-light p-3 rounded mb-4'>
                                    <h5>Question {qIndex + 1}</h5>

                                    <div className='p-3 bg-white border rounded mb-2'>
                                      <div className='d-flex justify-content-between align-items-start mb-2'>
                                        <div>
                                          <span className='badge bg-primary me-2'>
                                            Q{qIndex + 1}
                                          </span>
                                          <strong>
                                            {question.question ||
                                              "Question text not available"}
                                          </strong>
                                        </div>
                                      </div>

                                      <div className='row g-2'>
                                        {question.options?.map(
                                          (option, oIndex) => (
                                            <div
                                              className='col-md-6'
                                              key={oIndex}>
                                              <div
                                                className={`p-2 border rounded ${
                                                  oIndex ===
                                                  question.correctAnswer
                                                    ? "border-success bg-success bg-opacity-10"
                                                    : ""
                                                }`}>
                                                <strong>
                                                  {String.fromCharCode(
                                                    65 + oIndex
                                                  )}
                                                  .
                                                </strong>{" "}
                                                {option}
                                                {oIndex ===
                                                  question.correctAnswer && (
                                                  <span className='text-success fw-bold ms-2'>
                                                    ✓
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuizModal && (
        <AddQuestions
          courseId={courseId}
          showQuizModal={showQuizModal}
          setShowQuizModal={setShowQuizModal}
        />
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div
          className='modal-overlay'
          onClick={() => setShowLessonModal(false)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Add New Lesson</h2>
              <button
                className='modal-close'
                onClick={() => setShowLessonModal(false)}>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M18 6L6 18M6 6L18 18'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleLessonSubmit} className='modal-form'>
              {/* Title */}
              <div className='form-group-part'>
                <label htmlFor='lesson-title'>
                  Lesson Title <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  id='lesson-title'
                  name='title'
                  type='text'
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                  placeholder='e.g. Week 1: Introduction to React'
                  required
                />
              </div>

              {/* Content */}
              <div className='form-group-part'>
                <label htmlFor='lesson-content'>
                  Lesson Description <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  id='lesson-content'
                  name='content'
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
                  }
                  placeholder='Describe the lesson content, topics covered, learning objectives...'
                  rows={5}
                  required
                  style={{
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Video URL */}
              <div className='form-group-part'>
                <label htmlFor='lesson-video'>Video URL</label>
                <input
                  id='lesson-video'
                  name='video_url'
                  type='url'
                  value={lessonForm.video_url}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, video_url: e.target.value })
                  }
                  placeholder='https://youtube.com/watch?v=...'
                />
              </div>

              {/* Actions */}
              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn-cancel'
                  onClick={() => {
                    setShowLessonModal(false);
                    setLessonForm({
                      title: "",
                      content: "",
                      video_url: "",
                    });
                  }}>
                  Cancel
                </button>
                <button type='submit' className='btn-submit'>
                  ✓ Add Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div
          className='modal-overlay'
          onClick={() => setShowStudentModal(false)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Add Student to Course</h2>
              <button
                className='modal-close'
                onClick={() => setShowStudentModal(false)}>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M18 6L6 18M6 6L18 18'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className='modal-form'>
              <div className='form-group-part'>
                <label htmlFor='natural-id'>Student National ID *</label>
                <input
                  id='natural-id'
                  name='naturalId'
                  value={studentForm.naturalId}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      naturalId: e.target.value,
                    })
                  }
                  placeholder='14 digit ID number'
                  required
                />
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn-cancel'
                  onClick={() => setShowStudentModal(false)}>
                  Cancel
                </button>
                <button type='submit' className='btn-submit'>
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
