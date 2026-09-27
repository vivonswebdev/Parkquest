/*
 * ParkQuest — service worker minimal (MVP).
 * - Précache : page hors ligne, icônes, illustrations de démo.
 * - Navigations : réseau d'abord, repli sur le cache puis sur /offline.
 * - Ressources statiques : cache d'abord (stale-while-revalidate).
 * - Les requêtes non-GET (Server Actions : découvertes, quiz, défis) ne sont
 *   JAMAIS mises en cache ni rejouées : hors ligne, l'UI affiche une erreur explicite.
 * Préparé pour « Télécharger ce parc » : cache nommé par parc (pq-park-<slug>).
 */
const VERSION = "pq-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE_URLS = ["/fr/offline", "/nl/offline", "/en/offline", "/es/offline", "/de/offline"];
const PRECACHE = [...OFFLINE_URLS, "/icons/icon-192.png", "/icons/icon-512.png", "/brand/mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION) && !k.startsWith("pq-park-")).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function localeOf(url) {
  const m = new URL(url).pathname.match(/^\/(fr|nl|en|es|de)(\/|$)/);
  return m ? m[1] : "fr";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // actions serveur : jamais interceptées
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(`/${localeOf(req.url)}/offline`)) || Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/demo/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
