import React, { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  setDoc,
  arrayUnion,
} from "firebase/firestore";
import {
  BookOpen,
  User,
  Briefcase,
  BarChart2,
  Zap,
  Video,
  CheckCircle,
} from "lucide-react";

// Load Tailwind CSS script (assumed available in this environment)
// Load Lucide Icons (assumed available via Lucide React)

// --- CONFIGURATION & FIREBASE INITIALIZATION (MANDATORY) ---
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : { apiKey: "mock-api-key" };

const appId = typeof __app_id !== "undefined" ? __app_id : "ulmp-default-app";
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

// Mock UUID function for unauthenticated users (Firestore requires a UID)
const generateMockUserId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// --- GEMINI API CONFIGURATION AND UTILITIES ---
const GEMINI_API_KEY = ""; // Intentionally left empty for Canvas environment
const GEMINI_FLASH_MODEL = "gemini-2.5-flash-preview-09-2025";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Helper for exponential backoff
const retryFetch = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Calls the Gemini API for text generation.
 * @param {object} payload - The request payload (contents, systemInstruction, generationConfig).
 * @returns {Promise<string>} The generated text.
 */
const generateContent = async (payload) => {
  try {
    const response = await retryFetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Gemini API Error Response:", result);
      throw new Error(
        "Failed to generate content: Text missing in response or API error."
      );
    }
    return text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

// --- SHARED COMPONENTS ---

const Button = ({
  children,
  className = "",
  onClick,
  disabled = false,
  variant = "primary",
  icon: Icon,
}) => {
  const baseStyle =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  let variantStyle = "";

  if (disabled) {
    variantStyle = "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none";
  } else if (variant === "primary") {
    variantStyle =
      "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500";
  } else if (variant === "secondary") {
    variantStyle =
      "bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500";
  } else if (variant === "danger") {
    variantStyle = "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500";
  } else if (variant === "ai") {
    variantStyle =
      "bg-yellow-500 hover:bg-yellow-600 text-gray-900 focus:ring-yellow-500";
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      onClick={onClick}
      disabled={disabled}>
      {Icon && <Icon className='w-5 h-5 mr-2' />}
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-lg transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

const NavLink = ({ children, active, onClick }) => (
  <button
    className={`px-4 py-3 rounded-t-lg font-medium transition-colors border-b-2 ${
      active
        ? "border-indigo-600 text-indigo-700 font-bold"
        : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
    }`}
    onClick={onClick}>
    {children}
  </button>
);

// --- FIREBASE SERVICE HOOK ---
function useFirebase() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'Doctor' or 'Student'

  useEffect(() => {
    // 1. Initialize Firebase App and Services
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const authService = getAuth(app);

    setDb(firestore);
    setAuth(authService);

    // 2. Handle Authentication State
    const unsubscribe = onAuthStateChanged(authService, async (user) => {
      let currentUserId = null;

      if (user) {
        currentUserId = user.uid;
      } else {
        // Sign in using custom token or anonymously
        try {
          if (initialAuthToken) {
            const credentials = await signInWithCustomToken(
              authService,
              initialAuthToken
            );
            currentUserId = credentials.user.uid;
          } else {
            const credentials = await signInAnonymously(authService);
            currentUserId = credentials.user.uid;
          }
        } catch (error) {
          console.error("Firebase Auth Error:", error);
          currentUserId = generateMockUserId(); // Fallback for stability
        }
      }

      setUserId(currentUserId);
      setIsAuthReady(true);

      // Load user profile/role
      if (currentUserId) {
        // Private document: /artifacts/{appId}/users/{userId}/profile/data
        const userDocRef = doc(
          firestore,
          `/artifacts/${appId}/users/${currentUserId}/profile`,
          "data"
        );
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role || "Student");
          } else {
            // Default to null if profile not set, forcing them to the AuthPage to select role
            setUserRole(null);
          }
        });
        return () => {
          if (unsubscribe) unsubscribe();
          if (unsubProfile) unsubProfile();
        };
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { db, auth, userId, isAuthReady, userRole, setUserRole };
}

// --- AUTHENTICATION & ROLE SELECTION ---

function AuthPage({ auth, db, userId, setUserRole, navigate }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!db || !userId || loading) return;

    setLoading(true);
    // Private document: /artifacts/{appId}/users/{userId}/profile/data
    const userDocRef = doc(
      db,
      `/artifacts/${appId}/users/${userId}/profile`,
      "data"
    );

    try {
      if (!isLogin) {
        // Register: Save role to Firestore
        await setDoc(
          userDocRef,
          {
            role: role,
            email: email || `${userId.substring(0, 8)}@mock.edu`,
            createdAt: new Date(),
          },
          { merge: true }
        );
        // alert(`Registered as ${role}. You are now signed in!`); // Use console.log instead of alert
        console.log(`Registered as ${role}.`);
      }
      // Login: useFirebase hook handles loading the role. If it's missing, they are prompted to set it.

      // Force the role update in the local state
      setUserRole(role);
      navigate("Dashboard");
    } catch (error) {
      console.error("Auth/Profile Setup Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <Card className='max-w-md w-full border-t-4 border-indigo-600'>
        <h2 className='text-3xl font-bold text-center text-indigo-600 mb-2'>
          ULMP
        </h2>
        <p className='text-center text-gray-500 mb-6'>
          {isLogin ? "Sign In to continue" : "Create your account"}
        </p>

        <form onSubmit={handleAuth} className='space-y-4'>
          <label className='block'>
            <span className='text-gray-700 font-medium'>
              UID Display (Read-Only)
            </span>
            <input
              type='text'
              value={userId || "Loading..."}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 bg-gray-100 cursor-default'
              readOnly
            />
            <p className='text-xs text-gray-500 mt-1'>
              This is your unique system ID for collaboration.
            </p>
          </label>

          <label className='block'>
            <span className='text-gray-700 font-medium'>Select Role</span>
            <div className='mt-1 flex space-x-2'>
              <Button
                type='button'
                variant={role === "Doctor" ? "primary" : "secondary"}
                onClick={() => setRole("Doctor")}
                className='flex-1'
                icon={Briefcase}>
                Doctor
              </Button>
              <Button
                type='button'
                variant={role === "Student" ? "primary" : "secondary"}
                onClick={() => setRole("Student")}
                className='flex-1'
                icon={User}>
                Student
              </Button>
            </div>
          </label>

          <Button
            type='submit'
            className='w-full'
            disabled={loading}
            icon={loading ? BarChart2 : User}>
            {loading
              ? "Processing..."
              : isLogin
              ? "Sign In / Select Role"
              : "Create Account & Sign In"}
          </Button>
        </form>

        <p className='mt-6 text-center text-sm'>
          {isLogin ? "First time user?" : "Returning user?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className='text-indigo-600 hover:text-indigo-800 ml-1 font-medium'>
            {isLogin ? "Set Profile/Register" : "Back to Sign In"}
          </button>
        </p>
      </Card>
    </div>
  );
}

// --- DOCTOR VIEWS: AI QUIZ GENERATION FEATURE ---

function QuizForm({ courseId, courseName, db }) {
  const [quizTitle, setQuizTitle] = useState("");
  const [topic, setTopic] = useState(""); // Input for LLM guidance
  const [questionCount, setQuestionCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !courseId || isLoading || !topic) return;
    setIsLoading(true);
    setGeneratedQuestions(null);

    const prompt = `Generate ${questionCount} multiple-choice quiz questions for a university course named "${courseName}". The questions should strictly cover the topic: "${topic}". The options must be plausible and one option must be the correct answer.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              q: { type: "STRING", description: "The quiz question text." },
              options: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "Four multiple-choice options.",
              },
              answer: {
                type: "STRING",
                description:
                  "The correct answer (must match one of the options).",
              },
            },
            propertyOrdering: ["q", "options", "answer"],
          },
        },
      },
    };

    try {
      const jsonString = await generateContent(payload);
      // Clean the response if needed (sometimes LLMs add markdown fences)
      const cleanJsonString = jsonString.replace(/```json|```/g, "").trim();
      const parsedQuestions = JSON.parse(cleanJsonString);
      if (Array.isArray(parsedQuestions)) {
        setGeneratedQuestions(parsedQuestions);
      } else {
        throw new Error("AI returned an invalid JSON structure.");
      }
    } catch (error) {
      console.error("Quiz Generation Error:", error.message);
      setGeneratedQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedQuestions || !db) return;
    setIsLoading(true);
    try {
      const quizData = {
        title: quizTitle || `AI Generated Quiz for ${courseName} (${topic})`,
        courseId: courseId,
        questions: generatedQuestions.map((q, i) => ({
          id: i + 1,
          q: q.q,
          options: q.options,
          answer: q.answer,
          type: "mcq",
        })),
        createdAt: new Date(),
        isAiGenerated: true,
      };

      // Public collection for quizzes
      const quizColRef = collection(
        db,
        `/artifacts/${appId}/public/data/quizzes`
      );
      await addDoc(quizColRef, quizData);

      console.log("AI Quiz published successfully!");
      setQuizTitle("");
      setTopic("");
      setQuestionCount(3);
      setGeneratedQuestions(null);
    } catch (error) {
      console.error("Error publishing quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mt-4 p-4 border border-yellow-300'>
      <h4 className='text-xl font-semibold mb-3 text-yellow-800 flex items-center'>
        <Zap className='w-6 h-6 mr-2 text-yellow-500' /> AI Quiz Generator
      </h4>
      <p className='text-sm text-gray-600 mb-4'>
        Quickly generate quizzes based on your lecture topics using AI
        structured output.
      </p>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Topic for Questions (e.g., "The French Revolution")
          </label>
          <input
            type='text'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='Required: Specify the core topic...'
            className='mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm'
            required
          />
        </div>
        <div className='flex space-x-4'>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700'>
              Number of Questions (Max 10)
            </label>
            <input
              type='number'
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(
                  Math.min(10, Math.max(1, Number(e.target.value)))
                )
              }
              className='mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm'
              min='1'
              max='10'
              required
            />
          </div>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700'>
              Quiz Title (Optional)
            </label>
            <input
              type='text'
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder='Auto-generated if empty'
              className='mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm'
            />
          </div>
        </div>
        <Button
          type='submit'
          disabled={isLoading || !topic}
          variant='ai'
          className='w-full'
          icon={Zap}>
          {isLoading
            ? "Generating Questions..."
            : `Generate ${questionCount} Questions`}
        </Button>
      </form>

      {generatedQuestions && generatedQuestions.length > 0 && (
        <div className='mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-300'>
          <h5 className='font-bold mb-3 text-lg text-gray-800'>
            Review and Publish ({generatedQuestions.length} Questions)
          </h5>
          <div className='max-h-96 overflow-y-auto space-y-3'>
            {generatedQuestions.map((q, index) => (
              <div
                key={index}
                className='p-3 bg-white rounded-md shadow-sm border border-gray-100'>
                <p className='font-semibold text-gray-800'>
                  {index + 1}. {q.q}
                </p>
                <ul className='text-sm list-disc list-inside mt-1 ml-4 text-gray-600 space-y-1'>
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      className={
                        opt === q.answer ? "text-green-600 font-medium" : ""
                      }>
                      {opt}{" "}
                      {opt === q.answer && (
                        <CheckCircle className='w-4 h-4 inline ml-1' />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Button
            onClick={handlePublish}
            disabled={isLoading}
            className='mt-4 w-full bg-green-600 hover:bg-green-700'>
            {isLoading ? "Publishing..." : "Publish Quiz to Course"}
          </Button>
        </div>
      )}
      {generatedQuestions && generatedQuestions.length === 0 && !isLoading && (
        <div className='mt-6 p-4 bg-red-50 rounded-lg border border-red-300 text-red-700 text-center'>
          Failed to generate questions. Please try a different topic.
        </div>
      )}
    </Card>
  );
}

function AttendanceTable({ courseId, db }) {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (!db || !courseId) return;

    // Public collection for attendance
    const attendanceColRef = collection(
      db,
      `/artifacts/${appId}/public/data/attendance`
    );
    const q = query(attendanceColRef, where("courseId", "==", courseId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAttendance(list);
      },
      (error) => {
        console.error("Attendance Snapshot Error:", error);
      }
    );

    return () => unsubscribe();
  }, [db, courseId]);

  // Group by studentId to show total presence
  const studentSummary = attendance.reduce((acc, entry) => {
    const studentId = entry.studentId;
    acc[studentId] = {
      count: (acc[studentId]?.count || 0) + 1,
      lastCheckIn: entry.checkInTime.toDate(),
    };
    return acc;
  }, {});

  const totalSessions = Math.max(
    1,
    Math.max(...Object.values(studentSummary).map((s) => s.count))
  ); // Mock total sessions

  return (
    <Card className='mt-4 p-4 border border-indigo-200'>
      <h4 className='text-xl font-semibold mb-3 text-indigo-700 flex items-center'>
        <BarChart2 className='w-5 h-5 mr-2' /> Student Attendance Summary
      </h4>
      <div className='max-h-96 overflow-y-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50 sticky top-0'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Student UID
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Sessions
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Last Check-in
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {Object.entries(studentSummary)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([studentId, data]) => (
                <tr key={studentId} className='hover:bg-indigo-50'>
                  <td className='px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {studentId}
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap text-sm text-gray-700'>
                    {data.count} / {totalSessions}
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap text-xs text-gray-500'>
                    {data.lastCheckIn.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            {Object.keys(studentSummary).length === 0 && (
              <tr>
                <td
                  colSpan='3'
                  className='px-4 py-4 text-center text-sm text-gray-500'>
                  No attendance records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DoctorCourseDetail({ course, db }) {
  const [activeTab, setActiveTab] = useState("attendance");

  return (
    <div>
      <h2 className='text-3xl font-bold text-gray-800'>
        {course.name} ({course.code})
      </h2>
      <p className='text-indigo-600 mb-4'>
        Instructor: Dr. {course.doctorName}
      </p>

      <div className='flex space-x-2 border-b mb-6'>
        <NavLink
          active={activeTab === "attendance"}
          onClick={() => setActiveTab("attendance")}>
          Attendance Tracking
        </NavLink>
        <NavLink
          active={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}>
          AI Quiz Creation
        </NavLink>
        <NavLink
          active={activeTab === "students"}
          onClick={() => setActiveTab("students")}>
          Student Enrollment (Mock)
        </NavLink>
      </div>

      <div>
        {activeTab === "attendance" && (
          <AttendanceTable courseId={course.id} db={db} />
        )}
        {activeTab === "quiz" && (
          <QuizForm courseId={course.id} courseName={course.name} db={db} />
        )}
        {activeTab === "students" && (
          <Card className='mt-4 p-4'>
            <h4 className='text-xl font-semibold mb-3 text-indigo-700'>
              Student Management
            </h4>
            <p className='text-gray-600'>
              This feature is mocked for simplicity. In a production app, you
              would manage student enrollment (adding/removing student UIDs to
              the course document).
            </p>
            <ul className='list-disc list-inside mt-4 text-gray-700 space-y-1'>
              <li>**Student IDs currently enrolled (Mock):**</li>
              <li>S-UID-123456</li>
              <li>S-UID-789012</li>
            </ul>
            <Button className='mt-4' variant='secondary' disabled>
              Add Student by ID (Mock)
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function DoctorDashboard({ db, userId }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const doctorName = userId
    ? `Dr. ${userId.substring(0, 6).toUpperCase()}`
    : "Unknown Doctor";

  // 1. Fetch Doctor's Courses
  useEffect(() => {
    if (!db || !userId) return;

    // Public collection for courses
    const courseColRef = collection(
      db,
      `/artifacts/${appId}/public/data/courses`
    );
    const q = query(courseColRef, where("doctorId", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(list);
      },
      (error) => {
        console.error("Course Snapshot Error:", error);
      }
    );

    return () => unsubscribe();
  }, [db, userId]);

  // 2. Handle Course Creation
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!db || !userId || !newCourseName || !newCourseCode) return;
    setIsCreating(true);

    try {
      const courseColRef = collection(
        db,
        `/artifacts/${appId}/public/data/courses`
      );
      await addDoc(courseColRef, {
        name: newCourseName,
        code: newCourseCode.toUpperCase().trim(),
        doctorId: userId,
        doctorName: doctorName,
        createdAt: new Date(),
        studentUids: [], // Empty list to be populated later
      });
      setNewCourseName("");
      setNewCourseCode("");
      console.log("Course created successfully!");
    } catch (error) {
      console.error("Error creating course:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (selectedCourse) {
    return (
      <div className='p-8 max-w-7xl mx-auto'>
        <Button
          onClick={() => setSelectedCourse(null)}
          variant='secondary'
          className='mb-6'>
          ← Back to Dashboard
        </Button>
        <DoctorCourseDetail course={selectedCourse} db={db} />
      </div>
    );
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-4xl font-extrabold text-gray-900 mb-2'>
        Doctor Dashboard
      </h1>
      <p className='mb-8 text-gray-600 text-lg'>
        Welcome back, **{doctorName}**. Manage and create content for your
        university lectures.
      </p>

      {/* Create Course Section */}
      <Card className='mb-10 border-t-4 border-indigo-600'>
        <h2 className='text-2xl font-semibold text-indigo-700 mb-4'>
          Create New Course
        </h2>
        <form
          onSubmit={handleCreateCourse}
          className='sm:flex sm:space-x-3 space-y-3 sm:space-y-0'>
          <input
            type='text'
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            placeholder='Course Name (e.g., Advanced Calculus)'
            className='flex-grow p-3 border border-gray-300 rounded-lg shadow-sm w-full'
            required
            disabled={isCreating}
          />
          <input
            type='text'
            value={newCourseCode}
            onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
            placeholder='Code (e.g., MA400)'
            className='w-full sm:w-32 p-3 border border-gray-300 rounded-lg shadow-sm'
            required
            disabled={isCreating}
          />
          <Button
            type='submit'
            disabled={isCreating}
            className='w-full sm:w-auto'
            icon={BookOpen}>
            {isCreating ? "Adding..." : "Create Course"}
          </Button>
        </form>
      </Card>

      {/* Course List */}
      <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
        My Active Courses ({courses.length})
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {courses.map((course) => (
          <Card
            key={course.id}
            className='cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-indigo-500 hover:border-indigo-700'
            onClick={() => setSelectedCourse(course)}>
            <h3 className='text-xl font-bold text-gray-900 mb-1'>
              {course.name}
            </h3>
            <p className='text-sm font-semibold text-indigo-600'>
              {course.code}
            </p>
            <p className='text-sm mt-3 text-gray-500'>
              <span className='font-medium'>UID:</span>{" "}
              {course.doctorId.substring(0, 8)}...
            </p>
            <div className='mt-4'>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCourse(course);
                }}
                variant='secondary'
                className='text-sm'>
                Manage Course
              </Button>
            </div>
          </Card>
        ))}
        {courses.length === 0 && (
          <p className='text-gray-500 col-span-full'>
            No courses created yet. Use the form above to start teaching!
          </p>
        )}
      </div>
    </div>
  );
}

// --- STUDENT VIEWS: AI SUMMARY FEATURE ---

function VideoSummaryGenerator({ courseName, videoTitle }) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary("");

    const prompt = `Generate a concise, 3-sentence summary of a university lecture video titled "${videoTitle}" for the course "${courseName}". Focus only on the key learning objectives and core academic concepts.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [
          {
            text: "You are a highly efficient academic assistant, skilled at summarizing complex lecture material clearly and concisely for students. Output only the summary text.",
          },
        ],
      },
    };

    try {
      const generatedText = await generateContent(payload);
      setSummary(generatedText);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-3 bg-indigo-50 rounded-lg shadow-inner w-full'>
      <h5 className='font-bold text-indigo-800 mb-2 flex items-center text-sm'>
        <Zap className='w-4 h-4 mr-2' /> AI Summary of Key Concepts
      </h5>

      {summary ? (
        <p className='text-gray-800 whitespace-pre-wrap text-sm'>{summary}</p>
      ) : isLoading ? (
        <div className='flex items-center text-indigo-500 text-sm'>
          <svg
            className='animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'>
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
          </svg>
          Generating summary...
        </div>
      ) : error ? (
        <p className='text-red-500 text-sm'>Error: {error}</p>
      ) : (
        <Button
          onClick={handleGenerateSummary}
          variant='secondary'
          className='bg-indigo-200 hover:bg-indigo-300 text-indigo-800 border-none px-3 py-1 text-sm'>
          Generate Summary
        </Button>
      )}
    </div>
  );
}

function QuizTaker({ courseId, db, userId, quiz, onQuizComplete }) {
  const [score, setScore] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const totalQuestions = quiz.questions.length;

  const handleSubmit = async () => {
    // Mock Grading: Simulate a score
    const finalScore = Math.floor(Math.random() * (totalQuestions + 1));
    setScore(finalScore);
    setIsSubmitted(true);

    try {
      // Public collection for quiz submissions
      const submissionRef = doc(
        db,
        `/artifacts/${appId}/public/data/quiz_submissions`,
        `${userId}_${courseId}_${quiz.id}`
      );
      await setDoc(submissionRef, {
        userId: userId,
        courseId: courseId,
        quizId: quiz.id,
        score: finalScore,
        maxScore: totalQuestions,
        submittedAt: new Date(),
      });
      console.log("Quiz submitted successfully!");
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  if (isSubmitted) {
    return (
      <Card className='bg-green-50 border border-green-300 text-center'>
        <h4 className='text-3xl font-bold text-green-700 mb-2'>
          Quiz Submitted!
        </h4>
        <p className='text-2xl mt-2 mb-4'>
          Your Mock Score:{" "}
          <strong className='text-green-900'>
            {score}/{totalQuestions}
          </strong>
        </p>
        <p className='text-gray-600 mb-4'>
          Great work! The score has been recorded.
        </p>
        <Button onClick={onQuizComplete} icon={BookOpen}>
          Back to Course Videos
        </Button>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <h3 className='text-2xl font-bold text-gray-800'>{quiz.title}</h3>
      <p className='text-sm text-gray-600 mb-4'>
        Total Questions: {totalQuestions} | AI Generated:{" "}
        {quiz.isAiGenerated ? "Yes" : "No"}
      </p>

      {/* Display AI-generated questions */}
      {quiz.questions.map((q, index) => (
        <Card key={index} className='bg-gray-50 border-l-4 border-indigo-400'>
          <p className='font-semibold text-gray-800'>
            {index + 1}. {q.q}
          </p>
          <div className='mt-2 space-y-2'>
            {q.options.map((option, i) => (
              <div
                key={i}
                className='flex items-center text-base text-gray-700'>
                <input
                  type='radio'
                  id={`q${index}-opt${i}`}
                  name={`question-${index}`}
                  className='mr-3 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500'
                />
                <label htmlFor={`q${index}-opt${i}`}>{option}</label>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Button onClick={handleSubmit} className='w-full mt-6'>
        Submit Quiz (Mock Grading)
      </Button>
    </div>
  );
}

function StudentCourseDetail({ course, db, userId }) {
  const [activeTab, setActiveTab] = useState("videos");
  const [quizData, setQuizData] = useState(null);
  const [myAttendance, setMyAttendance] = useState(0);

  // Mock video content
  const mockVideos = [
    {
      title: "Lecture 1: Introduction to Redux Patterns",
      url: "https://mock/v1",
    },
    {
      title: "Lecture 2: Advanced State Management in React",
      url: "https://mock/v2",
    },
    {
      title: "Lecture 3: Component Lifecycle and Effects",
      url: "https://mock/v3",
    },
  ];

  // 1. Fetch Quiz for this Course
  useEffect(() => {
    if (!db || !course.id) return;
    const quizColRef = collection(
      db,
      `/artifacts/${appId}/public/data/quizzes`
    );
    const q = query(quizColRef, where("courseId", "==", course.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Get the latest published quiz
        const latestQuiz = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())[0];
        setQuizData(latestQuiz || null);
      },
      (error) => console.error("Quiz Fetch Error:", error)
    );

    return () => unsubscribe();
  }, [db, course.id]);

  // 2. Fetch Student's Attendance
  useEffect(() => {
    if (!db || !course.id || !userId) return;
    const attColRef = collection(
      db,
      `/artifacts/${appId}/public/data/attendance`
    );
    const q = query(
      attColRef,
      where("courseId", "==", course.id),
      where("studentId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMyAttendance(snapshot.size);
      },
      (error) => console.error("Attendance Fetch Error:", error)
    );

    return () => unsubscribe();
  }, [db, course.id, userId]);

  // 3. Simulate Attendance Check-in
  const handleCheckIn = async () => {
    if (!db || !userId) return;
    try {
      const attendanceColRef = collection(
        db,
        `/artifacts/${appId}/public/data/attendance`
      );
      await addDoc(attendanceColRef, {
        courseId: course.id,
        studentId: userId,
        checkInTime: new Date(),
        type: "session_checkin",
      });
      console.log("Attendance checked in successfully!");
    } catch (error) {
      console.error("Attendance Check-in Error:", error);
    }
  };

  return (
    <div>
      <h2 className='text-3xl font-bold text-gray-800'>
        {course.name} ({course.code})
      </h2>
      <p className='text-indigo-600 mb-4'>
        Instructor: Dr. {course.doctorName}
      </p>

      <div className='flex space-x-2 border-b mb-6'>
        <NavLink
          active={activeTab === "videos"}
          onClick={() => setActiveTab("videos")}>
          <Video className='w-5 h-5 inline mr-1' /> Online Videos
        </NavLink>
        <NavLink
          active={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}>
          <Zap className='w-5 h-5 inline mr-1' /> Quiz (
          {quizData ? "Ready" : "Pending"})
        </NavLink>
        <NavLink
          active={activeTab === "attendance"}
          onClick={() => setActiveTab("attendance")}>
          <CheckCircle className='w-5 h-5 inline mr-1' /> My Attendance
        </NavLink>
      </div>

      <div className='py-4'>
        {activeTab === "videos" && (
          <div className='space-y-6'>
            <h3 className='text-2xl font-semibold mb-4 text-gray-800'>
              Lecture Materials
            </h3>
            {mockVideos.map((video, index) => (
              <Card
                key={index}
                className='flex flex-col space-y-4 hover:shadow-xl'>
                <div className='flex justify-between items-start w-full'>
                  <p className='font-bold text-xl text-gray-900'>
                    {video.title}
                  </p>
                  <Button
                    variant='secondary'
                    className='px-4 py-1.5 text-sm'
                    disabled>
                    Watch Video (Mock)
                  </Button>
                </div>
                <VideoSummaryGenerator
                  courseName={course.name}
                  videoTitle={video.title}
                />
              </Card>
            ))}
          </div>
        )}

        {activeTab === "quiz" &&
          (quizData ? (
            <QuizTaker
              courseId={course.id}
              db={db}
              userId={userId}
              quiz={quizData}
              onQuizComplete={() => setActiveTab("videos")}
            />
          ) : (
            <Card className='bg-gray-100 text-center py-10'>
              <p className='text-xl text-gray-600'>
                The Doctor has not published a quiz for this course yet.
              </p>
              <p className='text-sm text-gray-500 mt-2'>
                Check back later or focus on the lecture videos.
              </p>
            </Card>
          ))}

        {activeTab === "attendance" && (
          <Card className='text-center bg-indigo-50 border border-indigo-200'>
            <h3 className='text-3xl font-bold mb-3 text-indigo-800'>
              Total Sessions Attended: {myAttendance}
            </h3>
            <p className='text-gray-600 mb-4'>
              Click below to record your presence for the current online or
              offline session.
            </p>
            <Button
              onClick={handleCheckIn}
              className='mt-2 bg-green-600 hover:bg-green-700 text-white'
              icon={CheckCircle}>
              Check-in Now
            </Button>
            <p className='text-xs mt-3 text-gray-500'>
              Your attendance is instantly updated on the Doctor's dashboard.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function StudentDashboard({ db, userId }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch all available courses (mocking enrollment for simplicity)
  useEffect(() => {
    if (!db) return;

    // Public collection for courses
    const courseColRef = collection(
      db,
      `/artifacts/${appId}/public/data/courses`
    );
    const q = query(courseColRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(list);
      },
      (error) => {
        console.error("Course Snapshot Error:", error);
      }
    );

    return () => unsubscribe();
  }, [db]);

  if (selectedCourse) {
    return (
      <div className='p-8 max-w-7xl mx-auto'>
        <Button
          onClick={() => setSelectedCourse(null)}
          variant='secondary'
          className='mb-6'>
          ← Back to Course List
        </Button>
        <StudentCourseDetail course={selectedCourse} db={db} userId={userId} />
      </div>
    );
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-4xl font-extrabold text-gray-900 mb-2'>
        Student Dashboard
      </h1>
      <p className='mb-8 text-gray-600 text-lg'>
        Welcome! Your ID: <strong className='text-indigo-600'>{userId}</strong>
      </p>

      <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
        Available Courses ({courses.length})
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {courses.map((course) => (
          <Card
            key={course.id}
            className='cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-green-500 hover:border-green-700'
            onClick={() => setSelectedCourse(course)}>
            <h3 className='text-xl font-bold text-gray-900 mb-1'>
              {course.name}
            </h3>
            <p className='text-sm font-semibold text-indigo-600'>
              {course.code}
            </p>
            <p className='text-sm mt-3 text-gray-500'>
              <span className='font-medium'>Instructor:</span>{" "}
              {course.doctorName}
            </p>
            <div className='mt-4'>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCourse(course);
                }}
                icon={Video}>
                View Course
              </Button>
            </div>
          </Card>
        ))}
        {courses.length === 0 && (
          <p className='text-gray-500 col-span-full'>
            No courses are currently available. Ask a Doctor to create one!
          </p>
        )}
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---

function Test() {
  const { db, auth, userId, isAuthReady, userRole, setUserRole } =
    useFirebase();
  const [currentView, setCurrentView] = useState("Auth"); // 'Auth', 'Dashboard', 'Profile'

  // Auto-navigate after successful authentication and role load
  useEffect(() => {
    if (isAuthReady && userRole) {
      setCurrentView("Dashboard");
    } else if (isAuthReady && !userRole && userId) {
      // If authenticated but no role set (new user), stay on Auth to select role
      setCurrentView("Auth");
    }
  }, [isAuthReady, userRole, userId]);

  const handleLogout = () => {
    if (auth) signOut(auth);
    setUserRole(null);
    setCurrentView("Auth");
  };

  const navigate = useCallback((view) => setCurrentView(view), []);

  if (!isAuthReady) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <p className='text-xl text-indigo-600 animate-pulse'>
          Initializing Platform...
        </p>
      </div>
    );
  }

  // If no role is set, show the Auth/Role Selection page
  if (currentView === "Auth" || !userRole) {
    return (
      <AuthPage
        auth={auth}
        db={db}
        userId={userId}
        setUserRole={setUserRole}
        navigate={navigate}
      />
    );
  }

  // --- Main Layout ---
  return (
    <div className='min-h-screen bg-gray-100 flex flex-col'>
      {/* Header */}
      <header className='bg-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-10'>
        <h1
          className='text-2xl font-extrabold text-indigo-700 cursor-pointer flex items-center'
          onClick={() => navigate("Dashboard")}>
          <BookOpen className='w-7 h-7 mr-2' /> ULMP | {userRole} Portal
        </h1>
        <div className='flex items-center space-x-4'>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              userRole === "Doctor"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}>
            {userRole}
          </span>
          <Button
            variant='secondary'
            onClick={() => navigate("Profile")}
            icon={User}
            className='hidden sm:inline-flex'>
            Profile
          </Button>
          <Button variant='danger' onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Content Area */}
      <main className='flex-grow'>
        {currentView === "Dashboard" && userRole === "Doctor" && (
          <DoctorDashboard db={db} userId={userId} navigate={navigate} />
        )}
        {currentView === "Dashboard" && userRole === "Student" && (
          <StudentDashboard db={db} userId={userId} navigate={navigate} />
        )}

        {currentView === "Profile" && (
          <div className='p-8 max-w-xl mx-auto'>
            <h1 className='text-4xl font-extrabold text-gray-900 mb-6'>
              User Profile
            </h1>
            <Card className='space-y-3'>
              <p className='text-lg'>
                <strong>Role:</strong>{" "}
                <span className='font-semibold text-indigo-600'>
                  {userRole}
                </span>
              </p>
              <p className='text-lg'>
                <strong>UID:</strong>{" "}
                <span className='break-all'>{userId}</span>
              </p>
              <p className='text-sm text-gray-500'>**App ID:** {appId}</p>
              <p className='text-sm mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200'>
                **Note:** Your unique UID is used to track your activities (like
                attendance and quiz submissions) in the public Firestore
                collections.
              </p>
              <Button className='mt-4' onClick={() => navigate("Dashboard")}>
                Go to Dashboard
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className='p-4 bg-gray-200 text-center text-sm text-gray-600'>
        University Lecture Management Platform | Authenticated UID: {userId}
      </footer>
    </div>
  );
}

export default Test;
