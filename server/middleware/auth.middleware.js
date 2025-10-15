import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // ✅ Check if Authorization header exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // ✅ Extract token
        const token = authHeader.split(" ")[1];

        // ✅ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Attach user info to request for later use
        req.user = decoded; // { id, email }

        next(); // move to the next middleware or route handler
    } catch (error) {
        console.error("❌ Token verification failed:", error);
        res.status(401).json({ message: "Invalid or expired token." });
    }
};
