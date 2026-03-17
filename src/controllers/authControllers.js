const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register
const register = async (req, res) => {
    try {
        const { email, password, role, guru_id } = req.body;

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

        // Cek apakah sebelumnya sudah ada akun yang dihapus dengan email sama
        const deletedUser = await prisma.user.findFirst({
            where: {
                email,
                deleted_at: {
                    not: null
                }
            }
        });

        if (deletedUser) {
            // Restore akun tersebut
            const restoredUser = await prisma.user.update({
                where: {
                    id: deletedUser.id
                },
                data: {
                    deleted_at: null,
                    password: await bcrypt.hash(password, 10),
                    role,
                    guru_id: role === 'GURU' && guru_id ? parseInt(guru_id, 10) : null
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

            return res.status(200).json({
                success: true,
                message: "Berhasil mengembalikan user yang telah dihapus",
                data: restoredUser
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat user baru
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
                guru_id: role === 'GURU' && guru_id ? parseInt(guru_id, 10) : null
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
            message: "Registrasi berhasil",
            data: newUser
        });

    } catch (error) {
        console.error("Error in register:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email dan password wajib diisi"
            });
        }

        // Cari user berdasarkan email (yang tidak dihapus)
        const user = await prisma.user.findFirst({
            where: {
                email,
                deleted_at: null
            },
            include: {
                guru: {
                    select: {
                        id: true,
                        NIP: true,
                        nama: true,
                        nomor_telepon: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        // Buat access token
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                guru_id: user.guru_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // 24 jam
        );

        // Response (tanpa password)
        const { password: _, ...userData } = user;

        return res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: {
                user: userData,
                accessToken
            }
        });

    } catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        // Karena menggunakan stateless JWT, logout dilakukan di client side
        // Client menghapus token dari storage mereka
        
        return res.status(200).json({
            success: true,
            message: "Logout berhasil"
        });

    } catch (error) {
        console.error("Error in logout:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

// Get Current User
const me = async (req, res) => {
    try {
        // req.user sudah di-set dari middleware verifyToken
        const user = await prisma.user.findFirst({
            where: {
                id: req.user.id,
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
                        nomor_telepon: true
                    }
                },
                created_at: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Error in me:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    me
};