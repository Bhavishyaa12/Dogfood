const express = require("express");
const { auth, roleAuth } = require("../middleware/auth.middleware");
const c = require("../controllers/judging.controller");
const router = express.Router();

router.post(
  "/invitations",
  auth,
  roleAuth("organizer", "admin"),
  c.inviteJudge,
);
router.post(
  "/invitations/:token/accept",
  auth,
  roleAuth("participant", "judge"),
  c.acceptJudge,
);
router.post(
  "/assignments",
  auth,
  roleAuth("organizer", "admin"),
  c.assignJudge,
);
router.get("/assignments", auth, roleAuth("judge"), c.myAssignments);
router.get("/scores", auth, roleAuth("judge"), c.getScores);
router.post("/scores", auth, roleAuth("judge"), c.submitScore);
router.get(
  "/dashboard/:eventId",
  auth,
  roleAuth("organizer", "admin"),
  c.organizerDashboard,
);

// Note: CSV export is mounted at /api/export.csv (see routes/index.js) to
// match .dogfood.toml's csv_export route, not under /api/judge.

module.exports = router;
