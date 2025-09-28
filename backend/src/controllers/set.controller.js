// Converts a value to a finite Number or returns null if it's not valid.
// Useful for safely parsing numeric IDs from req.params or req.query.
const toIntOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

const getAllSets = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId; // set by auth middleware
  const folderId = req.query.folder_id
    ? toIntOrNull(req.query.folder_id)
    : null;
  const limit = toIntOrNull(req.query.limit) ?? 100;
  const offset = toIntOrNull(req.query.offset) ?? 0;

  try {
    let result;
    if (folderId !== null) {
      result = await db.query(
        `
        SELECT * FROM sets
        WHERE owner_id = $1 AND folder_id = $2
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        `,
        [userId, folderId, limit, offset]
      );
    } else {
      result = await db.query(
        `
        SELECT * FROM sets
        WHERE owner_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, limit, offset]
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
  const db = req.app.locals.db;
  const userId = req.userId;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Set name is required" });
  }
  const folderId = folder_id === undefined ? null : toIntOrNull(folder_id);

  try {
    // If attaching to a folder, ensure that folder belongs to the user.
    if (folderId !== null) {
      const { rows: f } = await db.query(
        `SELECT id FROM folders WHERE id = $1 AND owner_id = $2`,
        [folderId, userId]
      );
      if (f.length === 0) {
        return res.status(404).json({ error: "Folder not found" });
      }
    }

    const result = await db.query(
      `
      INSERT INTO sets (name, folder_id, owner_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name.trim(), folderId, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // unique violation (e.g., unique name per user/folder if constraint exists)
      return res.status(409).json({ error: "Set already exists" });
    }
    console.error("Error creating set:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateSet = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  const id = toIntOrNull(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid set id" });

  const { name, folder_id } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Set name cannot be empty" });
  }

  // folder_id can be number, null, or undefined (no change)
  const folderId = folder_id === undefined ? undefined : toIntOrNull(folder_id);

  try {
    // Ensure the set belongs to this user
    const { rows: s } = await db.query(
      `SELECT id, folder_id FROM sets WHERE id = $1 AND owner_id = $2`,
      [id, userId]
    );
    if (s.length === 0) return res.status(404).json({ error: "Set not found" });

    // If changing folder_id (including null), validate the target folder belongs to user
    if (folder_id !== undefined && folder_id !== null) {
      const { rows: f } = await db.query(
        `SELECT id FROM folders WHERE id = $1 AND owner_id = $2`,
        [folderId, userId]
      );
      if (f.length === 0) {
        return res.status(404).json({ error: "Folder not found" });
      }
    }

    const result = await db.query(
      `
      UPDATE sets
      SET name = COALESCE($1, name),
          folder_id = CASE
            WHEN $2::int IS NULL AND $3::boolean = true THEN NULL
            WHEN $2::int IS NOT NULL THEN $2::int
            ELSE folder_id
          END
      WHERE id = $4 AND owner_id = $5
      RETURNING *
      `,
      [
        name ? name.trim() : null,
        folderId ?? null,
        folder_id === null, // explicit nulling
        id,
        userId,
      ]
    );

    if (result.rows.length === 0)
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

const getFlashcardsInSet = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  const setId = toIntOrNull(req.params.id);
  if (setId === null) {
    return res.status(400).json({ error: "Invalid set id" });
  }
  try {
    // Verify the set belongs to the user, then fetch flashcards
    const { rows: owned } = await db.query(
      `SELECT id FROM sets WHERE id = $1 AND owner_id = $2`,
      [setId, userId]
    );
    if (owned.length === 0)
      return res.status(404).json({ error: "Set not found" });

    const result = await db.query(
      `
      SELECT * FROM flashcards
      WHERE set_id = $1 AND owner_id = $2
      ORDER BY created_at DESC
      `,
      [setId, userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching flashcards in set:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
// ON DELETE CASCADE (fl ashcards.set_id) will remove its flashcards automatically
const deleteSet = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  const id = toIntOrNull(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid set id" });

  try {
    const result = await db.query(
      `DELETE FROM sets WHERE id = $1 AND owner_id = $2 RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Set not found" });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error deleting set:", err);
    res.status(500).json({ error: "Failed to delete set" });
  }
};

// Only allows assigning a folder that belongs to the user, to a set that belongs to the user.
const assignFolderToSet = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  const setId = toIntOrNull(req.params.setId);
  const folderId = toIntOrNull(req.body.folder_id);

  if (setId === null || folderId === null) {
    return res.status(400).json({ error: "Invalid ids" });
  }

  try {
    const { rows: s } = await db.query(
      `SELECT id FROM sets WHERE id = $1 AND owner_id = $2`,
      [setId, userId]
    );
    if (s.length === 0) return res.status(404).json({ error: "Set not found" });

    const { rows: f } = await db.query(
      `SELECT id FROM folders WHERE id = $1 AND owner_id = $2`,
      [folderId, userId]
    );
    if (f.length === 0)
      return res.status(404).json({ error: "Folder not found" });

    const result = await db.query(
      `UPDATE sets SET folder_id = $1 WHERE id = $2 AND owner_id = $3 RETURNING *`,
      [folderId, setId, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error assigning folder to set:", err);
    res.status(500).json({ error: "Failed to assign folder." });
  }
};

const getUnassignedSets = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  try {
    const result = await db.query(
      `
      SELECT * FROM sets
      WHERE owner_id = $1 AND folder_id IS NULL
      ORDER BY created_at DESC
      `,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching unassigned sets", err);
    res.status(500).json({ error: "Failed to load sets." });
  }
};

// Only unassign sets from a folder if both belong to the user.
const unassignSetsFromFolder = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  const folderId = toIntOrNull(req.params.folderId);
  if (folderId === null) {
    return res.status(400).json({ error: "Invalid folder id" });
  }

  try {
    // Ensure folder belongs to user
    const { rows: f } = await db.query(
      `SELECT id FROM folders WHERE id = $1 AND owner_id = $2`,
      [folderId, userId]
    );
    if (f.length === 0)
      return res.status(404).json({ error: "Folder not found" });

    const result = await db.query(
      `
      UPDATE sets
      SET folder_id = NULL
      WHERE folder_id = $1 AND owner_id = $2
      RETURNING *
      `,
      [folderId, userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error unassigning sets from folder:", err);
    res.status(500).json({ error: "Failed to unassign sets." });
  }
};

module.exports = {
  getAllSets,
  createSet,
  getFlashcardsInSet,
  updateSet,
  deleteSet,
  assignFolderToSet,
  getUnassignedSets,
  unassignSetsFromFolder,
};
