export type Tone = "good" | "warn" | "bad" | "neutral";

/** Déduit une couleur (bonne / à surveiller / mauvaise) à partir d'un score. */
export function scoreTone(score: number | null): Tone {
  if (score === null) return "neutral";
  const normalized = score > 1 ? score : score * 100;
  if (normalized >= 75) return "good";
  if (normalized >= 50) return "warn";
  return "bad";
}

/** Déduit une couleur à partir du champ "correspond" (texte libre type Oui/Non/Partiel...). */
export function correspondTone(value: string): Tone {
  const v = value.trim().toLowerCase();
  if (!v) return "neutral";
  if (["oui", "yes", "true", "match", "bon match"].some((k) => v.includes(k))) return "good";
  if (["non", "no", "false"].some((k) => v.includes(k))) return "bad";
  if (["partiel", "moyen", "peut-être", "peut etre"].some((k) => v.includes(k))) return "warn";
  return "neutral";
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Date du jour au format "YYYY-MM-DD" (fuseau local du serveur). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

/** Ajoute `days` jours (peut être négatif) à une date "YYYY-MM-DD". */
export function addDaysISODate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Remet "from"/"to" dans l'ordre si l'utilisateur les a inversés. */
export function normalizeDateRange(from: string, to: string): [string, string] {
  return from <= to ? [from, to] : [to, from];
}

export function formatScore(score: number | null): string {
  if (score === null) return "—";
  const normalized = score > 1 ? score : Math.round(score * 100);
  return `${Math.round(normalized)}`;
}
