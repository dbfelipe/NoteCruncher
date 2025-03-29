const express = require("express");
const router = express.Router();
const videoController = require("../controllers/video.controller");

//Get all summaries
router.get("/", videoController.getAllSummaries);

//Get a single summary by ID
router.get("/:id", videoController.getSummaryById);

//Process a new video URL
router.post("/", videoController.processVideo);

module.exports = router;
