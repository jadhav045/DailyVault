// import parseJwt from "../api/parseJWT"; // adjust path if needed

import parseJwt from "../api/parseJWT";

/**
 * Get current logged-in user's info from token
 * @returns { id: string, email: string } or null if no valid token
 */

export const getCurrentUser = () => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) return null;

        const claims = parseJwt(token) || {};
        // try many possible locations/names for the id
        const rawId =
            claims.id ??
            claims.user_id ??
            claims.sub ??
            claims._id ??
            (claims.user && (claims.user.id ?? claims.user._id)) ??
            null;

        const id = rawId != null ? String(rawId) : null;
        const email = claims.email ?? claims.user?.email ?? null;

        // helpful debug info
        console.log("Parsed JWT claims:", claims, "-> id:", id, "email:", email);

        // return available info (don't require both). Upstream components can handle missing fields.
        if (!id && !email) return null;
        return { id, email };
    } catch (err) {
        console.error("❌ Failed to get current user:", err);
        return null;
    }
};
