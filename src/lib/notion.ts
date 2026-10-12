import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { addDaysISODate } from "./format";
import type { Competence, Offre } from "./types";

// Le token ne quitte jamais le serveur : ce fichier n'est importé
// que depuis des Server Components / Route Handlers (jamais côté client).
const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!token || !databaseId) {
  console.warn(
    "[notion] NOTION_TOKEN ou NOTION_DATABASE_ID manquant. Copie .env.local.example en .env.local et renseigne tes valeurs."
  );
}

export const notion = new Client({ auth: token });

// --- Extraction générique des propriétés Notion -------------------------
// Ces helpers acceptent n'importe quel type de propriété Notion (title,
// rich_text, select, status, multi_select, number, url, checkbox, formula,
// rollup...) pour que la structure exacte de ta base n'ait pas besoin de
// correspondre parfaitement : on essaie de lire la valeur "sensée" quoi
// qu'il arrive.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotionProperty = any;

function richTextToString(richText: { plain_text: string }[] | undefined): string {
  if (!richText || richText.length === 0) return "";
  return richText.map((t) => t.plain_text).join("");
}

function getTextValue(property: NotionProperty | undefined): string {
  if (!property) return "";
  switch (property.type) {
    case "title":
      return richTextToString(property.title);
    case "rich_text":
      return richTextToString(property.rich_text);
    case "select":
      return property.select?.name ?? "";
    case "status":
      return property.status?.name ?? "";
    case "multi_select":
      return (property.multi_select ?? []).map((o: { name: string }) => o.name).join(", ");
    case "number":
      return property.number === null || property.number === undefined
        ? ""
        : String(property.number);
    case "url":
      return property.url ?? "";
    case "email":
      return property.email ?? "";
    case "phone_number":
      return property.phone_number ?? "";
    case "checkbox":
      return property.checkbox ? "Oui" : "Non";
    case "date":
      return property.date?.start ?? "";
    case "formula":
      return getTextValue(property.formula);
    case "rollup":
      if (property.rollup?.type === "array") {
        return property.rollup.array.map((p: NotionProperty) => getTextValue(p)).join(", ");
      }
      return getTextValue(property.rollup);
    default:
      return "";
  }
}

function getNumberValue(property: NotionProperty | undefined): number | null {
  if (!property) return null;
  switch (property.type) {
    case "number":
      return property.number ?? null;
    case "formula":
      return property.formula?.type === "number" ? property.formula.number : null;
    case "rollup":
      return property.rollup?.type === "number" ? property.rollup.number : null;
    default: {
      const text = getTextValue(property);
      const parsed = Number(text);
      return text !== "" && !Number.isNaN(parsed) ? parsed : null;
    }
  }
}

function getDateValue(property: NotionProperty | undefined): string | null {
  if (!property) return null;
  switch (property.type) {
    case "date":
      return property.date?.start ?? null;
    case "created_time":
      return property.created_time ?? null;
    case "last_edited_time":
      return property.last_edited_time ?? null;
    case "formula":
      return property.formula?.type === "date" ? (property.formula.date?.start ?? null) : null;
    case "rollup":
      return property.rollup?.type === "date" ? (property.rollup.date?.start ?? null) : null;
    default:
      return null;
  }
}

function getUrlValue(property: NotionProperty | undefined): string {
  if (!property) return "";
  if (property.type === "url") return property.url ?? "";
  return getTextValue(property);
}

function getListValue(property: NotionProperty | undefined): string[] {
  if (!property) return [];
  if (property.type === "multi_select") {
    return (property.multi_select ?? []).map((o: { name: string }) => o.name);
  }
  if (property.type === "rollup" && property.rollup?.type === "array") {
    return property.rollup.array.flatMap((p: NotionProperty) => getListValue(p));
  }
  const text = getTextValue(property);
  if (!text) return [];
  // Texte libre -> on éclate sur les virgules / points-virgules / retours à la ligne
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/**
 * Ces colonnes stockent en fait un JSON du type :
 * [{"titre":"Python","note":2,"importance_dans_offre":"haute"}, ...]
 * On parse ce JSON pour extraire proprement chaque compétence. Si le
 * contenu n'est pas du JSON (ex: simple multi-select ou texte libre), on
 * retombe sur une liste de compétences réduite à leur titre.
 */
function getCompetencesValue(property: NotionProperty | undefined): Competence[] {
  const text = getTextValue(property);
  if (!text) return [];

  const parsed = tryParseJson(text);
  if (Array.isArray(parsed)) {
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        titre: asString(item.titre) || asString(item.nom) || asString(item.name),
        note: asNumber(item.note),
        note_actuelle: asNumber(item.note_actuelle),
        importance_dans_offre: asString(item.importance_dans_offre) || asString(item.importance),
        conseil: asString(item.conseil),
      }))
      .filter((c) => c.titre);
  }

  // Pas du JSON : liste simple (multi-select ou texte séparé par virgules/retours à la ligne).
  return getListValue(property).map((titre) => ({
    titre,
    note: null,
    note_actuelle: null,
    importance_dans_offre: "",
    conseil: "",
  }));
}

