import { useEffect, useState } from "react";
import "./CourseDetailsPage.css";
import { useParams } from "react-router-dom";
import { supabase } from "../../services/SupabaseClient";
import Loading from './../../../components/Loading/Loading';
import toast from "react-hot-toast";

export default function CourseDetailsPage() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState();

    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState("desc");
    const [openLessons, setOpenLessons] = useState({});
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [quizzes, setQuizzes] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [quizForm, setQuizForm] = useState({
        title: "",
        questions: "",
        duration: "",
    });
    const [lessonForm, setLessonForm] = useState({
        title: "",
        content: "",
    });
    const [studentForm, setStudentForm] = useState({
        name: "",
        studentId: "",
        email: "",
        avatarUrl: "",
    });

    const [enrolledStudents, setEnrolledStudents] = useState([]);

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
                    .select(`
                        student_id,
                        profiles (
                            name,
                            naturalid
                        )
                    `)
                    .eq("course_id", courseId);

                if (!studentError && enrolled) {
                    const mappedStudents = enrolled.map(item => ({
                        id: item.student_id,
                        name: item.profiles?.name || 'Unknown',
                        studentId: item.profiles?.naturalid || 'N/A',
                        email: `${ item.profiles?.name?.toLowerCase().replace(/\s+/g, '.') }@university.edu`,
                        avatar: `https://ui-avatars.com/api/?name=${ encodeURIComponent(item.profiles?.name || 'Unknown') }&background=49bbbd&color=fff&size=128`
                    }));
                    setEnrolledStudents(mappedStudents);
                }

                // Map course data to desired structure
                const formattedCourse = {
                    idx: 0,
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
                };
                setCourse(formattedCourse);
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]); // Removed setLoading from dependencies
    console.log(course)

    const toggleLesson = (index) => {
        if (activeTab !== "curriculum") return;
        setOpenLessons((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const handleQuizSubmit = (e) => {
        e.preventDefault();
        if (!quizForm.title || !quizForm.questions || !quizForm.duration) {
            console.log("Please fill in all quiz fields.");
            return;
        }

        const newQuiz = {
            id: Date.now(),
            title: quizForm.title,
            questions: parseInt(quizForm.questions),
            duration: parseInt(quizForm.duration),
        };

        setQuizzes((prev) => [...prev, newQuiz]);
        setQuizForm({ title: "", questions: "", duration: "" });
        setShowQuizModal(false);
    };

    const handleDeleteQuiz = (quizId, quizTitle) => {
        if (window.confirm(`Are you sure you want to delete "${ quizTitle }"?`)) {
            setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
        }
    };

    const handleLessonSubmit = (e) => {
        e.preventDefault();
        if (!lessonForm.title || !lessonForm.content) {
            console.log("Please fill in all lesson fields.");
            return;
        }

        const newLesson = {
            id: Date.now(),
            title: lessonForm.title,
            content: lessonForm.content,
        };

        setLessons((prev) => [...prev, newLesson]);
        setLessonForm({ title: "", content: "" });
        setShowLessonModal(false);
    };

    const handleDeleteLesson = (lessonId, lessonTitle) => {
        if (window.confirm(`Are you sure you want to delete "${ lessonTitle }"?`)) {
            setLessons((prev) => prev.filter((l) => l.id !== lessonId));
        }
    };
    // const handleStudentSubmit = async (e) => {
    //     e.preventDefault();

    //     const naturalId = studentForm.naturalId?.trim();
    //     if (!naturalId) {
    //         toast.error("Please enter Natural ID");
    //         return;
    //     }

    //     setLoading(true);

    //     // 1️⃣ البحث عن الطالب في جدول profiles
    //     const { data: profile, error: profileError } = await supabase
    //         .from("profiles")
    //         .select("*")
    //         .eq("naturalid", naturalId)
    //         .single();

    //     if (profileError || !profile) {
    //         toast.error("Student not found!");
    //         setLoading(false);
    //         return;
    //     }

    //     // 2️⃣ التأكد أن الطالب غير مضاف بالفعل
    //     const exists = enrolledStudents.some((s) => s.id === profile.id);
    //     if (exists) {
    //         toast.error("Student already enrolled!");
    //         setLoading(false);
    //         return;
    //     }

    //     // 3️⃣ إضافة الطالب لجدول course_students
    //     const { error: insertError } = await supabase
    //         .from("course_students")
    //         .insert({
    //             course_id: courseId,
    //             student_id: profile.id,
    //         });

    //     if (insertError) {
    //         console.error(insertError);
    //         toast.error("Error adding student!");
    //         setLoading(false);
    //         return;
    //     }

    //     // 4️⃣ تحديث الواجهة
    //     const newStudent = {
    //         id: profile.id,
    //         name: profile.name,
    //         studentId: profile.naturalid,
    //         email: `${ profile.name.replace(/\s+/g, '.').toLowerCase() }@university.edu`,
    //         avatar: `https://ui-avatars.com/api/?name=${ encodeURIComponent(profile.name) }`
    //     };

    //     setEnrolledStudents((prev) => [...prev, newStudent]);

    //     // 5️⃣ تنظيف الفورم وإغلاق المودال
    //     setStudentForm({ naturalId: "" });
    //     setShowStudentModal(false);
    //     setLoading(false);
    // };

    const handleStudentSubmit = async (e) => {
        e.preventDefault();

        const naturalId = studentForm.naturalId?.trim();
        if (!naturalId) {
            toast.error("Please enter Natural ID");
            return;
        }

        setLoading(true);

        try {
            // 1️⃣ Search for student in profiles table (use lowercase 'naturalid')
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("naturalid", naturalId)  // ✅ lowercase
                .single();

            if (profileError) {
                console.error("Profile error:", profileError);
                toast.error("Student not found!");
                setLoading(false);
                return;
            }

            if (!profile) {
                toast.error("Student not found!");
                setLoading(false);
                return;
            }

            // 2️⃣ Check if student is already enrolled
            const { data: existingEnrollment, error: checkError } = await supabase
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

            // 3️⃣ Add student to course_students table
            const { data: insertData, error: insertError } = await supabase
                .from("course_students")
                .insert({
                    course_id: courseId,
                    student_id: profile.id,
                })
                .select();

            if (insertError) {
                console.error("Insert error:", insertError);
                toast.error(`Error adding student: ${ insertError.message }`);
                setLoading(false);
                return;
            }

            // 4️⃣ Update UI
            const newStudent = {
                id: profile.id,
                name: profile.name || 'Unknown',
                studentId: profile.naturalid || 'N/A',  // ✅ lowercase
                email: `${ (profile.name || 'student').replace(/\s+/g, '.').toLowerCase() }@university.edu`,
                avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${ encodeURIComponent(profile.name || 'Unknown') }&background=49bbbd&color=fff&size=128`
            };

            setEnrolledStudents((prev) => [...prev, newStudent]);
            toast.success("Student added successfully!");

            // 5️⃣ Clean form and close modal
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
        if (!window.confirm(`Remove ${ studentName } from this course?`)) return;

        const { error } = await supabase
            .from("course_students")
            .delete()
            .eq("course_id", courseId)
            .eq("student_id", studentId);

        if (error) {
            console.error("Delete failed:", error);
            toast.error("Error: " + error.message);
            return;
        }

        setEnrolledStudents((prev) =>
            prev.filter((student) => student.id !== studentId)
        );

        toast.success(`${ studentName } removed successfully.`);
    };


    // ✅ Show loading state
    if (loading || !course) {
        return (
            <div className="course-details-page">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '50vh',
                    fontSize: '1.2rem',
                    color: '#666'
                }}>
                    <Loading />
                </div>
            </div>
        );
    }

    return (
        <div className="course-details-page">
            <div className="hero-section" >
                <div className="hero-content">

                    <h1>{course.code} - {course.title}</h1>
                    <p>Instructor: {course.instructor}</p>
                </div>
            </div>

            <div className="container course-details-container">
                <div className="course-info-card">
                    <div className="info-tags">
                        <span>
                            <i className="fas fa-users"></i> {course.enrollment} Students Enrolled
                        </span>
                        <span>
                            <i className="fas fa-tag"></i> {course.category}
                        </span>
                    </div>

                    <div className="tabs">
                        {[
                            ["desc", "Course Description"],
                            ["curriculum", "Curriculum"],
                            ["instructor", "Instructor"],
                            ["students", "Enrolled Students"],
                            ["quizzes", "Quizzes & Exams"],
                        ].map(([id, label]) => (
                            <button
                                key={id}
                                className={`tab ${ activeTab === id ? "active" : "" }`}
                                onClick={() => setActiveTab(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="tab-box">
                        {activeTab === "desc" && (
                            <div className="tab-section">
                                <h3>About This Course</h3>
                                <p>{course.description || "With out Discription"}</p>
                            </div>
                        )}

                        {activeTab === "curriculum" && (
                            <div className="tab-section">
                                <div className="quizzes-header">
                                    <h3>Course Modules</h3>
                                    <button
                                        className="add-quiz-btn"
                                        onClick={() => setShowLessonModal(true)}
                                    >
                                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' style={{ marginRight: '8px' }}>
                                            <path d='M12 5V19M5 12H19' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                                        </svg>
                                        Add Lesson
                                    </button>
                                </div>

                                {lessons.length === 0 ? (
                                    <div className="no-students">
                                        <i className="fas fa-book"></i>
                                        <p>No lessons added yet. Click "Add Lesson" to create your first lesson.</p>
                                    </div>
                                ) : (
                                    lessons.map((lesson, index) => (
                                        <div key={lesson.id} className={`lesson ${ openLessons[index] ? "open" : "" }`}>
                                            <div className="lesson-header" onClick={() => toggleLesson(index)}>
                                                <span className="lesson-title">
                                                    <i className="fas fa-book"></i> {lesson.title}
                                                </span>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <button
                                                        className="quiz-delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteLesson(lesson.id, lesson.title);
                                                        }}
                                                        style={{ padding: '6px 10px', marginRight: '10px' }}
                                                    >
                                                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                                            <path d='M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                                                        </svg>
                                                    </button>
                                                    <span className="arrow">▼</span>
                                                </div>
                                            </div>

                                            {openLessons[index] && (
                                                <div className="lesson-content">
                                                    <p>{lesson.content}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === "instructor" && (
                            <div className="tab-section" id="instructor">
                                <h3>About the Instructor</h3>

                                <div className="inst">
                                    <div className="inst-info">
                                        <h4>{course.instructor}</h4>
                                        <p className="inst-title">Professor</p>
                                        <p className="inst-department">
                                            Department of {course.category}, Faculty of Science
                                        </p>
                                        <p className="inst-bio">
                                            {course.instructor} has extensive teaching experience and expertise in {course.category}.
                                            They are dedicated to helping students achieve their academic goals and develop
                                            strong foundational knowledge in the subject area.
                                        </p>
                                        <div className="inst-contact">
                                            <p>
                                                <i className="fas fa-envelope"></i> {course.instructor.toLowerCase().replace(/\s+/g, '.').replace('dr.', '')}@university.edu
                                            </p>
                                            <p>
                                                <i className="fas fa-building"></i> Office: Building B, Room 304
                                            </p>
                                            <p>
                                                <i className="fas fa-clock"></i> Office Hours: Sun & Tue, 2-4 PM
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "students" && (
                            <div className="tab-section" id="students">
                                <div className="quizzes-header">
                                    <h3>Enrolled Students</h3>
                                    <button
                                        className="add-quiz-btn"
                                        onClick={() => setShowStudentModal(true)}
                                    >
                                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' style={{ marginRight: '8px' }}>
                                            <path d='M12 5V19M5 12H19' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                                        </svg>
                                        Add Student
                                    </button>
                                </div>

                                {enrolledStudents.length === 0 ? (
                                    <div className="no-students">
                                        <i className="fas fa-user-graduate"></i>
                                        <p>No students enrolled yet. Click "Add Student" to enroll your first student.</p>
                                    </div>
                                ) : (
                                    <div className="students-grid">
                                        {enrolledStudents.map((student) => (
                                            <div key={student.id} className="student-card">
                                                <img
                                                    src={student.avatar}
                                                    alt={student.name}
                                                    className="student-avatar"
                                                />
                                                <div className="student-info">
                                                    <h4>{student.name}</h4>
                                                    <p className="student-id">{student.studentId}</p>
                                                    <p className="student-email">{student.email}</p>
                                                </div>
                                                <button
                                                    className="student-delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteStudent(student.id, student.name);
                                                    }}
                                                    title="Remove student"
                                                >
                                                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                                        <path d='M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "quizzes" && (
                            <div className="tab-section" id="quizzes">
                                <div className="quizzes-header">
                                    <h3>Quizzes & Exams</h3>
                                    <button
                                        className="add-quiz-btn"
                                        onClick={() => setShowQuizModal(true)}
                                    >
                                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' style={{ marginRight: '8px' }}>
                                            <path d='M12 5V19M5 12H19' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                                        </svg>
                                        Add Quiz
                                    </button>
                                </div>

                                {quizzes.length === 0 ? (
                                    <div className="no-students">
                                        <i className="fas fa-clipboard-list"></i>
                                        <p>No quizzes added yet. Click "Add Quiz" to create your first quiz.</p>
                                    </div>
                                ) : (
                                    <div className="quizzes-list">
                                        {quizzes.map((quiz) => (
                                            <div key={quiz.id} className="quiz-card">
                                                <div className="quiz-info">
                                                    <h4>{quiz.title}</h4>
                                                    <div className="quiz-meta">
                                                        <span>
                                                            <i className="fas fa-question-circle"></i> {quiz.questions} Questions
                                                        </span>
                                                        <span>
                                                            <i className="fas fa-clock"></i> {quiz.duration} Minutes
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="quiz-actions">
                                                    <button className="quiz-view-btn">
                                                        <i className="fas fa-eye"></i> View
                                                    </button>
                                                    <button
                                                        className="quiz-delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteQuiz(quiz.id, quiz.title);
                                                        }}
                                                    >
                                                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                                            <path d='M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals remain the same... */}
            {showQuizModal && (
                <div className="modal-overlay" onClick={() => setShowQuizModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Quiz</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowQuizModal(false)}
                            >
                                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                                    <path d='M18 6L6 18M6 6L18 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleQuizSubmit} className="modal-form">
                            <div className="form-group-part">
                                <label htmlFor="quiz-title">Quiz Title *</label>
                                <input
                                    id="quiz-title"
                                    name="title"
                                    value={quizForm.title}
                                    onChange={(e) =>
                                        setQuizForm({ ...quizForm, title: e.target.value })
                                    }
                                    placeholder="e.g. Midterm Exam"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group-part">
                                    <label htmlFor="quiz-questions">Number of Questions *</label>
                                    <input
                                        id="quiz-questions"
                                        name="questions"
                                        type="number"
                                        min="1"
                                        value={quizForm.questions}
                                        onChange={(e) =>
                                            setQuizForm({ ...quizForm, questions: e.target.value })
                                        }
                                        placeholder="e.g. 10"
                                        required
                                    />
                                </div>

                                <div className="form-group-part">
                                    <label htmlFor="quiz-duration">Duration (minutes) *</label>
                                    <input
                                        id="quiz-duration"
                                        name="duration"
                                        type="number"
                                        min="1"
                                        value={quizForm.duration}
                                        onChange={(e) =>
                                            setQuizForm({ ...quizForm, duration: e.target.value })
                                        }
                                        placeholder="e.g. 30"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowQuizModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Add Quiz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showLessonModal && (
                <div className="modal-overlay" onClick={() => setShowLessonModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Lesson</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowLessonModal(false)}
                            >
                                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                                    <path d='M18 6L6 18M6 6L18 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleLessonSubmit} className="modal-form">
                            <div className="form-group-part">
                                <label htmlFor="lesson-title">Lesson Title *</label>
                                <input
                                    id="lesson-title"
                                    name="title"
                                    value={lessonForm.title}
                                    onChange={(e) =>
                                        setLessonForm({ ...lessonForm, title: e.target.value })
                                    }
                                    placeholder="e.g. Week 1: Introduction"
                                    required
                                />
                            </div>

                            <div className="form-group-part">
                                <label htmlFor="lesson-content">Lesson Content *</label>
                                <textarea
                                    id="lesson-content"
                                    name="content"
                                    value={lessonForm.content}
                                    onChange={(e) =>
                                        setLessonForm({ ...lessonForm, content: e.target.value })
                                    }
                                    placeholder="Describe the lesson content, topics, assignments, etc."
                                    rows={6}
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowLessonModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Add Lesson
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStudentModal && (
                <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Student to Course</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowStudentModal(false)}
                            >
                                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                                    <path d='M18 6L6 18M6 6L18 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleStudentSubmit} className="modal-form">
                            <div className="form-group-part">
                                <label htmlFor="natural-id">Student Normal ID *</label>
                                <input
                                    id="natural-id"
                                    name="naturalId"
                                    value={studentForm.naturalId}
                                    onChange={(e) =>
                                        setStudentForm({ ...studentForm, naturalId: e.target.value })
                                    }
                                    placeholder="(14) Number 123..."
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowStudentModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
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