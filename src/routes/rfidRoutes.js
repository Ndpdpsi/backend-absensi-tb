const express = require("express");
const router = express.Router();
const rfidControllers = require("../controllers/rfidControllers");


router.get("/", rfidControllers.getAllRfid);
router.get("/:id", rfidControllers.getRfidById);
router.post("/", rfidControllers.createRFID);
router.put("/:id", rfidControllers.updateRFID);
router.patch("/:id", rfidControllers.updateRFID);
// router.delete("/:id", mapelControllers.deleteMapel);

module.exports = router;