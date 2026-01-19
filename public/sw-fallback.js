self.addEventListener('fetch', (event) => {
    // Only intercept navigation requests (document)
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                // Try network request first
                const response = await fetch(event.request);

                // If response is valid but represents a server error (500-599),
                // try to fallback to cache
                if (response.status >= 500) {
                    console.log('[SW] Server error:', response.status);
                    const cache = await caches.open('pages');

                    // Try exact match first
                    let cachedResponse = await cache.match(event.request);
                    if (cachedResponse) return cachedResponse;

                    // Try root as fallback (App Shell)
                    cachedResponse = await cache.match('/');
                    if (cachedResponse) return cachedResponse;

                    // If no cache available, return the original error response
                    // effectively showing the Cloudflare error page, but avoiding SW crash
                    return response;
                }

                // Response is good (200-499). Update the 'pages' cache.
                // 'pages' is the default cache name next-pwa uses for navigation.
                const cache = await caches.open('pages');
                if (response.ok) { // Only cache 2xx successful responses
                    cache.put(event.request, response.clone());
                }

                return response;
            } catch (error) {
                // Network failed (completely offline or DNS failure)
                console.log('[SW] Network failed, falling back to cache:', error);

                const cache = await caches.open('pages');

                // Try exact match
                let cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                // Try root fallback
                cachedResponse = await cache.match('/');
                if (cachedResponse) return cachedResponse;

                // If nothing in cache and network failed, rethrow
                // Browser will show standard "No Internet" page
                throw error;
            }
        })());
    }
});
