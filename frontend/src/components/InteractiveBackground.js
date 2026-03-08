import React, { useEffect, useRef } from 'react';

const InteractiveBackground = () => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(600px circle at ${event.clientX}px ${event.clientY}px, rgba(99, 102, 241, 0.15), transparent 80%)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 1. The Deep Space Base */}
      <div className="absolute inset-0 bg-brand-dark" />

      {/* 2. Floating "Planets" (Auto-Animation) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-blob" />
      <div className="absolute top-[40%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-blob animation-delay-4000" />

      {/* 3. The Mouse Spotlight (Follows You) */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 transition-opacity duration-300"
      />

      {/* 4. The Grid Overlay (Cyberpunk feel) */}
      <div
        className="absolute inset-0 opacity-20 brightness-100 contrast-150 mix-blend-overlay"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/noise.svg)` }}
      />
    </div>
  );
};

export default InteractiveBackground;