import w1 from "./words1.js";
import w2 from "./words2.js";
import w3 from "./words3.js";
import w4 from "./words4.js";
import SUNDAY from "./sundayWords.js";
import { daysBetween } from "../lib/store.js";

export const WORDS = [...w1, ...w2, ...w3, ...w4];
export const SUNDAY_WORDS = SUNDAY;
export const START = "2026-11-14"; // day one = "mountain"

// From this Sunday on, Sundays get a cheeky word and the main list carries on
// Monday–Saturday, so no regular word is skipped. Days before it keep the
// words they always had.
const SUNDAYS_FROM = "2026-11-22";
const MAIN_AT_SUNDAYS_FROM = 8; // the main-list index that 22 Nov had before

function entry(row, n, sunday) {
  const [en, type, sentence, fr, frS, de, deS, it, itS] = row;
  return { n, sunday, en, type, sentence, fr, frS, de, deS, it, itS };
}

const mod = (a, n) => ((a % n) + n) % n;

export function wordFor(dayKey) {
  const len = WORDS.length;
  const days = daysBetween(SUNDAYS_FROM, dayKey);
  if (days < 0) {
    const i = mod(daysBetween(START, dayKey), len);
    return entry(WORDS[i], i + 1, false);
  }
  const weeks = Math.floor(days / 7);
  const rem = days % 7; // 0 = Sunday, because SUNDAYS_FROM is a Sunday
  if (rem === 0) {
    const s = weeks % SUNDAY.length;
    return entry(SUNDAY[s], s + 1, true);
  }
  const sundaysSoFar = weeks + 1;
  const i = mod(MAIN_AT_SUNDAYS_FROM + days - sundaysSoFar, len);
  return entry(WORDS[i], i + 1, false);
}
