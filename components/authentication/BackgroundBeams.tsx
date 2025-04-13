"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Beam {
  id: number;
  top: string;
  left: string;
  width: string;
  height: string;
  delay: number;
  duration: number;
  opacity: number;
  fromColor: string;
}

export function BackgroundBeams() {
  const [beams, setBeams] = useState<Beam[]>([]);

  useEffect(() => {
    const generateBeams = () => {
      const beamCount = 12;
      const newBeams: Beam[] = [];

      for (let i = 0; i < beamCount; i++) {
        newBeams.push({
          id: i,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 40 + 30}%`,
          height: `${Math.random() * 3 + 2}px`,
          delay: Math.random() * 3,
          duration: Math.random() * 8 + 5,
          opacity: Math.random() * 0.6 + 0.4,
          fromColor: ['blue', 'purple', 'cyan'][Math.floor(Math.random() * 3)],
        });
      }

      setBeams(newBeams);
    };

    generateBeams();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {beams.map((beam) => (
        <motion.div
          key={beam.id}
          className={`absolute bg-gradient-to-r ${
            beam.fromColor === 'blue' ? 'from-blue-500' :
            beam.fromColor === 'purple' ? 'from-purple-500' : 'from-cyan-500'
          } to-transparent`}
          style={{
            top: beam.top,
            left: beam.left,
            width: beam.width,
            height: beam.height,
            opacity: 0,
          }}
          initial={{ opacity: 0, x: -100 }}
          animate={{
            opacity: [0, beam.opacity, 0],
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: beam.duration,
            delay: beam.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
