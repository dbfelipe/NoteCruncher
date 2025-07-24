import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FlashcardStyles.css";

function ManualFlashcardBuilder() {
  const [flashcards, setFlashcards] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/flashcards"
        );
        setFlashcards(response.data);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      }
    };
    fetchFlashcards();
  }, []);

  const handleAddFlashcard = async () => {
    if (!newQuestion || !newAnswer) return;
    try {
      const response = await axios.post(
        "http://localhost:3001/api/flashcards",
        {
          question: newQuestion,
          answer: newAnswer,
        }
      );
      setFlashcards([...flashcards, response.data]);
      setNewQuestion("");
      setNewAnswer("");
    } catch (error) {
      console.error("Error adding flashcard:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/flashcards/${id}`);
      setFlashcards(flashcards.filter((card) => card.id !== id));
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }
  };

  const handleEdit = async (id, updatedCard) => {
    try {
      const response = await axios.put(
        `http://localhost:3001/api/flashcards/${id}`,
        updatedCard
      );
      setFlashcards(
        flashcards.map((card) => (card.id === id ? response.data : card))
      );
    } catch (error) {
      console.error("Error editing flashcard:", error);
    }
  };

  const toggleCard = (id) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, flipped: !card.flipped } : card
      )
    );
  };

  return (
    <div className="flashcard-container">
      <h2>Create Flashcard</h2>
      <input
        type="text"
        placeholder="Question"
        value={newQuestion}
        onChange={(e) => setNewQuestion(e.target.value)}
      />
      <input
        type="text"
        placeholder="Answer"
        value={newAnswer}
        onChange={(e) => setNewAnswer(e.target.value)}
      />
      <button onClick={handleAddFlashcard}>Add Flashcard</button>

      <div className="flashcard-list">
        {flashcards.map((card) => (
          <div key={card.id} className="flashcard-wrapper">
            <div
              className={`flashcard ${card.flipped ? "flipped" : ""}`}
              onClick={() => toggleCard(card.id)}
            >
              <div className="front">{card.question}</div>
              <div className="back">{card.answer}</div>
            </div>
            <button onClick={() => handleDelete(card.id)}>Delete</button>
            <button
              onClick={() =>
                handleEdit(card.id, {
                  question: prompt("New question:", card.question),
                  answer: prompt("New answer:", card.answer),
                })
              }
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManualFlashcardBuilder;
