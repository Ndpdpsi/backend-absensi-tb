const express = require("express");
const router = express.Router();
const siswaControllers = require("../controllers/siswaControllers");

router.get("/siswa", siswaControllers.getAllSiswa);

module.exports = router;