function isFullPage(
  page: PageObjectResponse | PartialPageObjectResponse
): page is PageObjectResponse {
  return "properties" in page;
}

/**
 * Normalise un nom de propriété Notion pour la comparaison : "Compétences
 * matchées" et "competences_matchees" (ou "Titre", "ID Offre"...) donnent la
 * même clé. Ça évite de dépendre d'une casse ou d'une ponctuation exacte
 * dans les noms de colonnes tels que créés dans Notion.
 */
function normalizeKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Construit un index {nom normalisé -> propriété} pour un lookup tolérant. */
function buildPropertyLookup(
  properties: PageObjectResponse["properties"]
): Record<string, NotionProperty> {
  const lookup: Record<string, NotionProperty> = {};
  for (const [name, prop] of Object.entries(properties)) {
    lookup[normalizeKey(name)] = prop;
  }
  return lookup;
}

/** Transforme une page Notion en objet Offre exploitable par l'UI. */
export function mapPageToOffre(page: PageObjectResponse | PartialPageObjectResponse): Offre {
  const properties = buildPropertyLookup(isFullPage(page) ? page.properties : {});

  // Colonne "date" explicite si elle existe dans Notion (sous n'importe quel
  // nom courant), sinon on retombe sur la date de création de la fiche.
  const explicitDate =
    getDateValue(properties["date"]) ??
    getDateValue(properties["date_offre"]) ??
    getDateValue(properties["date_publication"]) ??
    getDateValue(properties["date_ajout"]);
  const fallbackDate = isFullPage(page) ? page.created_time : null;

  return {
    pageId: page.id,
    date: explicitDate ?? fallbackDate,
    id_offre: getTextValue(properties["id_offre"]),
    titre: getTextValue(properties["titre"]),
    entreprise: getTextValue(properties["entreprise"]),
    localisation: getTextValue(properties["localisation"]),
    contrat: getTextValue(properties["contrat"]),
    salaire: getTextValue(properties["salaire"]),
    source: getTextValue(properties["source"]),
    url: getUrlValue(properties["url"]),
    score: getNumberValue(properties["score"]),
    correspond: getTextValue(properties["correspond"]),
    competences_matchees: getCompetencesValue(properties["competences_matchees"]),
    competences_manquantes: getCompetencesValue(properties["competences_manquantes"]),
    competences_a_ameliorer: getCompetencesValue(properties["competences_a_ameliorer"]),
    raison: getTextValue(properties["raison"]),
    conseils: getTextValue(properties["conseils"]),
  };
}

// --- Filtre par date, appliqué côté API Notion -------------------------
// Pour éviter de rapatrier toute la base à chaque chargement, on filtre
// directement dans la requête `databases.query` plutôt qu'après coup.

type DateFilterTarget = { name: string; type: "date" | "created_time" | "last_edited_time" };

// Mis en cache pour la durée de vie du process (le schéma de la base ne
// change quasiment jamais) afin d'éviter un aller-retour API supplémentaire
// à chaque chargement de page.
let cachedDateProperty: DateFilterTarget | null | undefined;

