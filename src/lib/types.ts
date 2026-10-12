// Une compétence telle que stockée en JSON dans les colonnes Notion
// competences_matchees / competences_manquantes / competences_a_ameliorer,
// ex: {"titre":"Python","note":2,"importance_dans_offre":"haute"}
export interface Competence {
  titre: string;
  note: number | null;
  note_actuelle: number | null;
  importance_dans_offre: string;
  conseil: string;
}

// Représente une ligne (offre d'emploi) de la base de données Notion,
// avec les colonnes exactement telles que demandées.
export interface Offre {
  /** ID de la page Notion (utilisé pour la route de détail /offres/[id]) */
  pageId: string;
  /** Date ISO (colonne "date" dans Notion, sinon date de création de la fiche) */
  date: string | null;
  id_offre: string;
  titre: string;
  entreprise: string;
  localisation: string;
  contrat: string;
  salaire: string;
  source: string;
  url: string;
  score: number | null;
  correspond: string;
  competences_matchees: Competence[];
  competences_manquantes: Competence[];
  competences_a_ameliorer: Competence[];
  raison: string;
  conseils: string;
}
