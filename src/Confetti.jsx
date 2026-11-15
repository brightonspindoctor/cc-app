import { useEffect, useState } from "react";

// Brief burst of tiny Swiss crosses and red squares.
export default function Confetti({ crosses = true }) {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 1600);
    return () => clearTimeout(t);
  }, []);
  if (!alive) return null;
  const bits = Array.from({ length: 28 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4;
    const dist = 90 + Math.random() * 140;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 60,
      r: Math.random() * 360,
      s: 8 + Math.random() * 8,
      cross: crosses && i % 3 === 0,
      d: Math.random() * 0.12,
    };
  });
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className={b.cross ? "bit cross" : "bit"}
          style={{ "--x": `${b.x}px`, "--y": `${b.y}px`, "--r": `${b.r}deg`, width: b.s, height: b.s, animationDelay: `${b.d}s` }}
        />
      ))}
    </div>
  );
}
