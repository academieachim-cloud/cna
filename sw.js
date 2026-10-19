/* ═══════════════════════════════════════════════════════════════════════
   SERVICE WORKER — CAHIER NUMÉRIQUE ACHIM v4.2
   Stratégies :
   - App shell (HTML/CSS/JS/JSON) : cache-first avec mise à jour en arrière-plan
   - CDN (pdf.js, jsPDF, etc.)    : stale-while-revalidate
   - API externes (QR server)      : network-first avec fallback cache
   - Navigation                    : fallback vers index.html hors ligne
   ═══════════════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'achim-v4.2.0';
const CACHE_APP = `${CACHE_VERSION}-app`;
const CACHE_CDN = `${CACHE_VERSION}-cdn`;
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`;

/* Fichiers de l'app shell à précacher
   ⚠️ Chemins RELATIFS à /cna/ (pas de / au début)
   Traductions dans locales/, icônes dans icons/ */
const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './styles2.css',
  './manifest.json',
  './locales/fr.json',
  './locales/en.json',
  './locales/ht.json',
  './locales/es.json',
  './icons/favicon.ico',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/apple-touch-icon.png',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png'
];

/* CDN à mettre en cache (stale-while-revalidate) */
const CDN_HOSTS = [
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'api.qrserver.com'
];

/* ─────────────────────────────────────────────────────────
   INSTALL — Précache de l'app shell
   ───────────────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Install', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_APP)
      .then(cache => {
        // addAll échoue si UNE ressource manque → on ajoute une par une
        return Promise.all(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] ⚠️ Précache échoué : ${url}`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* ─────────────────────────────────────────────────────────
   ACTIVATE — Nettoyage des anciens caches
   ───────────────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  console.log('[SW] 🚀 Activate', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => ![CACHE_APP, CACHE_CDN, CACHE_RUNTIME].includes(key))
          .map(key => {
            console.log('[SW] 🗑️ Suppression ancien cache :', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Prévient les onglets ouverts qu'une MAJ est dispo
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
          });
        });
      })
  );
});

/* ─────────────────────────────────────────────────────────
   FETCH — Routage des stratégies
   ───────────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne gère que les GET
  if (request.method !== 'GET') return;

  // Ignore les URLs chrome-extension://, devtools://, etc.
  if (!url.protocol.startsWith('http')) return;

  // Ne cache pas les requêtes vers l'API EmailJS (POST)
  if (url.hostname.includes('emailjs.com')) return;

  // 1. Navigation (HTML) → network-first avec fallback index.html
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // 2. CDN → stale-while-revalidate
  if (CDN_HOSTS.some(host => url.hostname.includes(host))) {
    event.respondWith(handleCDN(request));
    return;
  }

  // 3. Ressources de l'app (même origine) → cache-first + update
  if (url.origin === self.location.origin) {
    event.respondWith(handleAppShell(request));
    return;
  }

  // 4. Autres → network-first avec fallback cache
  event.respondWith(handleRuntime(request));
});

/* ─────────────────────────────────────────────────────────
   Stratégie 1 : Navigation (HTML)
   ───────────────────────────────────────────────────────── */
async function handleNavigation(request) {
  try {
    // Network-first pour avoir la dernière version
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_APP);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Hors ligne → fallback cache puis index.html
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match('./index.html');
    if (fallback) return fallback;
    return new Response(
      '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Hors ligne</title></head><body style="font-family:sans-serif;text-align:center;padding:40px"><h1>📡 Hors ligne</h1><p>Le Cahier Numérique ACHIM n\'a pas pu se charger.</p><p>Vérifie ta connexion et réessaie.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/* ─────────────────────────────────────────────────────────
   Stratégie 2 : App Shell (cache-first + update)
   ───────────────────────────────────────────────────────── */
async function handleAppShell(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHE_APP).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  if (cached) {
    // Réponse immédiate depuis le cache, mise à jour en arrière-plan
    networkPromise;
    return cached;
  }
  const network = await networkPromise;
  return network || new Response('Ressource indisponible hors ligne', { status: 503 });
}

/* ─────────────────────────────────────────────────────────
   Stratégie 3 : CDN (stale-while-revalidate)
   ───────────────────────────────────────────────────────── */
async function handleCDN(request) {
  const cache = await caches.open(CACHE_CDN);
  const cached = await cache.match(request);

  const networkPromise = fetch(request, { mode: 'cors' })
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise;
    return cached;
  }
  const network = await networkPromise;
  return network || new Response('CDN indisponible hors ligne', { status: 503 });
}

/* ─────────────────────────────────────────────────────────
   Stratégie 4 : Runtime (network-first)
   ───────────────────────────────────────────────────────── */
async function handleRuntime(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Ressource indisponible hors ligne', { status: 503 });
  }
}

/* ─────────────────────────────────────────────────────────
   MESSAGES — Communication avec l'app
   ───────────────────────────────────────────────────────── */
self.addEventListener('message', (event) => {
  const data = event.data || {};

  // L'app demande à activer immédiatement une mise à jour
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // L'app demande la version actuelle
  if (data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
    return;
  }

  // L'app demande à vider les caches (mode debug)
  if (data.type === 'CLEAR_CACHE') {
    Promise.all([
      caches.delete(CACHE_APP),
      caches.delete(CACHE_CDN),
      caches.delete(CACHE_RUNTIME)
    ]).then(() => {
      event.ports[0]?.postMessage({ ok: true });
    });
    return;
  }

  // L'app demande le statut hors ligne
  if (data.type === 'PING') {
    event.ports[0]?.postMessage({ pong: true, version: CACHE_VERSION });
    return;
  }
});

/* ─────────────────────────────────────────────────────────
   SYNC — Synchronisation en arrière-plan (bonus)
   ───────────────────────────────────────────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'achim-sync-work') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_REQUESTED' });
        });
      })
    );
  }
});

/* ─────────────────────────────────────────────────────────
   PUSH NOTIFICATIONS (bonus — optionnel)
   ───────────────────────────────────────────────────────── */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Cahier Numérique ACHIM';
  const options = {
    body: data.body || 'Nouveau message de l\'école',
    icon: './icons/android-chrome-192x192.png',
    badge: './icons/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || './index.html' },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data?.url || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

console.log(`[SW] ✅ Service Worker chargé (${CACHE_VERSION})`);
