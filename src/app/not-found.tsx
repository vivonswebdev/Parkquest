"use client";

import NextError from "next/error";

// Requêtes hors locale (ex. /inconnu) : page 404 minimale.
export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body>
        <NextError statusCode={404} />
      </body>
    </html>
  );
}
