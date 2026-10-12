import { getOffres } from "@/lib/notion";
import { OffresTable } from "@/components/OffresTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { normalizeDateRange, todayISODate } from "@/lib/format";

// Toujours relire Notion à la demande (les offres changent régulièrement).
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; all?: string }>;
}) {
  const params = await searchParams;
  const isConfigured = Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);

  const today = todayISODate();
  const showingAll = params.all === "1";
  const [from, to] = normalizeDateRange(params.from || today, params.to || today);

  // Par défaut on ne charge que la période demandée (aujourd'hui par défaut)
  // pour éviter de rapatrier toute la base Notion à chaque visite.
  const offres = isConfigured ? await getOffres(showingAll ? undefined : { from, to }) : [];

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Suivi des offres d&apos;emploi</h1>
          <p>Synchronisé depuis ta base Notion — clique sur une offre pour voir le détail.</p>
        </div>
      </div>

      {!isConfigured ? (
        <div className="table-card">
          <div className="empty-state">
            Configuration manquante. Copie <code>.env.local.example</code> en{" "}
            <code>.env.local</code>, renseigne <code>NOTION_TOKEN</code> et{" "}
            <code>NOTION_DATABASE_ID</code>, puis relance le serveur.
          </div>
        </div>
      ) : (
        <>
          <DateRangeFilter from={from} to={to} today={today} showingAll={showingAll} />
          <OffresTable offres={offres} />
        </>
      )}
    </main>
  );
}
