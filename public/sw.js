const CACHE = 'lkpd-dynamo-v1'
const ASSETS = ['./', './manifest.json', './icons/app-icon.svg']

self.addEventListener('install', (event: any) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event: any) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
})

self.addEventListener('fetch', (event: any) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((r) => r || caches.match('./'))))
})
