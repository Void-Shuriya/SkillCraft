import styles from "@/app/page.module.css";

export default function CVProjectEditor({
  value,
  onChange,
  generatedAt,
  error,
}) {
  return (
    <section className={styles.cvEditor} aria-label="CV project section editor">
      <div className={styles.cvHeading}>
        <label htmlFor="cv-entry">Check and edit your project section</label>
        <span className={styles.provenance}>
          Generated{" "}
          {new Date(generatedAt).toLocaleString("en-GB", {
            timeZone: "Asia/Kuala_Lumpur",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}{" "}
          MYT
        </span>
      </div>
      <textarea
        id="cv-entry"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={14}
        maxLength={8000}
        lang="en"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "cv-error" : undefined}
        spellCheck
      />
      {error && (
        <p id="cv-error" className={styles.warning} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
