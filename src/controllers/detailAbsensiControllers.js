const prisma = require("../config/prisma");
const { StatusAbsensi } = require("@prisma/client");

// helpers untuk format tanggal dan waktu
const formatDateTime = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
};

const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
    });
};

const formatTime = (time) => {
    if (!time) return null;
    if (typeof time === 'string') {
        return time.substring(0, 5);
    }
    return new Date(time).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
};


const getActiveJadwalGuru = async (guru_id) => {
    const now = new Date();
    const hari = getDayName(now);

    return prisma.jadwal.findFirst({
        where: {
            guru_id: guru_id,
            hari: hari,
            jam_mulai: { lte: now },
            jam_selesai: { gte: now },
            deleted_at: null
        },
        include: {
            kelas: {
                include: {
                    siswa: {
                        where: { deleted_at: null }
                    }
                }
            }
        }
    });
};


// Helper untuk mendapatkan nama hari
const getDayName = (date) => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return days[date.getDay()];
};

// absensi untuk guru
const absensiByGuru = async (req, res) => {
    try {
        const { guru_id } = req.body;

        if (!guru_id) {
            return res.status(400).json({
                success: false,
                message: "guru_id wajib diisi"
            });
        }

        // Ambil jadwal aktif guru saat ini
        const jadwal = await getActiveJadwalGuru(parseInt(guru_id));

        if (!jadwal) {
            return res.status(404).json({
                success: false,
                message: "Tidak ada jadwal aktif untuk guru saat ini"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = [];

        for (const siswa of jadwal.kelas.siswa) {
            const absensi = await prisma.absensiSiswa.findFirst({
                where: {
                    siswa_id: siswa.id,
                    tanggal: today,
                    deleted_at: null
                }
            });

            if (!absensi) {
                results.push({
                    siswa_id: siswa.id,
                    nama: siswa.nama,
                    status: "ALPHA",
                    message: "Belum tap in"
                });
                continue;
            }

            const existingDetail = await prisma.detailAbsensiSiswa.findFirst({
                where: {
                    absensi_id: absensi.id,
                    jadwal_id: jadwal.id,
                    deleted_at: null
                }
            });

            if (existingDetail) {
                results.push({
                    siswa_id: siswa.id,
                    nama: siswa.nama,
                    status: existingDetail.status,
                    message: "Sudah diabsen"
                });
                continue;
            }

            const statusAbsensi = absensi.tap_in ? "HADIR" : "ALPHA";

            await prisma.detailAbsensiSiswa.create({
                data: {
                    absensi_id: absensi.id,
                    jadwal_id: jadwal.id,
                    guru_id: guru_id,
                    status: statusAbsensi,
                    jam_absen: new Date()
                }
            });

            results.push({
                siswa_id: siswa.id,
                nama: siswa.nama,
                status: statusAbsensi,
                tap_in: formatTime(absensi.tap_in),
                status_tapin: absensi.status_tapin
            });
        }

        return res.json({
            success: true,
            message: "Absensi kelas berhasil",
            jadwal: {
                id: jadwal.id,
                kelas: `${jadwal.kelas.kelas}`,
                hari: jadwal.hari,
                jam: `${formatTime(jadwal.jam_mulai)} - ${formatTime(jadwal.jam_selesai)}`
            },
            data: results
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server"
        });
    }
};


// update status absensi 
const updateStatusAbsensiManual = async (req, res) => {
    try {
        const { detail_absensi_id, status, keterangan } = req.body;

        if (!detail_absensi_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'detail_absensi_id dan status diperlukan'
            });
        }

        // Validasi status
        if (!Object.values(StatusAbsensi).includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status tidak valid. Gunakan: HADIR, IZIN, SAKIT, atau ALPHA'
            });
        }

        const detailAbsensi = await prisma.detailAbsensiSiswa.findFirst({
            where: {
                id: parseInt(detail_absensi_id),
                deleted_at: null
            },
            include: {
                absensi: {
                    include: {
                        siswa: {
                            select: {
                                nama: true,
                            }
                        }
                    }
                },
                jadwal: {
                    include: {
                        mata_pelajaran: true,
                        kelas: {
                            include: {
                                jurusan: true
                            }
                        }
                    }
                }
            }
        });

        if (!detailAbsensi) {
            return res.status(404).json({
                success: false,
                message: 'Detail absensi tidak ditemukan'
            });
        }

        const updated = await prisma.detailAbsensiSiswa.update({
            where: { id: parseInt(detail_absensi_id) },
            data: {
                status: status,
                keterangan: keterangan || detailAbsensi.keterangan,
                updated_at: new Date()
            },
            include: {
                absensi: {
                    include: {
                        siswa: {
                            select: {
                                id: true,
                                nama: true,
                            }
                        }
                    }
                },
                jadwal: {
                    include: {
                        mata_pelajaran: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Berhasil mengupdate status absensi',
            data: {
                id: updated.id,
                siswa: updated.absensi.siswa,
                status: updated.status,
                status_lama: detailAbsensi.status,
                keterangan: updated.keterangan,
                jam_absen: formatDateTime(updated.jam_absen),
                jadwal: {
                    mata_pelajaran: updated.jadwal.mata_pelajaran.nama_mapel,
                    hari: updated.jadwal.hari,
                    tanggal: formatDate(updated.absensi.tanggal)
                }
            }
        });

    } catch (error) {
        console.error('Error update status absensi:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
        });
    }
};

// get daftar absensi by jadwal
const getDaftarAbsensiByJadwal = async (req, res) => {
    try {
        const { jadwal_id } = req.params;

        const jadwal = await prisma.jadwal.findFirst({
            where: {
                id: parseInt(jadwal_id),
                deleted_at: null
            },
            include: {
                kelas: {
                    include: {
                        jurusan: true,
                        tahun: true
                    }
                },
                mata_pelajaran: true,
                guru: true,
                detail_absensi: {
                    where: {
                        deleted_at: null
                    },
                    include: {
                        absensi: {
                            include: {
                                siswa: {
                                    select: {
                                        id: true,
                                        nama: true,
                                        gender: true
                                    }
                                }
                            }
                        },
                        guru: {
                            select: {
                                nama: true,
                                NIP: true
                            }
                        }
                    },
                    orderBy: {
                        absensi: {
                            siswa: {
                                nama: 'asc'
                            }
                        }
                    }
                }
            }
        });

        if (!jadwal) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan'
            });
        }

        // Hitung statistik
        const stats = {
            total: jadwal.detail_absensi.length,
            hadir: jadwal.detail_absensi.filter(d => d.status === 'HADIR').length,
            izin: jadwal.detail_absensi.filter(d => d.status === 'IZIN').length,
            sakit: jadwal.detail_absensi.filter(d => d.status === 'SAKIT').length,
            alpha: jadwal.detail_absensi.filter(d => d.status === 'ALPHA').length,
            persentase_hadir: jadwal.detail_absensi.length > 0
                ? ((jadwal.detail_absensi.filter(d => d.status === 'HADIR').length / jadwal.detail_absensi.length) * 100).toFixed(2)
                : 0
        };

        return res.status(200).json({
            success: true,
            message: 'Berhasil mendapatkan daftar absensi',
            data: {
                jadwal: {
                    id: jadwal.id,
                    hari: jadwal.hari,
                    jam_mulai: formatTime(jadwal.jam_mulai),
                    jam_selesai: formatTime(jadwal.jam_selesai),
                    jam_lengkap: `${formatTime(jadwal.jam_mulai)} - ${formatTime(jadwal.jam_selesai)}`,
                    mata_pelajaran: jadwal.mata_pelajaran.nama_mapel,
                    guru: jadwal.guru.nama,
                    kelas: `${jadwal.kelas.kelas} ${jadwal.kelas.jurusan.nama_jurusan}`,
                    tahun_ajaran: jadwal.kelas.tahun.tahun_ajaran
                },
                statistik: stats,
                daftar_absensi: jadwal.detail_absensi.map(detail => ({
                    id: detail.id,
                    siswa: detail.absensi.siswa,
                    status: detail.status,
                    jam_absen: formatDateTime(detail.jam_absen),
                    keterangan: detail.keterangan,
                    tanggal: formatDate(detail.absensi.tanggal),
                    tap_in: formatTime(detail.absensi.tap_in),
                    tap_out: formatTime(detail.absensi.tap_out),
                    status_tapin: detail.absensi.status_tapin,
                    guru_absen: detail.guru.nama
                }))
            }
        });

    } catch (error) {
        console.error('Error get daftar absensi:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
        });
    }
};

