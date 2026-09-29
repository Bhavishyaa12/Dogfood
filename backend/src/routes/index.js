const express = require("express");
const router = express.Router();

const { auth, roleAuth } = require("../middleware/auth.middleware");
const { exportCsv } = require("../controllers/judging.controller");

router.use("/auth", require("./authentication.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/events", require("./event.routes"));
router.use("/teams", require("./team.routes"));
router.use("/judge", require("./judging.routes"));

router.use("/", require("./public.routes"));

router.use("/projects", require("./project.routes"));

router.get("/export.csv", auth, roleAuth("organizer", "admin"), exportCsv);

module.exports = router;
