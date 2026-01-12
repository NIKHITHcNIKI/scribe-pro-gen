import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  shape: "circle" | "square" | "triangle" | "ring";
  color: string;
}

const COLORS = [
  "hsl(262 83% 58% / 0.15)",
  "hsl(330 85% 60% / 0.12)",
  "hsl(200 80% 55% / 0.1)",
  "hsl(280 70% 50% / 0.12)",
];

const SHAPES = ["circle", "square", "triangle", "ring"] as const;

export const FloatingParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const count = window.innerWidth < 768 ? 12 : 20;

      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 40 + 20,
          duration: Math.random() * 20 + 15,
          delay: Math.random() * -20,
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    window.addEventListener("resize", generateParticles);
    return () => window.removeEventListener("resize", generateParticles);
  }, []);

  const renderShape = (particle: Particle) => {
    const baseStyle = {
      width: particle.size,
      height: particle.size,
    };

    switch (particle.shape) {
      case "circle":
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: particle.color,
              borderRadius: "50%",
            }}
          />
        );
      case "square":
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: particle.color,
              borderRadius: "4px",
              transform: "rotate(45deg)",
            }}
          />
        );
      case "triangle":
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${particle.size / 2}px solid transparent`,
              borderRight: `${particle.size / 2}px solid transparent`,
              borderBottom: `${particle.size}px solid ${particle.color}`,
            }}
          />
        );
      case "ring":
        return (
          <div
            style={{
              ...baseStyle,
              border: `3px solid ${particle.color}`,
              borderRadius: "50%",
              backgroundColor: "transparent",
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {renderShape(particle)}
        </div>
      ))}
    </div>
  );
};