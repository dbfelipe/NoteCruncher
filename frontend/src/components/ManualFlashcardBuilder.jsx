import React, { useState } from "react";

function ManualFlashcardBuilder() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [flashcards, setFlashcards] = useState([]);

  const handleAdd = () => {
    if (question && answer) {
      setFlashcards([...flashcards, { question, answer }]);
      setQuestion("");
      setAnswer("");
    }
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
      <button onClick={handleAdd}>Add Flashcard</button>

      {flashcards.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Your Flashcards:</h3>
          {flashcards.map((card, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <strong>Q:</strong> {card.question}
              <br />
              <strong>A:</strong> {card.answer}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManualFlashcardBuilder;
