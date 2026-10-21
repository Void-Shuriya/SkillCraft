// Imported only by the server route and local verification.
import { analysisSchema, checkAnalysis } from "./project.mjs";
import { cvSchema, checkCvEntry } from "./cv.mjs";

import { SYSTEM_PROMPT } from "./prompts/skills.mjs";
import { CV_PROMPT } from "./prompts/cv.mjs";
import { InputLanguageError } from "./language.mjs";

export class ServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

export async function analyseProject(project, options = {}) {
  return requestStructured(
    project,
    SYSTEM_PROMPT,
    analysisSchema,
    checkAnalysis,
    options,
  );
}

export async function generateCvEntry(project, options = {}) {
  return requestStructured(project, CV_PROMPT, cvSchema, checkCvEntry, options);
}

async function requestStructured(
  project,
  prompt,
  schema,
  check,
  {
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    fetcher = fetch,
  } = {},
) {
  if (!apiKey || apiKey.includes("paste_your"))
    throw new ServiceError(
      "AI is not configured yet. Ask the project owner to add the Gemini key on the server.",
      503,
    );
  if (!/^gemini-[a-z0-9.-]+$/.test(model))
    throw new ServiceError("The configured AI model name is invalid.", 503);
  let response;
  try {
    response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(45000),
        cache: "no-store",
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: prompt,
              },
            ],
          },
          contents: [
            { role: "user", parts: [{ text: JSON.stringify(project) }] },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: schema,
            temperature: 0.2,
            maxOutputTokens: 6000,
          },
        }),
      },
    );
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError")
      throw new ServiceError(
        "The AI took too long. Your project is still here; please try again.",
        504,
      );
    throw new ServiceError(
      "We could not reach Google AI. Check the connection and try again.",
      503,
    );
  }
  // Never forward Google's raw error, which could contain request information.
  if (!response.ok) {
    if (response.status === 429)
      throw new ServiceError(
        "Google AI quota is busy or exhausted. Wait and try again later; your work is unchanged.",
        429,
      );
    if ([401, 403].includes(response.status))
      throw new ServiceError(
        "Google could not authorise the AI request. Ask the project owner to check the API key and project access.",
        503,
      );
    if (response.status === 404)
      throw new ServiceError(
        "This AI model is unavailable to the project. Ask the owner to check GEMINI_MODEL in the server settings.",
        503,
      );
    throw new ServiceError(
      "Google could not complete this request. Please try again later.",
    );
  }
  try {
    const body = await response.json();
    const candidate = body.candidates?.[0];
    if (!candidate || candidate.finishReason !== "STOP")
      throw new Error("Incomplete response");
    const text = candidate.content?.parts
      ?.filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
    const checked = check(JSON.parse(text), project);
    return { ...checked, model, generatedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof InputLanguageError)
      throw new ServiceError(error.message, 422);
    throw new ServiceError(
      "The AI response did not pass the language, wording or source checks. Your work is unchanged. Please try again.",
    );
  }
}
