const DEFAULT_WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const DEFAULT_MAX = Number.parseInt(process.env.RATE_LIMIT_MAX || '60', 10);

const normalizeConfigValue = (value, fallback) =>
    Number.isFinite(value) && value > 0 ? value : fallback;

const getClientId = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

const createRateLimiter = ({
    windowMs = DEFAULT_WINDOW_MS,
    max = DEFAULT_MAX,
    message = 'Too many requests, please try again later',
} = {}) => {
    const store = new Map();
    const windowMsNormalized = normalizeConfigValue(windowMs, DEFAULT_WINDOW_MS);
    const maxNormalized = normalizeConfigValue(max, DEFAULT_MAX);

    return (req, res, next) => {
        const key = getClientId(req);
        const now = Date.now();
        const entry = store.get(key);

        if (!entry || entry.resetTime <= now) {
            store.set(key, { count: 1, resetTime: now + windowMsNormalized });
            return next();
        }

        if (entry.count >= maxNormalized) {
            const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
            res.set('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({ message });
        }

        entry.count += 1;
        store.set(key, entry);
        return next();
    };
};

module.exports = { createRateLimiter };
