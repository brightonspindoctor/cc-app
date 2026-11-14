import { useEffect, useRef, useState } from "react";
import { REELS } from "./data/exercises.js";
import { streak } from "./lib/store.js";

const N = 20;
const BASE = N; // middle copy of the strip
const COPIES = 5;

function rand(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

function fresh(today) {
  return { date: today, pos: [rand(N), rand(N), rand(N)], spun: false, nudges: 3 };
}

function Reel({ items, pos, spinId, index, lit, onSettled }) {
  const [v, setV] = useState(BASE + pos);
  const [trans, setTrans] = useState("none");
  const last = useRef({ spinId, pos });

  useEffect(() => {
    const prev = last.current;
    if (spinId !== prev.spinId) {
      setTrans(`transform ${1.3 + index * 0.45}s cubic-bezier(.12,.75,.25,1.03)`);
      setV(3 * N + pos);
    } else if (pos !== prev.pos) {
      const step = (pos - prev.pos + N) % N === 1 ? 1 : -1;
      setTrans("transform .32s cubic-bezier(.3,1.6,.5,1)");
      setV((x) => x + step);
    }
    last.current = { spinId, pos };
  }, [spinId, pos, index]);

  const settle = () => {
    setTrans("none");
    setV(BASE + pos);
    onSettled?.(index);
  };

  const strip = [];
  for (let c = 0; c < COPIES; c++) items.forEach((it, i) => strip.push([c * N + i, it]));
  const moving = trans !== "none";

  return (
    <div className="reel">
      <div className="strip" style={{ transform: `translateY(calc(var(--cell) * ${-(v - 1)}))`, transition: trans }} onTransitionEnd={settle}>
        {strip.map(([k, [name]]) => (
          <div key={k} className={`cell ${k === v && !moving && lit ? "sel" : ""}`}>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="reel-shade" />
    </div>
  );
}

function Lever({ pulled, disabled, onPull }) {
  const startY = useRef(null);
  return (
    <button
      className={`lever ${pulled ? "pulled" : ""} ${disabled ? "off" : ""}`}
      aria-label="Pull the lever"
      onClick={onPull}
      onPointerDown={(e) => (startY.current = e.clientY)}
      onPointerUp={(e) => {
        if (startY.current != null && e.clientY - startY.current > 30) onPull();
        startY.current = null;
      }}
    >
      <svg viewBox="0 0 60 220" width="52" height="190" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="chrome" x1="0" x2="1">
            <stop offset="0" stopColor="#8d8d8d" /><stop offset=".35" stopColor="#fafafa" />
            <stop offset=".6" stopColor="#b9b9b9" /><stop offset="1" stopColor="#6c6c6c" />
          </linearGradient>
          <radialGradient id="knob" cx=".35" cy=".3" r=".75">
            <stop offset="0" stopColor="#ff8a7a" /><stop offset=".35" stopColor="#e2301f" /><stop offset="1" stopColor="#8a120a" />
          </radialGradient>
        </defs>
        <g className="arm">
          <rect x="25" y="34" width="10" height="150" rx="5" fill="url(#chrome)" />
          <circle cx="30" cy="26" r="20" fill="url(#knob)" />
          <ellipse cx="23" cy="18" rx="6" ry="4" fill="#fff" opacity=".55" />
        </g>
        <rect x="14" y="178" width="32" height="38" rx="8" fill="url(#chrome)" />
        <circle cx="30" cy="197" r="7" fill="#777" />
        <circle cx="30" cy="197" r="4" fill="#ccc" />
      </svg>
    </button>
  );
}

export default function Bandit({ today, state, update, back, celebrate, Header, Flame }) {
  const day = state.bandit?.date === today ? state.bandit : null;
  const [initial] = useState(() => fresh(today));
  const b = day || (initial.date === today ? initial : fresh(today));
  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pulled, setPulled] = useState(false);
  const stopped = useRef(0);
  const done = state.banditDone?.includes(today);

  useEffect(() => {
    if (!day) update((s) => ({ ...s, bandit: initial.date === today ? initial : fresh(today) }));
  }, [day, today, update, initial]);

  const setB = (fn) => update((s) => ({ ...s, bandit: fn(s.bandit?.date === today ? s.bandit : fresh(today)) }));

  const pull = () => {
    if (b.spun || spinning) return;
    setPulled(true);
    navigator.vibrate?.(15);
    setTimeout(() => setPulled(false), 420);
    setTimeout(() => {
      stopped.current = 0;
      setSpinning(true);
      setB((x) => ({ ...x, pos: [rand(N), rand(N), rand(N)], spun: true }));
      setSpinId((n) => n + 1);
    }, 180);
  };

  const onSettled = () => {
    stopped.current += 1;
    if (stopped.current >= 3) setSpinning(false);
    navigator.vibrate?.(8);
  };

  const nudge = (r, dir) => {
    if (!b.spun || spinning || done || b.nudges <= 0) return;
    navigator.vibrate?.(10);
    setB((x) => {
      const pos = [...x.pos];
      pos[r] = (pos[r] + dir + N) % N;
      return { ...x, pos, nudges: x.nudges - 1 };
    });
  };

  const markDone = () => {
    if (done || !b.spun || spinning) return;
    update((s) => ({ ...s, banditDone: [...(s.banditDone || []), today] }));
    celebrate();
  };

  const canNudge = b.spun && !spinning && !done && b.nudges > 0;
  const status = !b.spun
    ? "Pull the lever"
    : spinning
      ? "Spinning…"
      : done
        ? "Done for today. Back tomorrow."
        : b.nudges > 0
          ? "Happy with that? Nudge a reel, or get going."
          : "No nudges left. That's your lot.";

  return (
    <main className="screen bandit">
      <Header onBack={back} />
      <h1 className="bandit-title">Ab Bandit</h1>
      <p className="status">{status}</p>

      <div className="machine-wrap">
        <div className="machine">
          <div className="crown">
            <div className="marquee">
              {[0, 1, 2].map((i) => <span key={i} className={`bulb ${i < b.nudges ? "lit" : ""} ${spinning ? "chase" : ""}`} style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
            <span className="crown-cross" />
          </div>
          <div className="window">
            {REELS.map((items, r) => (
              <Reel key={r} index={r} items={items} pos={b.pos[r]} spinId={spinId} lit={b.spun} onSettled={onSettled} />
            ))}
            <div className="payline l" /><div className="payline r" />
          </div>
          <div className="nudges">
            {[0, 1, 2].map((r) => (
              <div key={r} className="nudge-pair">
                <button className="nudge" disabled={!canNudge} onClick={() => nudge(r, -1)} aria-label={`Nudge reel ${r + 1} up`}>▲</button>
                <button className="nudge" disabled={!canNudge} onClick={() => nudge(r, 1)} aria-label={`Nudge reel ${r + 1} down`}>▼</button>
              </div>
            ))}
          </div>
          <div className="plate">
            <span>Nudges left</span>
            <span className="plate-bulbs">
              {[0, 1, 2].map((i) => <span key={i} className={`mini ${i < b.nudges ? "lit" : ""}`} />)}
            </span>
          </div>
          <div className="base" />
        </div>
        <Lever pulled={pulled} disabled={b.spun} onPull={pull} />
      </div>

      {b.spun && !spinning && (
        <ol className="workout">
          {REELS.map((items, r) => {
            const [name, dose] = items[b.pos[r]];
            return <li key={r}><span>{name}</span><em>{dose}</em></li>;
          })}
          <li className="rounds">3 rounds · 30s rest between</li>
        </ol>
      )}

      <div className="bottom">
        <button className={`done ${done ? "is-done" : ""}`} onClick={markDone} disabled={done || !b.spun || spinning}>
          {done ? "Workout done ✓" : "Done ✓"}
        </button>
        <Flame n={streak(state.banditDone, today)} label="Ab Bandit" />
      </div>
    </main>
  );
}
