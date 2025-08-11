// Converts a value to a finite Number or returns null if it's not valid.
// Useful for safely parsing numeric IDs from req.params or req.query.
const toIntOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const getAllSets = async (req, res) => {
  const folderId = req.query.folder_id
    ? toIntOrNull(req.query.folder_id)
    : null;
  const limit = toIntOrNull(req.query.limit) ?? 100;
  const offset = toIntOrNull(req.query.offset) ?? 0;
  try {
    if (folderId !== null) {
      result = await db.query(
        `SELECT * FROM sets
               WHERE folder_id = $1
               ORDER BY created_at DESC
               LIMIT $2 OFFSET $3`,
        [folderId, limit, offset]
      );
    } else {
      result = await db.query(
        `SELECT * FROM sets
               ORDER BY created_at DESC
               LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching sets:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createSet = async (req, res) => {
  const { name, folder_id } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Set name is required" });
  }
  const folderId = folder_id === undefined ? null : toIntOrNull(folder_id);

  try {
    const db = req.app.locals.db;
    const result = await db.query(
      `INSERT INTO sets (name, folder_id)
         VALUES ($1, $2)
         RETURNING *`,
      [name.trim(), folderId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // unique violation on sets.name
      return res.status(409).json({ error: "Set already exists" });
    }
    console.error("Error creating set:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateSet = async (req, res) => {
  const id = toIntOrNull(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid set id" });

  const { name, folder_id } = req.body;

  // If provided, validate
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Set name cannot be empty" });
  }
  const folderId = folder_id === undefined ? undefined : toIntOrNull(folder_id);

  try {
    const db = req.app.locals.db;
    const result = await db.query(
      `UPDATE sets
            SET name = COALESCE($1, name),
                folder_id = CASE
                              WHEN $2::int IS NULL AND $3::boolean = true THEN NULL
                              WHEN $2::int IS NOT NULL THEN $2::int
                              ELSE folder_id
                            END
          WHERE id = $4
          RETURNING *`,
      [
        name ? name.trim() : null,
        folderId ?? null,
        folder_id === null, // allow explicit nulling of folder_id
        id,
      ]
    );

    if (!result.rows[0])
      return res.status(404).json({ error: "Set not found" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Set name already exists" });
    }
    console.error("Error updating set:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
// ON DELETE CASCADE (flashcards.set_id) will remove its flashcards automatically
const deleteSet = async (req, res) => {
  const id = toIntOrNull(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid set id" });

  try {
    const db = req.app.locals.db;
    const result = await db.query(
      `DELETE FROM sets WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Set not found" });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error deleting set:", err);
    res.status(500).json({ error: "Failed to delete set" });
  }
};

module.exports = {
  getAllSets,
  createSet,
  getFlashcardsInSet,
  updateSet,
  deleteSet,
};
