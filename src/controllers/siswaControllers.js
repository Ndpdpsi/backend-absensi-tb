const prisma = require("../config/prisma");

// get all siswa 
const getAllSiswa = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            deleted_at: null
        };

        const [data, total] = await Promise.all([
            prisma.siswa.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: {
                    created_at: "desc"
                },
                include: {
                    orang_tua: {
                        select: {
                            id: true,
                            nama_orangtua: true,
                            nomor_telepon: true
                        }
                    },
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
                    rfid: {
                        where: {
                            deleted_at: null,
                            is_active: true
                        }
                    }
                }
            }),
            prisma.siswa.count({
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
        console.error("Error in getAllSiswa:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// get user by ID
const getSiswaById = async (req, res) => {
    try {
        const { id } = req.params;
        const siswa = await prisma.siswa.findUnique({
            where: {
                id,
                deleted_at: null
            },
            include: {
                orang_tua: {
                    select: {
                        id: true,
                        nama_orangtua: true,
                        nomor_telepon: true
                    }
                },
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
                rfid: {
                    where: {
                        deleted_at: null,
                        is_active: true
                    }
                }
            }
        });

        if (!siswa) {
            return res.status(404).json({
                success: false,
                message: "Siswa not found"
            });
        }

        return res.json({
            success: true,
            data: siswa
        });

    } catch (error) {
        console.error("Error in getSiswaById:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};




module.exports = {
    getAllSiswa,
    getSiswaById
};