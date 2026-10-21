import { createHash, timingSafeEqual } from "node:crypto";
import { validateInput } from "@/lib/project.mjs";
import {
  analyseProject,
  generateCvEntry,
  ServiceError,
} from "@/lib/gemini.mjs";
import { validateCvInput } from "@/lib/cv.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BYTES = 64000;
const recentRequests = new Map(); // Best-effort per-server cooldown, not a distributed rate limiter.
const reply = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  return reply({
    configured: Boolean(process.env.GEMINI_API_KEY),
    requiresCode:
      Boolean(process.env.TRIAL_ACCESS_CODE) || process.env.VERCEL === "1",
  });
}

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");
    // Next's internal URL may use localhost even when the browser uses 127.0.0.1.
    // Compare with the actual request Host, which also works behind Vercel.
    if (origin && new URL(origin).host !== request.headers.get("host"))
      return reply(
        { error: "Please send the request from the SkillCraft app." },
        403,
      );
    if (!request.headers.get("content-type")?.includes("application/json"))
      return reply({ error: "Expected a JSON request." }, 415);
    if (Number(request.headers.get("content-length")) > MAX_BYTES)
      return reply(
        { error: "This project is too large. Shorten your project details." },
        413,
      );
    // Count streamed bytes too; Content-Length alone cannot be trusted.
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Please enter project details." }, 400);
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return reply(
          { error: "This project is too large. Shorten your project details." },
          413,
        );
      }
      chunks.push(value);
    }
    let input;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return reply(
        { error: "The request was unreadable. Please reload and try again." },
        400,
      );
    }
    const code = process.env.TRIAL_ACCESS_CODE;
    if (process.env.VERCEL === "1" && (!code || code.length < 12))
      return reply(
        {
          error:
            "The owner needs to configure a trial access code of at least 12 characters before online AI trials.",
        },
        503,
      );
    if (code) {
      const supplied =
        typeof input?.accessCode === "string" ? input.accessCode : "";
      const hash = (value) => createHash("sha256").update(value).digest();
      if (!timingSafeEqual(hash(code), hash(supplied)))
        return reply(
          {
            error:
              "That trial access code is not correct. Ask Cyber Syntax for the code.",
          },
          401,
        );
    }
    let project;
    try {
      if (!input || typeof input !== "object" || Array.isArray(input))
        throw new Error("Please enter your project details.");
      if (input.action && !["analyse", "cv"].includes(input.action))
        throw new Error("Please choose a valid action.");
      project =
        input.action === "cv" ? validateCvInput(input) : validateInput(input);
    } catch (error) {
      return reply({ error: error.message }, 400);
    }
    // No raw project text, IPs or credentials are logged or stored by this route.
    const identity = createHash("sha256")
      .update(request.headers.get("x-forwarded-for") || "local")
      .digest("hex");
    const now = Date.now();
    for (const [key, time] of recentRequests)
      if (now - time > 60000) recentRequests.delete(key);
    if (
      recentRequests.has(identity) &&
      now - recentRequests.get(identity) < 6000
    )
      return reply(
        { error: "Please wait a few seconds before asking the AI again." },
        429,
      );
    if (recentRequests.size > 1000)
      return reply(
        { error: "The prototype is busy. Please try again shortly." },
        503,
      );
    recentRequests.set(identity, now);
    return reply(
      await (input.action === "cv"
        ? generateCvEntry(project)
        : analyseProject(project)),
    );
  } catch (error) {
    return reply(
      {
        error:
          error instanceof ServiceError
            ? error.message
            : "Something went wrong. Your input is unchanged; please try again.",
      },
      error instanceof ServiceError ? error.status : 500,
    );
  }
}
