const express = require("express");
const router = express.Router();
const jadwalControllers = require("../controllers/jadwalControllers");

router.get("/", jadwalControllers.getAllJadwal);
router.post("/", jadwalControllers.createJadwal);
router.put("/:id", jadwalControllers.updateJadwal);
router.delete("/:id", jadwalControllers.deleteJadwal);

module.exports = router;