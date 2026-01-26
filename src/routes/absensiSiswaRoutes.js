const express = require("express");
const router = express.Router();
const absensi = require("../controllers/absensiSiswaControllers");

// Tap In & Tap Out
router.post('/tap-in', absensi.tapIn);
router.post('/tap-out', absensi.tapOut);

router.get('/', absensi.getAllAbsensi);
router.get('/laporan/harian', absensi.getLaporanHarian);
router.get('/:id', absensi.getAbsensiById);
router.put('/:id', absensi.updateAbsensi);
router.delete('/:id', absensi.deleteAbsensi);

module.exports = router;