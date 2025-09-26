module.exports = function ensureDbUser(db) {
  return async function (req, res, next) {
    try {
      // req.user is set by your requireAuth (Cognito access token)
      const { sub, username, email: tokenEmail } = req.user || {};
      if (!sub) return res.status(401).json({ error: "Missing sub" });

      const email =
        tokenEmail ||
        (username ? `${username}@example.com` : "unknown@example.com");

      const { rows } = await db.query(
        `
          INSERT INTO users (sub, email)
          VALUES ($1, $2)
          ON CONFLICT (sub) DO UPDATE SET email = EXCLUDED.email
          RETURNING id
          `,
        [sub, email]
      );

      req.userId = rows[0].id; // <- use this in controllers
      next();
    } catch (e) {
      console.error("ensureDbUser failed:", e);
      res.status(500).json({ error: "User bootstrap failed" });
    }
  };
};
