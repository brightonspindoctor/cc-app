"""Pick a grammar topic for each word of the day and find the phrases to underline.

Every day gets a list of topics its sentences genuinely illustrate; the script then
picks one per day, spreading topics out so the same note doesn't keep coming back.

Regenerate src/data/grammarTags.js after editing the word lists:
  node --input-type=module -e "import {WORDS} from './src/data/words.js'; import fs from 'fs'; fs.writeFileSync('/tmp/words.json', JSON.stringify(WORDS));"
  python3 scripts/tag_grammar.py
and for the Sunday list:
  node --input-type=module -e "import S from './src/data/sundayWords.js'; import fs from 'fs'; fs.writeFileSync('/tmp/sunday.json', JSON.stringify(S));"
  python3 scripts/tag_grammar.py --sunday
"""
import collections, json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
from tag_grammar_base import (W, F, find, first_word, stem, default, imperative, reflexive, there_is,
                              comparative, partitive, modal, question, negation, perfect, imperfect, possessive)

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "grammarTags.js")
# --sunday: tag the Sunday list instead (dump it to /tmp/sunday.json first, like words.json)
if "--sunday" in sys.argv:
    W = json.load(open("/tmp/sunday.json"))
    OUT = OUT.replace("grammarTags.js", "grammarTagsSunday.js")


def word_hl(e):
    """Underline the day's word itself in each sentence."""
    return default(e[2], e[4], e[6], e[8], e[1], e)


# ---------- smaller topics ----------

SEP = {"ab": "fährt", "an": "zündete", "auf": "Mach", "aus": "sieht", "mit": "Bring|Nimm", "nach": "geht",
       "unter": "geht", "zu": "winkte", "dazu": "Gib", "entlang": "führt"}

def separable(en, fr, de, it, e):
    m = re.search(r"\b(ab|an|auf|aus|mit|nach|unter|zu|dazu|entlang)([.!?])$", de)
    if not m: return None
    v = re.search(r"\b(" + SEP[m.group(1)] + r")\b", de)
    if not v: return None
    return {"fr": [], "de": [v.group(0), m.group(1)], "it": []}

START_DE = r"^(Im|Am|Auf|In|Nach|Vor|Letzten|Draußen|Heute|Morgen|Dann|Hier|Jetzt|Lass)\b"

def verb_second(en, fr, de, it, e):
    if not re.match(START_DE, de) or de.startswith("Lass") or de.startswith("Morgen wird"): return None
    m = re.search(r"\b([a-zäöüß]+) (wir|ich|du|er|sie|es|die|der|das|man|ein|eine|alle)\b", de)
    if not m: return None
    return {"fr": [], "de": [m.group(0)], "it": []}

def compound(en, fr, de, it, e):
    if e[1] != "noun": return None
    st = stem(e[5])
    for tok in re.findall(r"[\wÄÖÜäöüß]+", de):
        low, s = tok.lower(), st.lower()
        if s in low and low != s and not re.fullmatch(re.escape(s) + r"(e|en|n|s|er|es)?", low) and len(low) >= len(s) + 3:
            fs, its = stem(e[3]).lower()[:3], stem(e[7]).lower()[:3]
            f = [x for x in find(r"\b[\wÀ-ÿ]+ (?:de |d'|à )(?:l'|la |le )?[\wÀ-ÿ]+", fr) if fs in x.lower()]
            i = [x for x in find(r"\b[\wÀ-ÿ]+ (?:di |della |del |da |d')[\wÀ-ÿ]+", it) if its in x.lower()]
            return {"fr": f[:1], "de": [tok], "it": i[:1]}
    return None

def contraction(en, fr, de, it, e):
    d = find(r"\b(im|am|zum|zur|ins|beim|vom|ans|fürs)\b", de, F)
    f = find(r"\b(au|aux)\b", fr)
    i = find(r"\b(al|allo|alla|ai|agli|alle|del|dello|della|nel|nello|nella|sul|sulla|dal|dalla)\b", it, F)
    if d and (f or i):
        return {"fr": f[:1], "de": d[:1], "it": i[:1]}
    return None

