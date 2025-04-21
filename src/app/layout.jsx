import "./globals.css";

export const metadata = {
  title: "Calendrier des Animations",
  description: "Application de gestion des animations et des animateurs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
