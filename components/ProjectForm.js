import { LIMITS } from "@/lib/project.mjs";
import Icon from "./Icon";
import { proseError } from "@/lib/content-rules.mjs";
import styles from "@/app/page.module.css";

export default function ProjectForm({
  project,
  updateProject,
  loadSample,
  config,
  accessCode,
  setAccessCode,
  busy,
  onSubmit,
  onClear,
}) {
  function field(key, label, placeholder, rows) {
    const error = proseError(project[key], label);
    const shared = {
      id: key,
      value: project[key],
      maxLength: LIMITS[key],
      placeholder,
      "aria-describedby": `${key}-count${error ? ` ${key}-error` : ""}`,
      "aria-invalid": Boolean(error),
      onChange: (event) => {
        updateProject(key, event.target.value);
      },
    };
    return (
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label htmlFor={key}>{label}</label>
          <span id={`${key}-count`} className={styles.characterCount}>
            {project[key].length.toLocaleString()} /{" "}
            {LIMITS[key].toLocaleString()}
          </span>
        </div>
        {rows ? (
          <textarea
            {...shared}
            rows={rows}
            required={key === "description" || key === "contribution"}
            minLength={key === "description" ? 20 : undefined}
          />
        ) : (
          <input {...shared} required minLength={2} />
        )}
        {error && (
          <p id={`${key}-error`} className={styles.warning}>
            {error}
          </p>
        )}
      </div>
    );
  }
  return (
    <form
      className={styles.projectForm}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <fieldset disabled={busy}>
        <div className={styles.formTopline}>
          <div className={styles.sampleButtons}>
            <button
              type="button"
              onClick={loadSample}
              title="Fictional example: Student Spending Survey"
            >
              <Icon name="file" size={14} /> Sample
            </button>
          </div>
        </div>
        {field("title", "Project title", "e.g. Student Spending Survey")}
        <div className={styles.writingGrid}>
          {field(
            "description",
            "Project overview",
            "What was your project about, and what was its purpose?",
            9,
          )}
          {field(
            "contribution",
            "What you did",
            "What did you do, and what tools or methods did you use?",
            9,
          )}
        </div>
        {config?.requiresCode && (
          <div className={styles.field}>
            <label htmlFor="access-code">Trial access code</label>
            <p className={styles.fieldHint}>
              Enter the code from Cyber Syntax.
            </p>
            <input
              id="access-code"
              type="password"
              value={accessCode}
              maxLength={200}
              autoComplete="off"
              onChange={(event) => setAccessCode(event.target.value)}
            />
          </div>
        )}
        {config && !config.configured && (
          <p className={styles.warning}>
            AI isn’t configured on the server yet. You can prepare your project
            here.
          </p>
        )}
        <div className={styles.formActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onClear}
          >
            Clear all
          </button>
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={config?.configured === false}
          >
            {busy ? "Finding skills…" : "Find my skills"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
