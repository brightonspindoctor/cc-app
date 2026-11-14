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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Header({ onBack, left }) {
  return (
    <header className="top">
      {left ? left : onBack ? (
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

function WordView({ day, today, state, update, celebrate, header }) {
  const w = useMemo(() => wordFor(day), [day]);
  const isToday = day === today;
  const done = state.protocolDone?.includes(day);
  const markDone = () => {
    if (done || !isToday) return;
    update((s) => ({ ...s, protocolDone: [...(s.protocolDone || []), today] }));
    celebrate();
  };
  return (
    <main className="screen protocol">
      {header}
      <p className="kicker">{prettyDate(day)}</p>
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
      {isToday ? (
        <div className="bottom">
          <button className={`done ${done ? "is-done" : ""}`} onClick={markDone} disabled={done}>
            {done ? "Learned ✓" : "Done ✓"}
          </button>
          <Flame n={streak(state.protocolDone, today)} label="Switzerland Protocol" />
        </div>
      ) : (
        <p className="past-note">{done ? "You learned this one ✓" : "Seen, not marked as done"}</p>
      )}
      <p className="day-n">Word {w.n} of 365</p>
    </main>
  );
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function Calendar({ today, state, onPick, header }) {
  const seen = new Set([...(state.protocolSeen || []), ...(state.protocolDone || [])]);
  const done = new Set(state.protocolDone || []);
  const [y0, m0] = today.split("-").map(Number);
  const [ym, setYm] = useState([y0, m0 - 1]);
  const [y, m] = ym;
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const key = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const earliest = [...seen].sort()[0] || today;
  const canPrev = key(1) > earliest;
  const canNext = key(1) < today.slice(0, 8) + "01";
  const shift = (n) => setYm(([yy, mm]) => { const d = new Date(yy, mm + n, 1); return [d.getFullYear(), d.getMonth()]; });
  const monthName = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const count = [...seen].length;

  return (
    <main className="screen calendar">
      {header}
      <h1 className="cal-title">Words so far</h1>
      <p className="status">{count === 1 ? "1 word seen" : `${count} words seen`}. Days you opened the app unlock their word.</p>
      <div className="cal-nav">
        <button onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month">‹</button>
        <h2>{monthName}</h2>
        <button onClick={() => shift(1)} disabled={!canNext} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((d, i) => <span key={i} className="wd">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={"x" + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const k = key(i + 1);
          const open = seen.has(k);
          const cls = ["day", open ? "open" : "", done.has(k) ? "done" : "", k === today ? "today" : "", k > today ? "future" : ""].join(" ");
          return (
            <button key={k} className={cls} disabled={!open} onClick={() => onPick(k)} aria-label={open ? `${prettyDate(k)}: ${wordFor(k).en}` : prettyDate(k)}>
              <span className="dn">{i + 1}</span>
              {open && <span className="dw">{wordFor(k).en}</span>}
            </button>
          );
        })}
      </div>
      <div className="cal-key">
        <span><i className="k done" /> Learned</span>
        <span><i className="k open" /> Seen</span>
        <span><i className="k" /> Locked</span>
      </div>
    </main>
  );
}

function Protocol({ today, state, update, back, celebrate }) {
  const [sub, setSub] = useState("today"); // "today" | "calendar" | "YYYY-MM-DD"
  useEffect(() => {
    if (!state.protocolSeen?.includes(today)) update((s) => ({ ...s, protocolSeen: [...(s.protocolSeen || []), today] }));
  }, [today, state.protocolSeen, update]);
  useEffect(() => { window.scrollTo(0, 0); }, [sub]);

  const backBtn = (fn, label = "Back") => (
    <button className="back" onClick={fn} aria-label={label}>
      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
  const calBtn = <button className="back cal-btn" onClick={() => setSub("calendar")} aria-label="Past words"><CalendarIcon /></button>;

  if (sub === "calendar") {
    return <Calendar today={today} state={state} onPick={(d) => setSub(d === today ? "today" : d)} header={<Header left={backBtn(() => setSub("today"))} />} />;
  }
  if (sub !== "today") {
    return <WordView day={sub} today={today} state={state} update={update} celebrate={celebrate} header={<Header left={backBtn(() => setSub("calendar"), "Back to calendar")} />} />;
  }
  return (
    <WordView
      day={today} today={today} state={state} update={update} celebrate={celebrate}
      header={<Header left={back ? <span className="hdr-l">{backBtn(back)}{calBtn}</span> : calBtn} />}
    />
  );
}

export default function App({ only }) {
  const [today, setToday] = useState(todayKey);
  const [state, setState] = useState(() => {
    const s = load();
    // Testing aid: open .../bandit/?reset (or .../protocol/?reset) to wipe that app's saved data.
    const params = new URLSearchParams(location.search);
    if (!params.has("reset")) return s;
    params.delete("reset");
    const q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
    if (only === "bandit") return { ...s, bandit: undefined, banditDone: [], excluded: [] };
    if (only === "protocol") return { ...s, protocolDone: [], protocolSeen: [] };
    return {};
  });
  const [view, setView] = useState(() => only || location.hash.slice(1) || "home");
  const [party, setParty] = useState(0);

  useEffect(() => { save(state); }, [state]);
  useEffect(() => {
    const onHash = () => setView(only || location.hash.slice(1) || "home");
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
  }, [only]);

  const go = (v) => { location.hash = v === "home" ? "" : v; setView(v); window.scrollTo(0, 0); };
  const back = only ? undefined : () => go("home");
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

