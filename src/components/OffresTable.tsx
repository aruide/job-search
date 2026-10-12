"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Offre } from "@/lib/types";
import { correspondTone, formatDate, formatScore, scoreTone } from "@/lib/format";
import { Badge } from "@/components/Badge";

export function OffresTable({ offres }: { offres: Offre[] }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return offres;
    return offres.filter((o) =>
      [o.titre, o.entreprise, o.localisation, o.contrat, o.source]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [offres, query]);

  const goToOffre = (pageId: string) => router.push(`/offres/${pageId}`);

  return (
    <>
      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Rechercher par titre, entreprise, localisation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="count-pill">
          {filtered.length} offre{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          {filtered.length === 0 ? (
            <div className="empty-state">Aucune offre ne correspond à ta recherche.</div>
          ) : (
            <div>
              <div className="offres-grid head">
                <div>Offre</div>
                <div>Date</div>
                <div>Localisation</div>
                <div>Contrat</div>
                <div>Salaire</div>
                <div>Source</div>
                <div>Score</div>
                <div>Correspond</div>
              </div>
              {filtered.map((offre) => (
                <div
                  key={offre.pageId}
                  className="offres-grid offre-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => goToOffre(offre.pageId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") goToOffre(offre.pageId);
                  }}
                >
                  <div className="cell cell-title">
                    <strong>{offre.titre || "(Sans titre)"}</strong>
                    <span>{offre.entreprise}</span>
                  </div>
                  <div className="cell">{formatDate(offre.date)}</div>
                  <div className="cell">{offre.localisation || "—"}</div>
                  <div className="cell">{offre.contrat || "—"}</div>
                  <div className="cell">{offre.salaire || "—"}</div>
                  <div className="cell">{offre.source || "—"}</div>
                  <div className="cell">
                    <Badge label={formatScore(offre.score)} tone={scoreTone(offre.score)} />
                  </div>
                  <div className="cell">
                    <Badge
                      label={offre.correspond || "—"}
                      tone={correspondTone(offre.correspond)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
