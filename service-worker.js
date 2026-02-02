const CACHE_NAME = 'cocina-pop-client-v1';

self.addEventListener('install', event => {
  console.log('Service Worker instalado');
});

self.addEventListener('fetch', event => {
  console.log('Fetch interceptado');
});