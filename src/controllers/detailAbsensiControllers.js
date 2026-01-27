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


// absensi untuk guru
const absensiByGuru = async (req, res) => {
    try {
        const { jadwal_id, guru_id, absensi_data } = req.body;

        // untuk set tanggal hari ini
        const tanggal = new Date();
        tanggal.setHours(0, 0, 0, 0);

        // Validasi input
        if (!jadwal_id || !guru_id) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap. Diperlukan: jadwal_id, guru_id'
            });
        }

        // Validasi jadwal
        const jadwal = await prisma.jadwal.findFirst({
            where: {
                id: parseInt(jadwal_id),
                guru_id: parseInt(guru_id),
                tanggal_jadwal: tanggal,
                deleted_at: null
            },
            include: {
                kelas: {
                    include: {
                        jurusan: true
                    }
                },
                mata_pelajaran: true,
                guru: true
            }
        });

        if (!jadwal) {
            return res.status(404).json({
                success: false,
                message: 'Jadwal tidak ditemukan atau Anda tidak memiliki akses'
            });
        }

        // Ambil semua siswa di kelas
        const siswaKelas = await prisma.siswa.findMany({
            where: {
                kelas_id: jadwal.kelas_id,
                deleted_at: null
            },
            include: {
                absensi: {
                    where: {
                        tanggal: tanggal,
                        deleted_at: null
                    },
                    include: {
                        detail: {
                            where: {
                                deleted_at: null
                            },
                            include: {
                                jadwal: {
                                    select: {
                                        jam_mulai: true
                                    }
                                }
                            },
                            orderBy: {
                                jadwal: {
                                    jam_mulai: 'desc'
                                }
                            }
                        }
                    }
                }
            }
        });

        const detailAbsensiList = [];
        const errors = [];

        // cek apakah jadwal pertama
        const jadwalHariIni = await prisma.jadwal.findMany({
            where: {
                kelas_id: jadwal.kelas_id,
                tanggal_jadwal: tanggal,
                deleted_at: null
            },
            orderBy: {
                jam_mulai: 'asc'
            }
        });

        const isJadwalPertama = jadwalHariIni.length > 0 && jadwalHariIni[0].id === jadwal.id;

        // Process setiap siswa
        for (const siswa of siswaKelas) {
            let statusAbsensi = StatusAbsensi.ALPHA;
            let keterangan = null;

            // Cari atau buat absensi siswa untuk hari ini
            let absensiSiswa = siswa.absensi[0];

            if (!absensiSiswa) {
                absensiSiswa = await prisma.absensiSiswa.create({
                    data: {
                        siswa_id: siswa.id,
                        tanggal: tanggal,
                        tap_in: null,
                        tap_out: null,
                        status_tapin: null
                    }
                });
            }

            // Cek apakah detail absensi sudah ada untuk jadwal 
            const existingDetail = await prisma.detailAbsensiSiswa.findUnique({
                where: {
                    absensi_id_jadwal_id: {
                        absensi_id: absensiSiswa.id,
                        jadwal_id: jadwal.id
                    },
                    deleted_at: null
                }
            });

            if (existingDetail) {
                errors.push({
                    siswa_id: siswa.id,
                    nama_siswa: siswa.nama_siswa,
                    error: 'Absensi untuk jadwal ini sudah dibuat sebelumnya'
                });
                continue;
            }


            if (isJadwalPertama) {
                // guru pertama menggunakan tap_in
                if (absensiSiswa.tap_in) {
                    statusAbsensi = StatusAbsensi.HADIR;
                    keterangan = `Tap in: ${formatTime(absensiSiswa.tap_in)} - ${absensiSiswa.status_tapin || ''}`;
                } else {
                    statusAbsensi = StatusAbsensi.ALPHA;
                    keterangan = 'Tidak melakukan tap in';
                }
            } else {
                // guru kedua menggunakan data terakhir dari detail absensi sebelumnya
                const detailTerakhir = absensiSiswa.detail && absensiSiswa.detail.length > 0
                    ? absensiSiswa.detail[0]
                    : null;

                if (detailTerakhir) {
                    statusAbsensi = detailTerakhir.status;
                    keterangan = `Melanjutkan status dari jadwal sebelumnya: ${detailTerakhir.status}`;
                } else {
                    // Jika tidak ada detail sebelumnya, cek tap_in sebagai fallback
                    if (absensiSiswa.tap_in) {
                        statusAbsensi = StatusAbsensi.HADIR;
                        keterangan = `Tap in: ${formatTime(absensiSiswa.tap_in)}`;
                    } else {
                        statusAbsensi = StatusAbsensi.ALPHA;
                        keterangan = 'Tidak ada data absensi sebelumnya';
                    }
                }
            }

            // Override dengan data manual jika ada
            if (Array.isArray(absensi_data)) {
                const manualData = absensi_data.find(d => d.siswa_id === siswa.id);
                if (manualData) {
                    if (manualData.status) statusAbsensi = manualData.status;
                    if (manualData.keterangan) keterangan = manualData.keterangan;
                }
            }

            // Buat detail absensi
            const detailAbsensi = await prisma.detailAbsensiSiswa.create({
                data: {
                    absensi_id: absensiSiswa.id,
                    jadwal_id: jadwal.id,
                    guru_id: parseInt(guru_id),
                    status: statusAbsensi,
                    jam_absen: new Date(),
                    keterangan: keterangan
                },
                include: {
                    absensi: {
                        include: {
                            siswa: {
                                select: {
                                    id: true,
                                    nama_siswa: true,
                                    NISN: true,
                                    NIPD: true
                                }
                            }
                        }
                    }
                }
            });

            detailAbsensiList.push(detailAbsensi);
        }

        // Hitung statistik
        const stats = {
            total: detailAbsensiList.length,
            hadir: detailAbsensiList.filter(d => d.status === 'HADIR').length,
            izin: detailAbsensiList.filter(d => d.status === 'IZIN').length,
            sakit: detailAbsensiList.filter(d => d.status === 'SAKIT').length,
            alpha: detailAbsensiList.filter(d => d.status === 'ALPHA').length
        };

        return res.status(201).json({
            success: true,
            message: `Berhasil menyimpan ${detailAbsensiList.length} absensi`,
            data: {
                jadwal: {
                    id: jadwal.id,
                    mata_pelajaran: jadwal.mata_pelajaran.nama_mapel,
                    kelas: `${jadwal.kelas.kelas} ${jadwal.kelas.jurusan.nama_jurusan}`,
                    tanggal: formatDate(jadwal.tanggal_jadwal),
                    jam_mulai: formatTime(jadwal.jam_mulai),
                    jam_selesai: formatTime(jadwal.jam_selesai),
                    guru: jadwal.guru.nama,
                    is_jadwal_pertama: isJadwalPertama
                },
                statistik: stats,
                detail_absensi: detailAbsensiList.map(d => ({
                    id: d.id,
                    siswa: d.absensi.siswa,
                    status: d.status,
                    jam_absen: formatDateTime(d.jam_absen),
                    keterangan: d.keterangan
                })),
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        console.error('Error absensi by guru:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
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
                                nama_siswa: true,
                                NISN: true
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
                                nama_siswa: true,
                                NISN: true,
                                NIPD: true
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
                    tanggal: formatDate(updated.jadwal.tanggal_jadwal)
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
                                        nama_siswa: true,
                                        NISN: true,
                                        NIPD: true,
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
                                nama_siswa: 'asc'
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
                    tanggal: formatDate(jadwal.tanggal_jadwal),
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
                                nama_siswa: true,
                                NISN: true,
                                NIPD: true,
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
                message: 'kelas_id dan tanggal diperlukan'
            });
        }

        const kelas = await prisma.kelas.findFirst({
            where: {
                id: parseInt(kelas_id),
                deleted_at: null
            },
            include: {
                jurusan: true,
                tahun: true,
                siswa: {
                    where: {
                        deleted_at: null
                    },
                    select: {
                        id: true,
                        nama_siswa: true,
                        NISN: true,
                        NIPD: true
                    }
                }
            }
        });

        if (!kelas) {
            return res.status(404).json({
                success: false,
                message: 'Kelas tidak ditemukan'
            });
        }

        // Ambil semua jadwal hari ini untuk kelas tersebut
        const jadwalHariIni = await prisma.jadwal.findMany({
            where: {
                kelas_id: parseInt(kelas_id),
                tanggal_jadwal: new Date(tanggal),
                deleted_at: null
            },
            include: {
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
                                        nama_siswa: true,
                                        NISN: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                jam_mulai: 'asc'
            }
        });

        // Buat laporan per siswa
        const laporanPerSiswa = kelas.siswa.map(siswa => {
            const absensiSiswa = {};

            jadwalHariIni.forEach(jadwal => {
                const detail = jadwal.detail_absensi.find(
                    d => d.absensi.siswa_id === siswa.id
                );

                absensiSiswa[jadwal.mata_pelajaran.nama_mapel] = {
                    jadwal_id: jadwal.id,
                    jam: `${formatTime(jadwal.jam_mulai)} - ${formatTime(jadwal.jam_selesai)}`,
                    status: detail ? detail.status : 'BELUM_ABSEN',
                    keterangan: detail ? detail.keterangan : null,
                    detail_id: detail ? detail.id : null
                };
            });

            // Hitung statistik per siswa
            const statusList = Object.values(absensiSiswa).filter(a => a.status !== 'BELUM_ABSEN');
            const stats = {
                hadir: statusList.filter(a => a.status === 'HADIR').length,
                izin: statusList.filter(a => a.status === 'IZIN').length,
                sakit: statusList.filter(a => a.status === 'SAKIT').length,
                alpha: statusList.filter(a => a.status === 'ALPHA').length,
                belum_absen: jadwalHariIni.length - statusList.length
            };

            return {
                siswa: siswa,
                absensi: absensiSiswa,
                statistik: stats
            };
        });

        // Statistik keseluruhan kelas
        const statsKelas = {
            total_siswa: kelas.siswa.length,
            total_jadwal: jadwalHariIni.length,
            total_absensi_dilakukan: jadwalHariIni.reduce((sum, j) => sum + j.detail_absensi.length, 0),
            total_absensi_seharusnya: kelas.siswa.length * jadwalHariIni.length
        };

        return res.status(200).json({
            success: true,
            message: 'Berhasil mendapatkan laporan harian per kelas',
            data: {
                kelas: {
                    id: kelas.id,
                    nama: `${kelas.kelas} ${kelas.jurusan.nama_jurusan}`,
                    tahun_ajaran: kelas.tahun.tahun_ajaran
                },
                tanggal: new Date(tanggal),
                jadwal_hari_ini: jadwalHariIni.map(j => ({
                    id: j.id,
                    mata_pelajaran: j.mata_pelajaran.nama_mapel,
                    guru: j.guru.nama,
                    jam: `${formatTime(j.jam_mulai)} - ${formatTime(j.jam_selesai)}`,
                    total_absen: j.detail_absensi.length,
                    sudah_dilakukan: j.detail_absensi.length > 0
                })),
                statistik_kelas: statsKelas,
                laporan_per_siswa: laporanPerSiswa
            }
        });

    } catch (error) {
        console.error('Error get laporan harian:', error);
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
                                nama_siswa: true
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
                siswa: detailAbsensi.absensi.siswa.nama_siswa,
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
    deleteDetailAbsensi
};