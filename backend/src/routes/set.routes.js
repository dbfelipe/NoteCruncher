const express = require("express");
const router = express.Router();
const setController = require("../controllers/set.controller");

router.get("/", setController.getAllSets);

router.post("/", setController.createSet);

router.get("/:id/flashcards", setController.getFlashcardsInSet);

router.get("/unassigned", setController.getUnassignedSets);

//for renaming of set
router.put("/:id", setController.updateSet);

router.put("/:setId/folder", setController.assignFolderToSet);

router.put(
  "/unassign-by-folder/:folderId",
  setController.unassignSetsFromFolder
);

router.delete("/:id", setController.deleteSet);

module.exports = router;
