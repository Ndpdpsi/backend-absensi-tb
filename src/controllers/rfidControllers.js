const prisma = require("../config/prisma");

// get all
const getAllRfid = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit

        // mencari data yang tidak di hapus
        const whereCondition = {
            deleted_at: null
        }

        const [data, total] = await Promise.all([
            prisma.RFID.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: {
                    created_at: "desc"
                },
                include: {
                    siswa: {
                        select: {
                            nama_siswa: true,
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
                    }
                }
            }),
            prisma.RFID.count({ where: whereCondition })
        ])

        return res.status(200).json({
            success: true,
            message: "berhasil mengambil seluruh data RFID Siswa",
            data: data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.log("error getting RFID:", error)
        return res.status(500).json({
            success: false,
            message: "terjadi kesalahan pada server",
            error: error.message
        })
    }
}

// get by id 
const getRfidById = async (req, res) => {
    try {
        const { id } = req.params

        const rfid = await prisma.RFID.findUnique({
            where: {
                id: parseInt(id),
                deleted_at: null
            },
            include: {
                siswa: {
                    select: {
                        nama_siswa: true
                    }
                }
            }
        })

        if (!rfid) {
            return res.status(404).json({
                success: false,
                message: "RFID tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            message: "berhasil mendapatkan data RFID",
            data: rfid
        })
    } catch (error) {
        console.error('error getting by id RFID', error)
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        })
    }
}

// create RFID 
const createRFID = async (req, res) => {
    try {
        const { uid_rfid, siswa_id } = req.body

        // validasi input
        if (!uid_rfid || !siswa_id) {
            return res.status(400).json({
                success: false,
                message: "Semua Field harus terisi"
            })
        }

        // cek duplikasi RFID
        const existingRFID = await prisma.RFID.findFirst({
            where: {
                uid_rfid,
                deleted_at: null
            }
        });

        if (existingRFID) {
            return res.status(409).json({
                success: false,
                message: "RFID sudah terdaftar"
            });
        }

        // cek duplikasi siswa yang sudah mempunyai RFID aktif
        const existingSiswaRFID = await prisma.RFID.findFirst({
            where: {
                siswa_id,
                is_active: true,
                deleted_at: null
            }
        });

        if (existingSiswaRFID) {
            return res.status(409).json({
                success: false,
                message: "Siswa sudah mempunyai RFID yang aktif"
            })
        }

        // cek apakah ada siswa
        const siswaExists = await prisma.siswa.findFirst({
            where: {
                id: siswa_id,
                deleted_at: null
            }
        });

        if (!siswaExists) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan"
            });
        }

        // buat RFID baru
        const newRFID = await prisma.RFID.create({
            data: {
                uid_rfid,
                siswa_id,
                is_active: true
            },
            include: {
                siswa: {
                    select: {
                        nama_siswa: true,
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
                }
            }
        })

        return res.status(201).json({
            success: true,
            message: "berhasil membuat data RFID baru",
            data: newRFID
        })
    } catch (error) {
        console.error("error creating RFID:", error)
        return res.status(500).json({
            success: false,
            message: "terjadi kesalahan pada server",
            error: error.message
        })
    }
}


// update RFID
const updateRFID = async (req, res) => {
    try {
        const { id } = req.params;
        const { uid_rfid, siswa_id, is_active } = req.body

        // validasi id 
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "ID tidak valid"
            })
        }

        // cek RFID
        const existingRFID = await prisma.RFID.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        })

        if (!existingRFID) {
            return res.status(404).json({
                success: false,
                message: "RFID tidak ditemukan"
            })
        }

        // build updateData
        const updateData = {}

        if (uid_rfid !== undefined) {
            // cek duplikasi uid_rfid
            const duplicateUID = await prisma.RFID.findFirst({
                where: {
                    uid_rfid,
                    id: { not: parseInt(id) },
                    deleted_at: null
                }
            })

            if (duplicateUID) {
                return res.status(409).json({
                    success: false,
                    message: "UID RFID sudah digunakan"
                })
            }

            updateData.uid_rfid = uid_rfid
        }

        if (siswa_id !== undefined) {
            updateData.siswa_id = siswa_id
        }

        if (is_active !== undefined) {
            updateData.is_active = is_active
        }

        const updatedRFID = await prisma.RFID.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                siswa: {
                    select: {
                        nama_siswa: true,
                        NISN: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "berhasil mengupdate data RFID",
            data: updatedRFID
        })
    } catch (error) {
        console.error("Error updating RFID:", error)
        return res.status(500).json({
            success: false,
            message: "terjadi kesalahan pada server",
            error: error.message
        })
    }
}

module.exports = {
    getAllRfid,
    getRfidById,
    createRFID,
    updateRFID
}