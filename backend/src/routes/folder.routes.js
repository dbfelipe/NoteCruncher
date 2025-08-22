const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folder.controller");

router.get("/", folderController.getAllFolders);
router.post("/", folderController.createFolder);
router.get("/:id/flashcards", folderController.getFlashcardsInFolder);
router.delete("/:id", folderController.deleteFolder);
router.get("/:id/sets", folderController.getSetsInFolder);

module.exports = router;
