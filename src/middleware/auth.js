const jwt = require("jsonwebtoken");
const db = require("../models");

const getSecret = () => process.env.JWT_SECRET;

async function requireAuth(req, res, next) {
    const secret = getSecret();
    if (!secret) {
        return res
            .status(500)
            .json({ success: false, message: "Server misconfigured: JWT_SECRET is missing" });
    }

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "No Authorization header provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, secret);
        const userId = (decoded && (decoded.userId || decoded.id)) || undefined;
        
        req.userId = userId;
        req.user = decoded; // default fallback
        
        if (userId) {
            const dbUser = await db.User.findByPk(userId);
            if (dbUser) {
                req.user = {
                    ...decoded,
                    ...dbUser.get({ plain: true }),
                    id: dbUser.id,
                    role: dbUser.role
                };
            }
        }
        
        return next();
    } catch (err) {
        if (err && err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}

function requireRole(...allowedRoles) {
    const normalizedAllowedRoles = allowedRoles.map((r) => String(r || "").toUpperCase());
    return (req, res, next) => {
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        const role = String(req.user.role || "").toUpperCase();
        if (!normalizedAllowedRoles.includes(role)) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: `Requires role: ${normalizedAllowedRoles.join(", ")}`,
                });
        }

        return next();
    };
}

function optionalAuth(req, res, next) {
    const secret = getSecret();
    if (!secret) {
        return next();
    }

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        req.userId = (decoded && (decoded.userId || decoded.id)) || undefined;
    } catch (err) {
        // Silent catch: let request proceed without req.user if verification fails
    }
    return next();
}
module.exports = {
    requireAuth,
    requireRole,
    optionalAuth,
};

