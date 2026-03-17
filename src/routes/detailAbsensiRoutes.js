const express = require("express");
const router = express.Router();
const detailAbsensi = require("../controllers/detailAbsensiControllers.js");

router.post('/absensi-guru', detailAbsensi.absensiByGuru);
router.put('/update-status', detailAbsensi.updateStatusAbsensiManual);
router.delete('/:id', detailAbsensi.deleteDetailAbsensi);

// Rekap Siswa
router.get('/rekap-siswa', detailAbsensi.getRekapAbsensiSiswa);
router.get('/rekap-siswa/tahunan', detailAbsensi.getRekapAbsensiSiswaYearly);

// Rekap Kelas
router.get('/rekap-kelas', detailAbsensi.getRekapAbsensiKelas);
router.get('/rekap-kelas/tahunan', detailAbsensi.GetRekapAbsensiKelasTahunan);
router.get('/rekap-kelas/semester', detailAbsensi.GetRekapAbsensiKelasSemester);

// Rekap Jadwal
router.get('/rekap-jadwal', detailAbsensi.getRekapAbsensiByJadwal);

module.exports = router;