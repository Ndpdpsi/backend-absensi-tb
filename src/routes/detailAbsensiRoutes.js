const express = require("express");
const router = express.Router();
const detailAbsensi = require("../controllers/detailAbsensiControllers.js");

router.post('/absensi-guru', detailAbsensi.absensiByGuru);
router.put('/update-status', detailAbsensi.updateStatusAbsensiManual);
router.get('/jadwal/:jadwal_id', detailAbsensi.getDaftarAbsensiByJadwal);
router.get('/rekap-siswa', detailAbsensi.getRekapAbsensiSiswa);
router.get('/rekap-siswa-yearly', detailAbsensi.getRekapAbsensiSiswaYearly);
router.get('/rekap-siswa-jadwal', detailAbsensi.getAbsensiByJadwal);
router.get('/laporan-harian', detailAbsensi.getLaporanHarianPerKelas);
router.delete('/:id', detailAbsensi.deleteDetailAbsensi);


module.exports = router;