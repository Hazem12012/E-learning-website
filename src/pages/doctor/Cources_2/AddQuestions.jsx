import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../services/SupabaseClient";

export default function AddQuestions({
  showQuizModal,
  setShowQuizModal,
  courseId,
}) {
  const [quizForm, setQuizForm] = useState({
    title: "",
    duration: "",
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });

  // -------------------------
  // ADD QUESTION
  // -------------------------
  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim())
      return toast.error("Enter a question");

    const filledOptions = currentQuestion.options.filter(
      (opt) => opt.trim() !== ""
    );
    if (filledOptions.length < 2)
      return toast.error("At least two options required");

    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now(),
          question: currentQuestion.question,
          options: filledOptions,
          correctAnswer: currentQuestion.correctAnswer,
        },
      ],
    }));

    // Reset current question
    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    });
  };

  // -------------------------
  // DELETE QUESTION
  // -------------------------
  const handleDeleteQuestion = (id) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  // -------------------------
  // SUBMIT QUIZ
  // -------------------------
  // const handleSubmit = async () => {
  //   if (!quizForm.title.trim()) return toast.error("Quiz title required");
  //   if (!quizForm.duration.trim()) return toast.error("Duration required");
  //   if (quizForm.questions.length === 0)
  //     return toast.error("Add at least one question");

  //   try {
  //     toast.loading("Saving quiz...", { id: "quiz" });

  //     // 1) Insert Quiz
  //     const { data: quizData, error: quizError } = await supabase
  //       .from("quizzes")
  //       .insert([
  //         {
  //           title: quizForm.title,
  //           description: "Quiz Description",
  //           course_id: courseId,
  //           duration: quizForm.duration,
  //         },
  //       ])
  //       .select()
  //       .single();

  //     if (quizError) throw quizError;

  //     const quizId = quizData.id;

  //     // 2) Insert Questions
  //     const payload = quizForm.questions.map((q) => ({
  //       quiz_id: quizId,
  //       question: q.question,
  //       options: q.options,
  //       answer: q.options[q.correctAnswer],
  //     }));

  //     const { error: qError } = await supabase
  //       .from("quiz_questions")
  //       .insert(payload);
  //     if (qError) throw qError;

  //     toast.success("Quiz created successfully!", { id: "quiz" });

  //     // Reset form
  //     setQuizForm({ title: "", duration: "", questions: [] });
  //     setShowQuizModal(false);
  //   } catch (error) {
  //     toast.error(error.message, { id: "quiz" });
  //   }
  // };

  // const handleSubmit = async () => {
  //   // Validation
  //   if (!quizForm.title.trim()) return toast.error("Quiz title required");
  //   if (!quizForm.duration || Number(quizForm.duration) <= 0)
  //     return toast.error("Duration required and must be greater than 0");
  //   if (quizForm.questions.length === 0)
  //     return toast.error("Add at least one question");

  //   try {
  //     toast.loading("Saving quiz...", { id: "quiz" });

  //     // 1️⃣ Insert quiz into Supabase
  //     const { data: quizData, error: quizError } = await supabase
  //       .from("quizzes")
  //       .insert([
  //         {
  //           title: quizForm.title,
  //           description: "Quiz Description",
  //           course_id: courseId,
  //           duration: Number(quizForm.duration), // تأكد أنها رقم
  //         },
  //       ])
  //       .select()
  //       .single();

  //     if (quizError) throw quizError;

  //     const quizId = quizData.id;

  //     // 2️⃣ Insert questions
  //     const payload = quizForm.questions.map((q) => ({
  //       quiz_id: quizId,
  //       question: q.question,
  //       options: q.options,
  //       answer: q.options[q.correctAnswer],
  //     }));

  //     const { error: qError } = await supabase
  //       .from("quiz_questions")
  //       .insert(payload);
  //     if (qError) throw qError;

  //     // 3️⃣ Success
  //     toast.success("Quiz created successfully!", { id: "quiz" });

  //     // 4️⃣ Reset form
  //     setQuizForm({ title: "", duration: "", questions: [] });
  //     setCurrentQuestion({
  //       question: "",
  //       options: ["", "", "", ""],
  //       correctAnswer: 0,
  //     });
  //     setShowQuizModal(false);
  //   } catch (error) {
  //     console.error(error);
  //     toast.error(error.message || "Error creating quiz", { id: "quiz" });
  //   }
  // };

  const handleSubmit = async () => {
    if (!quizForm.title.trim()) return toast.error("Quiz title required");
    if (!quizForm.duration || Number(quizForm.duration) <= 0)
      return toast.error("Duration required and must be > 0");
    if (quizForm.questions.length === 0)
      return toast.error("Add at least one question");

    try {
      toast.loading("Saving quiz...", { id: "quiz" });

      // Insert Quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert([
          {
            title: quizForm.title,
            description: "Quiz Description",
            course_id: courseId,
            duration: Number(quizForm.duration),
          },
        ])
        .select()
        .single();

      if (quizError) throw quizError;

      const quizId = quizData.id;

      // Insert Questions
      const payload = quizForm.questions.map((q) => ({
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        answer: q.options[q.correctAnswer],
      }));

      const { error: qError } = await supabase
        .from("quiz_questions")
        .insert(payload);
      if (qError) throw qError;

      toast.success("Quiz created successfully!", { id: "quiz" });

      // Reset form
      setQuizForm({ title: "", duration: "", questions: [] });
      setCurrentQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      });
      setShowQuizModal(false);
    } catch (error) {
      toast.error(error.message || "Error creating quiz", { id: "quiz" });
      console.error(error);
    }
  };

  // -------------------------
  // OPTION CHANGE
  // -------------------------
  const handleOptionChange = (index, value) => {
    setCurrentQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  if (!showQuizModal) {
    return (
      <div className='d-flex align-items-center justify-content-center min-vh-100 bg-light'>
        <button
          onClick={() => setShowQuizModal(true)}
          className='btn btn-primary px-4 py-2'>
          Create New Quiz
        </button>
      </div>
    );
  }

  return (
    <div
      className='position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center p-3'
      onClick={() => setShowQuizModal(false)}
      style={{ zIndex: 9999 }}>
      <div
        className='bg-white rounded shadow-lg w-100'
        style={{ maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='d-flex justify-content-between align-items-center border-bottom p-3'>
          <h4 className='m-0'>Create Quiz</h4>
          <button
            className='btn btn-light'
            onClick={() => setShowQuizModal(false)}>
            ✖
          </button>
        </div>

        <div className='p-4'>
          {/* Basic Info */}
          <div className='row g-3 mb-4'>
            <div className='col-md-6'>
              <label className='form-label'>Quiz Title *</label>
              <input
                type='text'
                value={quizForm.title}
                onChange={(e) =>
                  setQuizForm({ ...quizForm, title: e.target.value })
                }
                className='form-control'
                placeholder='e.g. Exam Name'
              />
            </div>

            <div className='col-md-6'>
              <label className='form-label'>Duration (minutes) *</label>
              <input
                type='number'
                min='1'
                value={quizForm.duration}
                onChange={(e) =>
                  setQuizForm({ ...quizForm, duration: e.target.value })
                }
                className='form-control'
                placeholder='e.g. 30 minutes'
              />
            </div>
          </div>

          {/* Questions List */}
          {quizForm.questions.length > 0 && (
            <div className='bg-light p-3 rounded mb-4'>
              <h5>Questions ({quizForm.questions.length})</h5>
              {quizForm.questions.map((q, index) => (
                <div key={q.id} className='p-3 bg-white border rounded mb-2'>
                  <div className='d-flex justify-content-between align-items-start mb-2'>
                    <div>
                      <span className='badge bg-primary me-2'>
                        Q{index + 1}
                      </span>
                      <strong>{q.question}</strong>
                    </div>
                    <button
                      className='btn btn-sm btn-danger'
                      onClick={() => handleDeleteQuestion(q.id)}>
                      🗑
                    </button>
                  </div>

                  <div className='row g-2'>
                    {q.options.map((opt, i) => (
                      <div className='col-md-6' key={i}>
                        <div
                          className={`p-2 border rounded ${
                            i === q.correctAnswer
                              ? "border-success bg-success bg-opacity-10"
                              : ""
                          }`}>
                          <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
                          {i === q.correctAnswer && (
                            <span className='text-success fw-bold ms-2'>✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Question */}
          <div className='border-top pt-4'>
            <h5>Add New Question</h5>
            <label className='form-label mt-2'>Question *</label>
            <textarea
              rows={3}
              className='form-control mb-3'
              value={currentQuestion.question}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  question: e.target.value,
                })
              }></textarea>

            <div className='row g-3 mb-3'>
              {currentQuestion.options.map((option, index) => (
                <div className='col-md-6' key={index}>
                  <label className='form-label'>
                    Option {String.fromCharCode(65 + index)}
                  </label>
                  <div className='input-group'>
                    <input
                      type='text'
                      className='form-control'
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <div className='input-group-text'>
                      <input
                        type='radio'
                        name='correctAnswer'
                        checked={currentQuestion.correctAnswer === index}
                        onChange={() =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: index,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className='btn btn-success w-100'
              onClick={handleAddQuestion}>
              ➕ Add Question
            </button>
          </div>

          {/* Actions */}
          <div className='d-flex gap-3 mt-4 border-top pt-3'>
            <button
              className='btn btn-outline-secondary w-50'
              onClick={() => setShowQuizModal(false)}>
              Cancel
            </button>
            <button className='btn btn-primary w-50' onClick={handleSubmit}>
              Create Quiz ({quizForm.questions.length} questions)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
