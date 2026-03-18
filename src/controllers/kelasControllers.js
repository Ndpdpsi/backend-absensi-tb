const prisma = require("../config/prisma");

// Get all kelas with pagination
const getAllKelas = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            deleted_at: null
        };

        const [data, total] = await Promise.all([
            prisma.kelas.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: {
                    created_at: "desc"
                },
                include: {
                    jurusan: {
                        select: {
                            id: true,
                            nama_jurusan: true
                        }
                    },
                    tahun: {
                        select: {
                            id: true,
                            tahun_ajaran: true
                        }
                    },
                    walas: {
                        select: {
                            id: true,
                            nama: true,
                            NIP: true
                        }
                    },
                    _count: {
                        select: {
                            siswa: true,
                            jadwal: true
                        }
                    }
                }
            }),
            prisma.kelas.count({
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
        console.error("Error in getAllKelas:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get kelas by ID
const getKelasById = async (req, res) => {
    try {
        const { id } = req.params;

        const kelas = await prisma.kelas.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            },
            include: {
                jurusan: {
                    select: {
                        id: true,
                        nama_jurusan: true
                    }
                },
                tahun: {
                    select: {
                        id: true,
                        tahun_ajaran: true
                    }
                },
                walas: {
                    select: {
                        id: true,
                        nama: true,
                        NIP: true
                    }
                },
                siswa: {
                    where: {
                        deleted_at: null
                    },
                    select: {
                        id: true,
                        nama: true,
                        nomor_telepon: true
                    }
                },
                _count: {
                    select: {
                        siswa: true,
                        jadwal: true
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

        return res.json({
            success: true,
            data: kelas
        });

    } catch (error) {
        console.error("Error in getKelasById:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create kelas
const createKelas = async (req, res) => {
    try {
        const {
            kelas,
            jurusan_id,
            tahun_ajaran_id,
            walas_id
        } = req.body;

        // Validasi input wajib
        if (!kelas || !jurusan_id || !tahun_ajaran_id) {
            return res.status(400).json({
                success: false,
                message: "Kelas, jurusan, dan tahun ajaran wajib diisi"
            });
        }

        // Validasi kelas tidak boleh kosong
        if (kelas.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nama kelas tidak boleh kosong"
            });
        }

        // Validasi jurusan_id harus angka
        if (isNaN(parseInt(jurusan_id))) {
            return res.status(400).json({
                success: false,
                message: "Jurusan ID harus berupa angka"
            });
        }

        // Validasi tahun_ajaran_id harus angka
        if (isNaN(parseInt(tahun_ajaran_id))) {
            return res.status(400).json({
                success: false,
                message: "Tahun ajaran ID harus berupa angka"
            });
        }

        // Validasi walas_id harus angka (jika diberikan)
        if (walas_id !== undefined && isNaN(parseInt(walas_id))) {
            return res.status(400).json({
                success: false,
                message: "Walas ID harus berupa angka"
            });
        }

        // Validasi jurusan exists
        const jurusanExists = await prisma.jurusan.findFirst({
            where: {
                id: parseInt(jurusan_id),
                deleted_at: null
            }
        });

        if (!jurusanExists) {
            return res.status(404).json({
                success: false,
                message: "Jurusan tidak ditemukan"
            });
        }

        // Validasi tahun ajaran exists
        const tahunExists = await prisma.tahun.findFirst({
            where: {
                id: parseInt(tahun_ajaran_id),
                deleted_at: null
            }
        });

        if (!tahunExists) {
            return res.status(404).json({
                success: false,
                message: "Tahun ajaran tidak ditemukan"
            });
        }

        // Validasi walas exists + cek konflik (jika diberikan)
        if (walas_id) {
            const walasExists = await prisma.guru.findFirst({
                where: {
                    id: parseInt(walas_id),
                    deleted_at: null
                }
            });

            if (!walasExists) {
                return res.status(404).json({
                    success: false,
                    message: "Guru (walas) tidak ditemukan"
                });
            }

            // 1 guru hanya boleh jadi walas 1 kelas per tahun ajaran
            const sudahWalas = await prisma.kelas.findFirst({
                where: {
                    walas_id: parseInt(walas_id),
                    tahun_ajaran_id: parseInt(tahun_ajaran_id),
                    deleted_at: null
                }
            });

            if (sudahWalas) {
                return res.status(409).json({
                    success: false,
                    message: "Guru ini sudah menjadi wali kelas di kelas lain pada tahun ajaran yang sama"
                });
            }
        }

        // Cek duplikasi kelas (kelas + jurusan + tahun ajaran yang sama)
        const existingKelas = await prisma.kelas.findFirst({
            where: {
                kelas: kelas.trim(),
                jurusan_id: parseInt(jurusan_id),
                tahun_ajaran_id: parseInt(tahun_ajaran_id),
                deleted_at: null
            }
        });

        if (existingKelas) {
            return res.status(409).json({
                success: false,
                message: "Kelas dengan jurusan dan tahun ajaran yang sama sudah terdaftar"
            });
        }

        // Buat kelas baru
        const newKelas = await prisma.kelas.create({
            data: {
                kelas: kelas.trim(),
                jurusan_id: parseInt(jurusan_id),
                tahun_ajaran_id: parseInt(tahun_ajaran_id),
                walas_id: walas_id ? parseInt(walas_id) : null
            },
            include: {
                jurusan: {
                    select: {
                        id: true,
                        nama_jurusan: true
                    }
                },
                tahun: {
                    select: {
                        id: true,
                        tahun_ajaran: true
                    }
                },
                walas: {
                    select: {
                        id: true,
                        nama: true,
                        NIP: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan kelas baru",
            data: newKelas
        });

    } catch (error) {
        console.error("Error creating kelas:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Update kelas
const updateKelas = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            kelas,
            jurusan_id,
            tahun_ajaran_id,
            walas_id
        } = req.body;

        // Validasi input wajib
        if (!kelas || !jurusan_id || !tahun_ajaran_id) {
            return res.status(400).json({
                success: false,
                message: "Kelas, jurusan, dan tahun ajaran wajib diisi"
            });
        }

        // Validasi kelas tidak boleh kosong
        if (kelas.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nama kelas tidak boleh kosong"
            });
        }

        // Validasi jurusan_id harus angka
        if (isNaN(parseInt(jurusan_id))) {
            return res.status(400).json({
                success: false,
                message: "Jurusan ID harus berupa angka"
            });
        }

        // Validasi tahun_ajaran_id harus angka
        if (isNaN(parseInt(tahun_ajaran_id))) {
            return res.status(400).json({
                success: false,
                message: "Tahun ajaran ID harus berupa angka"
            });
        }

        // Validasi walas_id harus angka (jika diberikan)
        if (walas_id !== undefined && walas_id !== null && isNaN(parseInt(walas_id))) {
            return res.status(400).json({
                success: false,
                message: "Walas ID harus berupa angka"
            });
        }

        // Cek kelas apakah ada
        const existingKelas = await prisma.kelas.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingKelas) {
            return res.status(404).json({
                success: false,
                message: "Kelas tidak ditemukan"
            });
        }

        // Validasi jurusan exists
        const jurusanExists = await prisma.jurusan.findFirst({
            where: {
                id: parseInt(jurusan_id),
                deleted_at: null
            }
        });

        if (!jurusanExists) {
            return res.status(404).json({
                success: false,
                message: "Jurusan tidak ditemukan"
            });
        }

        // Validasi tahun ajaran exists
        const tahunExists = await prisma.tahun.findFirst({
            where: {
                id: parseInt(tahun_ajaran_id),
                deleted_at: null
            }
        });

        if (!tahunExists) {
            return res.status(404).json({
                success: false,
                message: "Tahun ajaran tidak ditemukan"
            });
        }

        // Validasi walas exists 
        if (walas_id) {
            const walasExists = await prisma.guru.findFirst({
                where: {
                    id: parseInt(walas_id),
                    deleted_at: null
                }
            });

            if (!walasExists) {
                return res.status(404).json({
                    success: false,
                    message: "Guru (walas) tidak ditemukan"
                });
            }

            // 1 guru hanya boleh jadi walas 1 kelas per tahun ajaran (kecuali kelas ini sendiri)
            const konflikWalas = await prisma.kelas.findFirst({
                where: {
                    walas_id: parseInt(walas_id),
                    tahun_ajaran_id: parseInt(tahun_ajaran_id),
                    deleted_at: null,
                    NOT: {
                        id: parseInt(id)
                    }
                }
            });

            if (konflikWalas) {
                return res.status(409).json({
                    success: false,
                    message: "Guru ini sudah menjadi wali kelas di kelas lain pada tahun ajaran yang sama"
                });
            }
        }

        // Cek duplikasi (kecuali data sendiri)
        const duplicateKelas = await prisma.kelas.findFirst({
            where: {
                kelas: kelas.trim(),
                jurusan_id: parseInt(jurusan_id),
                tahun_ajaran_id: parseInt(tahun_ajaran_id),
                deleted_at: null,
                NOT: {
                    id: parseInt(id)
                }
            }
        });

        if (duplicateKelas) {
            return res.status(409).json({
                success: false,
                message: "Kelas dengan jurusan dan tahun ajaran yang sama sudah terdaftar"
            });
        }

        // Update kelas
        const updatedKelas = await prisma.kelas.update({
            where: {
                id: parseInt(id)
            },
            data: {
                kelas: kelas.trim(),
                jurusan_id: parseInt(jurusan_id),
                tahun_ajaran_id: parseInt(tahun_ajaran_id),

                walas_id: walas_id === null ? null
                    : walas_id ? parseInt(walas_id)
                    : existingKelas.walas_id,
                updated_at: new Date()
            },
            include: {
                jurusan: {
                    select: {
                        id: true,
                        nama_jurusan: true
                    }
                },
                tahun: {
                    select: {
                        id: true,
                        tahun_ajaran: true
                    }
                },
                walas: {
                    select: {
                        id: true,
                        nama: true,
                        NIP: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil mengupdate data kelas",
            data: updatedKelas
        });

    } catch (error) {
        console.error("Error updating kelas:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Delete kelas (soft delete)
const deleteKelas = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek kelas apakah ada
        const existingKelas = await prisma.kelas.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingKelas) {
            return res.status(404).json({
                success: false,
                message: "Kelas tidak ditemukan"
            });
        }

        // Cek apakah masih ada siswa di kelas ini
        const hasSiswa = await prisma.siswa.count({
            where: {
                kelas_id: parseInt(id),
                deleted_at: null
            }
        });

        if (hasSiswa > 0) {
            return res.status(400).json({
                success: false,
                message: `Kelas tidak dapat dihapus karena masih memiliki ${hasSiswa} siswa aktif`
            });
        }

        // Cek apakah masih ada jadwal di kelas ini
        const hasJadwal = await prisma.jadwal.count({
            where: {
                kelas_id: parseInt(id),
                deleted_at: null
            }
        });

        if (hasJadwal > 0) {
            return res.status(400).json({
                success: false,
                message: `Kelas tidak dapat dihapus karena masih memiliki ${hasJadwal} jadwal aktif`
            });
        }

        // Soft delete
        await prisma.kelas.update({
            where: {
                id: parseInt(id)
            },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus data kelas"
        });

    } catch (error) {
        console.error("Error deleting kelas:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Assign / hapus walas kelas
const assignWalas = async (req, res) => {
    try {
        const { id } = req.params;
        const { walas_id } = req.body;

        if (walas_id !== null && walas_id !== undefined && isNaN(parseInt(walas_id))) {
            return res.status(400).json({
                success: false,
                message: "Walas ID harus berupa angka"
            });
        }

        const kelas = await prisma.kelas.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!kelas) {
            return res.status(404).json({
                success: false,
                message: "Kelas tidak ditemukan"
            });
        }

        if (walas_id) {
            const walasExists = await prisma.guru.findFirst({
                where: {
                    id: parseInt(walas_id),
                    deleted_at: null
                }
            });

            if (!walasExists) {
                return res.status(404).json({
                    success: false,
                    message: "Guru (walas) tidak ditemukan"
                });
            }

            // 1 guru hanya boleh jadi walas 1 kelas per tahun ajaran
            const konflik = await prisma.kelas.findFirst({
                where: {
                    walas_id: parseInt(walas_id),
                    tahun_ajaran_id: kelas.tahun_ajaran_id,
                    deleted_at: null,
                    NOT: {
                        id: parseInt(id)
                    }
                }
            });

            if (konflik) {
                return res.status(409).json({
                    success: false,
                    message: "Guru ini sudah menjadi wali kelas di kelas lain pada tahun ajaran yang sama"
                });
            }
        }

        const updated = await prisma.kelas.update({
            where: {
                id: parseInt(id)
            },
            data: {
                walas_id: walas_id ? parseInt(walas_id) : null
            },
            include: {
                jurusan: {
                    select: {
                        id: true,
                        nama_jurusan: true
                    }
                },
                tahun: {
                    select: {
                        id: true,
                        tahun_ajaran: true
                    }
                },
                walas: {
                    select: {
                        id: true,
                        nama: true,
                        NIP: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: walas_id ? "Berhasil menetapkan wali kelas" : "Berhasil menghapus wali kelas",
            data: updated
        });

    } catch (error) {
        console.error("Error assign walas:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    getAllKelas,
    getKelasById,
    createKelas,
    updateKelas,
    deleteKelas,
    assignWalas
};