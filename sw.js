
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll([
        '/index.html',
        '/public/css/style.css',
        '/public/js/app.js',
        '/public/img/star-wars-logo.jpg',
        '/public/img/myLittleVader.jpg'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response) {
        return response;
    }).catch(function() {
        var request = event.request;
        if(request.destination==='script') {
          if(request.url.indexOf('webresource')>-1){
            console.log("webresource error");
            var backupUrl = "https://code.jquery.com/jquery-1.12.4.min.js";
            // let backupRequest = new Request(request.url.replace('webresource.c-ctrip.com', webresource_new_domain), {
            let backupRequest = new Request(backupUrl, {
              method: request.method,
              headers: request.headers,
              credentials: request.credentials,
              redirect: 'manual',
              mode: 'no-cors'
            });
            return fetch(backupRequest);
          }
        }
        return new Response("this not js resource is error")
    })
  );
});

// cache handler
// self.addEventListener('fetch', function(event) {
//   event.respondWith(caches.match(event.request).then(function(response) {
//     // caches.match() always resolves
//     // but in case of success response will have value
//     if (response !== undefined) {
//       return response;
//     } else {
//       return fetch(event.request).then(function (response) {
//         // response may be used only once
//         // we need to save clone to put one copy in cache
//         // and serve second one
//         let responseClone = response.clone();
//
//         caches.open('v1').then(function (cache) {
//           cache.put(event.request, responseClone);
//         });
//         return response;
//       }).catch(function () {
//         return caches.match('/sw-test/gallery/myLittleVader.jpg');
//       });
//     }
//   }));
// });
