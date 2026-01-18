const express = require("express");
const router = express.Router();
const mapelControllers = require("../controllers/mapelControllers");


router.get("/", mapelControllers.getAllMapel);
router.get("/:id", mapelControllers.getMapelById);
router.post("/", mapelControllers.createMapel);
router.put("/:id", mapelControllers.updateMapel);
router.delete("/:id", mapelControllers.deleteMapel);

module.exports = router;