const express = require("express");
const { auth, roleAuth } = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");

const router = express.Router();

router.get("/users", auth, roleAuth("admin"), admin.getUsers);
router.get("/users/:id", auth, roleAuth("admin"), admin.getUser);
router.patch("/users/:id", auth, roleAuth("admin"), admin.patchUsers);
router.delete("/users/:id", auth, roleAuth("admin"), admin.deleteUsers);

module.exports = router;
