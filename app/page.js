"use client";

import { useEffect, useRef, useState } from "react";
import { emptyProject, validateInput } from "@/lib/project.mjs";
import { proseError } from "@/lib/content-rules.mjs";
import { selectedSkills, cvText } from "@/lib/cv.mjs";
import { sampleProject } from "@/lib/samples.mjs";
import ProjectForm from "@/components/ProjectForm";
import SkillCard from "@/components/SkillCard";
import CVProjectEditor from "@/components/CVProjectEditor";
import Icon from "@/components/Icon";
import styles from "./page.module.css";

const steps = ["Project", "Skills", "CV Section"];

export default function Home() {
  const [project, setProject] = useState({ ...emptyProject });
  const [analysis, setAnalysis] = useState(null);
  const [entry, setEntry] = useState(null);
  const [entryText, setEntryText] = useState("");
  const [step, setStep] = useState(0);
  const [accessCode, setAccessCode] = useState("");
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const heading = useRef(null);
  const controller = useRef(null);

  useEffect(() => {
    try {
      localStorage.removeItem("skillcraft-draft-v1");
    } catch {
      /* Storage can be unavailable. */
    }
    const abort = new AbortController();
    fetch("/api/analyse", { signal: abort.signal })
      .then((response) => response.json())
      .then(setConfig)
      .catch(() => {});
    return () => {
      abort.abort();
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  const included =
    analysis?.skills.filter((skill) => skill.decision === "accepted").length ||
    0;
  const pending =
    analysis?.skills.filter((skill) => skill.decision === "pending").length ||
    0;

  function navigate(next) {
    setStep(next);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearEntry() {
    setEntry(null);
    setEntryText("");
  }

  function updateProject(key, value) {
    setProject((previous) => ({ ...previous, [key]: value }));
    clearEntry();
    if (analysis) {
      setAnalysis(null);
      setNotice("Project changed. Find your skills again when ready.");
    }
  }

  function loadSample() {
    if (
      (project.title ||
        project.description ||
        project.contribution) &&
      !window.confirm("Replace your current work with this example?")
    )
      return;
    setProject({ ...sampleProject });
    setAnalysis(null);
    clearEntry();
    setError("");
    setNotice("");
  }

  async function requestAI(input, label) {
    setError("");
    setNotice("");
    setBusy(true);
    setBusyLabel(label);
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 55000);
    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, accessCode }),
        signal: abort.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again.");
      return result;
    } catch (problem) {
      setError(
        problem.name === "AbortError"
          ? "Request stopped. Your work is still here."
          : problem.message,
      );
      return null;
    } finally {
      clearTimeout(timeout);
      setBusy(false);
      controller.current = null;
    }
  }

  async function analyse() {
    if (busy) return;

    try {
      validateInput(project);
    } catch (problem) {
      setError(problem.message);
      return;
    }

    const result = await requestAI(project, "Finding your skills…");
    if (!result) return;

    setAnalysis(result);
    clearEntry();
    navigate(1);
  }

  function clearAll() {
    if (busy) return;
    const hasWork =
      project.title ||
      project.description ||
      project.contribution ||
      entry;
    if (hasWork && !window.confirm("Clear all project text and results?"))
      return;

    setProject({ ...emptyProject });
    setAnalysis(null);
    clearEntry();
    setAccessCode("");
    navigate(0);
    document.getElementById("title")?.focus();
  }

  function updateSkill(id, changes) {
    clearEntry();
    setAnalysis((previous) => ({
      ...previous,
      skills: previous.skills.map((skill) =>
        skill.id === id ? { ...skill, ...changes } : skill,
      ),
    }));
  }

  async function buildEntry() {
    if (busy || pending || !included) return;
    if (entry) {
      navigate(2);
      return;
    }
    const result = await requestAI(
      {
        ...project,
        action: "cv",
        selectedSkills: selectedSkills(analysis.skills),
        rejectedSkillNames: analysis.skills
          .filter((skill) => skill.decision === "rejected")
          .map((skill) => skill.name),
      },
      "Writing your CV project section…",
    );
    if (!result) return;
    setEntry(result);
    setEntryText(cvText(result));
    navigate(2);
  }

  const exportError = proseError(entryText, "CV project section");

  async function copy() {
    if (exportError) {
      setError(exportError);
      return;
    }
    try {
      await navigator.clipboard.writeText(entryText);
      setNotice("Copied.");
      setError("");
    } catch {
      setError("Could not copy. Select the text below and copy it manually.");
    }
  }

  function download() {
    if (exportError) {
      setError(exportError);
      return;
    }
    const blob = new Blob([entryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skillcraft-cv-project.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Download started.");
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#workspace">
        Skip to workspace
      </a>
      <header className={styles.header}>
        <a
          className={styles.brand}
          href="/"
          aria-label="SkillCraft home — clear all and start again"
          title="Clear all and start again"
        >
          <span className={styles.brandMark}>
            <Icon name="layers" size={23} />
          </span>
          SkillCraft
        </a>
      </header>
      <div className={styles.workspaceLayout}>
        <main id="workspace" className={styles.main} aria-busy={busy}>
          <div className={styles.workspaceHeading}>
            <section className={styles.intro}>
              <h1 ref={heading} tabIndex={-1}>
                {
                  [
                    "Describe your project",
                    "Review your skills",
                    "Your CV project section",
                  ][step]
                }
              </h1>
            </section>
            <nav className={styles.steps} aria-label="Progress">
              {steps.map((label, index) => (
                <button
                  key={label}
                  className={styles.step}
                  aria-current={step === index ? "step" : undefined}
                  disabled={
                    busy ||
                    (index > 0 && !analysis) ||
                    (index === 2 && (pending > 0 || !included))
                  }
                  onClick={() => (index === 2 ? buildEntry() : navigate(index))}
                >
                  <span className={styles.stepNumber}>
                    {index < step ? <Icon name="check" size={15} /> : index + 1}
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
          {error && (
            <div className={styles.error} role="alert">
              <Icon name="info" />
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className={styles.notice} role="status">
              <Icon name="info" size={19} />
              <span>{notice}</span>
            </div>
          )}
          {busy && (
            <div className={styles.loading} role="status">
              <span className={styles.spinner} />
              <strong>{busyLabel}</strong>
              <button
                className={styles.textButton}
                onClick={() => controller.current?.abort()}
              >
                Cancel
              </button>
            </div>
          )}
          {step === 0 && (
            <ProjectForm
              project={project}
              updateProject={updateProject}
              loadSample={loadSample}
              config={config}
              accessCode={accessCode}
              setAccessCode={setAccessCode}
              busy={busy}
              onSubmit={analyse}
              onClear={clearAll}
            />
          )}
          {step === 1 && analysis && (
            <div className={styles.reviewLayout}>
              <div>
                <div className={styles.sectionHeading}>
                  <h2>
                    Skills{" "}
                    <span className={styles.count}>
                      {analysis.skills.length}
                    </span>
                  </h2>
                </div>
                {analysis.warnings.map((warning) => (
                  <p className={styles.warning} key={warning}>
                    {warning}
                  </p>
                ))}
              </div>
              <div>
                {!analysis.skills.length && (
                  <div className={styles.empty}>
                    <h3>Tell us a little more</h3>
                    <p>
                      Go back to your project and add details about what you
                      did.
                    </p>
                  </div>
                )}
                <div className={styles.skills}>
                  {analysis.skills.map((skill) => (
                    <SkillCard
                      key={`${analysis.generatedAt}-${skill.id}`}
                      skill={skill}
                      disabled={busy}
                      onChange={(changes) => updateSkill(skill.id, changes)}
                    />
                  ))}
                </div>
                <div className={styles.reviewFooter}>
                  <p>
                    <strong>{included}</strong> included ·{" "}
                    <strong>{pending}</strong> not reviewed
                  </p>
                  <button
                    className={styles.primaryButton}
                    disabled={busy || pending > 0 || !included}
                    onClick={buildEntry}
                  >
                    Create CV project section
                  </button>
                </div>
                {pending > 0 && (
                  <p className={styles.fieldHint}>
                    Include or exclude each skill to continue.
                  </p>
                )}
                {!pending && !included && analysis.skills.length > 0 && (
                  <p className={styles.fieldHint}>
                    Include a skill or add more project details.
                  </p>
                )}
                <div className={styles.reviewTools}>
                  <button
                    className={styles.textButton}
                    disabled={busy}
                    onClick={() => navigate(0)}
                  >
                    <Icon name="back" size={16} /> Edit project
                  </button>
                </div>
              </div>
            </div>
          )}
          {step === 2 && entry && (
            <>
              <CVProjectEditor
                value={entryText}
                onChange={setEntryText}
                generatedAt={entry.generatedAt}
                error={exportError}
              />
              <div className={styles.cvActions}>
                <button
                  className={styles.textButton}
                  onClick={() => navigate(1)}
                >
                  <Icon name="back" size={16} /> Back to skills
                </button>
                <div>
                  <button
                    className={styles.secondaryButton}
                    disabled={!entryText.trim() || Boolean(exportError)}
                    onClick={copy}
                  >
                    Copy text
                  </button>
                  <button
                    className={styles.primaryButton}
                    disabled={!entryText.trim() || Boolean(exportError)}
                    onClick={download}
                  >
                    <Icon name="download" size={17} /> Download .txt
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <footer className={styles.footer}>
        © 2026 SkillCraft &nbsp;|&nbsp; Built by Cyber Syntax
      </footer>
    </div>
  );
}
