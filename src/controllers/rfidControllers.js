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

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
};

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
                            id: true,
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
                    }
                }
            }),
            prisma.RFID.count({ where: whereCondition })
        ])

        // Format response
        const formattedData = data.map(rfid => ({
            id: rfid.id,
            uid_rfid: rfid.uid_rfid,
            siswa_id: rfid.siswa_id,
            is_active: rfid.is_active,
            siswa: rfid.siswa,
            created_at: formatDateTime(rfid.created_at),
            updated_at: formatDateTime(rfid.updated_at)
        }));

        return res.status(200).json({
            success: true,
            message: "Berhasil mengambil seluruh data RFID siswa",
            data: formattedData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Error getting RFID:", error)
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        })
    }
}

// get by id 
const getRfidById = async (req, res) => {
    try {
        const { id } = req.params

        const rfid = await prisma.RFID.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            },
            include: {
                siswa: {
                    select: {
                        id: true,
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
                }
            }
        })

        if (!rfid) {
            return res.status(404).json({
                success: false,
                message: "RFID tidak ditemukan"
            });
        }

        // Format response
        const formattedRfid = {
            id: rfid.id,
            uid_rfid: rfid.uid_rfid,
            siswa_id: rfid.siswa_id,
            is_active: rfid.is_active,
            siswa: rfid.siswa,
            created_at: formatDateTime(rfid.created_at),
            updated_at: formatDateTime(rfid.updated_at)
        };

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data RFID",
            data: formattedRfid
        })
    } catch (error) {
        console.error('Error getting by id RFID', error)
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
                message: "Semua field harus terisi"
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
                        id: true,
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
                }
            }
        })

        // Format response
        const formattedRFID = {
            id: newRFID.id,
            uid_rfid: newRFID.uid_rfid,
            siswa_id: newRFID.siswa_id,
            is_active: newRFID.is_active,
            siswa: newRFID.siswa,
            created_at: formatDateTime(newRFID.created_at),
            updated_at: formatDateTime(newRFID.updated_at)
        };

        return res.status(201).json({
            success: true,
            message: "Berhasil membuat data RFID baru",
            data: formattedRFID
        })
    } catch (error) {
        console.error("Error creating RFID:", error)
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
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
            // Validasi siswa exists jika siswa_id diubah
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

            // Cek apakah siswa sudah punya RFID aktif lain
            if (is_active !== false) {
                const existingSiswaRFID = await prisma.RFID.findFirst({
                    where: {
                        siswa_id,
                        is_active: true,
                        id: { not: parseInt(id) },
                        deleted_at: null
                    }
                });

                if (existingSiswaRFID) {
                    return res.status(409).json({
                        success: false,
                        message: "Siswa sudah mempunyai RFID yang aktif"
                    });
                }
            }

            updateData.siswa_id = siswa_id
        }

        if (is_active !== undefined) {
            // Jika akan mengaktifkan RFID, cek apakah siswa sudah punya RFID aktif lain
            if (is_active === true) {
                const existingSiswaRFID = await prisma.RFID.findFirst({
                    where: {
                        siswa_id: siswa_id || existingRFID.siswa_id,
                        is_active: true,
                        id: { not: parseInt(id) },
                        deleted_at: null
                    }
                });

                if (existingSiswaRFID) {
                    return res.status(409).json({
                        success: false,
                        message: "Siswa sudah mempunyai RFID yang aktif"
                    });
                }
            }

            updateData.is_active = is_active
        }

        const updatedRFID = await prisma.RFID.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                siswa: {
                    select: {
                        id: true,
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
                }
            }
        });

        // Format response
        const formattedRFID = {
            id: updatedRFID.id,
            uid_rfid: updatedRFID.uid_rfid,
            siswa_id: updatedRFID.siswa_id,
            is_active: updatedRFID.is_active,
            siswa: updatedRFID.siswa,
            created_at: formatDateTime(updatedRFID.created_at),
            updated_at: formatDateTime(updatedRFID.updated_at)
        };

        return res.status(200).json({
            success: true,
            message: "Berhasil mengupdate data RFID",
            data: formattedRFID
        })
    } catch (error) {
        console.error("Error updating RFID:", error)
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        })
    }
}


// delete RFID 

const deleteRFID = async (req, res) => {
    try {
        const {id} = req.params;

        //  cek apakah RFID ada
        const existingRFID = await prisma.RFID.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingRFID) {
            return res.status(404).json({
                success: false,
                message: "RFID tidak ditemukan"
            });
        }

        // soft delete RFID
        await prisma.RFID.update({
            where: { id: parseInt(id) },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true, 
            message: "Berhasil menghapus data RFID"
        })
    } catch (error) {
        console.error("Error deleting RFID:", error)
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        })
    }
}

module.exports = {
    getAllRfid,
    getRfidById,
    createRFID,
    updateRFID,
    deleteRFID
}