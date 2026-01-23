const prisma = require("../config/prisma");

// GET ALL - Ambil semua data jurusan
const getAllJurusan = async (req, res) => {
    try {
        const jurusan = await prisma.jurusan.findMany({
            where: {
                deleted_at: null
            },
            orderBy: {
                created_at: "desc"
            }
        });
        
        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data jurusan",
            data: jurusan
        }); 
    } catch (error) {
        console.error("Error getting jurusan:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}

// GET BY ID - Ambil jurusan berdasarkan ID
const getJurusanById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const jurusan = await prisma.jurusan.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!jurusan) {
            return res.status(404).json({
                success: false,
                message: "Jurusan tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data jurusan",
            data: jurusan
        });
    } catch (error) {
        console.error("Error getting jurusan:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}

// CREATE
const createJurusan = async (req, res) => {
    try {
        const { nama_jurusan } = req.body;

        // Validasi input
        if (!nama_jurusan) {
            return res.status(400).json({
                success: false,
                message: "Nama jurusan wajib diisi"
            });
        }

        // Cek duplikasi
        const existingJurusan = await prisma.jurusan.findFirst({
            where: {
                nama_jurusan: nama_jurusan,
                deleted_at: null
            }
        });

        if (existingJurusan) {
            return res.status(409).json({
                success: false,
                message: "Jurusan sudah ada"
            });
        }

        // Buat data baru
        const newJurusan = await prisma.jurusan.create({
            data: {
                nama_jurusan
            }
        });
        
        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan jurusan baru",
            data: newJurusan
        });
    } catch (error) {
        console.error("Error creating jurusan:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}

// UPDATE - Update data jurusan
const updateJurusan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_jurusan } = req.body;

        // Validasi input
        if (!nama_jurusan) {
            return res.status(400).json({
                success: false,
                message: "Nama jurusan wajib diisi"
            });
        }

        // Cek apakah jurusan ada
        const existingJurusan = await prisma.jurusan.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingJurusan) {
            return res.status(404).json({
                success: false,
                message: "Jurusan tidak ditemukan"
            });
        }

        // Cek duplikasi (kecuali data sendiri)
        const duplicate = await prisma.jurusan.findFirst({
            where: {
                nama_jurusan: nama_jurusan,
                deleted_at: null,
                NOT: {
                    id: parseInt(id)
                }
            }
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Nama jurusan sudah digunakan"
            });
        }

        // Update jurusan
        const updatedJurusan = await prisma.jurusan.update({
            where: {
                id: parseInt(id)
            },
            data: {
                nama_jurusan,
                updated_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil memperbarui jurusan",
            data: updatedJurusan
        });
    } catch (error) {
        console.error("Error updating jurusan:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal update data jurusan",
            error: error.message
        });
    }
}

// DELETE - Soft delete jurusan
const deleteJurusan = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah jurusan ada
        const existingJurusan = await prisma.jurusan.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingJurusan) {
            return res.status(404).json({
                success: false,
                message: "Jurusan tidak ditemukan"
            });
        }

        // Cek apakah jurusan masih digunakan di kelas
        const usedInKelas = await prisma.kelas.count({
            where: {
                jurusan_id: parseInt(id),
                deleted_at: null
            }
        });

        if (usedInKelas > 0) {
            return res.status(400).json({
                success: false,
                message: "Jurusan tidak dapat dihapus karena masih digunakan di kelas",
                details: `Terdapat ${usedInKelas} kelas yang menggunakan jurusan ini`
            });
        }

        // Soft delete jurusan
        await prisma.jurusan.update({
            where: {
                id: parseInt(id)
            },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus jurusan"
        });
    } catch (error) {
        console.error("Error deleting jurusan:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal menghapus data jurusan",
            error: error.message
        });
    }
}

module.exports = {
    getAllJurusan,
    getJurusanById,
    createJurusan,
    updateJurusan,
    deleteJurusan
};