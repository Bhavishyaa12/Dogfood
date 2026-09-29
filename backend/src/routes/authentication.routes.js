const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
//Middleware's

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/logout", authController.logoutUser);

module.exports = router;
