const express = require("express");
const router = express.Router();
const tahunControllers = require("../controllers/tahunControllers");


router.get("/", tahunControllers.getAllTahunAjaran);
router.get("/:id", tahunControllers.getTahunAjaranById);
router.post("/", tahunControllers.createTahunAjaran);
router.put("/:id", tahunControllers.updateTahunAjaran);
router.delete("/:id", tahunControllers.deleteTahunAjaran);

module.exports = router;