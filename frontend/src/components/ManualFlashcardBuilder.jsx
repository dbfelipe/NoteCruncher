import React, { useState } from "react";
import "./FlashcardStyles.css";

function ManualFlashcardBuilder() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showAnswer, setShowAnswer] = useState([]);

  const handleAddOrUpdate = () => {
    if (!question || !answer) return;

    if (editIndex !== null) {
      const updated = [...flashcards];
      updated[editIndex] = { question, answer };
      setFlashcards(updated);
      setEditIndex(null);
    } else {
      setFlashcards([...flashcards, { question, answer }]);
      setShowAnswer([...showAnswer, false]);
    }

    setQuestion("");
    setAnswer("");
  };

  const handleDelete = (index) => {
    const updated = flashcards.filter((_, i) => i !== index);
    const updatedFlips = showAnswer.filter((_, i) => i !== index);
    setFlashcards(updated);
    setShowAnswer(updatedFlips);
  };

  const handleEdit = (index) => {
    setQuestion(flashcards[index].question);
    setAnswer(flashcards[index].answer);
    setEditIndex(index);
  };

  const toggleFlip = (index) => {
    const flipped = [...showAnswer];
    flipped[index] = !flipped[index];
    setShowAnswer(flipped);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h2>Create Flashcards Manually</h2>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter question"
        style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
      />
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter answer"
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
      />
      <button onClick={handleAddOrUpdate}>
        {editIndex !== null ? "Update" : "Add"} Flashcard
      </button>

      {flashcards.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Your Flashcards:</h3>
          {flashcards.map((card, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                className={`card ${showAnswer[index] ? "flipped" : ""}`}
                onClick={() => toggleFlip(index)}
              >
                <div className="card-inner">
                  <div className="card-front">
                    <strong>Q:</strong> {card.question}
                  </div>
                  <div className="card-back">
                    <strong>A:</strong> {card.answer}
                  </div>
                </div>
              </div>
              <div className="card-buttons">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(index);
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManualFlashcardBuilder;
