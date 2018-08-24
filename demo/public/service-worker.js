const PRECACHE = 'precache';
const RUNTIME = 'cache';
var dnsconfig = {};

const PRECACHE_URLS = [
  'index.html',
  './', // Alias for index.html
  'dnsconfig.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    fetch('dnsconfig.json').then(function(response){
      response.json().then( data => {
        dnsconfig = data;
        caches.open(PRECACHE)
          .then(cache => cache.addAll(PRECACHE_URLS))
          // 直接 active
          .then(self.skipWaiting())
      });
    })
  )
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', function(event) {
  console.log("response", dnsconfig);
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME).then(cache => {
        return fetch(event.request).then(function(response) {
          // Put a copy of the response in the runtime cache.
          return cache.put(event.request, response.clone()).then(() => {
            return response;
          });
        }).catch(function() {
            // get host another way
            // var requestUrl = new URL(event.request.url);
            var request = event.request;
            var getHostReg=/(http|https):\/\/([^\/]+)/i,
                host = request.url.match(getHostReg)[2];
            if (dnsconfig[host]===undefined) {
              return new Response('<p>Resource Error!</p>', {
                headers: { 'Content-Type': 'text/html' }
              })
            }
            var backupData = dnsconfig[host];
            var backupUrl = request.url.replace(host, backupData["backup"][0]);
            var requestInit = {
              method: "GET",
              headers: {
                "Host": host
              },
              mode: request.mode,
              cache: 'default',
              credentials: request.credentials,
              redirect: 'manual'
            };
            request.headers.forEach(function(v,k){
              if(requestInit.headers[k] === undefined) {
                requestInit.headers[k] = v;
              }
            });
            // const myHeaders = new Headers(request.headers);
            // myHeaders.append('Host', host);
            // myHeaders.append('Content-Type', 'image/jpeg');
            var backupRequest = new Request(backupUrl, requestInit);
            // backupRequest.Host = host;
            // backupRequest.Header.Set("host", host)
            // return fetch(backupRequest);
            return caches.open(RUNTIME).then(cache => {
              return fetch(backupRequest).then(response => {
                // Put a copy of the response in the runtime cache.
                return cache.put(event.request, response.clone()).then(() => {
                  return response;
                });
              });
            });
        });
      });
    });
  )
});
