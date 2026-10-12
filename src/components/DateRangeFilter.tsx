import Link from "next/link";

export function DateRangeFilter({
  from,
  to,
  today,
  showingAll,
}: {
  from: string;
  to: string;
  today: string;
  showingAll: boolean;
}) {
  return (
    <form className="date-filter" method="get">
      <label className="date-filter-field">
        Du
        <input type="date" name="from" defaultValue={from} />
      </label>
      <label className="date-filter-field">
        Au
        <input type="date" name="to" defaultValue={to} />
      </label>
      <button type="submit" className="date-filter-submit">
        Filtrer
      </button>
      <Link href={`/?from=${today}&to=${today}`} className="date-filter-link">
        Aujourd&apos;hui
      </Link>
      <Link
        href="/?all=1"
        className={`date-filter-link${showingAll ? " active" : ""}`}
      >
        Toutes les offres
      </Link>
    </form>
  );
}
