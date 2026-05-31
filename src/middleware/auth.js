const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment variables");
}

const secret = process.env.JWT_SECRET;

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "No Authorization header provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        req.userId = (decoded && (decoded.userId || decoded.id)) || undefined;
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

function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "No Authorization header provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        req.userId = (decoded && (decoded.userId || decoded.id)) || undefined;
        
        // Nếu là admin thì cho phép
        if (String(req.user.role || "").toUpperCase() === "ADMIN") {
            return next();
        }
        
        return res
            .status(403)
            .json({ success: false, message: "Requires role: ADMIN" });
    } catch (err) {
        if (err && err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}
module.exports = {
    requireAuth,
    requireRole,
    optionalAuth,
    requireAdmin,
};

