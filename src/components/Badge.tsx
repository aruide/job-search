import type { Tone } from "@/lib/format";

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  if (!label) return <span className="badge neutral">—</span>;
  return <span className={`badge ${tone}`}>{label}</span>;
}