// get rekap absensi siswa
const getRekapAbsensiSiswa = async (req, res) => {
    try {
        const { siswa_id, tanggal_mulai, tanggal_akhir, mapel_id } = req.query;

        if (!siswa_id) {
            return res.status(400).json({
                success: false,
                message: 'siswa_id diperlukan'
            });
        }

        // Build filter
        const whereClause = {
            absensi: {
                siswa_id: siswa_id,
                tanggal: {
                    gte: tanggal_mulai ? new Date(tanggal_mulai) : undefined,
                    lte: tanggal_akhir ? new Date(tanggal_akhir) : undefined
                },
                deleted_at: null
            },
            jadwal: mapel_id ? {
                mapel_id: parseInt(mapel_id),
                deleted_at: null
            } : {
                deleted_at: null
            },
            deleted_at: null
        };

        const detailAbsensi = await prisma.detailAbsensiSiswa.findMany({
            where: whereClause,
            include: {
                absensi: {
                    include: {
                        siswa: {
                            select: {
                                id: true,
                                nama: true,
                                kelas: {
                                    include: {
                                        jurusan: true,
                                        tahun: true
                                    }
                                }
                            }
                        }
                    }
                },
                jadwal: {
                    include: {
                        mata_pelajaran: true
                    }
                },
                guru: {
                    select: {
                        nama: true
                    }
                }
            },
            orderBy: {
                absensi: {
                    tanggal: 'desc'
                }
            }
        });

        if (detailAbsensi.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data absensi tidak ditemukan'
            });
        }

        // Hitung statistik
        const stats = {
            total_pertemuan: detailAbsensi.length,
            hadir: detailAbsensi.filter(d => d.status === 'HADIR').length,
            izin: detailAbsensi.filter(d => d.status === 'IZIN').length,
            sakit: detailAbsensi.filter(d => d.status === 'SAKIT').length,
            alpha: detailAbsensi.filter(d => d.status === 'ALPHA').length,
            persentase_kehadiran: ((detailAbsensi.filter(d => d.status === 'HADIR').length / detailAbsensi.length) * 100).toFixed(2)
        };

        // Group by mata pelajaran
        const groupByMapel = detailAbsensi.reduce((acc, detail) => {
            const mapelName = detail.jadwal.mata_pelajaran.nama_mapel;
            if (!acc[mapelName]) {
                acc[mapelName] = {
                    total: 0,
                    hadir: 0,
                    izin: 0,
                    sakit: 0,
                    alpha: 0
                };
            }
            acc[mapelName].total++;
            acc[mapelName][detail.status.toLowerCase()]++;
            return acc;
        }, {});

        return res.status(200).json({
            success: true,
            message: 'Berhasil mendapatkan rekap absensi siswa',
            data: {
                siswa: detailAbsensi[0].absensi.siswa,
                periode: {
                    tanggal_mulai: tanggal_mulai || 'Awal',
                    tanggal_akhir: tanggal_akhir || 'Sekarang'
                },
                statistik_keseluruhan: stats,
                statistik_per_mapel: groupByMapel,
                riwayat_absensi: detailAbsensi.map(detail => ({
                    id: detail.id,
                    tanggal: formatDate(detail.absensi.tanggal),
                    mata_pelajaran: detail.jadwal.mata_pelajaran.nama_mapel,
                    status: detail.status,
                    jam_absen: formatDateTime(detail.jam_absen),
                    keterangan: detail.keterangan,
                    guru: detail.guru.nama,
                    tap_in: formatTime(detail.absensi.tap_in),
                    status_tapin: detail.absensi.status_tapin
                }))
            }
        });

    } catch (error) {
        console.error('Error get rekap absensi siswa:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
        });
    }
};

