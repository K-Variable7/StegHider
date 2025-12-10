'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface ParticleSystemProps {
  trigger?: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  className?: string;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  trigger = false,
  particleCount = 50,
  colors = ['#FFD700', '#FF6B35', '#F7931E', '#10B981', '#3B82F6'],
  duration = 2000,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create particles
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: Math.random() * 60 + 60, // 1-2 seconds at 60fps
        maxLife: Math.random() * 60 + 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.life--;

        // Draw particle
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        return particle.life > 0;
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    // Cleanup after duration
    const cleanup = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
    }, duration);

    return () => {
      clearTimeout(cleanup);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, particleCount, colors, duration]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Preset particle effects
export const AchievementParticles: React.FC<{ trigger: boolean }> = ({ trigger }) => (
  <ParticleSystem
    trigger={trigger}
    particleCount={30}
    colors={['#FFD700', '#FFA500', '#FF6347', '#FF1493']}
    duration={1500}
  />
);

export const MintParticles: React.FC<{ trigger: boolean }> = ({ trigger }) => (
  <ParticleSystem
    trigger={trigger}
    particleCount={25}
    colors={['#10B981', '#059669', '#047857', '#065F46']}
    duration={1200}
  />
);

export const RevealParticles: React.FC<{ trigger: boolean }> = ({ trigger }) => (
  <ParticleSystem
    trigger={trigger}
    particleCount={35}
    colors={['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF']}
    duration={1800}
  />
);

export const StealParticles: React.FC<{ trigger: boolean }> = ({ trigger }) => (
  <ParticleSystem
    trigger={trigger}
    particleCount={40}
    colors={['#DC2626', '#B91C1C', '#991B1B', '#7F1D1D']}
    duration={2000}
  />
);

export default ParticleSystem;
