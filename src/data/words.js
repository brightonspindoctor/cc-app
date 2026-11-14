import w1 from "./words1.js";
import w2 from "./words2.js";
import w3 from "./words3.js";
import w4 from "./words4.js";
import { daysBetween } from "../lib/store.js";

export const WORDS = [...w1, ...w2, ...w3, ...w4];
const START = "2026-11-14"; // day one = "mountain"

export function wordFor(dayKey) {
  const len = WORDS.length;
  const i = ((daysBetween(START, dayKey) % len) + len) % len;
  const [en, type, sentence, fr, frS, de, deS, it, itS] = WORDS[i];
  return { n: i + 1, en, type, sentence, fr, frS, de, deS, it, itS };
}
