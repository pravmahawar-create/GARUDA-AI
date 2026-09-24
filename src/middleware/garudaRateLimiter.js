const rateLimitMap = new Map(); // Stores { ip: [{ timestamp: Date.now(), count: 1 }] }
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // Max 60 requests per minute

const garudaRateLimiter = (req, res, next) => {
    const clientIp = req.ip; // Express automatically parses X-Forwarded-For if 'trust proxy' is enabled

    if (!clientIp) {
        console.warn('GARUDA Rate Limiter: Could not determine client IP. Skipping rate limiting.');
        return next();
    }

    const now = Date.now();
    let requests = rateLimitMap.get(clientIp) || [];

    // Remove expired requests from the window
    requests = requests.filter(request => now - request.timestamp < WINDOW_SIZE_MS);

    if (requests.length >= MAX_REQUESTS) {
        // Check if the last request in the window is still within the window
        const oldestRequestTime = requests.length > 0 ? requests[0].timestamp : now;
        const timeLeft = WINDOW_SIZE_MS - (now - oldestRequestTime);

        res.status(429).json({
            status: 'error',
            message: `Too many requests from this IP. Please try again after ${Math.ceil(timeLeft / 1000)} seconds.`, 
            code: 'GARUDA_RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(timeLeft / 1000)
        });
        return;
    }

    // Add the current request to the window
    requests.push({ timestamp: now });
    rateLimitMap.set(clientIp, requests);

    next();
};

module.exports = garudaRateLimiter;
