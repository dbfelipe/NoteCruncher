const getAllFlashcards = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      "SELECT * FROM flashcards ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching flashcards", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createFlashcard = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const db = req.app.locals.db;
    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "Question and answer are required" });
    }
    const result = await db.query(
      "INSERT INTO flashcards (question, answer) VALUES ($1, $2) RETURNING *",
      [question, answer]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating flashcards", error);
    res.status(500).json({ error: "Failed to create flashcard" });
  }
};

const updateFlashcard = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    const db = req.app.locals.db;
    const result = await db.query(
      "UPDATE flashcards SET question = $1, answer = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [question, answer, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating flashcard", error);
    res.status(500).json({ error: "Failed to update flashcard" });
  }
};

const deleteFlashcard = async (req, res) => {
  console.log("DELETE /api/flashcards/:id hit with", req.params.id); // 👈 add this
  try {
    const { id } = req.params;
    const db = req.app.locals.db;
    const result = await db.query(
      "DELETE FROM flashcards WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Flashcard not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting flashcard", error);
    res.status(500).json({ error: "Failed to delete flashcard" });
  }
};

module.exports = {
  getAllFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
};
