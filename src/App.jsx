import { useEffect, useMemo, useState } from "react";
import { load, save, todayKey, prettyDate, streak, bestStreak } from "./lib/store.js";
import { wordFor } from "./data/words.js";
import Bandit from "./Bandit.jsx";
import Confetti from "./Confetti.jsx";

export function Cross({ size = 22, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="3" fill="var(--red)" />
      <path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#fff" />
    </svg>
  );
}

function Flame({ n, label }) {
  return (
    <div className="streak" aria-label={`${label}: ${n} day streak`}>
      <span className="flame">🔥</span>
      <span className="streak-n">{n}</span>
      <span className="streak-l">{n === 1 ? "day" : "days"}</span>
    </div>
  );
}

function Tick({ on }) {
  return (
    <span className={`tick ${on ? "on" : ""}`} aria-label={on ? "Done today" : "Not done yet"}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

function Header({ today, onBack }) {
  return (
    <header className="top">
      {onBack ? (
        <button className="back" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      ) : <span />}
      <Cross />
    </header>
  );
}

function Home({ today, state, go }) {
  const pDone = state.protocolDone?.includes(today);
  const bDone = state.banditDone?.includes(today);
  const [day, ...rest] = prettyDate(today).split(" ");
  return (
    <main className="screen home">
      <Header today={today} />
      <h1 className="date-big">{day}<br />{rest.join(" ")}</h1>
      <button className="card" onClick={() => go("protocol")}>
        <div className="card-head">
          <h2>The Switzerland<br />Protocol</h2>
          <Tick on={pDone} />
        </div>
        <div className="card-foot">
          <Flame n={streak(state.protocolDone, today)} label="Switzerland Protocol" />
          <span className="card-hint">{pDone ? "Learned today" : "Today's word"} →</span>
        </div>
      </button>
      <button className="card" onClick={() => go("bandit")}>
        <div className="card-head">
          <h2>Ab Bandit</h2>
          <Tick on={bDone} />
        </div>
        <div className="card-foot">
          <Flame n={streak(state.banditDone, today)} label="Ab Bandit" />
          <span className="card-hint">{bDone ? "Workout done" : "Pull the lever"} →</span>
        </div>
      </button>
      <footer className="home-foot">
        Best streaks: {bestStreak(state.protocolDone)} · {bestStreak(state.banditDone)}
      </footer>
    </main>
  );
}

const FLAGS = {
  fr: ["#0055A4", "#fff", "#EF4135"],
  de: ["#000", "#DD0000", "#FFCE00"],
  it: ["#009246", "#fff", "#CE2B37"],
};
function Flag({ lang }) {
  const c = FLAGS[lang];
  const horizontal = lang === "de";
  return (
    <span className={`flag ${horizontal ? "h" : "v"}`} aria-hidden="true">
      {c.map((col, i) => <i key={i} style={{ background: col }} />)}
    </span>
  );
}

function Protocol({ today, state, update, back, celebrate }) {
  const w = useMemo(() => wordFor(today), [today]);
  const done = state.protocolDone?.includes(today);
  const markDone = () => {
    if (done) return;
    update((s) => ({ ...s, protocolDone: [...(s.protocolDone || []), today] }));
    celebrate();
  };
  return (
    <main className="screen protocol">
      <Header onBack={back} />
      <p className="kicker">{prettyDate(today)}</p>
      <h1 className="word">{w.en.toUpperCase()}</h1>
      <p className="pos">({w.type})</p>
      <p className="en-sentence">{w.sentence}</p>
      <div className="rule" />
      {[["fr", "Français"], ["de", "Deutsch"], ["it", "Italiano"]].map(([k, name]) => (
        <section className="lang" key={k} lang={k}>
          <Flag lang={k} />
          <div>
            <p className="lang-name">{name}</p>
            <h3>{w[k]}</h3>
            <p className="lang-sentence">{w[k + "S"]}</p>
          </div>
        </section>
      ))}
      <div className="bottom">
        <button className={`done ${done ? "is-done" : ""}`} onClick={markDone} disabled={done}>
          {done ? "Learned ✓" : "Done ✓"}
        </button>
        <Flame n={streak(state.protocolDone, today)} label="Switzerland Protocol" />
      </div>
      <p className="day-n">Word {w.n} of 365</p>
    </main>
  );
}

export default function App() {
  const [today, setToday] = useState(todayKey);
  const [state, setState] = useState(load);
  const [view, setView] = useState(() => (location.hash.slice(1) || "home"));
  const [party, setParty] = useState(0);

  useEffect(() => save(state), [state]);
  useEffect(() => {
    const onHash = () => setView(location.hash.slice(1) || "home");
    window.addEventListener("hashchange", onHash);
    // Roll over at midnight / when reopened from the background.
    const tick = () => setToday(todayKey());
    const id = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const go = (v) => { location.hash = v === "home" ? "" : v; setView(v); window.scrollTo(0, 0); };
  const back = () => go("home");
  const celebrate = () => {
    setParty((p) => p + 1);
    navigator.vibrate?.([20, 40, 30]);
  };

  return (
    <div className={`app view-${view}`}>
      {view === "protocol" && <Protocol today={today} state={state} update={setState} back={back} celebrate={celebrate} />}
      {view === "bandit" && <Bandit today={today} state={state} update={setState} back={back} celebrate={celebrate} Header={Header} Flame={Flame} />}
      {view === "home" && <Home today={today} state={state} go={go} />}
      {party > 0 && <Confetti key={party} />}
    </div>
  );
}

