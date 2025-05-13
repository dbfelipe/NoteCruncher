const express = require("express");
const router = express.Router();
const videoController = require("../controllers/video.controller");
const upload = require("../middleware/upload.middleware");

//Get all summaries
router.get("/", videoController.getAllSummaries);

//Get a single summary by ID
router.get("/:id", videoController.getSummaryById);

//Process a new video URL
router.post("/", videoController.processVideo);

//Upload file
router.post("/upload", upload.single("file"), videoController.uploadFile);

module.exports = router;
