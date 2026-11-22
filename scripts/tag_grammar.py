"""Pick a grammar topic for each word of the day and find the phrases to underline.

Regenerate src/data/grammarTags.js after editing the word lists:
  node --input-type=module -e "import {WORDS} from './src/data/words.js'; import fs from 'fs'; fs.writeFileSync('/tmp/words.json', JSON.stringify(WORDS));"
  python3 scripts/tag_grammar.py   # writes /tmp/grammar_tags.json
then convert that JSON into src/data/grammarTags.js (one row per line).
"""
import json, re, collections
W = json.load(open('/tmp/words.json'))
F = re.IGNORECASE

def find(pattern, s, flags=0):
    return [m.group(0) for m in re.finditer(pattern, s, flags)]

IMP_START = r"^(Please|Open|Take|Pass|Bring|Give|Look|Wash|Water|Tell|Add|Chop|Slice|Put|Send|Wear|Don't|Let's|Be|Get)\b"

def first_word(s):
    m = re.match(r"^[\wÀ-ÿ'’]+(?:-[\wÀ-ÿ]+)*", s)
    return m.group(0) if m else None

def imperative(en, fr, de, it):
    if not re.match(IMP_START, en) or fr.startswith("Attention"): return None
    if en.startswith("Be careful") and False: pass
    h = {}
    m = re.match(r"^(Ne|N')\s?[\wÀ-ÿ'-]+(?: [\wÀ-ÿ]+)? pas", fr)
    h['fr'] = [m.group(0) if m else first_word(fr)]
    m2 = re.match(r"^[\wÄÖÜäöüß]+ wir(?: uns)?", de)
    if re.match(r"^Lass uns", de): h['de'] = ["Lass uns"]
    elif m2: h['de'] = [m2.group(0)]
    else: h['de'] = [first_word(de)]
    if it.startswith("Non "): h['it'] = [" ".join(it.split()[:2])]
    else: h['it'] = [first_word(it)]
    return h

def reflexive(en, fr, de, it):
    frp = r"\bnous nous [\wÀ-ÿ]+|\bse [\wÀ-ÿ]+|\bs'(?!il\b)[\wÀ-ÿ]+|\bme sens\b|\b[\wÀ-ÿ]+-toi\b"
    f = find(frp, fr, F)
    # exclude "se" false positives? ok
    if not f: return None
    d = find(r"\b(mich|dich|sich|uns|euch)\b", de)
    i = find(r"\b(mi|ti|si|ci|vi)\s+[\wÀ-ÿ]+|\b[\wÀ-ÿ]+(ati|iti|amoci|iamoci)\b", it, F)
    return {'fr': f, 'de': d, 'it': i}

def there_is(en, fr, de, it):
    if not re.search(r"\bIl y a\b", fr, F): return None
    return {'fr': find(r"\bil y a\b", fr, F), 'de': find(r"\bes gibt\b|\b(steht|sitzt|liegt|hängt|ist)\b", de, F)[:1], 'it': find(r"\bc'è\b|\bci sono\b", it, F)}

def comparative(en, fr, de, it):
    f = find(r"\b(la |le |les )?plus [\wÀ-ÿ]+|\bmeilleur\w*|\bmoins [\wÀ-ÿ]+", fr, F)
    if not f: return None
    return {'fr': f, 'de': find(r"\b(größte\w*|beste\w*|am besten|mehr|weniger)\b", de), 'it': find(r"\bpiù [\wÀ-ÿ]+|\bmigliore\b", it)}

def partitive(en, fr, de, it):
    f = [m.group(2) for m in re.finditer(r"\b(acheté|veux|prends|mets|fait|fais|écouté|bu|mangé|mangeons|a|avec) ((?:du|de la|de l')\s?[\wÀ-ÿ]+)", fr)]
    if not f: return None
    return {'fr': f, 'de': find(r"\betwas [\wÀ-ÿ]+", de), 'it': find(r"\b(del|della|dello|dell'|dei|degli|delle) ?[\wÀ-ÿ]+|\bun po' di [\wÀ-ÿ]+", it)}

