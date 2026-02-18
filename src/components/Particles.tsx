import { useMemo } from 'react';

export function Particles() {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            background: p.id % 2 === 0 
              ? 'rgba(139, 92, 246, 0.5)' 
              : 'rgba(6, 182, 212, 0.5)',
          }}
        />
      ))}
    </div>
  );
}
