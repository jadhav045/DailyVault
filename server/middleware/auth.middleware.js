import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. Token missing." });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Attach decoded data { id, email }

    next(); // Continue to the protected route
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
        expired: true,
      });
    }

    res.status(401).json({ message: "Invalid token." });
  }
};
