import Link from "next/link";
import { notFound } from "next/navigation";
import { getOffre } from "@/lib/notion";
import { correspondTone, formatDate, formatScore, scoreTone } from "@/lib/format";
import { Badge } from "@/components/Badge";
import { CompetenceList } from "@/components/CompetenceList";

export const dynamic = "force-dynamic";

export default async function OffreDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offre = await getOffre(id);

  if (!offre) {
    notFound();
  }

  const tone = scoreTone(offre.score);
  const scoreColor = `var(--${tone === "neutral" ? "text-muted" : tone})`;

  return (
    <main className="page">
      <Link href="/" className="back-link">
        ← Retour aux offres
      </Link>

      <div className="detail-header">
        <div className="detail-header-top">
          <div>
            <h1>{offre.titre || "(Sans titre)"}</h1>
            <p className="entreprise">{offre.entreprise || "Entreprise inconnue"}</p>
          </div>
          {offre.url ? (
            <a href={offre.url} target="_blank" rel="noreferrer" className="apply-btn">
              Voir l&apos;annonce ↗
            </a>
          ) : null}
        </div>

        <div className="detail-meta">
          <span>
            <strong>Date :</strong> {formatDate(offre.date)}
          </span>
          <span>
            <strong>Localisation :</strong> {offre.localisation || "—"}
          </span>
          <span>
            <strong>Contrat :</strong> {offre.contrat || "—"}
          </span>
          <span>
            <strong>Salaire :</strong> {offre.salaire || "—"}
          </span>
          <span>
            <strong>Source :</strong> {offre.source || "—"}
          </span>
          <span>
            <strong>ID offre :</strong> {offre.id_offre || "—"}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h2>Score</h2>
          <div className="score-block">
            <span className="score-value" style={{ color: scoreColor }}>
              {formatScore(offre.score)}
            </span>
            <div className="score-bar-track">
              <div
                className="score-bar-fill"
                style={{
                  width: `${Math.min(100, Number(formatScore(offre.score)) || 0)}%`,
                  background: scoreColor,
                }}
              />
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>Correspond</h2>
          <Badge label={offre.correspond || "—"} tone={correspondTone(offre.correspond)} />
        </div>

        <div className="detail-card full">
          <h2>Compétences correspondantes</h2>
          <CompetenceList items={offre.competences_matchees} tone="good" />
        </div>

        <div className="detail-card full">
          <h2>Compétences manquantes</h2>
          <CompetenceList items={offre.competences_manquantes} tone="bad" />
        </div>

        <div className="detail-card full">
          <h2>Compétences à améliorer</h2>
          <CompetenceList items={offre.competences_a_ameliorer} tone="warn" />
        </div>

        <div className="detail-card full">
          <h2>Raison</h2>
          <p>{offre.raison || "Aucune information"}</p>
        </div>

        <div className="detail-card full">
          <h2>Conseils</h2>
          <p>{offre.conseils || "Aucune information"}</p>
        </div>
      </div>
    </main>
  );
}
