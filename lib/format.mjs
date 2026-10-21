const names = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "PHP",
  "MySQL",
  "XAMPP",
  "SQL",
  "Python",
  "Java",
  "React",
  "Next.js",
  "Node.js",
  "Git",
  "GitHub",
  "Vercel",
  "Microsoft Excel",
  "Microsoft Word",
  "PowerPoint",
  "Figma",
  "API",
  "UI",
  "UX",
];
// Only unambiguous project-tool shorthand; source quotations stay unchanged.
const toolAliases = {
  JavaScript: ["js"],
  "Node.js": ["nodejs", "node js"],
  "Next.js": ["nextjs", "next js"],
  XAMPP: ["xaamp"],
  "Microsoft Excel": ["excel"],
  "Microsoft Word": ["word"],
};

export function toolName(value) {
  const clean = value.trim();
  return (
    names.find((name) => name.toLowerCase() === clean.toLowerCase()) ||
    Object.keys(toolAliases).find((name) =>
      toolAliases[name].includes(clean.toLowerCase()),
    ) ||
    clean
  );
}

export function mentionsTool(source, value) {
  const canonical = toolName(value);
  return [canonical, ...(toolAliases[canonical] || [])].some((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // The js in Node.js or a filename is not an independent JavaScript mention.
    const boundary = name === "js" ? "[^a-z0-9_.]" : "[^a-z0-9_]";
    return new RegExp(`(^|${boundary})${escaped}(?=$|[^a-z0-9_])`, "i").test(source);
  });
}

export function toolsMentioned(source) {
  // These three labels describe concepts rather than concrete tools.
  return names.filter(
    (name) => !["API", "UI", "UX"].includes(name) && mentionsTool(source, name),
  );
}
export function projectTitle(value) {
  return value
    .trim()
    .replace(/[\p{L}\p{N}]+(?:[.-][\p{L}\p{N}]+)*/gu, (word) => {
      // Formatting a title must not expand ordinary words such as "word" into
      // a tool alias like Microsoft Word.
      const known = names.find((name) => name.toLowerCase() === word.toLowerCase()) || word;
      if (known !== word) return known;
      return word === word.toLowerCase()
        ? word[0].toUpperCase() + word.slice(1)
        : word;
    });
}
export function sentence(value) {
  const clean = value
    .replace(/^[•-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  const capitalised = clean[0].toUpperCase() + clean.slice(1);
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}
