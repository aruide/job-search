import type { Tone } from "@/lib/format";
import type { Competence } from "@/lib/types";

export function CompetenceList({ items, tone }: { items: Competence[]; tone: Tone }) {
  if (items.length === 0) {
    return <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Aucune information</p>;
  }

  return (
    <ul className="competence-list">
      {items.map((c, i) => {
        const note = c.note ?? c.note_actuelle;
        return (
          <li key={`${c.titre}-${i}`} className="competence-item">
            <div className="competence-row">
              <span className={`tag ${tone === "neutral" ? "" : tone}`}>{c.titre}</span>
              {c.importance_dans_offre ? (
                <span className="competence-meta">Importance : {c.importance_dans_offre}</span>
              ) : null}
              {note !== null ? <span className="competence-meta">Note : {note}</span> : null}
            </div>
            {c.conseil ? <p className="competence-conseil">{c.conseil}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
