import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suivi des offres d'emploi",
  description: "Tableau de bord des offres d'emploi synchronisées depuis Notion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
