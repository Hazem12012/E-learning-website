import { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import styles from "./VideoCam.module.css";

export default function VideoCam({ sendData, detectCheck }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const photoTakenRef = useRef(false);

  const [message, setMessage] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [image, setImage] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [detectionQuality, setDetectionQuality] = useState(null);

  console.log("State:", {
    modelsLoaded,
    faceDetected,
    image,
    countdown,
    detectionQuality,
  });

  // Notify parent about face detection status
  useEffect(() => {
    if (detectCheck) {
      detectCheck(faceDetected);
    }
  }, [faceDetected, detectCheck]);

  // Load Face-API Models
  const loadModels = useCallback(async () => {
    try {
      console.log("Loading models...");

      // Try local models first, fallback to CDN
      const MODEL_URL = "/models";
      const CDN_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Models loaded from local folder!");
      } catch (localError) {
        console.log("Local models not found, trying CDN...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(CDN_URL),
        ]);
        console.log("Models loaded from CDN!");
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
      console.log("Starting video...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Video stream set");
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

    console.log("Starting face detection...");

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || photoTakenRef.current) {
        return;
      }

      if (videoRef.current.readyState !== 4) {
        return; // Video not ready
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

        // Set canvas dimensions to match video
        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Clear previous drawings
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const resizedDetections = faceapi.resizeResults(detections, {
            width: video.videoWidth,
            height: video.videoHeight,
          });

          // Draw detections
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }

        // Check detection quality
        const hasOneFace = detections.length === 1;
        const faceIsWellDetected =
          hasOneFace && detections[0].detection.score > 0.7;

        setFaceDetected(faceIsWellDetected);

        // Provide feedback
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

    console.log("Taking photo...");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL("image/jpeg", 0.95);
    setImage(imageUrl);
    photoTakenRef.current = true;

    console.log("Photo taken!");

    if (sendData) {
      sendData(imageUrl);
    }

    stopVideo();
  }, [sendData]);

  // Stop video
  const stopVideo = useCallback(() => {
    console.log("Stopping video...");

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
    let mounted = true;

    const initialize = async () => {
      if (mounted) {
        await loadModels();
        await startVideo();
      }
    };

    initialize();

    return () => {
      mounted = false;
      stopVideo();
    };
  }, []);

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
    console.log("Retaking photo...");
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

  // Submit photo
  const handleSubmit = () => {
    console.log("Submitting photo...");
    if (sendData && image) {
      sendData(image);
    }
    // You can add additional logic here like showing success message
    alert("Photo submitted successfully!");
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
      {!modelsLoaded && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontSize: "18px",
          }}>
          Loading face detection models...
        </div>
      )}

      {!image && modelsLoaded && (
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            poster="ehfsgiu"
            className={styles.video}
            autoPlay
            muted
            playsInline
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

          {/* Status overlay */}
          {/* <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              textAlign: "center",
            }}>
            {detectionQuality && (
              <div
                style={{
                  padding: "12px 24px",
                  borderRadius: "25px",
                  fontWeight: "600",
                  fontSize: "16px",
                  background: faceDetected
                    ? "rgba(34, 197, 94, 0.9)"
                    : "rgba(234, 179, 8, 0.9)",
                  color: "white",
                  marginBottom: "20px",
                }}>
                {detectionQuality}
              </div>
            )}

            {countdown !== null && (
              <div
                style={{
                  animation: "pulse 1s ease-in-out infinite",
                }}>
                <div
                  style={{
                    fontSize: "80px",
                    fontWeight: "bold",
                    color: "white",
                    textShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                  }}>
                  {countdown}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    color: "white",
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                  }}>
                  Get ready...
                </div>
              </div>
            )}
          </div> */}

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
            src={image}
            alt='Captured'
            style={{
              maxWidth: "640px",
              width: "100%",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          />
          <div className="d-flex align-items-center justify-content-center gap-2">
            <button
              onClick={retakePhoto}
              style={{
                padding: "12px 30px",
                fontSize: "16px",
                fontWeight: "600",
                color: "white",
                background: "#dc3545",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}>
              Retake Photo
            </button>

            <button
              style={{
                padding: "12px 30px",
                fontSize: "16px",
                fontWeight: "600",
                color: "white",
                background: "#3b82f6",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}>
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
