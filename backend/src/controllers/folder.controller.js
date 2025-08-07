const getAllFolders = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      "SELECT * FROM folders ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching folders", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createFolder = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Folder name is required" });
  }
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      "INSERT INTO folders (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      // Unique violation
      return res.status(409).json({ error: "Folder already exists" });
    }
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFlashcardsInFolder = async (req, res) => {
  const { id } = req.params;

  try {
    const db = req.app.locals.db;

    const result = await db.query(
      "SELECT * FROM flashcards WHERE folder_id = $1 ORDER BY created_at DESC",
      [id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching flashcards in folder:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;
    const result = await db.query(
      "DELETE FROM folders WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error deleting folder", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
};
module.exports = {
  getAllFolders,
  createFolder,
  getFlashcardsInFolder,
};
