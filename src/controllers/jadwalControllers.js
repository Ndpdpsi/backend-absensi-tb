const prisma = require("../config/prisma");


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

// Validasi format waktu HH:MM
const validateTimeFormat = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

// Validasi hari
const validateHari = (hari) => {
    const validHari = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return validHari.includes(hari.toUpperCase());
};

// get all jadwal
const getAllJadwal = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            deleted_at: null
        };

        // Filter by kelas_id if provided
        if (req.query.kelas_id) {
            whereCondition.kelas_id = parseInt(req.query.kelas_id);
        }

        // Filter by guru_id if provided
        if (req.query.guru_id) {
            whereCondition.guru_id = parseInt(req.query.guru_id);
        }

        // Filter by hari if provided
        if (req.query.hari) {
            whereCondition.hari = req.query.hari.toUpperCase();
        }

        const [data, total] = await Promise.all([
            prisma.jadwal.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: [
                    { hari: "asc" },
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


        // format response
        const formattedData = data.map(jadwal => ({
            id: jadwal.id,
            hari: jadwal.hari,
            jam_mulai: formatTime(jadwal.jam_mulai),
            jam_selesai: formatTime(jadwal.jam_selesai),
            jam_lengkap: `${formatTime(jadwal.jam_mulai)} - ${formatTime(jadwal.jam_selesai)}`,
            kelas: jadwal.kelas,
            mata_pelajaran: jadwal.mata_pelajaran,
            guru: jadwal.guru,
            created_at: formatDateTime(jadwal.created_at),
            updated_at: formatDateTime(jadwal.updated_at)
        }));

        return res.json({
            success: true,
            message: "Berhasil mendapatkan data jadwal",
            data: formattedData,
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
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// create jadwal 
const createJadwal = async (req, res) => {
    try {
        const {
            hari,
            kelas_id,
            mapel_id,
            guru_id,
            jam_mulai,
            jam_selesai
        } = req.body;

        // Validasi input wajib
        if (!hari || !kelas_id || !mapel_id || !guru_id || !jam_mulai || !jam_selesai) {
            return res.status(400).json({
                success: false,
                message: "Semua field wajib diisi"
            });
        }

        // Validasi hari
        if (!validateHari(hari)) {
            return res.status(400).json({
                success: false,
                message: "Hari tidak valid (gunakan: SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU)"
            });
        }

        // Validasi ID harus angka
        if (isNaN(parseInt(kelas_id)) || isNaN(parseInt(mapel_id)) || isNaN(parseInt(guru_id))) {
            return res.status(400).json({
                success: false,
                message: "Kelas ID, Mapel ID, dan Guru ID harus berupa angka"
            });
        }

        // Validasi format waktu
        if (!validateTimeFormat(jam_mulai) || !validateTimeFormat(jam_selesai)) {
            return res.status(400).json({
                success: false,
                message: "Format jam tidak valid (gunakan HH:MM)"
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

        // Konversi jam ke format Time untuk PostgreSQL
        const jamMulaiTime = `${jam_mulai}:00`;
        const jamSelesaiTime = `${jam_selesai}:00`;

        // Validasi jam selesai harus setelah jam mulai
        const [jamMulaiHour, jamMulaiMinute] = jam_mulai.split(':').map(Number);
        const [jamSelesaiHour, jamSelesaiMinute] = jam_selesai.split(':').map(Number);
        
        const totalMulai = jamMulaiHour * 60 + jamMulaiMinute;
        const totalSelesai = jamSelesaiHour * 60 + jamSelesaiMinute;

        if (totalSelesai <= totalMulai) {
            return res.status(400).json({
                success: false,
                message: "Jam selesai harus setelah jam mulai"
            });
        }

        // Cek konflik jadwal kelas
        const conflictKelas = await prisma.jadwal.findFirst({
            where: {
                kelas_id: parseInt(kelas_id),
                hari: hari.toUpperCase(),
                deleted_at: null,
                OR: [
                    // Case 1: Jadwal baru dimulai saat jadwal existing berlangsung
                    {
                        AND: [
                            { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                            { jam_selesai: { gt: new Date(`1970-01-01T${jamMulaiTime}`) } }
                        ]
                    },
                    // Case 2: Jadwal baru berakhir saat jadwal existing berlangsung
                    {
                        AND: [
                            { jam_mulai: { lt: new Date(`1970-01-01T${jamSelesaiTime}`) } },
                            { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                        ]
                    },
                    // Case 3: Jadwal baru membungkus jadwal existing
                    {
                        AND: [
                            { jam_mulai: { gte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                            { jam_selesai: { lte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                        ]
                    },
                    // Case 4: Jadwal existing membungkus jadwal baru
                    {
                        AND: [
                            { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                            { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
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

        // Cek konflik jadwal guru
        const conflictGuru = await prisma.jadwal.findFirst({
            where: {
                guru_id: parseInt(guru_id),
                hari: hari.toUpperCase(),
                deleted_at: null,
                OR: [
                    // Case 1: Jadwal baru dimulai saat jadwal existing berlangsung
                    {
                        AND: [
                            { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                            { jam_selesai: { gt: new Date(`1970-01-01T${jamMulaiTime}`) } }
                        ]
                    },
                    // Case 2: Jadwal baru berakhir saat jadwal existing berlangsung
                    {
                        AND: [
                            { jam_mulai: { lt: new Date(`1970-01-01T${jamSelesaiTime}`) } },
                            { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                        ]
                    },
                    // Case 3: Jadwal baru membungkus jadwal existing
                    {
                        AND: [
                            { jam_mulai: { gte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                            { jam_selesai: { lte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                        ]
                    },
                    // Case 4: Jadwal existing membungkus jadwal baru
                    {
                        AND: [
                            { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                            { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
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
                hari: hari.toUpperCase(),
                kelas_id: parseInt(kelas_id),
                mapel_id: parseInt(mapel_id),
                guru_id: parseInt(guru_id),
                jam_mulai: new Date(`1970-01-01T${jamMulaiTime}`),
                jam_selesai: new Date(`1970-01-01T${jamSelesaiTime}`)
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

        // Format response
        const formattedJadwal = {
            id: newJadwal.id,
            hari: newJadwal.hari,
            jam_mulai: formatTime(newJadwal.jam_mulai),
            jam_selesai: formatTime(newJadwal.jam_selesai),
            jam_lengkap: `${formatTime(newJadwal.jam_mulai)} - ${formatTime(newJadwal.jam_selesai)}`,
            kelas: newJadwal.kelas,
            mata_pelajaran: newJadwal.mata_pelajaran,
            guru: newJadwal.guru,
            created_at: formatDateTime(newJadwal.created_at)
        };

        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan jadwal baru",
            data: formattedJadwal
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

// update jadwal 
const updateJadwal = async (req, res) => {
    try {
        const { id } = req.params;
        const { hari, kelas_id, mapel_id, guru_id, jam_mulai, jam_selesai } = req.body;

        // Validasi input 
        if (!hari || !kelas_id || !mapel_id || !guru_id || !jam_mulai || !jam_selesai) {
            return res.status(400).json({
                success: false,
                message: "Semua field harus terisi"
            });
        }

        // Validasi hari
        if (!validateHari(hari)) {
            return res.status(400).json({
                success: false,
                message: "Hari tidak valid (gunakan: SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU)"
            });
        }

        // Validasi format waktu
        if (!validateTimeFormat(jam_mulai) || !validateTimeFormat(jam_selesai)) {
            return res.status(400).json({
                success: false,
                message: "Format jam tidak valid (gunakan HH:MM)"
            });
        }

        // Cek jadwal apakah ada
        const existingJadwal = await prisma.jadwal.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingJadwal) {
            return res.status(404).json({
                success: false,
                message: "Jadwal tidak ditemukan"
            });
        }

        // Validasi kelas, mapel, guru exists
        const [kelasExists, mapelExists, guruExists] = await Promise.all([
            prisma.kelas.findFirst({
                where: { id: parseInt(kelas_id), deleted_at: null }
            }),
            prisma.mataPelajaran.findFirst({
                where: { id: parseInt(mapel_id), deleted_at: null }
            }),
            prisma.guru.findFirst({
                where: { id: parseInt(guru_id), deleted_at: null }
            })
        ]);

        if (!kelasExists) {
            return res.status(404).json({
                success: false,
                message: "Kelas tidak ditemukan"
            });
        }

        if (!mapelExists) {
            return res.status(404).json({
                success: false,
                message: "Mata pelajaran tidak ditemukan"
            });
        }

        if (!guruExists) {
            return res.status(404).json({
                success: false,
                message: "Guru tidak ditemukan"
            });
        }

        // Konversi jam ke format Time
        const jamMulaiTime = `${jam_mulai}:00`;
        const jamSelesaiTime = `${jam_selesai}:00`;

        // Validasi jam selesai harus setelah jam mulai
        const [jamMulaiHour, jamMulaiMinute] = jam_mulai.split(':').map(Number);
        const [jamSelesaiHour, jamSelesaiMinute] = jam_selesai.split(':').map(Number);
        
        const totalMulai = jamMulaiHour * 60 + jamMulaiMinute;
        const totalSelesai = jamSelesaiHour * 60 + jamSelesaiMinute;

        if (totalSelesai <= totalMulai) {
            return res.status(400).json({
                success: false,
                message: "Jam selesai harus setelah jam mulai"
            });
        }

        // Cek konflik dengan semua 4 kondisi overlap
        const [conflictKelas, conflictGuru] = await Promise.all([
            prisma.jadwal.findFirst({
                where: {
                    kelas_id: parseInt(kelas_id),
                    hari: hari.toUpperCase(),
                    deleted_at: null,
                    NOT: { id: parseInt(id) },
                    OR: [
                        {
                            AND: [
                                { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                                { jam_selesai: { gt: new Date(`1970-01-01T${jamMulaiTime}`) } }
                            ]
                        },
                        {
                            AND: [
                                { jam_mulai: { lt: new Date(`1970-01-01T${jamSelesaiTime}`) } },
                                { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                            ]
                        },
                        {
                            AND: [
                                { jam_mulai: { gte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                                { jam_selesai: { lte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                            ]
                        },
                        {
                            AND: [
                                { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                                { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                            ]
                        }
                    ]
                }
            }),
            prisma.jadwal.findFirst({
                where: {
                    guru_id: parseInt(guru_id),
                    hari: hari.toUpperCase(),
                    deleted_at: null,
                    NOT: { id: parseInt(id) },
                    OR: [
                        {
                            AND: [
                                { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                                { jam_selesai: { gt: new Date(`1970-01-01T${jamMulaiTime}`) } }
                            ]
                        },
                        {
                            AND: [
                                { jam_mulai: { lt: new Date(`1970-01-01T${jamSelesaiTime}`) } },
                                { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                            ]
                        },
                        {
                            AND: [
                                { jam_mulai: { gte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                                { jam_selesai: { lte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                            ]
                        },
                        {
                            AND: [
                                { jam_mulai: { lte: new Date(`1970-01-01T${jamMulaiTime}`) } },
                                { jam_selesai: { gte: new Date(`1970-01-01T${jamSelesaiTime}`) } }
                            ]
                        }
                    ]
                }
            })
        ]);

        if (conflictKelas) {
            return res.status(409).json({
                success: false,
                message: "Jadwal bentrok dengan jadwal kelas lain"
            });
        }

        if (conflictGuru) {
            return res.status(409).json({
                success: false,
                message: "Guru sudah memiliki jadwal pada waktu yang sama"
            });
        }

        // Update jadwal
        const updatedJadwal = await prisma.jadwal.update({
            where: {
                id: parseInt(id)
            },
            data: {
                hari: hari.toUpperCase(),
                kelas_id: parseInt(kelas_id),
                mapel_id: parseInt(mapel_id),
                guru_id: parseInt(guru_id),
                jam_mulai: new Date(`1970-01-01T${jamMulaiTime}`),
                jam_selesai: new Date(`1970-01-01T${jamSelesaiTime}`),
                updated_at: new Date()
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

        // Format response
        const formattedJadwal = {
            id: updatedJadwal.id,
            hari: updatedJadwal.hari,
            jam_mulai: formatTime(updatedJadwal.jam_mulai),
            jam_selesai: formatTime(updatedJadwal.jam_selesai),
            jam_lengkap: `${formatTime(updatedJadwal.jam_mulai)} - ${formatTime(updatedJadwal.jam_selesai)}`,
            kelas: updatedJadwal.kelas,
            mata_pelajaran: updatedJadwal.mata_pelajaran,
            guru: updatedJadwal.guru,
            updated_at: formatDateTime(updatedJadwal.updated_at)
        };

        return res.status(200).json({
            success: true,
            message: "Berhasil mengupdate jadwal",
            data: formattedJadwal
        });
    } catch (error) {
        console.error("Error updating jadwal:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// delete jadwal 
const deleteJadwal = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah jadwal ada
        const existingJadwal = await prisma.jadwal.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingJadwal) {
            return res.status(404).json({
                success: false,
                message: "Jadwal tidak ditemukan"
            });
        }

        // Soft delete jadwal 
        await prisma.jadwal.update({
            where: {
                id: parseInt(id)
            },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus jadwal"
        });
    } catch (error) {
        console.error("Error deleting jadwal:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    getAllJadwal,
    createJadwal,
    updateJadwal,
    deleteJadwal
};