def question(en, fr, de, it):
    if not en.endswith("?"): return None
    f = find(r"\b[\wÀ-ÿ]+-(t-)?(je|tu|il|elle|nous|vous|ils|elles|on)\b", fr) or find(r"^(Est-ce que|Qu'est-ce qu'on|Qu'est-ce que|Que|Quel|Quelle|Pourquoi|Où|Comment)\b", fr) or []
    d = [first_word(de)]
    i = find(r"^(Che cosa|Cosa|Che|Perché|Dove|Come|Quando|Chi)\b", it)
    return {'fr': f, 'de': d, 'it': i}

def negation(en, fr, de, it):
    f = find(r"\b(ne|n')\s?[\wÀ-ÿ'-]+(?: [\wÀ-ÿ]+)?? (pas|jamais|plus|rien|personne)\b", fr, F)
    if not f:
        f2 = find(r"\b(n'|ne )", fr)
        if not f2: return None
    return {'fr': f or find(r"\bne\b|\bn'\w+|\bpas\b", fr), 'de': find(r"\b(nicht|kein\w*|nie)\b", de), 'it': find(r"\b[Nn]on\b", it)}

def perfect(en, fr, de, it):
    f = find(r"\b(j'ai|ai|as|a|avons|avez|ont|suis|es|est|sommes|êtes|sont|s'est|nous sommes)\s+(?:(?:déjà|enfin|encore|bien)\s+)?[\wÀ-ÿ]*(?:é|ée|és|ées|i|is|ie|it|u|ue|us|ert|erts|ait|aint|ise)\b", fr)
    ETRE = r"^(suis|es|est|sommes|êtes|sont)\s"
    MOVE = r"(tomb|venu|devenu|allé|arriv|parti|sorti|entr|rest|né|mort|mont|descendu|retourn)"
    f = [x for x in f if not x.startswith("a vue") and (not re.match(ETRE, x) or re.search(r"\s" + MOVE, x))]
    if not f: return None
    d = find(r"\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b", de)
    dp = find(r"\b(ge[\wäöüß]+(t|en)|[\wäöüß]+iert|ver[\wäöüß]+(t|en)|be[\wäöüß]+(t|en)|er[\wäöüß]+t|[\wäöüß]+ge[\wäöüß]+(t|en))\b(?=[.!?,]?$)", de)
    i = find(r"\b(ho|hai|ha|abbiamo|avete|hanno|sono|sei|è|siamo|siete)\s+(?:già\s+)?[\wÀ-ÿ]+(?:ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite|so|sa|si|se|tto|tta|tti|tte|sto|sta|sti|ste)\b", it, F)
    last = re.findall(r"([\wÄÖÜäöüß]+)[.!?]?$", de)
    dd = d[:1] + last[-1:] if d else find(PRET_DE, de)
    return {'fr': f, 'de': dd, 'it': i}

PRET_DE = r"\b(war|waren|hatte|hatten|trug|fühlte|winkte|fiel|sprang|bestiegen|rannte|verdeckte|zündete|wurde|kam|lief)\b"
def imperfect(en, fr, de, it):
    f = find(r"\b[\wÀ-ÿ]+(ait|aient)\b", fr)
    f = [x for x in f if x.lower() not in ('lait','fait','parfait','plait','plaît')]
    if not f: return None
    d = find(r"\b(war|waren|warst|hatte|hatten|trug|fühlte|winkte|fiel|sprang|bestiegen|rannte|verdeckte|zündete|wurde)\b", de, F)
    i = find(r"\b(era|erano|eri|ero)\b|\b[\wÀ-ÿ]+(ava|avano|eva|evano|iva|ivano)\b", it, F)
    return {'fr': f, 'de': d, 'it': i}

def modal(en, fr, de, it):
    f = find(r"\b(peux|peut|pouvez|pouvons|veux|veut|voulez|voudrais|dois|doit)\b", fr)
    if not f: return None
    return {'fr': f, 'de': find(r"\b(kann|kannst|können|möchte|möchtest|darf|soll|muss|will)\b", de, F), 'it': find(r"\b(posso|puoi|può|possiamo|vuoi|vuole|vorrei|devo|deve)\b", it, F)}

