const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
const verifyToken = require("../middleware/verifyToken");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.me);

module.exports = router;