def you(en, fr, de, it, e):
    f = find(r"\b(s'il vous plaît|vous|tu|te|t'|toi|ton|ta|tes)\b", fr)
    if not f: return None
    return {"fr": f[:1], "de": find(r"\b(du|dir|dich|dein\w*|Sie)\b", de)[:1], "it": find(r"\b(tu|ti|te|tuo|tua|sei|hai|puoi|vuoi|sai|per favore)\b", it, F)[:1]}

def days(en, fr, de, it, e):
    f = find(r"\ble (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|soir|matin)\b|\bla nuit\b", fr)
    d = find(r"\b(montags|dienstags|mittwochs|donnerstags|freitags|samstags|sonntags|morgens|abends|nachts|mittags)\b", de)
    if not d: return None  # only real habits ("sonntags", "nachts"), not "die ganze Nacht"
    return {"fr": f[:1], "de": d[:1], "it": find(r"\b(il lunedì|il martedì|il venerdì|il sabato|la domenica|la sera|la mattina|di notte)\b", it)[:1]}

def punctuation(en, fr, de, it, e):
    d = find(r", (aber|dass|weil|wenn)\b|, [\wäöüß]+ (?:[\wäöüß]+ )?zu [\wäöüß]+", de)
    f = find(r"[\wÀ-ÿ]+ [?!]$", fr)
    if d or (f and len(fr) > 25):
        return {"fr": f[:1] or find(r"^[\wÀ-ÿ']+,", fr)[:1], "de": d[:1], "it": []}
    return None

def plural(en, fr, de, it, e):
    if e[1] != "noun": return None
    st = stem(e[3])
    key = re.escape(st[:max(3, len(st) - 2)])
    f = find(r"\b(les|des|ces|mes|nos|tes|ses|leurs|deux|trois|quatre) " + key + r"[\wÀ-ÿ]*[sx]\b", fr, F)
    if not f: return None
    dst = stem(e[5]); ist = stem(e[7])
    d = find(r"\b[\wÄÖÜäöüß]*" + re.escape(dst[:max(3, len(dst) - 2)]) + r"[\wäöüß]*", de, F)
    i = find(r"\b(i|gli|le|due|tre|quattro|dei|delle|degli)?\s?" + re.escape(ist[:max(3, len(ist) - 1)]) + r"[\wÀ-ÿ]*", it, F)
    return {"fr": f[:1], "de": d[:1], "it": [x.strip() for x in i[:1]]}

def gender_of(word, lang):
    w = word.lower()
    if "(m.)" in w or "(m./f.)" in w: return "m" if "(m.)" in w else None
    if "(f.)" in w or "(f. pl.)" in w: return "f"
    first = w.split()[0]
    return {"le": "m", "la": "f", "der": "m", "die": "f", "das": "n", "il": "m", "lo": "m", "i": "m", "le ": "f"}.get(first)

def gender_mix(en, fr, de, it, e):
    if e[1] != "noun": return None
    g = [gender_of(e[3], "fr"), gender_of(e[5], "de"), gender_of(e[7], "it")]
    if None in g or e[3].startswith("les ") or e[7].startswith("i ") or e[7].startswith("le "): return None
    if len(set(g)) > 1:
        return word_hl(e)
    return None

# ---------- pronunciation ----------

def bare(w): return stem(w).lower()

def p_silent(en, fr, de, it, e):
    f = bare(e[3])
    if re.search(r"[dtspxzg]s?$", f) or f.startswith("h"): return word_hl(e)

def p_accents(en, fr, de, it, e):
    if re.search(r"[äöü]", bare(e[5])) or re.search(r"[éèêç]", bare(e[3])) or re.search(r"[àèìòù]$", bare(e[7])): return word_hl(e)

def p_cg(en, fr, de, it, e):
    i = bare(e[7])
    if re.search(r"c[ei]|g[ei]|ch|gh", i) or re.search(r"ch", bare(e[5])): return word_hl(e)

def p_vowels(en, fr, de, it, e):
    if re.search(r"ei|ie|eu|äu|au", bare(e[5])) and re.search(r"ou|oi|au|eau|ai|eu", bare(e[3])): return word_hl(e)

