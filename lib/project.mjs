import { checkInputLanguage } from "./language.mjs";
import { validateProse } from "./content-rules.mjs";
import { toolName, mentionsTool } from "./format.mjs";

// Shared validation runs in the browser and on the server.
export const LIMITS = {
  title: 100,
  description: 3000,
  contribution: 12000,
};

export const emptyProject = {
  title: "",
  description: "",
  contribution: "",
};

export const supportLabels = {
  self_reported: "Self-reported",
  needs_clarification: "Needs clarification",
};

export const sourceLabels = {
  description: "Project overview",
  contribution: "What you did",
};

export function validateInput(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Please enter your project details.");
  const project = {};
  for (const key of Object.keys(LIMITS)) {
    if (typeof raw[key] !== "string" || raw[key].length > LIMITS[key])
      throw new Error(`Please check the ${key} field and its character limit.`);
    project[key] = raw[key].trim();
    validateProse(
      project[key],
      key === "title" ? "Project title" : sourceLabels[key],
    );
  }
  if (project.title.length < 2)
    throw new Error("Give your project a title of at least 2 characters.");
  if (project.description.length < 20)
    throw new Error("Describe your project in at least 20 characters.");
  if (!project.contribution)
    throw new Error("Tell us what you did and what tools or methods you used.");
  if (raw.outputLanguage !== undefined && raw.outputLanguage !== "en")
    throw new Error("SkillCraft supports English only.");
  if (raw.answers !== undefined)
    throw new Error(
      "Update your project details instead of sending context answers.",
    );
  return project;
}

export const analysisSchema = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          explanation: { type: "string" },
          tools: {
            type: "array",
            maxItems: 10,
            items: { type: "string" },
            description: "Named tools the student personally used for this skill; an empty list is valid.",
          },
          support: {
            type: "string",
            enum: Object.keys(supportLabels),
          },
          contributionNote: {
            type: "string",
            description:
              "How this relates to the student's own reported contribution; acknowledge ambiguity.",
          },
          citations: {
            type: "array",
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                source: { type: "string", enum: Object.keys(sourceLabels) },
                quote: { type: "string" },
              },
              required: ["source", "quote"],
            },
          },
        },
        required: [
          "name",
          "explanation",
          "tools",
          "support",
          "contributionNote",
          "citations",
        ],
      },
    },
    inputLanguage: { type: "string", enum: ["english", "non_english"] },
  },
  required: ["skills", "inputLanguage"],
};

function checkedText(value, max, allowEmpty = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!allowEmpty && !value.trim())
  )
    throw new Error("The AI response was incomplete. Please try again.");
  return validateProse(value.trim(), "AI wording");
}

const normalise = (text) => text.replace(/\s+/g, " ").trim();

// A quote match checks traceability only. It does NOT prove the skill or author.
export function checkAnalysis(raw, project) {
  checkInputLanguage(raw?.inputLanguage);
  if (!raw || !Array.isArray(raw.skills) || raw.skills.length > 6)
    throw new Error("The AI returned an unexpected format. Please try again.");
  const sources = {
    description: project.description,
    contribution: project.contribution,
  };
  let removedQuotes = 0;
  const seen = new Set();
  const skills = raw.skills
    .map((skill, index) => {
      const name = checkedText(skill?.name, 100);
      const reportedTools = skill.tools ?? [];
      if (!Array.isArray(reportedTools) || reportedTools.length > 10)
        throw new Error("The AI returned an unexpected tool list.");
      const tools = [...new Set(reportedTools.map((value) => toolName(checkedText(value, 80))))];
      if (tools.some((tool) => !mentionsTool(project.contribution, tool)))
        throw new Error("A suggested tool was not found in what you did.");
      if (
        !Object.hasOwn(supportLabels, skill.support) ||
        !Array.isArray(skill.citations) ||
        skill.citations.length > 3
      )
        throw new Error(
          "The AI returned an unexpected skill format. Please try again.",
        );
      const citations = skill.citations
        .filter((citation) => {
          const valid =
            citation &&
            Object.hasOwn(sources, citation.source) &&
            typeof citation.quote === "string" &&
            citation.quote.trim().length >= 2 &&
            citation.quote.length <= 1200 &&
            normalise(sources[citation.source]).includes(
              normalise(citation.quote),
            );
          if (!valid) removedQuotes++;
          return valid;
        })
        .map(({ source, quote }) => ({ source, quote: quote.trim() }));
      let support = skill.support;
      // Source matching establishes traceability; relevance and attribution still
      // depend on the model and the student's review.
      if (!citations.length) support = "needs_clarification";
      return {
        id: `skill-${index + 1}`,
        name,
        explanation: checkedText(skill.explanation, 1200),
        tools,
        contributionNote: checkedText(skill.contributionNote, 1000),
        support,
        citations,
        decision: "pending",
        edited: false,
      };
    })
    .filter((skill) => {
      const key = skill.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return {
    skills,
    warnings: removedQuotes
      ? [
          "Some quotes did not match your text and were removed. Check these suggestions.",
        ]
      : [],
  };
}
