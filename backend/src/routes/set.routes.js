const express = require("express");
const router = express.Router();
const setController = require("../controllers/set.controller");

router.get("/", setController.getAllSets);

router.post("/", setController.createSet);

router.get("/:id/flashcards", setController.getFlashcardsInSet);

//Incase you want to rename a set
router.put("/:id", setController.updateSet);

router.delete("/:id", setController.deleteSet);

module.exports = router;
