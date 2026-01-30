const express = require("express");
const router = express.Router();
const ortuControllers = require("../controllers/orangtuaControllers");

router.get("/", ortuControllers.getAllOrangTua);
router.get("/:id", ortuControllers.getOrangTuaById)
router.post("/", ortuControllers.createOrangTua)
router.put("/:id", ortuControllers.updateOrangTua)
router.delete("/:id", ortuControllers.deleteOrangTua)

module.exports = router;
