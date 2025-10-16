// ensureDbUser.js
module.exports = function ensureDbUser(db) {
  return async function (req, res, next) {
    try {
      const u = req.user; // set by requireAuth
      if (!u?.sub) return res.status(401).json({ error: "Unauthorized" });

      const sub = u.sub; // Cognito subject (stable identifier)
      const email = u.email || null; // access tokens may not include email

      // Upsert by SUB, not by ID; let DB generate/keep the UUID id.
      const { rows } = await db.query(
        `
        INSERT INTO users (sub, email)
        VALUES ($1::text, $2::text)
        ON CONFLICT (sub) DO UPDATE
          SET email = COALESCE(EXCLUDED.email, users.email)
        RETURNING id
        `,
        [sub, email]
      );

      req.userId = rows[0].id; // UUID from users.id
      next();
    } catch (err) {
      console.error("ensureDbUser failed:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
