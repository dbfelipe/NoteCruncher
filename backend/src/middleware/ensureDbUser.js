// ensureDbUser.js
module.exports = function ensureDbUser(db) {
  if (!db) throw new Error("ensureDbUser requires a db pool");

  return async function (req, res, next) {
    try {
      const u = req.user;
      if (!u || !u.sub) return res.status(401).json({ error: "Unauthorized" });

      const { rows } = await db.query(
        `
        INSERT INTO users (id, sub, email)
        VALUES ($1, $1, COALESCE($2, ''))
        ON CONFLICT (id) DO UPDATE
          SET
            sub   = COALESCE(users.sub, EXCLUDED.sub),
            email = COALESCE(EXCLUDED.email, users.email)
        RETURNING id
        `,
        [u.sub, u.email || null]
      );

      req.userId = rows[0].id;
      next();
    } catch (err) {
      console.error("ensureDbUser failed:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