// get laporan harian per kelas
const getLaporanHarianPerKelas = async (req, res) => {
    try {
        const { kelas_id, tanggal } = req.query;

        if (!kelas_id || !tanggal) {
            return res.status(400).json({
                success: false,
                message: "kelas_id dan tanggal wajib diisi"
            });
        }

        const targetDate = new Date(tanggal);
        targetDate.setHours(0, 0, 0, 0);
        const hari = getDayName(targetDate);

        // ambil kelas
        const kelas = await prisma.kelas.findFirst({
            where: {
                id: parseInt(kelas_id),
                deleted_at: null
            },
            include: {
                jurusan: true,
                tahun: true,
                siswa: {
                    where: { deleted_at: null },
                    select: {
                        id: true,
                        nama: true,
                    }
                }
            }
        });

        if (!kelas) {
            return res.status(404).json({
                success: false,
                message: "Kelas tidak ditemukan"
            });
        }

        // ambil jadwal hari ini
        const jadwalHariIni = await prisma.jadwal.findMany({
            where: {
                kelas_id: kelas.id,
                hari: hari,
                deleted_at: null
            },
            include: {
                mata_pelajaran: true,
                guru: true,
                detail_absensi: {
                    where: {
                        deleted_at: null,
                        absensi: {
                            tanggal: targetDate
                        }
                    },
                    include: {
                        absensi: {
                            include: {
                                siswa: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                jam_mulai: "asc"
            }
        });

        // laporan per siswa
        const laporanPerSiswa = kelas.siswa.map((siswa) => {
            const absensi = [];

            jadwalHariIni.forEach((jadwal) => {
                const detail = jadwal.detail_absensi.find(
                    d => d.absensi.siswa_id === siswa.id
                );

                absensi.push({
                    jadwal_id: jadwal.id,
                    mata_pelajaran: jadwal.mata_pelajaran.nama_mapel,
                    guru: jadwal.guru.nama,
                    jam: `${formatTime(jadwal.jam_mulai)} - ${formatTime(jadwal.jam_selesai)}`,
                    status: detail ? detail.status : "BELUM_ABSEN",
                    keterangan: detail?.keterangan || null,
                    detail_id: detail?.id || null
                });
            });

            const statistik = {
                hadir: absensi.filter(a => a.status === "HADIR").length,
                izin: absensi.filter(a => a.status === "IZIN").length,
                sakit: absensi.filter(a => a.status === "SAKIT").length,
                alpha: absensi.filter(a => a.status === "ALPHA").length,
                belum_absen: absensi.filter(a => a.status === "BELUM_ABSEN").length
            };

            return {
                siswa,
                absensi,
                statistik
            };
        });

        const statistikKelas = {
            total_siswa: kelas.siswa.length,
            total_jadwal: jadwalHariIni.length,
            total_absensi_dilakukan: jadwalHariIni.reduce(
                (sum, j) => sum + j.detail_absensi.length,
                0
            ),
            total_absensi_seharusnya: kelas.siswa.length * jadwalHariIni.length
        };

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan laporan harian per kelas",
            data: {
                kelas: {
                    id: kelas.id,
                    nama: `${kelas.kelas} ${kelas.jurusan.nama_jurusan}`,
                    tahun_ajaran: kelas.tahun.tahun_ajaran
                },
                tanggal: formatDate(targetDate),
                hari,
                jadwal_hari_ini: jadwalHariIni.map(j => ({
                    id: j.id,
                    mata_pelajaran: j.mata_pelajaran.nama_mapel,
                    guru: j.guru.nama,
                    jam: `${formatTime(j.jam_mulai)} - ${formatTime(j.jam_selesai)}`,
                    total_absen: j.detail_absensi.length,
                    sudah_dilakukan: j.detail_absensi.length > 0
                })),
                statistik_kelas: statistikKelas,
                laporan_per_siswa: laporanPerSiswa
            }
        });

    } catch (error) {
        console.error("Error laporan harian:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server"
        });
    }
};


// get rekap absensi siswa tahunan (yearly)
const getRekapAbsensiSiswaYearly = async (req, res) => {
    try {
        const { siswa_id, tahun } = req.query;

        if (!siswa_id || !tahun) {
            return res.status(400).json({
                success: false,
                message: 'siswa_id dan tahun diperlukan'
            });
        }

        const tahunInt = parseInt(tahun);
        const tanggalMulai = new Date(Date.UTC(tahunInt, 0, 1));
        const tanggalAkhir = new Date(Date.UTC(tahunInt, 11, 31));

        // Ambil semua absensi siswa dalam tahun tersebut beserta detailnya
        const absensiList = await prisma.absensiSiswa.findMany({
            where: {
                siswa_id: siswa_id,
                deleted_at: null,
                tanggal: {
                    gte: tanggalMulai,
                    lte: tanggalAkhir
                }
            },
            include: {
                siswa: {
                    select: {
                        id: true,
                        nama: true,
                        kelas: {
                            include: {
                                jurusan: true,
                                tahun: true
                            }
                        }
                    }
                },
                detail: {
                    where: { deleted_at: null },
                    include: {
                        jadwal: {
                            include: { mata_pelajaran: true }
                        },
                        guru: {
                            select: { nama: true }
                        }
                    }
                }
            },
            orderBy: { tanggal: 'asc' }
        });

        if (absensiList.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data absensi tidak ditemukan untuk tahun tersebut'
            });
        }

        // Flatten semua detail untuk statistik
        const semuaDetail = absensiList.flatMap(a => a.detail);

        const getBulan = (tanggal) => new Date(tanggal).getUTCMonth();

        // Statistik keseluruhan
        const total = semuaDetail.length;
        const statsKeseluruhan = total > 0 ? {
            total_pertemuan: total,
            hadir:  semuaDetail.filter(d => d.status === 'HADIR').length,
            izin:   semuaDetail.filter(d => d.status === 'IZIN').length,
            sakit:  semuaDetail.filter(d => d.status === 'SAKIT').length,
            alpha:  semuaDetail.filter(d => d.status === 'ALPHA').length,
            persentase_kehadiran: (
                (semuaDetail.filter(d => d.status === 'HADIR').length / total) * 100
            ).toFixed(2)
        } : {
            total_pertemuan: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0,
            persentase_kehadiran: '0.00'
        };

        // Statistik per bulan
        const NAMA_BULAN = [
            'Januari','Februari','Maret','April','Mei','Juni',
            'Juli','Agustus','September','Oktober','November','Desember'
        ];

        const perBulan = Array.from({ length: 12 }, (_, i) => ({
            bulan: i + 1,
            nama_bulan: NAMA_BULAN[i],
            total_hadir_tap: 0,   // dari tap RFID
            total_pertemuan: 0,   // dari detail absensi guru
            hadir: 0, izin: 0, sakit: 0, alpha: 0,
            persentase_kehadiran: '0.00'
        }));

        // Hitung tap per bulan (dari absensi_siswa)
        absensiList.forEach(a => {
            const idx = getBulan(a.tanggal);
            if (a.tap_in) perBulan[idx].total_hadir_tap++;
        });

        // Hitung detail per bulan (dari detail_absensi_siswa)
        semuaDetail.forEach(d => {
            const idx = getBulan(d.jadwal ? absensiList.find(
                a => a.id === d.absensi_id
            )?.tanggal : null);
            if (idx !== undefined && idx >= 0) {
                perBulan[idx].total_pertemuan++;
                perBulan[idx][d.status.toLowerCase()]++;
            }
        });

        perBulan.forEach(b => {
            b.persentase_kehadiran = b.total_pertemuan > 0
                ? ((b.hadir / b.total_pertemuan) * 100).toFixed(2)
                : '0.00';
        });

        // Statistik per mata pelajaran
        const mapelMap = {};
        semuaDetail.forEach(d => {
            const nama = d.jadwal?.mata_pelajaran?.nama_mapel || 'Unknown';
            if (!mapelMap[nama]) {
                mapelMap[nama] = { total: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0 };
            }
            mapelMap[nama].total++;
            mapelMap[nama][d.status.toLowerCase()]++;
        });

        const perMapel = Object.entries(mapelMap).map(([nama_mapel, stat]) => ({
            nama_mapel,
            ...stat,
            persentase_kehadiran: stat.total > 0
                ? ((stat.hadir / stat.total) * 100).toFixed(2)
                : '0.00'
        }));

        // Statistik per semester
        const buildSemesterStat = (arr, label) => ({
            semester: label,
            total: arr.length,
            hadir:  arr.filter(d => d.status === 'HADIR').length,
            izin:   arr.filter(d => d.status === 'IZIN').length,
            sakit:  arr.filter(d => d.status === 'SAKIT').length,
            alpha:  arr.filter(d => d.status === 'ALPHA').length,
            persentase_kehadiran: arr.length > 0
                ? ((arr.filter(d => d.status === 'HADIR').length / arr.length) * 100).toFixed(2)
                : '0.00'
        });

        const sem1 = semuaDetail.filter(d => {
            const a = absensiList.find(a => a.id === d.absensi_id);
            const bln = getBulan(a?.tanggal) + 1;
            return bln >= 1 && bln <= 6;
        });
        const sem2 = semuaDetail.filter(d => {
            const a = absensiList.find(a => a.id === d.absensi_id);
            const bln = getBulan(a?.tanggal) + 1;
            return bln >= 7 && bln <= 12;
        });

        // Riwayat absensi harian (dari tap RFID + detail guru)
        const riwayat = absensiList.map(a => ({
            tanggal: formatDate(a.tanggal),
            tap_in: formatTime(a.tap_in),
            tap_out: formatTime(a.tap_out),
            status_tapin: a.status_tapin,
            detail_per_mapel: a.detail.map(d => ({
                id: d.id,
                mata_pelajaran: d.jadwal?.mata_pelajaran?.nama_mapel,
                status: d.status,
                jam_absen: formatDateTime(d.jam_absen),
                keterangan: d.keterangan,
                guru: d.guru?.nama
            }))
        }));

        return res.status(200).json({
            success: true,
            message: `Berhasil mendapatkan rekap absensi tahunan tahun ${tahunInt}`,
            data: {
                siswa: absensiList[0].siswa,
                tahun: tahunInt,
                periode: {
                    tanggal_mulai: formatDate(tanggalMulai),
                    tanggal_akhir: formatDate(tanggalAkhir)
                },
                total_hari_masuk: absensiList.filter(a => a.tap_in).length,
                total_hari_absen: absensiList.length,
                statistik_keseluruhan: statsKeseluruhan,
                statistik_per_semester: [
                    buildSemesterStat(sem1, 'Semester 1 (Jan–Jun)'),
                    buildSemesterStat(sem2, 'Semester 2 (Jul–Des)')
                ],
                statistik_per_bulan: perBulan,
                statistik_per_mapel: perMapel,
                riwayat_absensi: riwayat
            }
        });

    } catch (error) {
        console.error('Error get rekap absensi yearly:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
        });
    }
};


