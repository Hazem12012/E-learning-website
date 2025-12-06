import { useEffect, useState } from "react";
import { supabase } from "../../services/SupabaseClient";
import { useParams } from "react-router-dom";
import { UserAuth } from "../../services/AuthContext";
import toast from "react-hot-toast";
import "./QuizPage.css";

export default function QuizPage() {
  const params = useParams();
  const courseId = params.id || params.courseId;
  const { user } = UserAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

  // Fetch quizzes for this course
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!courseId) {
        toast.error("Course ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: quizzesData, error: quizzesError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("course_id", courseId);

        if (quizzesError) {
          toast.error("Error loading quizzes: " + quizzesError.message);
          setLoading(false);
          return;
        }

        if (!quizzesData || quizzesData.length === 0) {
          toast.info("No quizzes available for this course yet.");
          setQuizzes([]);
          setLoading(false);
          return;
        }

        setQuizzes(quizzesData);

        if (quizzesData.length === 1) {
          setSelectedQuizId(quizzesData[0].id);
        }
      } catch (err) {
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [courseId]);

  // Fetch questions when a quiz is selected
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedQuizId) return;

      try {
        setLoading(true);
        setAnswers({});
        setTimerExpired(false);

        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", selectedQuizId);

        if (questionsError) {
          toast.error("Error loading questions: " + questionsError.message);
          setLoading(false);
          return;
        }

        if (!questionsData || questionsData.length === 0) {
          toast.error("No questions found for this quiz.");
          setQuestions([]);
          setLoading(false);
          return;
        }

        setQuestions(questionsData);

        const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
        if (selectedQuiz && selectedQuiz.duration) {
          setTimeRemaining(selectedQuiz.duration * 60);
        }

        if (user?.id) {
          const { data: existingSubmission } = await supabase
            .from("quiz_answers")
            .select("*")
            .eq("quiz_id", selectedQuizId)
            .eq("student_id", user.id)
            .maybeSingle();

          if (existingSubmission) {
            setSubmitted(true);
            toast.info("You have already submitted this quiz.");
          } else {
            setSubmitted(false);
          }
        }
      } catch (err) {
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedQuizId, user?.id, quizzes]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || submitted || loading) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted, loading]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timerExpired && !submitted) {
      toast.error("Time's up! Auto-submitting quiz...");
      handleSubmit();
    }
  }, [timerExpired, submitted]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle option selection
  const handleSelectAnswer = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  // Check if all questions are answered
  const allQuestionsAnswered = () => {
    return questions.every((q) => answers[q.id]);
  };

  // Submit answers
  const handleSubmit = async () => {
    if (!user || !user.id) {
      toast.error("You must be logged in to submit the quiz!");
      return;
    }

    if (!timerExpired && !allQuestionsAnswered()) {
      toast.error("Please answer all questions before submitting!");
      return;
    }

    try {
      setLoading(true);

      const { data: existing } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("quiz_id", selectedQuizId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existing) {
        toast.error("You have already submitted this quiz!");
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Calculate final score
      let finalScore = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.answer) {
          finalScore++;
        }
      });

      // Prepare answers as JSON
      const answersArray = Object.keys(answers).map((questionId) => ({
        question_id: parseInt(questionId),
        selected_answer: answers[questionId],
      }));

      const { error: insertError } = await supabase
        .from("quiz_answers")
        .insert([
          {
            quiz_id: selectedQuizId,
            student_id: user.id,
            answers: answersArray,
            score: finalScore,
            submitted_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      setSubmitted(true);
      setTimeRemaining(null);
      toast.success(`Quiz submitted! Score: ${finalScore}/${questions.length}`);
    } catch (err) {
      toast.error("Failed to submit quiz: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && quizzes.length === 0) {
    return (
      <div className='container my-4'>
        <div className='text-center'>
          <div className='spinner-border' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
          <p className='mt-2'>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  // No quizzes found
  if (!loading && quizzes.length === 0) {
    return (
      <div className='container my-4'>
        <div className='alert alert-info'>
          <h4>No Quizzes Available</h4>
          <p>There are no quizzes for this course yet.</p>
        </div>
      </div>
    );
  }

  // Show quiz selector if multiple quizzes
  if (!selectedQuizId && quizzes.length > 1) {
    return (
      <div className='container my-4'>
        <h2 className='mb-4'>Select a Quiz</h2>
        <div className='row'>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className='col-md-6 mb-3'>
              <div
                className='card h-100 cursor-pointer hover:shadow-lg transition'
                onClick={() => setSelectedQuizId(quiz.id)}
                style={{ cursor: "pointer" }}>
                <div className='card-body'>
                  <h5 className='card-title'>{quiz.title}</h5>
                  <p className='card-text text-muted'>
                    {quiz.description || "Click to start this quiz"}
                  </p>
                  {quiz.duration && (
                    <p className='card-text'>
                      <small className='text-muted'>
                        Duration: {quiz.duration} minutes
                      </small>
                    </p>
                  )}
                  <button className='btn btn-primary'>Start Quiz</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get selected quiz info
  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  // Submitted state
  if (submitted) {
    return (
      <div className='container my-4'>
        <div className='alert alert-success' role='alert'>
          <h4 className='alert-heading'>Success!</h4>
          <p>You have submitted this quiz. Thank you!</p>
        </div>
        {quizzes.length > 1 && (
          <button
            className='btn btn-secondary'
            onClick={() => {
              setSelectedQuizId(null);
              setSubmitted(false);
              setQuestions([]);
              setAnswers({});
              setTimeRemaining(null);
              setTimerExpired(false);
            }}>
            Back to Quizzes
          </button>
        )}
      </div>
    );
  }

  // Main quiz render
  return (
    <div className='container my-4'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h2>{selectedQuiz?.title || "Quiz"}</h2>
        <div className='d-flex align-items-center gap-3'>
          {timeRemaining !== null && (
            <div
              className={`badge fs-5 px-3 py-2 ${
                timeRemaining <= 60
                  ? "bg-danger"
                  : timeRemaining <= 300
                  ? "bg-warning"
                  : "bg-primary"
              }`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className='text-center my-5'>
          <div className='spinner-border' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
          <p className='mt-2'>Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className='alert alert-warning'>
          <p>No questions available for this quiz.</p>
        </div>
      ) : (
        <>
          <div className='mb-3 text-muted'>
            Answer all {questions.length} questions
            {selectedQuiz?.duration && (
              <span className='ms-2'>
                • Duration: {selectedQuiz.duration} minutes
              </span>
            )}
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} className='card p-3 mb-3 shadow-sm'>
              <h5 className='mb-3'>
                <span className='badge bg-primary me-2'>{idx + 1}</span>
                {q.question}
              </h5>

              {q.options &&
                Array.isArray(q.options) &&
                q.options.map((opt, i) => (
                  <div className='form-check mb-2' key={i}>
                    <input
                      className='form-check-input'
                      type='radio'
                      name={`question-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleSelectAnswer(q.id, opt)}
                      id={`q-${q.id}-opt-${i}`}
                      disabled={timerExpired}
                    />
                    <label
                      className='form-check-label'
                      htmlFor={`q-${q.id}-opt-${i}`}>
                      {opt}
                    </label>
                  </div>
                ))}
            </div>
          ))}

          <div className='d-flex justify-content-between align-items-center mt-4'>
            <span className='text-muted'>
              Answered: {Object.keys(answers).length} / {questions.length}
            </span>
            <button
              className='btn btn-primary btn-lg'
              onClick={handleSubmit}
              disabled={(!allQuestionsAnswered() && !timerExpired) || loading}>
              {loading ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
