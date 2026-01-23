const prisma = require("../config/prisma");

// get all siswa 
const getAllSiswa = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // mencari data yang tidak di hapus
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
                        },
                        select: {
                            id: true,
                            uid_rfid: true,
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
            message: "Terjadi kesalahan pada server",
            message: error.message
        });
    }
};

// get siswa by ID
const getSiswaById = async (req, res) => {
    try {
        const { id } = req.params;

        const siswa = await prisma.siswa.findFirst({
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
                    },
                    select: {
                        id: true,
                        uid_rfid: true,
                        is_active: true
                    }
                }
            }
        });

        if (!siswa) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan"
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
            message: "Terjadi kesalahan pada server",
            message: error.message
        });
    }
};

// create data siswa 
const createSiswa = async (req, res) => {
    try {
        const {
            NISN,
            NIPD,
            nama_siswa,
            alamat,
            gender,
            tanggal_lahir,
            nomor_telepon,
            kelas_id,
            orangtua_id
        } = req.body;

        // Validasi input 
        if (!NISN || !NIPD || !nama_siswa || !alamat || !gender || !tanggal_lahir || !nomor_telepon || !kelas_id) {
            return res.status(400).json({
                success: false,
                message: "NISN, NIPD, nama siswa, alamat, gender, tanggal lahir, nomor telepon, dan kelas wajib diisi"
            });
        }

        // validasi NISN harus angka
        if (!/^\d+$/.test(NISN)) {
            return res.status(400).json({
                success: false,
                message: "NISN harus berupa angka"
            });
        }

        // validasi NIPD harus angka
        if (!/^\d+$/.test(NIPD)) {
            return res.status(400).json({
                success: false,
                message: "NIPD harus berupa angka"
            });
        }


        // Validasi kelas_id harus angka
        if (isNaN(parseInt(kelas_id))) {
            return res.status(400).json({
                success: false,
                message: "Kelas ID harus berupa angka"
            });
        }

        // Cek duplikasi NISN
        const existingNISN = await prisma.Siswa.findFirst({
            where: {
                NISN,
                deleted_at: null
            }
        });

        if (existingNISN) {
            return res.status(409).json({
                success: false,
                message: "NISN sudah terdaftar"
            });
        }

        // Cek duplikasi NIPD
        const existingNIPD = await prisma.Siswa.findFirst({
            where: {
                NIPD,
                deleted_at: null
            }
        });

        if (existingNIPD) {
            return res.status(409).json({
                success: false,
                message: "NIPD sudah terdaftar"
            });
        }

        // Validasi kelas exists 
        const kelasExists = await prisma.Kelas.findFirst({
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

        // Validasi orangtua exists 
        if (orangtua_id) {
            const orangTuaExists = await prisma.OrangTua.findFirst({
                where: {
                    id: parseInt(orangtua_id),
                    deleted_at: null
                }
            });

            if (!orangTuaExists) {
                return res.status(404).json({
                    success: false,
                    message: "Orang tua tidak ditemukan"
                });
            }
        }

        // Konversi tanggal lahir
        let tanggalLahirDate = new Date(tanggal_lahir);
        if (isNaN(tanggalLahirDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)"
            });
        }

        // Buat data siswa baru
        const newSiswa = await prisma.siswa.create({
            data: {
                NISN: NISN,
                NIPD: NIPD,
                nama_siswa,
                alamat,
                gender,
                tanggal_lahir: tanggalLahirDate,
                nomor_telepon,
                kelas_id: parseInt(kelas_id),
                orangtua_id: orangtua_id ? parseInt(orangtua_id) : null
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
                orang_tua: {
                    select: {
                        nama_orangtua: true,
                        nomor_telepon: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan siswa baru",
            data: newSiswa
        });
    } catch (error) {
        console.error("Error creating siswa:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// update data siswa
const updateSiswa = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            NISN,
            NIPD,
            nama_siswa,
            alamat,
            gender,
            tanggal_lahir,
            nomor_telepon,
            kelas_id,
            orangtua_id
        } = req.body;

        // Validasi input wajib - KELAS_ID WAJIB
        if (!NISN || !NIPD || !nama_siswa || !alamat || !gender || !tanggal_lahir || !nomor_telepon || !kelas_id) {
            return res.status(400).json({
                success: false,
                message: "NISN, NIPD, nama siswa, alamat, gender, tanggal lahir, nomor telepon, dan kelas wajib diisi"
            });
        }

        // Validasi NISN harus angka
        if (!/^\d+$/.test(NISN)) {
            return res.status(400).json({
                success: false,
                message: "NISN harus berupa angka"
            });
        }

        // Validasi NIPD harus angka
        if (!/^\d+$/.test(NIPD)) {
            return res.status(400).json({
                success: false,
                message: "NIPD harus berupa angka"
            });
        }

        // Validasi kelas_id harus angka
        if (isNaN(parseInt(kelas_id))) {
            return res.status(400).json({
                success: false,
                message: "Kelas ID harus berupa angka"
            });
        }

        // Cek siswa apakah ada
        const existingSiswa = await prisma.siswa.findFirst({
            where: {
                id: id,
                deleted_at: null
            }
        });

        if (!existingSiswa) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan"
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

        // Validasi orangtua exists (jika diisi)
        if (orangtua_id) {
            const orangTuaExists = await prisma.orang_tua.findFirst({
                where: {
                    id: parseInt(orangtua_id),
                    deleted_at: null
                }
            });

            if (!orangTuaExists) {
                return res.status(404).json({
                    success: false,
                    message: "Orang tua tidak ditemukan"
                });
            }
        }

        // Cek duplikasi NISN (kecuali data sendiri)
        const duplicateNISN = await prisma.siswa.findFirst({
            where: {
                NISN,
                deleted_at: null,
                NOT: {
                    id: id
                }
            }
        });

        if (duplicateNISN) {
            return res.status(409).json({
                success: false,
                message: "NISN sudah digunakan oleh siswa lain"
            });
        }

        // Cek duplikasi NIPD (kecuali data sendiri)
        const duplicateNIPD = await prisma.siswa.findFirst({
            where: {
                NIPD,
                deleted_at: null,
                NOT: {
                    id: id
                }
            }
        });

        if (duplicateNIPD) {
            return res.status(409).json({
                success: false,
                message: "NIPD sudah digunakan oleh siswa lain"
            });
        }

        // Konversi tanggal lahir
        let tanggalLahirDate = new Date(tanggal_lahir);
        if (isNaN(tanggalLahirDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)"
            });
        }

        // Update data
        const updatedSiswa = await prisma.siswa.update({
            where: {
                id: id
            },
            data: {
                NISN,
                NIPD,
                nama_siswa,
                alamat,
                gender,
                tanggal_lahir: tanggalLahirDate,
                nomor_telepon,
                kelas_id: parseInt(kelas_id),
                orangtua_id: orangtua_id ? parseInt(orangtua_id) : null,
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
                orang_tua: {
                    select: {
                        nama_orangtua: true,
                        nomor_telepon: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil mengupdate data siswa",
            data: updatedSiswa
        });
    } catch (error) {
        console.error("Error updating siswa:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// delete siswa (soft delete)
const deleteSiswa = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek siswa apakah ada
        const existingSiswa = await prisma.siswa.findFirst({
            where: {
                id: id,
                deleted_at: null
            }
        });

        if (!existingSiswa) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan"
            });
        }

        // Cek apakah masih punya RFID aktif
        const hasRFID = await prisma.rFID.count({
            where: {
                siswa_id: id,
                deleted_at: null,
                is_active: true
            }
        });

        if (hasRFID > 0) {
            return res.status(400).json({
                success: false,
                message: "Siswa tidak dapat dihapus karena masih memiliki RFID aktif"
            });
        }

        // Soft delete
        await prisma.siswa.update({
            where: {
                id: id
            },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus data siswa"
        });
    } catch (error) {
        console.error("Error deleting siswa:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    getAllSiswa,
    getSiswaById,
    createSiswa,
    updateSiswa,
    deleteSiswa
};