def possessive(en, fr, de, it):
    f = find(r"\b(mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs)\s+[\wÀ-ÿ'-]+", fr, F)
    if not f: return None
    d = find(r"\b(mein|dein|sein|ihr|unser|euer)(e|en|em|er|es)?\s+[\wÄÖÜäöüß-]+", de, F)
    i = find(r"\b((il|la|i|le|del|della|al|alla|nel|nella|sul|sulla)\s+)?(mio|mia|miei|mie|tuo|tua|tuoi|tue|suo|sua|suoi|sue|nostro|nostra|nostri|nostre|vostro|vostra|loro)\s+[\wÀ-ÿ]+", it, F)
    return {'fr': f, 'de': d, 'it': i}

ART_FR = r"(?:(?:le|la|les|un|une|des|du|ce|cet|cette|ces|l'|d')\s?)?"
def stem(word):
    w = re.sub(r"\s*\(.*?\)", "", word)
    w = re.sub(r"^(le|la|les|der|die|das|il|lo|i|gli)\s+|^l'", "", w, flags=F)
    return w.strip()

def default(en, fr, de, it, typ, entry):
    out = {}
    for lang, word, sent in (('fr', entry[3], fr), ('de', entry[5], de), ('it', entry[7], it)):
        st = stem(word)
        key = st[:max(3, len(st) - 2)] if typ == 'adjective' else st[:max(3, len(st) - 1)]
        if lang == 'de' and typ == 'noun': key = st[:max(3, len(st) - 1)]
        if typ == 'noun':
            arts = {'fr': r"(?:(?:le|la|les|un|une|des|du|de la|ce|cet|cette|ces|mon|ma|mes|ton|ta|son|sa|notre|nos|leur)\s+|(?:l'|d'))?",
                    'de': r"(?:(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein\w*|mein\w*|dein\w*|unser\w*|ihr\w*|sein\w*|diese\w*)\s+(?:[\wäöüß]+\s+)?)?",
                    'it': r"(?:(?:il|lo|la|i|gli|le|un|uno|una|del|della|al|alla|nel|nella|sul|sulla|dal|dalla|questo|questa|quel|quella|mio|mia|tuo|tua)\s+|(?:l'|un'|dell'|all'|nell'|sull'))?"}[lang]
            m = re.search(arts + r"(?:[\wÀ-ÿ]+\s+)?" * 0 + r"\b" + re.escape(key) + r"[\wÀ-ÿ-]*", sent, F)
            if not m:
                m = re.search(r"\b\w*" + re.escape(key[:4]) + r"[\wÀ-ÿ-]*", sent, F)
        else:
            m = re.search(r"\b" + re.escape(key) + r"[\wÀ-ÿ]*", sent, F)
        out[lang] = [m.group(0)] if m else []
    return out

ORDER = [('imperative', imperative), ('reflexive', reflexive), ('there-is', there_is), ('comparative', comparative),
         ('partitive', partitive), ('modal', modal), ('question', question), ('negation', negation), ('perfect', perfect),
         ('imperfect', imperfect), ('possessive', possessive)]

res = []
for e in W:
    en, typ, s, fw, fr, dw, de, iw, it = e
    tag = None
    for name, fn in ORDER:
        h = fn(s, fr, de, it)
        if h:
            tag = (name, h); break
    if not tag:
        tag = ('gender' if typ == 'noun' else 'agreement', default(s, fr, de, it, typ, e))
    # drop empty/None spans
    h = {k: [x for x in v if x] for k, v in tag[1].items()}
    res.append([tag[0], h])

OVERRIDE = {
  'fondue': ['imperative', {'fr': ["Si on mangeait"], 'de': ["Lass uns"], 'it': ["mangiamo"]}],
  'pale': ['question', {'fr': ["ça va"], 'de': ["geht es dir gut"], 'it': ["stai bene"]}],
}
for i, e in enumerate(W):
    if e[0] in OVERRIDE: res[i] = OVERRIDE[e[0]]

c = collections.Counter(r[0] for r in res)
print(c)
json.dump(res, open('/tmp/grammar_tags.json', 'w'), ensure_ascii=False)
