const express = require("express");
const { auth, roleAuth } = require("../middleware/auth.middleware");
const c = require("../controllers/project.controller");
const router = express.Router();
router.get(
  "/mine",
  auth,
  roleAuth("participant", "organizer", "admin"),
  c.listMine,
);
router.get(
  "/:id",
  auth,
  roleAuth("participant", "organizer", "admin"),
  c.getMine,
);
router.post("/", auth, roleAuth("participant", "organizer"), c.createProject);
router.patch(
  "/:id",
  auth,
  roleAuth("participant", "organizer"),
  c.updateProject,
);
router.post(
  "/:id/submit",
  auth,
  roleAuth("participant", "organizer"),
  c.submitProject,
);
module.exports = router;
