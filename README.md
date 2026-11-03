# SkillCraft

An AI-assisted web tool that helps students identify skills from their projects and draft CV project descriptions.

**[Try SkillCraft](https://skillcraft-cs.vercel.app/)** · Trial access code required.

## About

I developed SkillCraft as part of my participation in **AI Future Makers 2026**, under the name **Cyber Syntax**. I built the app with help from AI, in line with the event's focus on creating with AI.

## How it works

1. Describe your project and what you did, in any language.
2. Review, edit, include or exclude the suggested skills.
3. Generate an English CV project section, then edit, copy or download it.

AI-generated wording is in English; source quotes and your project title keep their original language. Review the suggestions before using them. Project details are sent to Google Gemini, and work is cleared when you refresh the page.

## Built with

Next.js, React, JavaScript, CSS and the Google Gemini API. Hosted on Vercel.

## Run locally

Requires Node.js 24 or later.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`.
3. Optionally set `TRIAL_ACCESS_CODE` for local testing and `GEMINI_MODEL` to override the default model.
4. Run `npm run dev` and open the local URL shown in the terminal.

Keep `.env.local` private. Run `npm run build` to check the production build.

## Deploy on Vercel

Set `GEMINI_API_KEY` and `TRIAL_ACCESS_CODE` (12–200 characters) in the project's environment variables for Production, then redeploy. The trial code controls access; the API key enables AI generation.
