const prisma = require("../config/prisma");
require('dotenv').config();



// get all orang tua
const getAllOrangTua = async (req, res) => {
    try {
        const orangTua = await prisma.orangTua.findMany({
            where: {
                deleted_at: null
            },
            orderBy: {
                created_at: "desc"
            },
            include: {
                siswa: {
                    where: {
                        deleted_at: null
                    },
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
                                }
                            }
                        }
                    }
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data orang tua",
            data: orangTua
        });
    } catch (error) {
        console.error("Error getting orang tua:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// get by id
const getOrangTuaById = async (req, res) => {
    try {
        const { id } = req.params;

        const orangTua = await prisma.orangTua.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            },
            include: {
                siswa: {
                    where: {
                        deleted_at: null
                    },
                    select: {
                        id: true,
                        nama: true,
                        NISN: true,
                        NIPD: true,
                        alamat: true,
                        nomor_telepon: true,
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
                                        tahun_ajaran: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!orangTua) {
            return res.status(404).json({
                success: false,
                message: "Data orang tua tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data orang tua",
            data: orangTua
        });
    } catch (error) {
        console.error("Error getting orang tua by id:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// menambahkan orang tua
const createOrangTua = async (req, res) => {
    try {
        const { nama_orangtua, nomor_telepon } = req.body;

        if (!nama_orangtua || !nomor_telepon) {
            return res.status(400).json({
                success: false,
                message: "Nama orang tua dan nomor telepon wajib diisi"
            });
        }

        // validasi format nomor telepon
        const phoneRegex = /^08[0-9]{8,11}$/;
        if (!phoneRegex.test(nomor_telepon)) {
            return res.status(400).json({
                success: false,
                message: "Format nomor telepon tidak valid (gunakan format: 08xx)"
            });
        }

        // Cek duplikasi nomor telepon
        const existingPhone = await prisma.orangTua.findFirst({
            where: {
                nomor_telepon: nomor_telepon,
                deleted_at: null
            }
        });

        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "Nomor telepon sudah terdaftar"
            });
        }


        const checkDeletedOrangTua = await prisma.orangTua.findFirst({
            where: {
                nama_orangtua: nama_orangtua
            }
        });

        if (checkDeletedOrangTua && checkDeletedOrangTua.deleted_at) {
            // restore orang tua yang sudah di soft delete
            return res.status(200).json({
                success: true,
                message: "Berhasil mengembalikan data orang tua yang sudah dihapus",
                data: checkDeletedOrangTua
            })
        }

        // create orang tua
        const newOrangTua = await prisma.orangTua.create({
            data: {
                nama_orangtua,
                nomor_telepon,
            }
        });

        return res.status(201).json({
            success: true,
            message: "Data orang tua berhasil ditambahkan",
            data: newOrangTua
        });
    } catch (error) {
        console.error("Error creating orang tua:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// update data orang tua
const updateOrangTua = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_orangtua, nomor_telepon } = req.body;

        // Validasi input
        if (!nama_orangtua || !nomor_telepon) {
            return res.status(400).json({
                success: false,
                message: "Nama orang tua dan nomor telepon wajib diisi"
            });
        }

        // Validasi format nomor telepon
        const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
        if (!phoneRegex.test(nomor_telepon)) {
            return res.status(400).json({
                success: false,
                message: "Format nomor telepon tidak valid (gunakan format: 08xx atau +62xx)"
            });
        }

        // Cek apakah orang tua ada
        const existingOrangTua = await prisma.orangTua.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingOrangTua) {
            return res.status(404).json({
                success: false,
                message: "Data orang tua tidak ditemukan"
            });
        }

        // Cek duplikasi nomor telepon (kecuali data sendiri)
        const duplicatePhone = await prisma.orangTua.findFirst({
            where: {
                nomor_telepon: nomor_telepon,
                deleted_at: null,
                NOT: {
                    id: parseInt(id)
                }
            }
        });

        if (duplicatePhone) {
            return res.status(409).json({
                success: false,
                message: "Nomor telepon sudah digunakan oleh orang tua lain"
            });
        }

        // Update data
        const updatedOrangTua = await prisma.orangTua.update({
            where: {
                id: parseInt(id)
            },
            data: {
                nama_orangtua,
                nomor_telepon,
                updated_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Data orang tua berhasil diupdate",
            data: updatedOrangTua
        });
    } catch (error) {
        console.error("Error updating orang tua:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// delete data orang tua (soft delete)
const deleteOrangTua = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah orang tua ada
        const existingOrangTua = await prisma.orangTua.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingOrangTua) {
            return res.status(404).json({
                success: false,
                message: "Data orang tua tidak ditemukan"
            });
        }

        // Cek apakah orang tua masih digunakan oleh siswa
        const usedBySiswa = await prisma.siswa.count({
            where: {
                orangtua_id: parseInt(id),
                deleted_at: null
            }
        });

        if (usedBySiswa > 0) {
            return res.status(400).json({
                success: false,
                message: "Data orang tua tidak dapat dihapus karena masih terkait dengan siswa",
                details: `Terdapat ${usedBySiswa} siswa yang terkait dengan orang tua ini`
            });
        }

        // Soft delete
        await prisma.orangTua.update({
            where: {
                id: parseInt(id)
            },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Data orang tua berhasil dihapus"
        });
    } catch (error) {
        console.error("Error deleting orang tua:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    getAllOrangTua,
    getOrangTuaById,
    createOrangTua,
    updateOrangTua,
    deleteOrangTua,
};