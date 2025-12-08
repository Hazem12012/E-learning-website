import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../pages/services/SupabaseClient";
import { useParams } from "react-router-dom";
import { ClipboardPenLine } from "lucide-react";
import { UserAuth } from "../pages/services/AuthContext";

function Lectures({
  //   courseId,
  openLessons,
  lessons,
  setLessons,
  setShowLessonModal,
  toggleLesson,
}) {
  const { courseId } = useParams();
  const { role } = UserAuth();

  const fetchLectures = async () => {
    // console.log("Fetching lectures for courseId:", courseId);

    if (!courseId) {
      console.warn("⛔ No courseId provided!");
      return;
    }

    const { data, error } = await supabase
      .from("lectures")
      .select("id, course_id, title, content, video_url, duration, created_at")

      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load lectures");
      return;
    }

    // console.log("LECTURES FETCHED:", data);
    setLessons(data);
    // console.log(data);
  };

  useEffect(() => {
    if (courseId) fetchLectures();
  }, [courseId]);

  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (!window.confirm(`Delete "${lessonTitle}"?`)) return;

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", lessonId);

    if (error) {
      console.error(error);
      toast.error("Failed to delete lecture");
      return;
    }

    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    toast.success("Lecture deleted");
  };

  return (
    <div className='tab-section'>
      <div className='quizzes-header'>
        <h3>Course Lectures</h3>
        {role === "teacher" && (
          <button
            className='add-quiz-btn'
            onClick={() => setShowLessonModal(true)}>
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
            Add Lecture
          </button>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className='no-students'>
          <i className='fas fa-video'></i>
          <p>No lectures yet. Click "Add Lecture" to create one.</p>
        </div>
      ) : (
        lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            className={`lesson ${openLessons[index] ? "open" : ""}`}>
            <div className='lesson-header' onClick={() => toggleLesson(index)}>
              <span className='lesson-title'>
                <span style={{ color: "#0166bf" }}>
                  <ClipboardPenLine />
                </span>{" "}
                {lesson.title}
              </span>

              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {role === "teacher" && (
                  <button
                    className='quiz-delete-btn'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLesson(lesson.id, lesson.title);
                    }}
                    style={{ padding: "6px 10px", marginRight: "10px" }}>
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
                )}

                <span className='arrow'>▼</span>
              </div>
            </div>

            {openLessons[index] && (
              <div className='lesson-content'>
                <p>
                  <strong>Created At :</strong>{" "}
                  {new Date(lesson.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Video URL :</strong>
                  {"    "}
                  <a href={lesson.video_url} target="_blanck">
                    {lesson.video_url || "No video"}
                  </a>
                </p>
                <p>
                  <strong>Content :</strong>{" "}
                  {lesson.content ? `${lesson.content} min` : "N/A"}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Lectures;
