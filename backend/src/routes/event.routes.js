const express = require("express");
const { auth, roleAuth } = require("../middleware/auth.middleware");
const c = require("../controllers/event.controller");
const router = express.Router();
router.get("/", c.listEvents);
router.get("/:id", c.getEvent);
router.post("/", auth, roleAuth("organizer", "admin"), c.createEvent);
router.patch("/:id", auth, roleAuth("organizer", "admin"), c.updateEvent);
module.exports = router;
