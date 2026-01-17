const express = require("express");
const router = express.Router();
const siswaControllers = require("../controllers/tahunControllers");


router.get("/", siswaControllers.getAllTahunAjaran);
router.get("/:id", siswaControllers.getTahunAjaranById);
router.post("/", siswaControllers.createTahunAjaran);
router.put("/:id", siswaControllers.updateTahunAjaran);
router.delete("/:id", siswaControllers.deleteTahunAjaran);

module.exports = router;