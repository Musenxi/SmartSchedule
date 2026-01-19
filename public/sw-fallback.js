self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const isApiRequest = url.pathname.match(/^\/api\/(schedules|timetables|auth\/me)/);

    // 1. Navigation requests (Document)
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(event.request);

                // Check for 5xx errors on navigation too (optional, but good for "server down" page)
                if (response.status >= 500) {
                    console.log('[SW] Server error on navigation:', response.status);
                    throw new Error(`Server error: ${response.status}`);
                }

                return response;
            } catch (error) {
                console.log('[SW] Navigation failed, trying cache:', error);
                const cache = await caches.open('pages');

                // Try exact match
                let cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                // Try root fallback
                cachedResponse = await cache.match('/');
                if (cachedResponse) return cachedResponse;

                return new Response('Offline and no cache available', { status: 503 });
            }
        })());
        return;
    }

    // 2. API Requests (Custom 5xx handling)
    if (isApiRequest) {
        event.respondWith((async () => {
            // Determine cache name based on endpoint
            let cacheName = 'api-general';
            if (url.pathname.includes('/api/schedules')) cacheName = 'api-schedules';
            else if (url.pathname.includes('/api/timetables')) cacheName = 'api-timetables';
            else if (url.pathname.includes('/api/auth/me')) cacheName = 'api-auth-me';

            try {
                const response = await fetch(event.request);

                // If server error (5xx), throw to trigger catch block
                if (response.status >= 500) {
                    throw new Error(`Server error: ${response.status}`);
                }

                // Cache successful responses (2xx) - ONLY for GET requests
                if (response.ok && event.request.method === 'GET') {
                    const cache = await caches.open(cacheName);
                    cache.put(event.request, response.clone());
                }

                return response;
            } catch (error) {
                console.log(`[SW] API request failed (${url.pathname}), trying cache:`, error);
                const cache = await caches.open(cacheName);
                const cachedResponse = await cache.match(event.request);

                if (cachedResponse) {
                    return cachedResponse;
                }

                // If no cache, propagate the error (or return a custom JSON error)
                throw error;
            }
        })());
    }
});