def p_doubles(en, fr, de, it, e):
    if re.search(r"(bb|cc|dd|ff|gg|ll|mm|nn|pp|rr|ss|tt|zz)", bare(e[7])): return word_hl(e)

def p_nasal(en, fr, de, it, e):
    if re.search(r"gn|gli", bare(e[7])) or re.search(r"(an|en|in|on|un|ain|ein)([^aeiouyn]|$)", bare(e[3])): return word_hl(e)

def p_stress(en, fr, de, it, e):
    i = bare(e[7])
    if len(re.findall(r"[aeiouàèéìòù]+", i)) >= 3: return word_hl(e)

def p_sz(en, fr, de, it, e):
    d = bare(e[5])
    if re.search(r"z|sch|^s[pt]|^s[aeiouäöü]", d) or "z" in bare(e[7]): return word_hl(e)


def wrap(fn):
    return lambda en, fr, de, it, e: fn(en, fr, de, it)

# (id, detector, weight). Higher weight = allowed to appear more often.
TOPICS = [
    ("imperative", wrap(imperative), 1.6), ("reflexive", wrap(reflexive), 1.4), ("there-is", wrap(there_is), 1.4),
    ("comparative", wrap(comparative), 1.4), ("partitive", wrap(partitive), 1.3), ("modal", wrap(modal), 1.3),
    ("negation", wrap(negation), 1.3), ("question", wrap(question), 1.2), ("perfect", wrap(perfect), 1.5),
    ("imperfect", wrap(imperfect), 1.2), ("possessive", wrap(possessive), 1.0),
    ("separable", separable, 1.4), ("verb2", verb_second, 1.3), ("compound", compound, 1.4),
    ("contraction", contraction, 1.0), ("you", you, 1.0), ("days", days, 1.2), ("punctuation", punctuation, 1.0),
    ("plural", plural, 1.1), ("gender-mix", gender_mix, 1.1),
    ("p-silent", p_silent, 0.6), ("p-accents", p_accents, 0.6), ("p-cg", p_cg, 0.6), ("p-vowels", p_vowels, 0.6),
    ("p-doubles", p_doubles, 0.6), ("p-nasal", p_nasal, 0.6), ("p-stress", p_stress, 0.5), ("p-sz", p_sz, 0.6),
]

OVERRIDE = {
    "fondue": ["imperative", {"fr": ["Si on mangeait"], "de": ["Lass uns"], "it": ["mangiamo"]}],
    "pale": ["question", {"fr": ["ça va"], "de": ["geht es dir gut"], "it": ["stai bene"]}],
}

count = collections.Counter()
res, prev = [], None
for e in W:
    en, typ, s, fw, fr, dw, de, iw, it = e
    if en in OVERRIDE:
        tag = OVERRIDE[en]
    else:
        cands = []
        for idx, (tid, fn, wt) in enumerate(TOPICS):
            h = fn(s, fr, de, it, e)
            if h:
                score = (count[tid] + 1) / wt + (5 if tid == prev else 0) + idx * 0.001
                cands.append((score, tid, h))
        base = "gender" if typ == "noun" else "agreement"
        cands.append(((count[base] + 1) / 0.9 + (5 if base == prev else 0) + 1, base, word_hl(e)))
        _, tid, h = min(cands, key=lambda c: c[0])
        tag = [tid, h]
    h = {k: [x for x in v if x] for k, v in tag[1].items()}
    # only keep highlights that really occur in the sentence
    for k, i in (("fr", 4), ("de", 6), ("it", 8)):
        h[k] = [x for x in h.get(k, []) if x in e[i]]
    res.append([tag[0], h])
    count[tag[0]] += 1
    prev = tag[0]

print(sorted(count.items(), key=lambda x: -x[1]))
lines = [json.dumps([t, h.get("fr", []), h.get("de", []), h.get("it", [])], ensure_ascii=False, separators=(",", ":")) for t, h in res]
with open(OUT, "w") as fh:
    fh.write("// One grammar point per word of the day: [topicId, frHighlights, deHighlights, itHighlights].\n"
             "// Generated by scripts/tag_grammar.py from the sentences.\nexport default [\n" + ",\n".join(lines) + ",\n];\n")
