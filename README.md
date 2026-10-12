# Suivi des offres d'emploi (Notion + Next.js/TypeScript)

Site React (Next.js, App Router, TypeScript) qui lit une base de données Notion
et affiche :

- une **page d'accueil** avec les infos essentielles de chaque offre (titre,
  entreprise, localisation, contrat, salaire, source, score, correspond) et
  une recherche ;
- une **page de détail** (clic sur une ligne) avec tous les champs :
  compétences matchées / manquantes / à améliorer, raison, conseils, lien
  vers l'annonce.

Le token Notion reste **côté serveur uniquement** (Server Components), il
n'est jamais exposé au navigateur.

## 1. Créer l'intégration Notion (si pas déjà fait)

1. Va sur https://www.notion.so/my-integrations et crée une intégration
   interne ("New integration").
2. Copie le **token** généré (commence par `secret_` ou `ntn_`).
3. Ouvre ta base de données dans Notion → menu `•••` en haut à droite →
   **Connections** → connecte ton intégration à la base (sinon l'API
   renverra une erreur 404 "object_not_found").
4. Récupère l'**ID de la base** : dans l'URL
   `https://www.notion.so/xxxxxxxx<ID_DE_32_CARACTERES>?v=...`, l'ID est le
   bloc de 32 caractères juste après le nom de l'espace de travail.

## 2. Colonnes attendues dans la base Notion

Les noms de propriétés doivent correspondre exactement (peu importe le type
de propriété Notion utilisé — texte, select, multi-select, number, url...) :

```
id_offre, titre, entreprise, localisation, contrat, salaire, source, url,
score, correspond, competences_matchees, competences_manquantes,
competences_a_ameliorer, raison, conseils
```

Pour les 3 colonnes de compétences, utilise idéalement une propriété
**multi-select**, mais du texte séparé par des virgules fonctionne aussi.

## 3. Installation

```bash
npm install
cp .env.local.example .env.local
```

Édite `.env.local` :

```
NOTION_TOKEN=secret_xxx...
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. Lancer le site

```bash
npm run dev
```

Ouvre http://localhost:3000

## 5. Build production

```bash
npm run build
npm run start
```

## Structure du projet

```
src/
  app/
    page.tsx              # page d'accueil (liste des offres)
    offres/[id]/page.tsx   # page de détail d'une offre
    layout.tsx, globals.css
  components/
    OffresTable.tsx        # tableau cliquable + recherche
    Badge.tsx, TagList.tsx
  lib/
    notion.ts               # client Notion + mapping des propriétés
    types.ts                 # type Offre
    format.ts                # helpers d'affichage (couleurs de score, etc.)
```
