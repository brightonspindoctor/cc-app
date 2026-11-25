import { useEffect, useRef, useState } from "react";
import { REELS } from "./data/exercises.js";
import { streak, prettyDate } from "./lib/store.js";

const COPIES = 5;
const MAX_SPINS = 3;
const MAX_NUDGES = 3;
const MIN_PER_REEL = 3;

function rand(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

// Built-in exercises plus her own (stored locally as { name, dose, reel }).
function allReels(custom = []) {
  return REELS.map((items, r) => [
    ...items,
    ...custom.filter((c) => c.reel === r).map((c) => [c.name, c.dose || "", "", true]),
  ]);
}

function reelsWithout(excluded = [], custom = []) {
  const out = new Set(excluded);
  return allReels(custom).map((items) => items.filter(([name]) => !out.has(name)));
}

function AddExercise({ onAdd, taken }) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim().replace(/\s+/g, " ");
    if (!n) return setErr("Give it a name.");
    if (taken.has(n.toLowerCase())) return setErr("That one's already in the machine.");
    onAdd(n, dose.trim());
    setName(""); setDose(""); setErr("");
  };
  return (
    <form className="add-ex" onSubmit={submit}>
      <input value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="Add an exercise" maxLength={40} aria-label="New exercise name" />
      <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. ×12" maxLength={16} aria-label="Reps or time (optional)" className="dose" />
      <button type="submit" aria-label="Add exercise">+</button>
      {err && <p className="add-err">{err}</p>}
    </form>
  );
}

function fresh(today, reels) {
  return { date: today, sel: reels.map((it) => it[rand(it.length)][0]), spins: 0, nudges: MAX_NUDGES };
}

// Upgrade older saved days (index-based, one spin) to the name-based shape.
function normalise(b) {
  if (!b) return b;
  if (b.sel) return b;
  const sel = REELS.map((items, r) => items[b.pos?.[r] ?? 0][0]);
  return { date: b.date, sel, spins: b.spun ? 1 : 0, nudges: b.nudges ?? MAX_NUDGES };
}

function indexIn(items, name) {
  const i = items.findIndex(([n]) => n === name);
  return i < 0 ? 0 : i;
}

