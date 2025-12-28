// Service Worker for Enhanced Visitor Tracking System
const CACHE_NAME = 'gahan-tracker-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip Google Sheets API calls
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'sync-failed-events') {
    event.waitUntil(syncFailedEvents());
  }
});

async function syncFailedEvents() {
  const failedEvents = await getFailedEvents();
  
  for (const event of failedEvents) {
    try {
      await fetch('https://script.google.com/macros/s/AKfycbyLSzGLCQ_SDzBDYGLcEWBk7kMs1DEUznin7wsuMo9wrggAdynA02us-I0YGKKbI921/exec', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(event)
      });
      
      // Remove from failed events
      await removeFailedEvent(event);
    } catch (error) {
      console.error('Failed to sync event:', error);
    }
  }
}

// IndexedDB for storing failed events
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FailedEventsDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      const store = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      store.createIndex('timestamp', 'timestamp');
    };
  });
}

async function getFailedEvents() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function addFailedEvent(event) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    const request = store.add({
      ...event,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFailedEvent(event) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    const request = store.delete(event.id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}