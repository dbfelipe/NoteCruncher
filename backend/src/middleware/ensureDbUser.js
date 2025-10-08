// ensureDbUser.js
module.exports = function ensureDbUser(db) {
  return async function (req, res, next) {
    try {
      const u = req.user;
      if (!u?.sub) return res.status(401).json({ error: "Unauthorized" });

      const id = u.sub; // uuid (string format)
      const sub = u.sub; // same uuid
      const email = u.email || "";

      const { rows } = await db.query(
        `
        INSERT INTO users (id, sub, email)
        VALUES ($1::uuid, $2::uuid, $3::text)
        ON CONFLICT (id) DO UPDATE
          SET
            sub   = COALESCE(users.sub, EXCLUDED.sub),
            email = COALESCE(NULLIF(EXCLUDED.email, ''), users.email)
        RETURNING id
        `,
        [id, sub, email]
      );

      req.userId = rows[0].id;
      next();
    } catch (err) {
      console.error("ensureDbUser failed:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
