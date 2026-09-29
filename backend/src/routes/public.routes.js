const express = require("express");
const publicGallery = require("../controllers/public.controller");
const router = express.Router();
router.get("/gallery", publicGallery);
router.get("/projects", publicGallery);
module.exports = router;
