import { francAll } from "franc-min";

// Short text is unreliable for statistical detection. These explicit Malay
// markers also catch common mixed English/Malay sentences before an AI request.
const malayMarkers = new Set([
  "saya",
  "anda",
  "kami",
  "kita",
  "mereka",
  "yang",
  "dengan",
  "untuk",
  "projek",
  "sistem",
  "pelajar",
  "pengguna",
  "menggunakan",
  "membangunkan",
  "membina",
  "menulis",
  "menguji",
  "membantu",
  "membuat",
  "mengurus",
  "menganalisis",
  "menyediakan",
  "menyimpan",
  "mencipta",
  "maklumat",
  "tugasan",
  "tajuk",
  "kemahiran",
  "perisian",
  "pangkalan",
  "laporan",
  "kumpulan",
  "borang",
  "kajian",
  "penyelidikan",
  "pengesahan",
  "jawapan",
  "adalah",
  "ialah",
  "kerana",
  "supaya",
  "sebagai",
  "daripada",
  "kepada",
]);

export function englishError(value, label = "This field") {
  const clean = value
    .normalize("NFKC")
    .replace(/https?:\/\/\S+|\b[\w.+-]+@[\w.-]+\.\w+\b/g, " ")
    .trim();

  if (!clean) return "";

  const message = `${label}: please write in English only.`;
  const letters = clean.match(/\p{L}/gu) || [];
  if (letters.some((letter) => !/\p{Script=Latin}/u.test(letter)))
    return message;

  const words = clean.toLowerCase().match(/\p{L}+/gu) || [];
  if (words.some((word) => malayMarkers.has(word))) return message;

  // Statistical detection is unreliable for short English and tool-heavy text.
  // Keep script/word checks above for all lengths and let the AI verdict handle
  // ambiguous short passages. Scores are relative rankings, not probabilities.
  const passages = [clean, ...clean.split(/[\n!?]+|\.(?:\s|$)/u)];
  for (const passage of passages) {
    if (passage.length < 120 || (passage.match(/\p{L}+/gu) || []).length < 20)
      continue;
    const scores = francAll(passage, { minLength: 120 });
    const english = scores.find(([language]) => language === "eng")?.[1] ?? 0;
    if (scores[0]?.[0] !== "eng" && english < 0.7) return message;
  }

  return "";
}

export class InputLanguageError extends Error {
  constructor() {
    super(
      "Please write your project details in English only.",
    );
    this.name = "InputLanguageError";
  }
}

// The AI also checks narrative language, including short ambiguous input.
// This verdict supplements local checks; it is not a guarantee of accuracy.
export function checkInputLanguage(value) {
  if (value === "non_english") throw new InputLanguageError();
  if (value !== "english") throw new Error("Missing input-language check.");
}
