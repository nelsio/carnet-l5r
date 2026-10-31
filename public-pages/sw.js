// Service worker de l'adresse GitHub Pages (annexe O.3) : même origine uniquement, version injectée au déploiement.
const CACHE = "carnet-v__APP_VERSION__";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("carnet-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/** Réseau d'abord : une nouvelle version arrive dès qu'il y a du réseau, et remplace la copie hors ligne. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? cache.match("./");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Autre origine : pas de respondWith, le grimoire du portail garde son propre cache (annexe N).
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") event.respondWith(networkFirst(request));
  else event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
});
