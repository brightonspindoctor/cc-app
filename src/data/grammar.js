import TAGS from "./grammarTags.js";

// Short grammar notes, one topic per day, chosen to match that day's sentences.
export const TOPICS = {
  gender: {
    title: "Gender and articles",
    intro: "Every noun has a gender, and the word for “the” or “a” changes to match. Learn each noun together with its article.",
    fr: "Two genders. “The” is le (masculine) or la (feminine), shortened to l' before a vowel. “A” is un or une. In the plural, “the” is always les.",
    de: "Three genders: der (masculine), die (feminine), das (neuter). “A” is ein, eine, ein. The plural is always die. Articles also change with their role in the sentence: der Berg becomes den Berg as the object (Wir bestiegen den Berg).",
    it: "Masculine il (lo before s + consonant or z, l' before a vowel); feminine la (l' before a vowel). “A” is un, uno, una or un'. Plurals: i or gli for masculine, le for feminine.",
  },
  agreement: {
    title: "Adjective agreement",
    intro: "In English, adjectives never change. In these languages they often take endings to match the noun.",
    fr: "Add -e for feminine and -s for plural: petit, petite, petits, petites. Most adjectives go after the noun (une robe rouge), but a few short, common ones go before it (beau, petit, grand, vieux, nouveau, bon).",
    de: "After the verb sein (to be), the adjective never changes: Das Kleid ist rot. Before a noun it takes an ending: ein rotes Kleid, der rote Mantel, eine kluge Idee.",
    it: "Adjectives match gender and number with -o, -a, -i, -e: rosso, rossa, rossi, rosse. Adjectives ending in -e have only two forms: felice, felici. Most go after the noun.",
  },
  imperative: {
    title: "The imperative",
    intro: "The form for telling someone to do something, and for “let's…”.",
    fr: "Use the tu or vous form without the pronoun: Ouvre ! Ouvrez ! (-er verbs drop the -s of tu: tu ouvres → ouvre). “Let's” is the nous form: Allons ! Reflexive verbs add -toi or -nous after a hyphen: Lave-toi, Asseyons-nous. A softer “shall we…?” is si on + imparfait: Si on mangeait une fondue ?",
    de: "For du, use the verb stem, usually without -st: Mach!, Nimm!, Gib! (Sei! for “be”). For Sie: Machen Sie! “Let's” is lass uns + infinitive, or the verb + wir: Setzen wir uns. Separable prefixes go to the end: Mach das Fenster auf!",
    it: "For tu, -are verbs end in -a (Guarda!) and others in -i (Prendi!, Apri!). “Let's” is the noi form: Andiamo! Negative tu commands are non + infinitive: Non dimenticare! Pronouns attach to the end: Passami, Lavati.",
  },
  perfect: {
    title: "Talking about the past",
    intro: "The everyday past tense for things that happened: “I bought”, “we swam”.",
    fr: "Passé composé = avoir or être (present tense) + past participle: j'ai acheté, nous avons nagé. Verbs of movement (aller, venir, tomber…) and all reflexive verbs use être, and then the participle agrees: elle est tombée.",
    de: "Perfekt = haben or sein + past participle, which goes to the very end: Ich habe Brot gekauft. Verbs of movement or change use sein: Wir sind geschwommen. Participles often look like ge…t or ge…en. For telling stories, German also uses the simple past (bestiegen, fiel, lief).",
    it: "Passato prossimo = avere or essere + past participle: ho comprato, abbiamo nuotato. Verbs of movement or change use essere, and then the participle agrees like an adjective: la neve è caduta.",
  },
  imperfect: {
    title: "Describing the past",
    intro: "For setting the scene and saying what something was like, rather than what happened.",
    fr: "The imparfait: take the nous form of the present, drop -ons and add -ais, -ais, -ait, -ions, -iez, -aient (portait). Être is irregular: c'était, ils étaient.",
    de: "German mostly uses the Perfekt in speech, but a few very common verbs prefer the simple past: war (was), hatte (had). Es war ein langer Tag.",
    it: "The imperfetto: -avo/-evo/-ivo, -avi, -ava, -avamo, -avate, -avano (indossava). Essere is irregular: ero, eri, era, eravamo, eravate, erano.",
  },
  question: {
    title: "Asking questions",
    intro: "Each language has its own way of turning a statement into a question.",
    fr: "Three ways: just raise your voice (Tu veux du thé ?), start with est-ce que, or swap the verb and pronoun with a hyphen (Es-tu ? Est-il possible ?). French puts a space before ? and !.",
    de: "For yes/no questions the verb goes first: Bist du noch wach? With a question word (warum, wo, was, wie), the verb comes second: Warum bist du traurig?",
    it: "The word order usually stays the same; only your intonation (and the ?) makes it a question: Sai leggere la mappa? Question words go first: Perché sei triste?",
  },
  negation: {
    title: "Saying “not”",
    intro: "Making a sentence negative.",
    fr: "Wrap the verb in ne … pas (ne becomes n' before a vowel): Je ne trouve pas ma clé. In casual speech the ne often disappears. Also ne … jamais (never) and ne … plus (no longer).",
    de: "Nicht negates verbs and adjectives and usually goes near the end: Ich finde meinen Schlüssel nicht. Before a noun, use kein instead of “not a” or “no”: Ich habe kein Geld.",
    it: "Simply put non before the verb: Non trovo la mia chiave. Double negatives are normal: Non vedo nessuno (I don't see anyone).",
  },
  "there-is": {
    title: "“There is”",
    intro: "Saying that something exists or is somewhere.",
    fr: "Il y a works for singular and plural: Il y a un chat sur le toit.",
    de: "Es gibt is used for general existence: Es gibt ein Problem. For something in a particular place, German usually uses a verb of position instead: Im Park steht ein Baum, auf dem Dach sitzt eine Katze.",
    it: "C'è (singular) and ci sono (plural): C'è un gatto sul tetto. Ci sono due gatti.",
  },
  reflexive: {
    title: "Reflexive verbs",
    intro: "Verbs that use a pronoun meaning “myself”, “yourself” and so on, often where English doesn't.",
    fr: "The pronoun goes before the verb and matches the subject: je me sens, il se sent, nous nous sentons. In the passé composé they always take être: La pluie s'est arrêtée.",
    de: "Mich, dich, sich, uns, euch, sich: ich fühle mich, er fühlt sich. Some verbs are reflexive in German but not in English: sich verlaufen (to get lost).",
    it: "Mi, ti, si, ci, vi, si before the verb: mi sento, si sente. In the past tense they use essere: Ci siamo persi. In commands the pronoun joins the end: Lavati le mani!",
  },
  comparative: {
    title: "More, most, best",
    intro: "Comparing things.",
    fr: "Plus (more) or moins (less) + adjective, then que: plus grand que. For “the most”, add the article: la plus grande ville. Bon becomes meilleur (better, best).",
    de: "Add -er for “more” and -(e)st for “most”, often with an umlaut: groß, größer, die größte Stadt, am größten. Gut becomes besser and am besten.",
    it: "Più + adjective, then di: più grande di. For “the most”, use the article: la città più grande. Buono also has the form migliore (better).",
  },
  partitive: {
    title: "“Some”",
    intro: "Talking about an unspecified amount of something.",
    fr: "French needs a word for “some” before things you don't count: du (masculine), de la (feminine), de l' (before a vowel), des (plural). J'ai acheté du pain. After a negative it becomes de: pas de pain.",
    de: "German simply leaves it out: Ich habe frisches Brot gekauft. Use etwas for “a bit of”: etwas Schokolade.",
    it: "Optional in Italian: di + article (del, della, dello, dei, delle), or un po' di (a little): del pane fresco, un po' di tè.",
  },
  modal: {
    title: "Can, want, would like",
    intro: "Modal verbs, followed by another verb in the infinitive.",
    fr: "Pouvoir (can), vouloir (want), devoir (must) + infinitive: Je peux avoir un verre d'eau ? Je voudrais is the polite “I would like”.",
    de: "Können, wollen, möchten, müssen, dürfen + infinitive, which goes to the very end: Kann ich ein Glas Wasser haben? Möchtest du…? is the polite “would you like…?”.",
    it: "Potere, volere, dovere + infinitive: Posso avere un bicchiere d'acqua? Vorrei is the polite “I would like”.",
  },
  possessive: {
    title: "My, your, our",
    intro: "Words that show who something belongs to.",
    fr: "They agree with the thing owned, not the owner: mon frère, ma sœur, mes amis. Son fromage can mean his, her or its cheese. Before a vowel use mon even for feminine words: mon amie.",
    de: "Mein, dein, sein (his), ihr (her/their), unser, euer take the same endings as ein: meine Schwester, unser Haus, ich liebe deinen Mantel.",
    it: "Italian adds the article: il mio libro, la nostra casa. The exception is a single family member: mia sorella, mio fratello (but i miei fratelli).",
  },
};

export function grammarFor(index) {
  const [topic, fr, de, it] = TAGS[index] || ["gender", [], [], []];
  return { id: topic, ...TOPICS[topic], highlights: { fr, de, it } };
}
