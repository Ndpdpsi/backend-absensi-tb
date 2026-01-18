const express = require("express");
const router = express.Router();
const siswaControllers = require("../controllers/siswaControllers");

router.get("/", siswaControllers.getAllSiswa);
router.get("/:id", siswaControllers.getSiswaById)
router.post("/", siswaControllers.createSiswa)
router.put("/:id", siswaControllers.updateSiswa)
router.delete("/:id", siswaControllers.deleteSiswa)

module.exports = router;
