import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <Link href="/" className="back-link">
        ← Retour aux offres
      </Link>
      <div className="table-card">
        <div className="empty-state">Cette offre est introuvable (elle a peut-être été supprimée de Notion).</div>
      </div>
    </main>
  );
}
