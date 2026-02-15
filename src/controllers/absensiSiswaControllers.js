const prisma = require("../config/prisma");
const { sendTapInNotification, sendTapOutNotification } = require("../services/telegramServices");


// format tanggal dan waktu ke dalam format Indonesia
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

// get hari untuk validasi hari untuk tapin absensi
const validateHari = (hari) => {
    const validHari = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return validHari[hari.getDay()];
};


// Tap In 
const tapIn = async (req, res) => {
    try {
        const { uid_rfid } = req.body;

        // Validasi input
        if (!uid_rfid) {
            return res.status(400).json({
                success: false,
                message: "UID RFID harus terisi"
            });
        }

        // Cari RFID yang aktif 
        const rfid = await prisma.rFID.findFirst({
            where: {
                uid_rfid,
                is_active: true,
                deleted_at: null
            },
            include: {
                siswa: {
                    include: {
                        kelas: {
                            include: {
                                jurusan: true
                            }
                        },
                        orang_tua: true 
                    }
                }
            }
        });

        if (!rfid) {
            return res.status(404).json({
                success: false,
                message: "RFID tidak ditemukan atau tidak aktif"
            });
        }

        if (!rfid.siswa.kelas) {
            return res.status(400).json({
                success: false,
                message: "Siswa tidak memiliki kelas"
            });
        }

        // Set tanggal hari ini (tanpa jam)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Cek apakah sudah tap in hari ini
        const existingAbsensi = await prisma.absensiSiswa.findFirst({
            where: {
                siswa_id: rfid.siswa.id,
                tanggal: today,
                tap_in: { not: null },
                deleted_at: null
            }
        });

        if (existingAbsensi) {
            return res.status(409).json({
                success: false,
                message: "Siswa sudah melakukan tap in hari ini"
            });
        }

        // Dapatkan nama hari ini
        const hariIni = validateHari(new Date());

        // Cek jika hari Minggu
        if (hariIni === 'MINGGU') {
            return res.status(400).json({
                success: false,
                message: "Tidak ada jadwal di hari Minggu"
            });
        }

        // Ambil jadwal pertama hari ini untuk kelas siswa
        const jadwalPertama = await prisma.jadwal.findFirst({
            where: {
                kelas_id: rfid.siswa.kelas_id,
                hari: hariIni,
                deleted_at: null
            },
            include: {
                mata_pelajaran: true
            },
            orderBy: {
                jam_mulai: 'asc'
            }
        });

        if (!jadwalPertama) {
            return res.status(404).json({
                success: false,
                message: `Tidak ada jadwal untuk kelas ${rfid.siswa.kelas.kelas} ${rfid.siswa.kelas.jurusan.nama_jurusan} di hari ${hariIni}`
            });
        }

        const tapInTime = new Date();

        // Tentukan status kedatangan berdasarkan jam mulai jadwal pertama
        const jamMulai = new Date(jadwalPertama.jam_mulai);
        const jamMulaiToday = new Date();
        jamMulaiToday.setHours(jamMulai.getHours(), jamMulai.getMinutes(), 0, 0);

        const statusTapIn = tapInTime <= jamMulaiToday ? 'TEPAT_WAKTU' : 'TELAMBAT';

        // Buat absensi baru
        const absensi = await prisma.absensiSiswa.create({
            data: {
                siswa_id: rfid.siswa.id,
                tanggal: today,
                tap_in: tapInTime,
                rfid_id: rfid.id,
                status_tapin: statusTapIn
            },
            include: {
                siswa: {
                    select: {
                        nama: true,
                        NISN: true,
                        kelas: {
                            select: {
                                kelas: true,
                                jurusan: {
                                    select: {
                                        nama_jurusan: true
                                    }
                                }
                            }
                        }
                    }
                },
                rfid: {
                    select: {
                        uid_rfid: true
                    }
                }
            }
        });

        // kirim notifikasi telegram
        if (rfid.siswa.orang_tua && rfid.siswa.orang_tua.telegram_id) {
            const notifData = {
                nama: rfid.siswa.nama,
                kelas: `${rfid.siswa.kelas.kelas} ${rfid.siswa.kelas.jurusan.nama_jurusan}`,
                status_tapin: statusTapIn,
                tap_in: formatTime(tapInTime),
                tanggal: formatDate(today),
                jadwal_pertama: jadwalPertama.mata_pelajaran.nama_mapel,
                jam_mulai: formatTime(jadwalPertama.jam_mulai)
            };

            // Kirim async (tidak menunggu response)
            sendTapInNotification(rfid.siswa.orang_tua.telegram_id, notifData)
                .catch(error => {
                    console.error('Failed to send Telegram notification:', error);
                });
        }

        // Format response
        const formattedAbsensi = {
            id: absensi.id,
            siswa: absensi.siswa,
            tanggal: formatDate(absensi.tanggal),
            tap_in: formatTime(absensi.tap_in),
            tap_out: formatTime(absensi.tap_out),
            status_tapin: absensi.status_tapin,
            rfid: absensi.rfid,
            jadwal_info: {
                hari: hariIni,
                mata_pelajaran_pertama: jadwalPertama.mata_pelajaran.nama_mapel,
                jam_mulai: formatTime(jadwalPertama.jam_mulai),
                jam_selesai: formatTime(jadwalPertama.jam_selesai)
            },
            created_at: formatDateTime(absensi.created_at)
        };

        return res.status(201).json({
            success: true,
            message: `Tap in berhasil - ${statusTapIn}`,
            data: formattedAbsensi
        });

    } catch (error) {
        console.error("Error tap in:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Tap Out 
const tapOut = async (req, res) => {
    try {
        const { uid_rfid } = req.body;

        // Validasi input
        if (!uid_rfid) {
            return res.status(400).json({
                success: false,
                message: "UID RFID harus terisi"
            });
        }

        // Cari RFID yang aktif - INCLUDE ORANG TUA
        const rfid = await prisma.rFID.findFirst({
            where: {
                uid_rfid,
                is_active: true,
                deleted_at: null
            },
            include: {
                siswa: {
                    include: {
                        kelas: {
                            include: {
                                jurusan: true
                            }
                        },
                        orang_tua: true 
                    }
                }
            }
        });

        if (!rfid) {
            return res.status(404).json({
                success: false,
                message: "RFID tidak ditemukan atau tidak aktif"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Cek apakah sudah ada tap_in hari ini
        const absensiTapIn = await prisma.absensiSiswa.findFirst({
            where: {
                siswa_id: rfid.siswa_id,
                tanggal: today,
                tap_in: { not: null },
                deleted_at: null
            }
        });

        if (!absensiTapIn) {
            return res.status(404).json({
                success: false,
                message: "Belum melakukan tap in hari ini"
            });
        }

        // Cek apakah sudah tap out hari ini
        const existingTapOut = await prisma.absensiSiswa.findFirst({
            where: {
                siswa_id: rfid.siswa_id,
                tanggal: today,
                tap_out: { not: null },
                deleted_at: null
            }
        });

        if (existingTapOut) {
            return res.status(409).json({
                success: false,
                message: "Sudah melakukan tap out hari ini"
            });
        }

        const tapOutTime = new Date();

        // Update tap out pada record yang sudah ada
        const updatedAbsensi = await prisma.absensiSiswa.update({
            where: { id: absensiTapIn.id },
            data: {
                tap_out: tapOutTime
            },
            include: {
                siswa: {
                    select: {
                        nama: true,
                        NISN: true,
                        kelas: {
                            select: {
                                kelas: true,
                                jurusan: {
                                    select: {
                                        nama_jurusan: true
                                    }
                                }
                            }
                        }
                    }
                },
                rfid: {
                    select: {
                        uid_rfid: true
                    }
                }
            }
        });

        // kirim notifikasi telegram
        if (rfid.siswa.orang_tua && rfid.siswa.orang_tua.telegram_id) {
            const notifData = {
                nama: rfid.siswa.nama,
                kelas: `${rfid.siswa.kelas.kelas} ${rfid.siswa.kelas.jurusan.nama_jurusan}`,
                tap_out: formatTime(tapOutTime),
                tanggal: formatDate(today)
            };

            sendTapOutNotification(rfid.siswa.orang_tua.telegram_id, notifData)
                .catch(error => {
                    console.error('Failed to send Telegram notification:', error);
                });
        }

        // Format response
        const formattedAbsensi = {
            id: updatedAbsensi.id,
            siswa: updatedAbsensi.siswa,
            tanggal: formatDate(updatedAbsensi.tanggal),
            tap_in: formatTime(updatedAbsensi.tap_in),
            tap_out: formatTime(updatedAbsensi.tap_out),
            status_tapin: updatedAbsensi.status_tapin,
            rfid: updatedAbsensi.rfid,
            updated_at: formatDateTime(updatedAbsensi.updated_at)
        };

        return res.status(200).json({
            success: true,
            message: "Tap out berhasil",
            data: formattedAbsensi
        });

    } catch (error) {
        console.error("Error tap out:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Get all absensi dengan pagination dan filter
const getAllAbsensi = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { tanggal, siswa_id, kelas_id, status_tapin } = req.query;

        // Build where condition
        const whereCondition = {
            deleted_at: null
        };

        if (tanggal) {
            const date = new Date(tanggal);
            date.setHours(0, 0, 0, 0);
            whereCondition.tanggal = date;
        }

        if (siswa_id) {
            whereCondition.siswa_id = siswa_id;
        }

        if (kelas_id) {
            whereCondition.siswa = {
                kelas_id: parseInt(kelas_id)
            };
        }

        if (status_tapin) {
            whereCondition.status_tapin = status_tapin;
        }

        const [data, total] = await Promise.all([
            prisma.absensiSiswa.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: {
                    created_at: "desc"
                },
                include: {
                    siswa: {
                        select: {
                            nama: true,
                            NISN: true,
                            kelas: {
                                select: {
                                    kelas: true,
                                    jurusan: {
                                        select: {
                                            nama_jurusan: true
                                        }
                                    },
                                    tahun: {
                                        select: {
                                            tahun_ajaran: true,
                                            is_active: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    rfid: {
                        select: {
                            uid_rfid: true
                        }
                    }
                }
            }),
            prisma.absensiSiswa.count({ where: whereCondition })
        ]);

        // Format data
        const formattedData = data.map(absensi => ({
            id: absensi.id,
            siswa: absensi.siswa,
            tanggal: formatDate(absensi.tanggal),
            tap_in: formatTime(absensi.tap_in),
            tap_out: formatTime(absensi.tap_out),
            status_tapin: absensi.status_tapin,
            rfid: absensi.rfid,
            created_at: formatDateTime(absensi.created_at),
            updated_at: formatDateTime(absensi.updated_at)
        }));

        return res.status(200).json({
            success: true,
            message: "Berhasil mengambil seluruh data absensi siswa",
            data: formattedData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error getting absensi:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Get absensi by ID
const getAbsensiById = async (req, res) => {
    try {
        const { id } = req.params;

        const absensi = await prisma.absensiSiswa.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            },
            include: {
                siswa: {
                    select: {
                        nama: true,
                        NISN: true,
                        kelas: {
                            select: {
                                kelas: true,
                                jurusan: {
                                    select: {
                                        nama_jurusan: true
                                    }
                                },
                                tahun: {
                                    select: {
                                        tahun_ajaran: true,
                                        is_active: true
                                    }
                                }
                            }
                        }
                    }
                },
                rfid: {
                    select: {
                        uid_rfid: true
                    }
                },
                detail: {
                    where: {
                        deleted_at: null
                    },
                    include: {
                        jadwal: {
                            include: {
                                mata_pelajaran: true,
                                guru: {
                                    select: {
                                        nama: true,
                                        NIP: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!absensi) {
            return res.status(404).json({
                success: false,
                message: "Absensi tidak ditemukan"
            });
        }

        // Format detail absensi
        const formattedDetail = absensi.detail.map(detail => ({
            id: detail.id,
            status: detail.status,
            jam_absen: formatDateTime(detail.jam_absen),
            keterangan: detail.keterangan,
            jadwal: {
                id: detail.jadwal.id,
                hari: detail.jadwal.hari,
                jam_mulai: formatTime(detail.jadwal.jam_mulai),
                jam_selesai: formatTime(detail.jadwal.jam_selesai),
                mata_pelajaran: detail.jadwal.mata_pelajaran,
                guru: detail.jadwal.guru
            }
        }));

        // Format response
        const formattedAbsensi = {
            id: absensi.id,
            siswa: absensi.siswa,
            tanggal: formatDate(absensi.tanggal),
            tap_in: formatTime(absensi.tap_in),
            tap_out: formatTime(absensi.tap_out),
            status_tapin: absensi.status_tapin,
            rfid: absensi.rfid,
            detail: formattedDetail,
            created_at: formatDateTime(absensi.created_at),
            updated_at: formatDateTime(absensi.updated_at)
        };

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data absensi",
            data: formattedAbsensi
        });

    } catch (error) {
        console.error("Error getting absensi by id:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Get laporan absensi harian
const getLaporanHarian = async (req, res) => {
    try {
        const { tanggal, kelas_id } = req.query;

        if (!tanggal) {
            return res.status(400).json({
                success: false,
                message: "Tanggal harus terisi"
            });
        }

        const date = new Date(tanggal);
        date.setHours(0, 0, 0, 0);

        const whereCondition = {
            tanggal: date,
            deleted_at: null
        };

        if (kelas_id) {
            whereCondition.siswa = {
                kelas_id: parseInt(kelas_id)
            };
        }

        const absensiList = await prisma.absensiSiswa.findMany({
            where: whereCondition,
            include: {
                siswa: {
                    select: {
                        nama: true,
                        NISN: true,
                        kelas: {
                            select: {
                                kelas: true,
                                jurusan: {
                                    select: {
                                        nama_jurusan: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                tap_in: 'asc'
            }
        });

        const summary = {
            total: absensiList.length,
            tepat_waktu: absensiList.filter(a => a.status_tapin === 'TEPAT_WAKTU').length,
            telambat: absensiList.filter(a => a.status_tapin === 'TELAMBAT').length,
            belum_tap_in: absensiList.filter(a => !a.tap_in).length,
            belum_tap_out: absensiList.filter(a => a.tap_in && !a.tap_out).length
        };

        // Format data
        const formattedData = absensiList.map(absensi => ({
            id: absensi.id,
            siswa: absensi.siswa,
            tanggal: formatDate(absensi.tanggal),
            tap_in: formatTime(absensi.tap_in),
            tap_out: formatTime(absensi.tap_out),
            status_tapin: absensi.status_tapin
        }));

        return res.status(200).json({
            success: true,
            message: "Berhasil mengambil laporan absensi harian",
            data: formattedData,
            summary
        });

    } catch (error) {
        console.error("Error getting laporan harian:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Update absensi
const updateAbsensi = async (req, res) => {
    try {
        const { id } = req.params;
        const { tap_in, tap_out, status_tapin } = req.body;

        // Validasi id
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "ID tidak valid"
            });
        }

        // Cek absensi
        const existingAbsensi = await prisma.absensiSiswa.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingAbsensi) {
            return res.status(404).json({
                success: false,
                message: "Absensi tidak ditemukan"
            });
        }

        // Build update data
        const updateData = {};

        if (tap_in !== undefined) {
            updateData.tap_in = new Date(tap_in);
        }

        if (tap_out !== undefined) {
            updateData.tap_out = new Date(tap_out);
        }

        if (status_tapin !== undefined) {
            if (!['TEPAT_WAKTU', 'TELAMBAT'].includes(status_tapin)) {
                return res.status(400).json({
                    success: false,
                    message: "Status tap in tidak valid"
                });
            }
            updateData.status_tapin = status_tapin;
        }

        const updatedAbsensi = await prisma.absensiSiswa.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                siswa: {
                    select: {
                        nama: true,
                        NISN: true,
                        kelas: {
                            select: {
                                kelas: true,
                                jurusan: {
                                    select: {
                                        nama_jurusan: true
                                    }
                                }
                            }
                        }
                    }
                },
                rfid: {
                    select: {
                        uid_rfid: true
                    }
                }
            }
        });

        // Format response
        const formattedAbsensi = {
            id: updatedAbsensi.id,
            siswa: updatedAbsensi.siswa,
            tanggal: formatDate(updatedAbsensi.tanggal),
            tap_in: formatTime(updatedAbsensi.tap_in),
            tap_out: formatTime(updatedAbsensi.tap_out),
            status_tapin: updatedAbsensi.status_tapin,
            rfid: updatedAbsensi.rfid,
            updated_at: formatDateTime(updatedAbsensi.updated_at)
        };

        return res.status(200).json({
            success: true,
            message: "Berhasil mengupdate data absensi",
            data: formattedAbsensi
        });

    } catch (error) {
        console.error("Error updating absensi:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Soft delete absensi
const deleteAbsensi = async (req, res) => {
    try {
        const { id } = req.params;

        // Validasi id
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "ID tidak valid"
            });
        }

        // Cek absensi
        const existingAbsensi = await prisma.absensiSiswa.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingAbsensi) {
            return res.status(404).json({
                success: false,
                message: "Absensi tidak ditemukan"
            });
        }

        // Soft delete detail absensi terlebih dahulu
        await prisma.detailAbsensiSiswa.updateMany({
            where: {
                absensi_id: parseInt(id),
                deleted_at: null
            },
            data: {
                deleted_at: new Date()
            }
        });

        // Soft delete absensi
        await prisma.absensiSiswa.update({
            where: { id: parseInt(id) },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus data absensi"
        });

    } catch (error) {
        console.error("Error deleting absensi:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    tapIn,
    tapOut,
    getAllAbsensi,
    getAbsensiById,
    getLaporanHarian,
    updateAbsensi,
    deleteAbsensi
};