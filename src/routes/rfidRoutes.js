const express = require("express");
const router = express.Router();
const rfidControllers = require("../controllers/rfidControllers");


router.get("/", rfidControllers.getAllRfid);
router.get("/load-Rfid", rfidControllers.loadAllRfid);
router.get("/:id", rfidControllers.getRfidById);
router.post("/", rfidControllers.createRFID);
router.put("/:id", rfidControllers.updateRFID);
router.patch("/:id", rfidControllers.updateRFID);
router.delete("/:id", rfidControllers.deleteRFID);

module.exports = router;