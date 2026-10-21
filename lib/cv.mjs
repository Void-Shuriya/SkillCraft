import { sourceLabels, validateInput } from "./project.mjs";
import { checkInputLanguage } from "./language.mjs";
import { validateProse } from "./content-rules.mjs";
import { projectTitle, toolName, mentionsTool, toolsMentioned, sentence } from "./format.mjs";

const text = (value, max) => {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error("Please check the selected skills and try again.");
  return validateProse(value.trim(), "CV project section");
};

export function selectedSkills(skills) {
  return skills
    .filter((skill) => skill.decision === "accepted")
    .map((skill) => ({
      name: skill.name,
      explanation: skill.explanation,
      tools: skill.tools || [],
    }));
}

export function validateCvInput(raw) {
  const project = validateInput(raw);
  const rejectedSkillNames = raw.rejectedSkillNames ?? [];
  if (!Array.isArray(rejectedSkillNames) || rejectedSkillNames.length > 6)
    throw new Error("Please check the excluded skills and try again.");
  if (
    !Array.isArray(raw.selectedSkills) ||
    !raw.selectedSkills.length ||
    raw.selectedSkills.length > 6
  )
    throw new Error(
      "Include at least one skill before creating your CV project section.",
    );
  return {
    ...project,
    rejectedSkillNames: rejectedSkillNames.map((name) => text(name, 100)),
    selectedSkills: raw.selectedSkills.map((skill) => ({
      name: text(skill?.name, 100),
      explanation: text(skill?.explanation, 1200),
      tools: (() => {
        const tools = skill.tools ?? [];
        if (!Array.isArray(tools) || tools.length > 10)
          throw new Error("Please check the included skill tools.");
        return [...new Set(tools.map((tool) => toolName(text(tool, 80))))];
      })(),
    })),
  };
}

export const cvSchema = {
  type: "object",
  properties: {
    inputLanguage: { type: "string", enum: ["english", "non_english"] },
    tools: { type: "array", maxItems: 10, items: { type: "string" } },
    bullets: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          source: { type: "string", enum: Object.keys(sourceLabels) },
          quote: { type: "string" },
        },
        required: ["text", "source", "quote"],
      },
    },
  },
  required: ["tools", "bullets", "inputLanguage"],
};

const normalise = (value) => value.replace(/\s+/g, " ").trim();

export function checkCvEntry(raw, project) {
  checkInputLanguage(raw?.inputLanguage);
  if (
    !Array.isArray(raw?.tools) ||
    raw.tools.length > 10 ||
    !Array.isArray(raw?.bullets) ||
    !raw.bullets.length ||
    raw.bullets.length > 5
  )
    throw new Error("Invalid CV project section.");
  const sources = {
    description: project.description,
    contribution: project.contribution,
  };
  const sourceText = normalise(Object.values(sources).join(" ")).toLowerCase();
  let tools = [...new Set(raw.tools.map((tool) => toolName(text(tool, 80))))];
  for (const tool of tools) {
    if (!mentionsTool(sourceText, tool))
      throw new Error("A tool was not found in the project details.");
  }
  // A general description may include work by others. Apply the same source
  // requirement to every project; presence still does not prove ownership.
  const personalSources = normalise(project.contribution);
  const rejectedTools = new Set(
    (project.rejectedSkillNames || []).map((name) => toolName(name).toLowerCase()),
  );
  tools = tools.filter(
    (tool) => mentionsTool(personalSources, tool) && !rejectedTools.has(tool.toLowerCase()),
  );
  const bullets = raw.bullets.map((bullet) => {
    const line = text(bullet?.text, 500);
    const quote = bullet?.quote;
    if (
      typeof quote !== "string" ||
      quote.trim().length < 2 ||
      quote.length > 1200 ||
      !Object.hasOwn(sources, bullet.source) ||
      !normalise(sources[bullet.source]).includes(normalise(quote))
    )
      throw new Error(
        "A CV bullet could not be linked to the project details.",
      );
    return sentence(line);
  });
  // Recover personally used, included technologies even if Gemini omitted them
  // from its tools array. Keep the same personal-source and rejection checks.
  if (Array.isArray(project.selectedSkills)) {
    const includedWork = [
      ...project.selectedSkills.map(({ name, explanation }) => `${name} ${explanation}`),
      ...bullets,
    ].join(" ");
    const includedTools = toolsMentioned(includedWork).filter(
      (tool) => mentionsTool(personalSources, tool) && !rejectedTools.has(tool.toLowerCase()),
    );
    const reviewedTools = project.selectedSkills
      .flatMap((skill) => skill.tools || [])
      .map(toolName)
      .filter((tool) => mentionsTool(personalSources, tool) && !rejectedTools.has(tool.toLowerCase()));
    const namedTools = project.selectedSkills
      .map(({ name }) => toolName(name))
      .filter((tool) => includedTools.includes(tool));
    tools = [...new Set([
      ...namedTools,
      ...reviewedTools,
      ...includedTools,
      ...tools.filter((tool) => mentionsTool(includedWork, tool)),
    ])].slice(0, 10);
  }
  // Quote matching establishes traceability, not the truth of an AI paraphrase.
  return {
    title: projectTitle(project.title),
    tools: [...new Set(tools.map(toolName))],
    bullets: [...new Set(bullets)],
  };
}

export function cvText(entry) {
  return [
    entry.title.trim(),
    ...(entry.tools.length
      ? [
          `Tools: ${entry.tools.join(", ")}`,
        ]
      : []),
    "",
    ...entry.bullets.map((bullet) => `• ${bullet}`),
  ].join("\n");
}
