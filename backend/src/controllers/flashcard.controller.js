const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateFlashcards = async (text) => {
  const systemPrompt = `
You are a helpful assistant that generates flashcards for students from lecture notes or transcripts.
Return a JSON array like:
[
  { "question": "What is ...?", "answer": "..." }
]
Try to keep the number of flashcards proportional to the amount of content.
For example:
- ~100 words → 2-4 cards
- ~300 words → 5–10 cards
- ~800+ words → 15–25 cards

Each flashcard should be concise, relevant, and fact-based.
Only return the JSON array.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });

  const rawContent = completion.choices[0].message.content;

  return JSON.parse(rawContent);
};

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

const generateFlashcardsFromText = async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Transcript or notes required." });
  }

  try {
    const flashcards = await generateFlashcards(text);

    const isValid =
      Array.isArray(flashcards) &&
      flashcards.every(
        (card) =>
          typeof card.question === "string" && typeof card.answer === "string"
      );

    if (!isValid) {
      return res
        .status(400)
        .json({ error: "Generated flashcards are not in the correct format." });
    }

    res.status(200).json({ flashcards });
  } catch (err) {
    console.error("Flashcard generation failed:", err);
    res.status(500).json({ error: "Failed to generate flashcards." });
  }
};

module.exports = {
  getAllFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  generateFlashcardsFromText,
};
