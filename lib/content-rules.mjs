import { englishError } from "./language.mjs";

// Kept in both languages even though the website accepts English prose only.
// Edit this list to maintain the basic profanity policy. It is not exhaustive.
export const restrictedWords = {
  en: [
    "fuck",
    "fucks",
    "fucked",
    "fucker",
    "fuckers",
    "fucking",
    "shit",
    "shits",
    "shitty",
    "shitting",
    "bullshit",
    "bitch",
    "bitches",
    "asshole",
    "assholes",
    "bastard",
    "bastards",
    "cunt",
    "cunts",
  ],
  ms: [
    "babi",
    "bajingan",
    "bangsat",
    "bodoh",
    "sial",
    "pukimak",
    "kimak",
    "butoh",
    "lancau",
  ],
};

const blocked = new Set(Object.values(restrictedWords).flat());
const separatedWords = Object.values(restrictedWords)
  .flat()
  .map(
    (word) =>
      new RegExp(
        `(^|[^\\p{L}\\p{N}])${word.split("").join("[._\\s-]*")}(?=$|[^\\p{L}\\p{N}])`,
        "iu",
      ),
  );

export function profanityError(value, label = "This field") {
  const normalised = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  const words = normalised.match(/[\p{L}\p{N}@$]+/gu) || [];
  const substitutions = {
    0: "o",
    1: "i",
    3: "e",
    4: "a",
    5: "s",
    7: "t",
    "@": "a",
    $: "s",
  };
  const containsProfanity =
    words.some(
      (word) =>
        blocked.has(word) ||
        blocked.has(
          word.replace(/[013457@$]/g, (letter) => substitutions[letter]),
        ),
    ) || separatedWords.some((pattern) => pattern.test(normalised));

  return containsProfanity
    ? `${label}: please use professional wording without profanity.`
    : "";
}

export function proseError(value, label = "This field") {
  return profanityError(value, label) || englishError(value, label);
}

export function validateProse(value, label) {
  const error = proseError(value, label);
  if (error) throw new Error(error);
  return value;
}
