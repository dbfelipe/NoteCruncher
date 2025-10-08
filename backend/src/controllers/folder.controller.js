const { get } = require("../routes/set.routes");

const getAllFolders = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.userId;
    const result = await db.query(
      "SELECT * FROM folders WHERE owner_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching folders", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createFolder = async (req, res) => {
  const { name } = req.body;
  const userId = req.userId;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Folder name is required" });
  }
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      "INSERT INTO folders (name, owner_id) VALUES ($1, $2) RETURNING *",
      [name.trim(), userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      // Unique violation (e.g., unique per user)
      return res.status(409).json({ error: "Folder already exists" });
    }
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFlashcardsInFolder = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const db = req.app.locals.db;

    // Ensure folder belongs to user
    const { rows: f } = await db.query(
      `SELECT id FROM folders WHERE id = $1 AND owner_id = $2`,
      [id, userId]
    );
    if (f.length === 0)
      return res.status(404).json({ error: "Folder not found" });

    const result = await db.query(
      `
      SELECT fc.*
      FROM flashcards fc
      JOIN sets s ON fc.set_id = s.id
      WHERE s.folder_id = $1
        AND s.owner_id = $2
        AND fc.owner_id = $2
      ORDER BY fc.created_at DESC
      `,
      [id, userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching flashcards in folder:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteFolder = async (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;
  const userId = req.userId;

  try {
    const result = await db.query(
      "DELETE FROM folders WHERE id = $1 AND owner_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
};

const getSetsInFolder = async (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;
  const userId = req.userId;

  try {
    // Ensure folder belongs to user
    const { rows: f } = await db.query(
      `SELECT id FROM folders WHERE id = $1 AND owner_id = $2`,
      [id, userId]
    );
    if (f.length === 0)
      return res.status(404).json({ error: "Folder not found" });

    const result = await db.query(
      "SELECT * FROM sets WHERE folder_id = $1 AND owner_id = $2 ORDER BY created_at DESC",
      [id, userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching sets in folder:", err);
    res.status(500).json({ error: "Failed to fetch sets for folder" });
  }
};

module.exports = {
  getAllFolders,
  createFolder,
  getFlashcardsInFolder,
  deleteFolder,
  getSetsInFolder,
};