/** Trouve la propriété Notion à utiliser pour filtrer par date, si elle existe. */
async function resolveDateProperty(): Promise<DateFilterTarget | null> {
  if (cachedDateProperty !== undefined) return cachedDateProperty;
  if (!databaseId) return null;

  const candidates = ["date", "date_offre", "date_publication", "date_ajout"];
  try {
    const db = (await notion.databases.retrieve({ database_id: databaseId })) as NotionProperty;
    let found: DateFilterTarget | null = null;
    for (const [name, config] of Object.entries(db.properties ?? {})) {
      if (!candidates.includes(normalizeKey(name))) continue;
      const type = (config as NotionProperty).type;
      if (type === "date" || type === "created_time" || type === "last_edited_time") {
        found = { name, type };
        break;
      }
    }
    cachedDateProperty = found;
  } catch (error) {
    console.error("[notion] Impossible de lire le schéma de la base", error);
    cachedDateProperty = null;
  }
  return cachedDateProperty;
}

/**
 * Filtre [fromDate, toExclusiveDate) sur la colonne date explicite si elle
 * existe, sinon sur le timestamp de création de la fiche Notion (toujours
 * disponible, même sans colonne date dédiée).
 */
async function buildDateFilter(fromDate: string, toExclusiveDate: string): Promise<NotionProperty> {
  const target = await resolveDateProperty();
  if (!target) {
    return {
      and: [
        { timestamp: "created_time", created_time: { on_or_after: fromDate } },
        { timestamp: "created_time", created_time: { before: toExclusiveDate } },
      ],
    };
  }
  return {
    and: [
      { property: target.name, [target.type]: { on_or_after: fromDate } },
      { property: target.name, [target.type]: { before: toExclusiveDate } },
    ],
  };
}

/**
 * Récupère les offres de la base, triées par date décroissante (plus récent
 * en premier). Si `range` est fourni, seules les offres entre ces deux
 * dates ("YYYY-MM-DD", bornes incluses) sont remontées par l'API Notion —
 * ça évite de tout charger quand on ne veut voir qu'une période précise.
 */
export async function getOffres(range?: { from: string; to: string }): Promise<Offre[]> {
  if (!token || !databaseId) return [];

  const filter = range
    ? await buildDateFilter(range.from, addDaysISODate(range.to, 1))
    : undefined;

  const results: (PageObjectResponse | PartialPageObjectResponse)[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter,
      start_cursor: cursor,
      page_size: 100,
    });
    // `databases.query` ne renvoie jamais que des pages (jamais des databases),
    // mais le SDK type `results` avec une union plus large : on la resserre ici.
    results.push(...(response.results as (PageObjectResponse | PartialPageObjectResponse)[]));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  if (process.env.NODE_ENV !== "production" && results.length > 0 && isFullPage(results[0])) {
    const expected = [
      "id_offre",
      "titre",
      "entreprise",
      "localisation",
      "contrat",
      "salaire",
      "source",
      "url",
      "score",
      "correspond",
      "competences_matchees",
      "competences_manquantes",
      "competences_a_ameliorer",
      "raison",
      "conseils",
    ];
    const found = Object.keys(results[0].properties).map((n) => normalizeKey(n));
    const missing = expected.filter((e) => !found.includes(e));
    if (missing.length > 0) {
      console.warn(
        `[notion] Colonnes non trouvées dans la base : ${missing.join(", ")}.\n` +
          `  Colonnes réellement présentes dans Notion : ${Object.keys(results[0].properties).join(", ")}`
      );
    }
  }

  const offres = results.map(mapPageToOffre);
  // Tri principal par date (plus récent d'abord), puis par score pour les
  // offres du même jour. On compare au jour près (et pas à la seconde près)
  // car deux offres "du même jour" ont presque toujours une heure différente
  // (ex: fallback sur la date de création de la fiche) : sans ça, le score
  // ne servait quasiment jamais de départage.
  offres.sort((a, b) => {
    const da = dayKey(a.date);
    const db = dayKey(b.date);
    if (da !== db) return db.localeCompare(da); // jour le plus récent d'abord
    return (b.score ?? -Infinity) - (a.score ?? -Infinity);
  });
  return offres;
}

/** Clé "YYYY-MM-DD" (jour local) pour comparer deux dates au jour près. */
function dayKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Récupère une offre unique par l'ID de sa page Notion. */
export async function getOffre(pageId: string): Promise<Offre | null> {
  if (!token || !databaseId) return null;
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    return mapPageToOffre(page);
  } catch (error) {
    console.error("[notion] Impossible de récupérer la page", pageId, error);
    return null;
  }
}
