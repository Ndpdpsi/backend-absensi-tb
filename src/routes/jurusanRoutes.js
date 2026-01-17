const express = require("express");
const router = express.Router();
const jurusanControllers = require("../controllers/jurusanControllers");

router.get("/", jurusanControllers.getAllJurusan);
router.get("/:id", jurusanControllers.getJurusanById);
router.post("/", jurusanControllers.createJurusan);
router.put("/:id", jurusanControllers.updateJurusan);
router.delete("/:id", jurusanControllers.deleteJurusan);

module.exports = router;