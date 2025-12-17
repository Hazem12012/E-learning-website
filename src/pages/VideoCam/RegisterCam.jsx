import { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import styles from "./VideoCam.module.css";
import videoCover from "../../assets/Webcam cover.webp";
import toast from "react-hot-toast";
import { UserAuth } from "../services/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/SupabaseClient";

export default function RegisterCam({ sendData, detectCheck }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const photoTakenRef = useRef(false);
  const { naturalId } = UserAuth();
  const navigate = useNavigate();
  const { courseId } = useParams(); // Get courseId from URL params

  const [message, setMessage] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [image, setImage] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [detectionQuality, setDetectionQuality] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRegistration = async () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);

    try {
      if (!image) {
        toast.error("No image captured");
        setIsSubmitting(false);
        return;
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        setIsSubmitting(false);
        return;
      }

      // Check if user is already registered in this course
      const { data: existingRegistration } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", courseId)
        .limit(1);

      if (existingRegistration && existingRegistration.length > 0) {
        toast.error(
          "You are already registered for attendance in this course!"
        );
        setIsSubmitting(false);

        setTimeout(() => {
          navigate(-1);
        }, 2000);
        return;
      }

      // Convert Base64 to Blob for face recognition API
      const blob = await (await fetch(image)).blob();
      const formData = new FormData();
      formData.append("image", blob, "face.jpg");
      formData.append("national_id", naturalId);
      formData.append("course_id", courseId || "324324324");

      // Call your face registration/verification API
      const response = await fetch("http://localhost:8000/verify", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Face Registration Result:", result);

      // If face is verified/registered successfully
      if (result.status === "verified" || result.status === "registered") {
        // Create initial attendance record in Supabase
        // This serves as registration for the attendance system
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .insert({
            student_id: user.id,
            course_id: courseId,
            attended: false,
            date: new Date().toISOString(),
          })
          .select();

        if (attendanceError) {
          console.error("Supabase Error:", attendanceError);

          // Check if error is duplicate entry
          if (attendanceError.code === "23505") {
            toast.error("You are already registered for this course!");
          } else {
            toast.error("Failed to register: " + attendanceError.message);
          }
          setIsSubmitting(false);
          return;
        }

        console.log("Registration saved to Supabase:", attendanceData);
        toast.success("Face registered successfully! ✓");

        // Navigate back to courses after successful registration
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      } else {
        toast.error(result.message || "Face registration failed");

        // Allow retake on failure
        // photoTakenRef.current = false;
        // setImage(null);
        // startVideo().then(() => {
        //   if (modelsLoaded) {
        //     setTimeout(() => faceMyDetect(), 1000);
        //   }
        // });
      }
    } catch (err) {
      console.error("Registration Error:", err);
      toast.error("Failed to register face. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Face-API Models
  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = "/models";
      const CDN_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
      } catch (localError) {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(CDN_URL),
        ]);
      }

      setModelsLoaded(true);
    } catch (error) {
      console.error("Error loading models:", error);
      setMessage({
        text: "Failed to load face detection models. Check your internet connection.",
        type: "error",
      });
    }
  }, []);

  // Start Webcam
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      let errorMessage = "Unable to access camera.";

      if (err.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }

      setMessage({ text: errorMessage, type: "error" });
    }
  }, []);

  // Face detection
  const faceMyDetect = useCallback(() => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
    }

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || photoTakenRef.current) {
        return;
      }

      if (videoRef.current.readyState !== 4) {
        return;
      }

      try {
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.5,
            })
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) return;

        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const resizedDetections = faceapi.resizeResults(detections, {
            width: video.videoWidth,
            height: video.videoHeight,
          });

          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }

        const hasOneFace = detections.length === 1;
        const faceIsWellDetected =
          hasOneFace && detections[0].detection.score > 0.7;

        setFaceDetected(faceIsWellDetected);

        if (detections.length === 0) {
          setDetectionQuality("No face detected");
        } else if (detections.length > 1) {
          setDetectionQuality("Multiple faces detected");
        } else if (faceIsWellDetected) {
          setDetectionQuality("Face detected - Good quality ✓");
        } else {
          setDetectionQuality("Face detected - Move closer");
        }
      } catch (error) {
        console.error("Error during face detection:", error);
      }
    }, 300);
  }, []);

  // Take photo
  const takePhoto = useCallback(() => {
    if (photoTakenRef.current) return;

    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL("image/jpeg", 0.95);
    setImage(imageUrl);
    photoTakenRef.current = true;

    if (sendData) {
      sendData(imageUrl);
    }

    stopVideo();
  }, [sendData]);

  // Stop video
  const stopVideo = useCallback(() => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize
  useEffect(() => {
    if (cameraStarted) {
      loadModels().then(() => {
        startVideo();
      });
    } else {
      stopVideo();
    }

    return () => stopVideo();
  }, [cameraStarted, loadModels, startVideo, stopVideo]);

  // Start detection when models are loaded
  useEffect(() => {
    if (modelsLoaded && videoRef.current) {
      const checkVideo = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          clearInterval(checkVideo);
          faceMyDetect();
        }
      }, 100);

      return () => clearInterval(checkVideo);
    }
  }, [modelsLoaded, faceMyDetect]);

  // Auto-capture with countdown
  useEffect(() => {
    let countdownInterval;

    if (faceDetected && !photoTakenRef.current && !image) {
      setCountdown(3);

      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            takePhoto();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [faceDetected, image, takePhoto]);

  // Retake photo
  const retakePhoto = () => {
    photoTakenRef.current = false;
    setImage(null);
    setCountdown(null);
    setFaceDetected(false);
    setDetectionQuality(null);
    startVideo().then(() => {
      if (modelsLoaded) {
        setTimeout(() => faceMyDetect(), 1000);
      }
    });
  };

  // Error state
  if (message && message.type === "error") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div
          style={{
            padding: "20px",
            background: "#fee",
            borderRadius: "8px",
            marginBottom: "20px",
          }}>
          <h3>Error</h3>
          <p>{message.text}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 24px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}>
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className={styles.appvideo}>
      {!modelsLoaded && cameraStarted && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontSize: "18px",
            zIndex: "9999",
          }}>
          Loading face detection models...
        </div>
      )}

      {!cameraStarted && (
        <button
          className=''
          onClick={() => setCameraStarted(true)}
          style={{
            width: "100%",
            maxWidth: "640px",
            height: "420px",
            background: "#000",
            color: "#fff",
            fontSize: "28px",
            borderRadius: "12px",
            border: "2px solid #444",
            cursor: "pointer",
          }}>
          <div className='d-flex align-items-center justify-content-center flex-column'>
            <img
              src={videoCover}
              className='img-fluid rounded-top w-auto mb-4'
              alt=''
            />
            <span className='position-relative'>Start Camera</span>
          </div>
        </button>
      )}

      {cameraStarted && !image && modelsLoaded && (
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            muted
            playsInPlace
            style={{
              width: "100%",
              maxWidth: "640px",
              borderRadius: "12px",
            }}
          />
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              maxWidth: "640px",
              borderRadius: "12px",
            }}
          />

          <div className={styles.statusOverlay}>
            {detectionQuality && (
              <div
                className={`${styles.statusBadge} ${
                  faceDetected ? styles.statusSuccess : styles.statusWarning
                }`}>
                {detectionQuality}
              </div>
            )}

            {countdown !== null && (
              <div className={styles.countdown}>
                <div className={styles.countdownNumber}>{countdown}</div>
                <div className={styles.countdownText}>Get ready...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {image && (
        <div style={{ textAlign: "center" }}>
          <img
            className={styles.capturedImage}
            src={image}
            alt='Captured'
            style={{
              maxWidth: "640px",
              width: "100%",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          />
          <div className='d-flex align-items-center justify-content-center gap-2'>
            <button
              onClick={retakePhoto}
              disabled={isSubmitting}
              style={{
                padding: "12px 30px",
                fontSize: "16px",
                fontWeight: "600",
                color: "white",
                background: isSubmitting ? "#999" : "#dc3545",
                border: "none",
                borderRadius: "8px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
              }}>
              Retake Photo
            </button>

            <button
              onClick={handleSubmitRegistration}
              disabled={isSubmitting}
              style={{
                padding: "12px 30px",
                fontSize: "16px",
                fontWeight: "600",
                color: "white",
                background: isSubmitting ? "#999" : "#3b82f6",
                border: "none",
                borderRadius: "8px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
              }}>
              {isSubmitting ? "Registering..." : "Register Face"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
