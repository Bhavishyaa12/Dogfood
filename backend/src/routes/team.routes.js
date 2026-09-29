const express = require("express");
const { auth, roleAuth } = require("../middleware/auth.middleware");
const c = require("../controllers/team.controller");
const router = express.Router();
router.get(
  "/",
  auth,
  roleAuth("participant", "organizer", "admin", "judge"),
  c.myTeams,
);
router.get("/invite/:token", c.inviteInfo);
router.post("/", auth, roleAuth("participant", "organizer"), c.createTeam);
router.post(
  "/invite/:token/join",
  auth,
  roleAuth("participant", "organizer"),
  c.joinTeam,
);
module.exports = router;