function Reel({ items, pos, spinId, solo = 0, index, lit, onSettled }) {
  const N = items.length;
  const BASE = N;
  const [v, setV] = useState(BASE + pos);
  const [trans, setTrans] = useState("none");
  const last = useRef({ spinId, solo, pos, N });

  useEffect(() => {
    const prev = last.current;
    if (N !== prev.N) {
      setTrans("none");
      setV(N + pos);
    } else if (spinId !== prev.spinId) {
      setTrans(`transform ${2.8 + index * 0.9}s cubic-bezier(.15,.6,.2,1.02)`);
      setV(3 * N + pos);
    } else if (solo !== prev.solo) {
      // A nudge: just this reel re-spins to a new random exercise.
      setTrans("transform 2.2s cubic-bezier(.15,.6,.2,1.02)");
      setV(3 * N + pos);
    }
    last.current = { spinId, solo, pos, N };
  }, [spinId, solo, pos, index, N]);

  const settle = (e) => {
    // Ignore transitions bubbling up from the cells (e.g. the highlight fading).
    if (e && (e.target !== e.currentTarget || e.propertyName !== "transform")) return;
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

const LEVER_COLOURS = {
  red: { rod: ["#8d8d8d", "#fafafa", "#b9b9b9", "#6c6c6c"], knob: ["#ff8a7a", "#e2301f", "#8a120a"] },
  gold: { rod: ["#7a5a12", "#ffe9a8", "#c99a2e", "#6b4c0c"], knob: ["#4a4a4a", "#151515", "#000000"] },
};

function Lever({ pulled, disabled, onPull, variant = "red", label = "Pull the lever" }) {
  const c = LEVER_COLOURS[variant];
  const rod = `rod-${variant}`, knob = `knob-${variant}`;
  const startY = useRef(null);
  return (
    <button
      className={`lever lever-${variant} ${pulled ? "pulled" : ""} ${disabled ? "off" : ""}`}
      aria-label={label}
      onClick={onPull}
      onPointerDown={(e) => (startY.current = e.clientY)}
      onPointerUp={(e) => {
        if (startY.current != null && e.clientY - startY.current > 30) onPull();
        startY.current = null;
      }}
    >
      <svg viewBox="0 0 60 220" width="52" height="190" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={rod} x1="0" x2="1">
            <stop offset="0" stopColor={c.rod[0]} /><stop offset=".35" stopColor={c.rod[1]} />
            <stop offset=".6" stopColor={c.rod[2]} /><stop offset="1" stopColor={c.rod[3]} />
          </linearGradient>
          <radialGradient id={knob} cx=".35" cy=".3" r=".75">
            <stop offset="0" stopColor={c.knob[0]} /><stop offset=".35" stopColor={c.knob[1]} /><stop offset="1" stopColor={c.knob[2]} />
          </radialGradient>
        </defs>
        <g className="arm">
          <rect x="25" y="34" width="10" height="150" rx="5" fill={`url(#${rod})`} />
          <circle cx="30" cy="26" r="20" fill={`url(#${knob})`} />
          <ellipse cx="23" cy="18" rx="6" ry="4" fill="#fff" opacity=".55" />
        </g>
        <rect x="14" y="178" width="32" height="38" rx="8" fill={`url(#${rod})`} />
        <circle cx="30" cy="197" r="7" fill="#777" />
        <circle cx="30" cy="197" r="4" fill="#ccc" />
      </svg>
    </button>
  );
}


const GLUTES = [
  ["Cable Kickbacks", "×12 each side", "Clip an ankle strap to a low cable and face the machine, holding on for balance. Keeping your leg almost straight, push it back and up by squeezing your bum, then return slowly."],
  ["Weighted Step-ups", "×10 each side", "Hold dumbbells by your sides and step up onto a sturdy bench or step, driving through the heel of the top foot until you're standing tall. Step down with control."],
  ["Donkey Kicks", "×15 each side", "On hands and knees, keep one knee bent at 90° and lift that foot towards the ceiling, as if stamping a footprint on it. Squeeze at the top, then lower without arching your back."],
  ["Hip Thrusts", "×12", "Sit with your upper back against a bench, feet flat and a weight across your hips. Drive your hips up until your body is level from shoulders to knees, squeeze, then lower."],
  ["Hip Abductions", "×15 each side", "Lie on your side with legs stacked (a band above the knees makes it harder). Lift your top leg up and slightly back, keeping your toes pointing forward, then lower slowly."],
];

function GluteMultiplier({ today, state, update }) {
  const saved = state.glute?.date === today ? state.glute : null;
  const [initial] = useState(() => ({ date: today, sel: GLUTES[rand(GLUTES.length)][0], spun: false }));
  const g = saved || (initial.date === today ? initial : { date: today, sel: GLUTES[0][0], spun: false });
  const pos = indexIn(GLUTES, g.sel);
  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pulled, setPulled] = useState(false);

  const pull = () => {
    if (g.spun || spinning) return;
    setPulled(true);
    navigator.vibrate?.(15);
    setTimeout(() => setPulled(false), 420);
    setTimeout(() => {
      setSpinning(true);
      update((s) => ({ ...s, glute: { date: today, sel: GLUTES[rand(GLUTES.length)][0], spun: true } }));
      setSpinId((n) => n + 1);
    }, 180);
  };

  const [name, dose, how] = GLUTES[pos];
  return (
    <section className="glute">
      <div className="glute-head">
        <h2>Glute Multiplier</h2>
        <span>Bonus spin · once a day</span>
      </div>
      <div className="machine-wrap glute-wrap">
        <div className="machine glute-machine">
          <div className="glute-crown">
            <span className={`bulb ${g.spun ? "" : "lit"} ${spinning ? "chase" : ""}`} />
            <span className="glute-label">×</span>
            <span className={`bulb ${g.spun ? "" : "lit"} ${spinning ? "chase" : ""}`} style={{ animationDelay: ".15s" }} />
          </div>
          <div className="window glute-window">
            <Reel index={1} items={GLUTES} pos={pos} spinId={spinId} lit={g.spun} onSettled={() => setSpinning(false)} />
            <div className="payline l" /><div className="payline r" />
          </div>
          <div className="base" />
        </div>
        <Lever variant="gold" label="Pull the Glute Multiplier lever" pulled={pulled} disabled={g.spun} onPull={pull} />
      </div>
      <p className="status glute-status">{!g.spun ? "Pull the gold lever for a bonus glute exercise." : spinning ? "Spinning…" : "Your bonus:"}</p>
      {g.spun && !spinning && (
        <div className="glute-result">
          <div className="ex-row"><span>{name}</span><em>{dose}</em></div>
          <p className="how">{how}</p>
        </div>
      )}
    </section>
  );
}

function Dots({ n, max }) {
  return (
    <span className="plate-bulbs">
      {Array.from({ length: max }, (_, i) => <span key={i} className={`mini ${i < n ? "lit" : ""}`} />)}
    </span>
  );
}

export default function Bandit({ today, state, update, back, celebrate, Header, Flame }) {
  const excluded = state.excluded || [];
  const custom = state.custom || [];
  const reels = reelsWithout(excluded, custom);
  const saved = normalise(state.bandit?.date === today ? state.bandit : null);
  const [initial] = useState(() => fresh(today, reels));
  const b = saved || (initial.date === today ? initial : fresh(today, reels));
  const pos = reels.map((items, r) => indexIn(items, b.sel[r]));

  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pulled, setPulled] = useState(false);
  const [confirm, setConfirm] = useState(null); // exercise name awaiting "remove?"
  const [settings, setSettings] = useState(false);
  const stopped = useRef(0);
  const expect = useRef(3);
  const [solo, setSolo] = useState([0, 0, 0]);
  const done = state.banditDone?.includes(today);
  const spinsLeft = MAX_SPINS - b.spins;
  const spun = b.spins > 0;

  useEffect(() => {
    if (!saved || state.bandit !== saved) update((s) => ({ ...s, bandit: saved || b }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const setB = (fn) =>
    update((s) => {
      const cur = normalise(s.bandit?.date === today ? s.bandit : null) || b;
      return { ...s, bandit: fn(cur) };
    });

  const pull = () => {
    if (spinsLeft <= 0 || spinning || done) return;
    setConfirm(null);
    setPulled(true);
    navigator.vibrate?.(15);
    setTimeout(() => setPulled(false), 420);
    setTimeout(() => {
      stopped.current = 0;
      expect.current = 3;
      setSpinning(true);
      setB((x) => ({ ...x, sel: reels.map((items) => items[rand(items.length)][0]), spins: x.spins + 1 }));
      setSpinId((n) => n + 1);
    }, 180);
  };

  const onSettled = () => {
    stopped.current += 1;
    if (stopped.current >= expect.current) setSpinning(false);
    navigator.vibrate?.(8);
  };

  const nudge = (r) => {
    if (!spun || spinning || done || b.nudges <= 0) return;
    navigator.vibrate?.(10);
    const items = reels[r];
    let j = rand(items.length - 1);
    if (j >= pos[r]) j += 1; // never land on the same exercise
    const next = items[j][0];
    setConfirm(null);
    stopped.current = 0;
    expect.current = 1;
    setSpinning(true);
    setSolo((s) => s.map((n, i) => (i === r ? n + 1 : n)));
    setB((x) => {
      const sel = [...x.sel];
      sel[r] = next;
      return { ...x, sel, nudges: x.nudges - 1 };
    });
  };

  const remove = (r, name) => {
    const items = reels[r];
    if (items.length <= MIN_PER_REEL) return;
    const i = indexIn(items, name);
    const left = items.filter(([n]) => n !== name);
    const replacement = left[i % left.length][0];
    update((s) => {
      const cur = normalise(s.bandit?.date === today ? s.bandit : null) || b;
      const sel = [...cur.sel];
      if (sel[r] === name) sel[r] = replacement;
      return { ...s, excluded: [...(s.excluded || []), name], bandit: { ...cur, sel } };
    });
    setConfirm(null);
  };

  const restore = (name) => update((s) => ({ ...s, excluded: (s.excluded || []).filter((n) => n !== name) }));

  const toggle = (r, name, on) => (on ? remove(r, name) : restore(name));

  const addCustom = (r, name, dose) =>
    update((s) => ({ ...s, custom: [...(s.custom || []), { name, dose, reel: r }] }));

  const deleteCustom = (r, name) => {
    const items = reels[r];
    const isOn = items.some(([n]) => n === name);
    if (isOn && items.length <= MIN_PER_REEL) return;
    const i = indexIn(items, name);
    const left = items.filter(([n]) => n !== name);
    update((s) => {
      const cur = normalise(s.bandit?.date === today ? s.bandit : null) || b;
      const sel = [...cur.sel];
      if (sel[r] === name) sel[r] = left[i % left.length][0];
      return {
        ...s,
        custom: (s.custom || []).filter((c) => c.name !== name),
        excluded: (s.excluded || []).filter((n) => n !== name),
        bandit: { ...cur, sel },
      };
    });
  };

  const markDone = () => {
    if (done || !spun || spinning) return;
    update((s) => ({ ...s, banditDone: [...(s.banditDone || []), today] }));
    celebrate();
  };

  const canNudge = spun && !spinning && !done && b.nudges > 0;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const status = !spun
    ? "Pull the lever"
    : spinning
      ? "Spinning…"
      : done
        ? "Done for today. Back tomorrow."
        : spinsLeft > 0 || b.nudges > 0
          ? `Happy with that? ${plural(spinsLeft, "spin")} and ${plural(b.nudges, "nudge")} left.`
          : "No spins or nudges left. That's your lot.";

  const gear = (
    <button className="back gear" onClick={() => setSettings(true)} aria-label="Settings: choose exercises">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm7.4 5.4l1.6 1.2-1.8 3.1-1.9-.7a7.4 7.4 0 0 1-2 1.2l-.3 2H9l-.3-2a7.4 7.4 0 0 1-2-1.2l-1.9.7L3 15.1l1.6-1.2a7.6 7.6 0 0 1 0-2.3L3 10.4l1.8-3.1 1.9.7a7.4 7.4 0 0 1 2-1.2l.3-2h3.6l.3 2a7.4 7.4 0 0 1 2 1.2l1.9-.7 1.8 3.1-1.6 1.2a7.6 7.6 0 0 1 0 2.3z" />
      </svg>
    </button>
  );

  if (settings) {
    const out = new Set(excluded);
    const taken = new Set(allReels(custom).flat().map(([n]) => n.toLowerCase()));
    const titles = ["Reel 1 · Crunches and lifts", "Reel 2 · Twists and obliques", "Reel 3 · Planks and holds"];
    return (
      <main className="screen bandit settings">
        <Header onBack={() => setSettings(false)} right={null} />
        <h1 className="bandit-title">Exercises</h1>
        <p className="status">Switch off any you don't want, or add your own. Each reel keeps at least {MIN_PER_REEL}.</p>
        {allReels(custom).map((items, r) => {
          const onCount = items.filter(([n]) => !out.has(n)).length;
          return (
            <section key={r} className="set-reel">
              <h2>{titles[r]} <span>{onCount} of {items.length} on</span></h2>
              <ul>
                {items.map(([name, dose, how, mine]) => {
                  const on = !out.has(name);
                  const locked = on && onCount <= MIN_PER_REEL;
                  return (
                    <li key={name} className={on ? "" : "off"}>
                      {how ? (
                        <details>
                          <summary><span className="nm">{name}</span><em>{dose}</em></summary>
                          <p className="how">{how}</p>
                        </details>
                      ) : (
                        <div className="plain"><span className="nm">{name}</span><em>{dose}</em>{mine && <span className="mine">Yours</span>}</div>
                      )}
                      {mine && (
                        <button className="del" disabled={locked || spinning} onClick={() => deleteCustom(r, name)} aria-label={`Delete ${name}`}>Delete</button>
                      )}
                      <button
                        role="switch"
                        aria-checked={on}
                        aria-label={`${name} ${on ? "on" : "off"}`}
                        className={`switch ${on ? "on" : ""}`}
                        disabled={locked || spinning}
                        onClick={() => toggle(r, name, on)}
                      ><i /></button>
                    </li>
                  );
                })}
              </ul>
              <AddExercise taken={taken} onAdd={(n, d) => addCustom(r, n, d)} />
            </section>
          );
        })}
      </main>
    );
  }

  return (
    <main className="screen bandit">
      <Header onBack={back} right={gear} />
      <p className="kicker">{prettyDate(today)}</p>
      <h1 className="bandit-title">One Ab Bandit</h1>
      <p className="status">{status}</p>

      <div className="machine-wrap">
        <div className="machine">
          <div className="crown">
            <div className="marquee">
              {[0, 1, 2].map((i) => <span key={i} className={`bulb ${i < spinsLeft ? "lit" : ""} ${spinning ? "chase" : ""}`} style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
          <div className="window">
            {reels.map((items, r) => (
              <Reel key={r} index={r} items={items} pos={pos[r]} spinId={spinId} solo={solo[r]} lit={spun} onSettled={onSettled} />
            ))}
            <div className="payline l" /><div className="payline r" />
          </div>
          <div className="nudges">
            {[0, 1, 2].map((r) => (
              <div key={r} className="nudge-pair">
                <button className="nudge wide" disabled={!canNudge} onClick={() => nudge(r)} aria-label={`Nudge reel ${r + 1} to a new exercise`}>NUDGE</button>
              </div>
            ))}
          </div>
          <div className="plate">
            <span className="plate-group">Spins <Dots n={spinsLeft} max={MAX_SPINS} /></span>
            <span className="plate-group">Nudges <Dots n={b.nudges} max={MAX_NUDGES} /></span>
          </div>
          <div className="base" />
        </div>
        <Lever pulled={pulled} disabled={spinsLeft <= 0 || done} onPull={pull} />
      </div>

      {spun && !spinning && (
        <ol className="workout">
          {reels.map((items, r) => {
            const [name, dose, how] = items[pos[r]];
            const canRemove = !done && items.length > MIN_PER_REEL;
            if (confirm === name) {
              return (
                <li key={r} className="confirm">
                  <span>Take <b>{name}</b> out of the machine?</span>
                  <span className="confirm-btns">
                    <button className="yes" onClick={() => remove(r, name)}>Remove</button>
                    <button className="no" onClick={() => setConfirm(null)}>Keep</button>
                  </span>
                </li>
              );
            }
            return (
              <li key={r} className="ex">
                <div className="ex-row">
                  <span>{name}</span>
                  <em>{dose}</em>
                  {canRemove && (
                    <button className="remove" onClick={() => setConfirm(name)} aria-label={`Remove ${name} from the rotation`}>✕</button>
                  )}
                </div>
                {how && <p className="how">{how}</p>}
              </li>
            );
          })}
          <li className="rounds">3 rounds · 30s rest between</li>
        </ol>
      )}

      <GluteMultiplier today={today} state={state} update={update} />

      <div className="bottom">
        <button className={`done ${done ? "is-done" : ""}`} onClick={markDone} disabled={done || !spun || spinning}>
          {done ? "Workout done ✓" : "Done ✓"}
        </button>
        <Flame n={streak(state.banditDone, today)} label="One Ab Bandit" />
      </div>
    </main>
  );
}
