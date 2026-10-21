import { useState } from "react";
import { sourceLabels } from "@/lib/project.mjs";
import { proseError } from "@/lib/content-rules.mjs";
import Icon from "./Icon";
import styles from "@/app/page.module.css";

export default function SkillCard({ skill, onChange, disabled }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(skill.name);
  const [explanation, setExplanation] = useState(skill.explanation);
  const validationError =
    proseError(name, "Skill name") || proseError(explanation, "Explanation");
  function save() {
    if (!name.trim() || !explanation.trim() || validationError) return;
    onChange({
      name: name.trim(),
      explanation: explanation.trim(),
      edited: true,
      decision: "pending",
    });
    setEditing(false);
  }
  return (
    <article
      className={`${styles.skillCard} ${skill.decision === "rejected" ? styles.rejectedCard : ""} ${skill.decision === "accepted" ? styles.acceptedCard : ""}`}
    >
      <div className={styles.skillTop}>
        {skill.support === "needs_clarification" && (
          <span className={styles.warning}>Check this suggestion</span>
        )}
        <span className={styles.decisionLabel}>
          {skill.decision === "accepted"
            ? "Included"
            : skill.decision === "rejected"
              ? "Excluded"
              : "Not reviewed"}
        </span>
      </div>
      {editing ? (
        <div className={styles.skillEdit}>
          <label htmlFor={`${skill.id}-name`}>Skill name</label>
          <input
            id={`${skill.id}-name`}
            maxLength={100}
            value={name}
            disabled={disabled}
            onChange={(event) => setName(event.target.value)}
          />
          <label htmlFor={`${skill.id}-explanation`}>Your explanation</label>
          <textarea
            id={`${skill.id}-explanation`}
            maxLength={1200}
            rows={4}
            value={explanation}
            disabled={disabled}
            onChange={(event) => setExplanation(event.target.value)}
          />
          <p className={styles.fieldHint}>
            Change the name or explanation, then review this skill again.
          </p>
          {validationError && (
            <p className={styles.warning} role="alert">
              {validationError}
            </p>
          )}
          <div className={styles.cardButtons}>
            <button
              disabled={
                disabled ||
                !name.trim() ||
                !explanation.trim() ||
                Boolean(validationError)
              }
              onClick={save}
              className={styles.primaryButton}
            >
              Save changes
            </button>
            <button
              disabled={disabled}
              className={styles.secondaryButton}
              onClick={() => {
                setName(skill.name);
                setExplanation(skill.explanation);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3>{skill.name}</h3>
          <p>{skill.explanation}</p>
        </>
      )}
      <details className={styles.skillDetails}>
        <summary>Why this skill?</summary>
        {skill.edited && (
          <p className={styles.fieldHint}>
            You edited this suggestion. Check it against your work.
          </p>
        )}
        <div className={styles.citations}>
          {skill.citations.map((citation, index) => (
            <blockquote key={index}>
              <span>
                <Icon name="file" size={14} />
                {sourceLabels[citation.source]}
              </span>
              <p>{citation.quote}</p>
            </blockquote>
          ))}
        </div>
        <p className={styles.contributionNote}>{skill.contributionNote}</p>
      </details>
      {!editing && (
        <div className={styles.cardButtons}>
          <button
            className={
              skill.decision === "accepted"
                ? styles.selectedButton
                : styles.secondaryButton
            }
            disabled={disabled}
            aria-pressed={skill.decision === "accepted"}
            onClick={() => {
              if (skill.decision !== "accepted") onChange({ decision: "accepted" });
            }}
          >
            <Icon name="check" size={16} />{" "}
            {skill.decision === "accepted" ? "Included" : "Include"}
          </button>
          <button
            className={
              skill.decision === "rejected"
                ? styles.selectedButton
                : styles.secondaryButton
            }
            disabled={disabled}
            aria-pressed={skill.decision === "rejected"}
            onClick={() => {
              if (skill.decision !== "rejected") onChange({ decision: "rejected" });
            }}
          >
            <Icon name="close" size={16} />{" "}
            {skill.decision === "rejected" ? "Excluded" : "Exclude"}
          </button>
          <button
            className={styles.editButton}
            disabled={disabled}
            onClick={() => setEditing(true)}
          >
            <Icon name="edit" size={16} /> Edit skill
          </button>
        </div>
      )}
    </article>
  );
}
