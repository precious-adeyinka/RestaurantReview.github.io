// Static Cache Name    
var staticCacheName = "mws-restaurant-001";
// var mapCacheName = "map-cache-001";
// Array of Cache Names
// var cacheNames = [staticCacheName, mapCacheName];


self.addEventListener ('install', (e) => {
  self.skipWaiting();
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(staticCacheName).then((cache) =>{
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll([
        './',
        './index.html',
        './restaurant.html',
        './css/styles.css',
        './css/responsive.css',
        './manifest.json',
      ]);
    }).catch((e) => {
      console.log("Failed to open cache - ", e);
    })
  );
});

/*

self.addEventListener ('activate', (e) => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil (
    caches.keys().then((cachesNames) => {
      return Promise.all(
       cachesNames.filter((cacheName) => {
          return cacheName.startsWith(staticCacheName) && cacheName !== staticCacheName || cacheName.startsWith(mapCacheName)
          && cacheName !== mapCacheName ;
        }).map((cacheName) => {
          if (cacheName !== staticCacheName && cacheName !== mapCacheName) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch((e) => {
      console.log("Failed to open cache - ", e);
    })
  );
 // self.clients.claim();
});

*/


self.addEventListener ('activate', (e) => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil (
    caches.keys().then((cachesNames) => {
      return Promise.all(
       cachesNames.filter((cacheName) => {
          return cacheName.startsWith(staticCacheName) && cacheName !== staticCacheName })
          .map((cacheName) => {
          if (cacheName !== staticCacheName) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch((e) => {
      console.log("Failed to open cache - ", e);
    })
  );
 // self.clients.claim();
});

self.addEventListener ('fetch', (e) => {
  /*
  if (e.request.url.startsWith('api.tiles.mapbox.com') || e.request.url.includes('/v4/mapbox.streets/')) {
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch (e.request).then((response) => {
          caches.open(mapCacheName).then(function(cache) {
            cache.put(e.request.url, response.clone());
            return response;
          })
        })
      })
    );
  }
  else if (e.request.url.startsWith('unpkg.com/leaflet@1.3.1') || e.request.url.includes('/dist/')) {
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch (e.request).then((response) => {
          caches.open(mapCacheName).then(function(cache) {
            cache.put(e.request.url, response.clone());
            return response;
          })
        })
      })
    );
  }
  else {
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch (e.request).then((response) => {
          caches.open(staticCacheName).then(function(cache) {
            cache.put(e.request.url, response.clone());
            return response;
          })
        })
      })
    );
  }
  */
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch (e.request).then((response) => {
        caches.open(staticCacheName).then(function(cache) {
          cache.put(e.request.url, response.clone());
          return response;
        })
      })
    })
  );

});