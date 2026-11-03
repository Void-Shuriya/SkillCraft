# 🎓 SkillCraft

An AI-assisted web tool that helps students identify skills from their projects and draft CV project descriptions.

## 🌐 Live Demo

[Try SkillCraft](https://skillcraft-cs.vercel.app/)

A trial access code is required to use the AI features.

## 📖 Overview

SkillCraft was developed as part of my participation in **AI Future Makers 2026**. I developed it under the name **Cyber Syntax**, with help from AI in line with the event's focus.

Students describe their project and personal contribution, review the suggested skills, and generate an editable CV project section.

## ✨ Features

- AI skill suggestions for IT and non-IT projects
- Input in any language, with AI-generated wording in English
- Skill review with editing, inclusion and exclusion options
- Source quotes linking suggestions to project details
- Editable CV project section with copy and download options
- Responsive layout for desktop and mobile

## 🛠️ Built With

- Next.js
- React
- JavaScript
- CSS
- Google Gemini API
- Vercel

## 💻 Run Locally

Install Node.js 24.x and Git, then clone the repository and install its dependencies:

```sh
git clone https://github.com/Void-Shuriya/SkillCraft.git
cd SkillCraft
npm install
```

Create a file named `.env.local` in the project folder, next to `package.json`, and add your own Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey):

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

The API key enables AI generation. A trial access code is optional locally; add `TRIAL_ACCESS_CODE` if you want to require one. You can also set `GEMINI_MODEL` to use another Gemini model available to your Google project.

Start the development server:

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000), or the URL shown in your terminal, and try the Sample button. Keep `.env.local` private and restart the server after changing it. Gemini usage is subject to your account's quota and billing settings.

## 📌 Notes

- This project was created for learning and participation in AI Future Makers 2026.
- The application is hosted on Vercel.
- Project details are sent to Google Gemini for AI generation; suggestions should be reviewed before use.
- Source quotes and the supplied project title retain their original language.
- Work stays in the current page and is cleared on refresh; copy or download your CV text before leaving.
