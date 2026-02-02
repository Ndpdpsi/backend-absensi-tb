const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");

// get all users
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // mencari data yang tidak di hapus
        const whereCondition = {
            deleted_at: null
        };

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: {
                    created_at: "desc"
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    guru_id: true,
                    guru: {
                        select: {
                            id: true,
                            NIP: true,
                            nama: true,
                            nomor_telepon: true
                        }
                    },
                    created_at: true,
                    updated_at: true,
                    deleted_at: true
                }
            }),
            prisma.user.count({
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
        console.error("Error in getAllUsers:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findFirst({
            where: {
                id,
                deleted_at: null
            },
            select: {
                id: true,
                email: true,
                role: true,
                guru_id: true,
                guru: {
                    select: {
                        id: true,
                        NIP: true,
                        nama: true,
                        nomor_telepon: true,
                        alamat: true,
                        tanggal_lahir: true
                    }
                },
                created_at: true,
                updated_at: true,
                deleted_at: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        return res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Error in getUserById:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// create user
const createUser = async (req, res) => {
    try {
        const {
            email,
            password,
            role,
            guru_id
        } = req.body;

        // Validasi input
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Email, password, dan role wajib diisi"
            });
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Format email tidak valid"
            });
        }

        // Validasi role
        if (!['ADMIN', 'GURU'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role harus ADMIN atau GURU"
            });
        }

        // Validasi password minimal 6 karakter
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password minimal 6 karakter"
            });
        }

        // Cek duplikasi email
        const existingEmail = await prisma.user.findFirst({
            where: {
                email,
                deleted_at: null
            }
        });

        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email sudah terdaftar"
            });
        }

        // Validasi guru_id jika role GURU
        if (role === 'GURU') {
            if (!guru_id) {
                return res.status(400).json({
                    success: false,
                    message: "Guru ID wajib diisi untuk role GURU"
                });
            }

            // Validasi guru_id harus angka
            if (isNaN(parseInt(guru_id))) {
                return res.status(400).json({
                    success: false,
                    message: "Guru ID harus berupa angka"
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

            // Cek apakah guru sudah memiliki user
            const guruHasUser = await prisma.user.findFirst({
                where: {
                    guru_id: parseInt(guru_id),
                    deleted_at: null
                }
            });

            if (guruHasUser) {
                return res.status(409).json({
                    success: false,
                    message: "Guru sudah memiliki akun user"
                });
            }
        }

        // cek apakah sebelumnya sudah ada akun yang dihapus dengan email sama
        const deletedUser = await prisma.user.findFirst({
            where: {
                email,
                deleted_at: {
                    not: null
                }
            }
        })

        if (deletedUser && deletedUser.deleted_at) {
            // restore akun tersebut
            const restoredUser = await prisma.user.update({
                where: {
                    id: deletedUser.id
                },
                data: {
                    deleted_at: null,
                    password: await bcrypt.hash(password, 10),
                    role,
                    guru_id: role === 'GURU' && guru_id ? parseInt(guru_id) : null
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    guru_id: true,
                    guru: {
                        select: {
                            id: true,
                            NIP: true,
                            nama: true,
                            nomor_telepon: true
                        }
                    },
                    created_at: true,
                }
            })

            return res.status(200).json({
                success: true, 
                message: "Berhasil mengembalikan user yang telah dihapus",
                data: restoredUser
            })
        }


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat user baru
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
                guru_id: role === 'GURU' && guru_id ? parseInt(guru_id) : null
            },
            select: {
                id: true,
                email: true,
                role: true,
                guru_id: true,
                guru: {
                    select: {
                        id: true,
                        NIP: true,
                        nama: true,
                        nomor_telepon: true
                    }
                },
                created_at: true,
                updated_at: true,
                deleted_at: true
            }
        });

        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan user baru",
            data: newUser
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            email,
            password,
            role,
            guru_id
        } = req.body;

        // Validasi input wajib
        if (!email || !role) {
            return res.status(400).json({
                success: false,
                message: "Email dan role wajib diisi"
            });
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Format email tidak valid"
            });
        }

        // Validasi role
        if (!['ADMIN', 'GURU'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role harus ADMIN atau GURU"
            });
        }

        // Cek user apakah ada
        const existingUser = await prisma.user.findFirst({
            where: {
                id: id,
                deleted_at: null
            }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Cek duplikasi email (kecuali data sendiri)
        const duplicateEmail = await prisma.user.findFirst({
            where: {
                email,
                deleted_at: null,
                NOT: {
                    id: id
                }
            }
        });

        if (duplicateEmail) {
            return res.status(409).json({
                success: false,
                message: "Email sudah digunakan oleh user lain"
            });
        }

        // Validasi guru_id jika role GURU
        if (role === 'GURU') {
            if (!guru_id) {
                return res.status(400).json({
                    success: false,
                    message: "Guru ID wajib diisi untuk role GURU"
                });
            }

            // Validasi guru_id harus angka
            if (isNaN(parseInt(guru_id))) {
                return res.status(400).json({
                    success: false,
                    message: "Guru ID harus berupa angka"
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

            // Cek apakah guru sudah memiliki user (kecuali user ini sendiri)
            const guruHasUser = await prisma.user.findFirst({
                where: {
                    guru_id: parseInt(guru_id),
                    deleted_at: null,
                    NOT: {
                        id: id
                    }
                }
            });

            if (guruHasUser) {
                return res.status(409).json({
                    success: false,
                    message: "Guru sudah memiliki akun user lain"
                });
            }
        }

        // Persiapkan data update
        const updateData = {
            email,
            role,
            guru_id: role === 'GURU' && guru_id ? parseInt(guru_id) : null,
            updated_at: new Date()
        };

        // Hash password baru jika ada
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password minimal 6 karakter"
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update data
        const updatedUser = await prisma.user.update({
            where: {
                id: id
            },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                guru_id: true,
                guru: {
                    select: {
                        id: true,
                        NIP: true,
                        nama: true,
                        nomor_telepon: true
                    }
                },
                created_at: true,
                updated_at: true,
                deleted_at: true
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil mengupdate data user",
            data: updatedUser
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// delete user (soft delete)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek user apakah ada
        const existingUser = await prisma.user.findFirst({
            where: {
                id: id,
                deleted_at: null
            }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Soft delete
        await prisma.user.update({
            where: {
                id: id
            },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus data user"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};