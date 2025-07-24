const express = require("express");
const router = express.Router();
const flashcardController = require("../controllers/flashcard.controller");

router.get("/", flashcardController.getAllFlashcards);

router.post("/", flashcardController.createFlashcard);

router.put("/:id", flashcardController.updateFlashcard);

router.delete("/id:", flashcardController.deleteFlashcard);

module.exports = router;
