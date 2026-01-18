const prisma = require("../config/prisma");

const getAllJadwal = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            deleted_at: null
        };

        // Filter by tanggal if provided
        if (req.query.tanggal) {
            const startDate = new Date(req.query.tanggal);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(req.query.tanggal);
            endDate.setHours(23, 59, 59, 999);

            whereCondition.tanggal_jadwal = {
                gte: startDate,
                lte: endDate
            };
        }

        // Filter by kelas_id if provided
        if (req.query.kelas_id) {
            whereCondition.kelas_id = parseInt(req.query.kelas_id);
        }

        // Filter by guru_id if provided
        if (req.query.guru_id) {
            whereCondition.guru_id = parseInt(req.query.guru_id);
        }

        const [data, total] = await Promise.all([
            prisma.jadwal.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: [
                    { tanggal_jadwal: "desc" },
                    { jam_mulai: "asc" }
                ],
                include: {
                    kelas: {
                        select: {
                            id: true,
                            kelas: true,
                            jurusan: {
                                select: {
                                    nama_jurusan: true
                                }
                            },
                            tahun: {
                                select: {
                                    tahun_ajaran: true
                                }
                            }
                        }
                    },
                    mata_pelajaran: {
                        select: {
                            id: true,
                            nama_mapel: true
                        }
                    },
                    guru: {
                        select: {
                            id: true,
                            NIP: true,
                            nama: true
                        }
                    }
                }
            }),
            prisma.jadwal.count({
                where: whereCondition
            })
        ]);

        return res.json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error in getAllJadwal:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}



// create jadwal 
const createJadwal = async (req, res) => {
    try {
        const {
            tanggal_jadwal,
            kelas_id,
            mapel_id,
            guru_id,
            jam_mulai,
            jam_selesai
        } = req.body;

        // Validasi input wajib
        if (!tanggal_jadwal || !kelas_id || !mapel_id || !guru_id || !jam_mulai || !jam_selesai) {
            return res.status(400).json({
                success: false,
                message: "Semua field wajib diisi"
            });
        }

        // Validasi ID harus angka
        if (isNaN(parseInt(kelas_id)) || isNaN(parseInt(mapel_id)) || isNaN(parseInt(guru_id))) {
            return res.status(400).json({
                success: false,
                message: "Kelas ID, Mapel ID, dan Guru ID harus berupa angka"
            });
        }

        // Validasi kelas exists
        const kelasExists = await prisma.kelas.findFirst({
            where: {
                id: parseInt(kelas_id),
                deleted_at: null
            }
        });

        if (!kelasExists) {
            return res.status(404).json({
                success: false,
                message: "Kelas tidak ditemukan"
            });
        }

        // Validasi mata pelajaran exists
        const mapelExists = await prisma.mataPelajaran.findFirst({
            where: {
                id: parseInt(mapel_id),
                deleted_at: null
            }
        });

        if (!mapelExists) {
            return res.status(404).json({
                success: false,
                message: "Mata pelajaran tidak ditemukan"
            });
        }

        // Validasi guru exists
        const guruExists = await prisma.guru.findFirst({
            where: {
                id: parseInt(guru_id),
                deleted_at: null
            }
        });

        if (!guruExists) {
            return res.status(404).json({
                success: false,
                message: "Guru tidak ditemukan"
            });
        }

        // Konversi tanggal dan jam
        const tanggalJadwalDate = new Date(tanggal_jadwal);
        if (isNaN(tanggalJadwalDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal jadwal tidak valid (gunakan YYYY-MM-DD)"
            });
        }

        // Parse jam mulai dan selesai
        const jamMulaiDate = new Date(`${tanggal_jadwal} ${jam_mulai}`);
        const jamSelesaiDate = new Date(`${tanggal_jadwal} ${jam_selesai}`);

        if (isNaN(jamMulaiDate.getTime()) || isNaN(jamSelesaiDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format jam tidak valid (gunakan HH:MM)"
            });
        }

        // Validasi jam selesai harus setelah jam mulai
        if (jamSelesaiDate <= jamMulaiDate) {
            return res.status(400).json({
                success: false,
                message: "Jam selesai harus setelah jam mulai"
            });
        }

        // Cek konflik jadwal untuk kelas yang sama
        const conflictKelas = await prisma.jadwal.findFirst({
            where: {
                kelas_id: parseInt(kelas_id),
                tanggal_jadwal: tanggalJadwalDate,
                deleted_at: null,
                OR: [
                    {
                        AND: [
                            { jam_mulai: { lte: jamMulaiDate } },
                            { jam_selesai: { gt: jamMulaiDate } }
                        ]
                    },
                    {
                        AND: [
                            { jam_mulai: { lt: jamSelesaiDate } },
                            { jam_selesai: { gte: jamSelesaiDate } }
                        ]
                    },
                    {
                        AND: [
                            { jam_mulai: { gte: jamMulaiDate } },
                            { jam_selesai: { lte: jamSelesaiDate } }
                        ]
                    }
                ]
            }
        });

        if (conflictKelas) {
            return res.status(409).json({
                success: false,
                message: "Jadwal bentrok dengan jadwal kelas lain pada waktu yang sama"
            });
        }

        // Cek konflik jadwal untuk guru yang sama
        const conflictGuru = await prisma.jadwal.findFirst({
            where: {
                guru_id: parseInt(guru_id),
                tanggal_jadwal: tanggalJadwalDate,
                deleted_at: null,
                OR: [
                    {
                        AND: [
                            { jam_mulai: { lte: jamMulaiDate } },
                            { jam_selesai: { gt: jamMulaiDate } }
                        ]
                    },
                    {
                        AND: [
                            { jam_mulai: { lt: jamSelesaiDate } },
                            { jam_selesai: { gte: jamSelesaiDate } }
                        ]
                    },
                    {
                        AND: [
                            { jam_mulai: { gte: jamMulaiDate } },
                            { jam_selesai: { lte: jamSelesaiDate } }
                        ]
                    }
                ]
            }
        });

        if (conflictGuru) {
            return res.status(409).json({
                success: false,
                message: "Guru sudah memiliki jadwal mengajar pada waktu yang sama"
            });
        }

        // Buat jadwal baru
        const newJadwal = await prisma.jadwal.create({
            data: {
                tanggal_jadwal: tanggalJadwalDate,
                kelas_id: parseInt(kelas_id),
                mapel_id: parseInt(mapel_id),
                guru_id: parseInt(guru_id),
                jam_mulai: jamMulaiDate,
                jam_selesai: jamSelesaiDate
            },
            include: {
                kelas: {
                    select: {
                        kelas: true,
                        jurusan: {
                            select: {
                                nama_jurusan: true
                            }
                        }
                    }
                },
                mata_pelajaran: {
                    select: {
                        nama_mapel: true
                    }
                },
                guru: {
                    select: {
                        nama: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan jadwal baru",
            data: newJadwal
        });

    } catch (error) {
        console.error("Error creating jadwal:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    getAllJadwal,
    createJadwal
}