import { useEffect, useRef, useState } from "react";

function Eyes({ color, width, height, delay }) {
  const orangeRef = useRef(null);

  useEffect(() => {
    const orangeHalf = orangeRef.current;
    if (!orangeHalf) return;

    const eyes = orangeHalf.querySelectorAll(".eye");
    function handleMouseMove(e) {
      const rect = orangeHalf.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const maxMove = 8;

      const moveX = Math.max(Math.min(deltaX / 30, maxMove), -maxMove);
      const moveY = Math.max(Math.min(deltaY / 30, maxMove), -maxMove);

      eyes.forEach((eye) => {
        eye.style.setProperty(
          "--eye-transform",
          `translate(${moveX}px, ${moveY}px)`
        );
        eye.style.setProperty("animation-delay", delay || "0s");
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  return (
    <div className='eyes' ref={orangeRef}>
      <div
        className='eye eye_1'
        style={{ background: color, width: width, height: height }}>
          
        </div>
      <div
        className='eye eye_2'
        style={{ background: color, width: width, height: height }}></div>
    </div>
  );
}

export default Eyes;