// delete detail absensi 
const deleteDetailAbsensi = async (req, res) => {
    try {
        const { id } = req.params;

        const detailAbsensi = await prisma.detailAbsensiSiswa.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            },
            include: {
                absensi: {
                    include: {
                        siswa: {
                            select: {
                                nama: true
                            }
                        }
                    }
                },
                jadwal: {
                    include: {
                        mata_pelajaran: true
                    }
                }
            }
        });

        if (!detailAbsensi) {
            return res.status(404).json({
                success: false,
                message: 'Detail absensi tidak ditemukan'
            });
        }

        await prisma.detailAbsensiSiswa.update({
            where: { id: parseInt(id) },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Berhasil menghapus detail absensi',
            data: {
                id: detailAbsensi.id,
                siswa: detailAbsensi.absensi.siswa.nama,
                mata_pelajaran: detailAbsensi.jadwal.mata_pelajaran.nama_mapel,
                tanggal: formatDate(detailAbsensi.absensi.tanggal)
            }
        });

    } catch (error) {
        console.error('Error delete detail absensi:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
        });
    }
};

module.exports = {
    absensiByGuru,
    updateStatusAbsensiManual,
    getDaftarAbsensiByJadwal,
    getRekapAbsensiSiswa,
    getLaporanHarianPerKelas,
    getRekapAbsensiSiswaYearly,
    deleteDetailAbsensi
};