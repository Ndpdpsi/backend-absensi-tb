const express = require("express");
const router = express.Router();
const jadwalControllers = require("../controllers/jadwalControllers");

router.get("/", jadwalControllers.getAllJadwal);
router.post("/", jadwalControllers.createJadwal);
// router.put("/:id", guruControllers.updateGuru);
// router.delete("/:id", guruControllers.deleteGuru);

module.exports = router;