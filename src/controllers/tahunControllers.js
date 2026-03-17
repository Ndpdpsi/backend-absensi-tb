const prisma = require("../config/prisma");


// HELPER: Hitung tahun ajaran aktif berdasarkan tanggal hari ini
const generateTahunAjaran = (date = new Date()) => {
    const month = date.getMonth() + 1; // 1–12
    const year = date.getFullYear();

    const startYear = month >= 7 ? year : year - 1;
    const endYear = startYear + 1;

    return {
        tahun_ajaran: `${startYear}/${endYear}`,
        tanggal_mulai: new Date(startYear, 6, 1),   // 1 Juli
        tanggal_selesai: new Date(endYear, 5, 30),   // 30 Juni
    };
};

// Buat tahun ajaran baru jika belum ada untuk periode saat ini
const autoCreateTahunAjaran = async () => {
    const { tahun_ajaran, tanggal_mulai, tanggal_selesai } = generateTahunAjaran();

    // Sudah ada dan aktif → skip
    const existing = await prisma.Tahun.findFirst({
        where: { tahun_ajaran, deleted_at: null },
    });
    if (existing) return existing;

    // Pernah dibuat tapi soft-deleted → restore
    const deletedTahun = await prisma.Tahun.findFirst({
        where: { tahun_ajaran },
    });

    if (deletedTahun?.deleted_at) {
        const restored = await prisma.Tahun.update({
            where: { id: deletedTahun.id },
            data: {
                deleted_at: null,
                is_active: true,
                tanggal_mulai,
                tanggal_selesai,
                updated_at: new Date(),
            },
        });
        console.log(`[AUTO-RESTORE] Tahun ajaran dipulihkan: ${tahun_ajaran}`);
        return restored;
    }

    // Nonaktifkan semua tahun ajaran sebelumnya
    await prisma.Tahun.updateMany({
        where: { is_active: true, deleted_at: null },
        data: { is_active: false, updated_at: new Date() },
    });

    // Buat tahun ajaran baru
    const newTahun = await prisma.Tahun.create({
        data: {
            tahun_ajaran,
            tanggal_mulai,
            tanggal_selesai,
            is_active: true,
        },
    });

    console.log(
        `[AUTO-CREATE] Tahun ajaran baru: ${tahun_ajaran} | ` +
        `Mulai: ${tanggal_mulai.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} | ` +
        `Selesai: ${tanggal_selesai.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`
    );

    return newTahun;
};



// GET ALL
const getAllTahunAjaran = async (req, res) => {
    try {
        await autoCreateTahunAjaran();

        const tahun = await prisma.Tahun.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: "desc" },
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data tahun ajaran",
            data: tahun,
        });
    } catch (error) {
        console.error("Error getting tahun ajaran:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};



// GET BY ID
const getTahunAjaranById = async (req, res) => {
    try {
        const { id } = req.params;

        const tahun = await prisma.Tahun.findFirst({
            where: { id: parseInt(id), deleted_at: null },
        });

        if (!tahun) {
            return res.status(404).json({
                success: false,
                message: "Tahun ajaran tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data tahun ajaran",
            data: tahun,
        });
    } catch (error) {
        console.error("Error mendapatkan tahun ajaran by ID:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data tahun ajaran",
            error: error.message,
        });
    }
};



// CREATE (manual)
const createTahunAjaran = async (req, res) => {
    try {
        const { tahun_ajaran, tanggal_mulai, tanggal_selesai } = req.body;

        // Validasi wajib
        if (!tahun_ajaran) {
            return res.status(400).json({
                success: false,
                message: "Tahun ajaran wajib diisi",
            });
        }

        // Validasi format YYYY/YYYY
        const formatValid = /^\d{4}\/\d{4}$/.test(tahun_ajaran);
        if (!formatValid) {
            return res.status(400).json({
                success: false,
                message: "Format tahun ajaran tidak valid. Gunakan format: 2024/2025",
            });
        }

        // Validasi urutan tahun: endYear harus startYear + 1
        const [startYear, endYear] = tahun_ajaran.split("/").map(Number);
        if (endYear !== startYear + 1) {
            return res.status(400).json({
                success: false,
                message: "Tahun akhir harus tepat 1 tahun setelah tahun awal. Contoh: 2024/2025",
            });
        }

        // Hitung tanggal otomatis jika tidak dikirim
        const finalTanggalMulai = tanggal_mulai
            ? new Date(tanggal_mulai)
            : new Date(startYear, 6, 1);   // default: 1 Juli

        const finalTanggalSelesai = tanggal_selesai
            ? new Date(tanggal_selesai)
            : new Date(endYear, 5, 30);     // default: 30 Juni

        // Validasi tanggal mulai harus sebelum tanggal selesai
        if (finalTanggalMulai >= finalTanggalSelesai) {
            return res.status(400).json({
                success: false,
                message: "Tanggal mulai harus sebelum tanggal selesai",
            });
        }

        // Cek duplikat aktif
        const existingTahun = await prisma.Tahun.findFirst({
            where: { tahun_ajaran, deleted_at: null },
        });

        if (existingTahun) {
            return res.status(409).json({
                success: false,
                message: "Tahun ajaran sudah ada",
            });
        }

        // Restore jika pernah soft-deleted
        const deletedTahun = await prisma.Tahun.findFirst({
            where: { tahun_ajaran },
        });

        if (deletedTahun?.deleted_at) {
            const restored = await prisma.Tahun.update({
                where: { id: deletedTahun.id },
                data: {
                    deleted_at: null,
                    tanggal_mulai: finalTanggalMulai,
                    tanggal_selesai: finalTanggalSelesai,
                    updated_at: new Date(),
                },
            });

            return res.status(200).json({
                success: true,
                message: "Berhasil mengembalikan tahun ajaran yang dihapus",
                data: restored,
            });
        }

        // Buat baru
        const newTahun = await prisma.Tahun.create({
            data: {
                tahun_ajaran,
                tanggal_mulai: finalTanggalMulai,
                tanggal_selesai: finalTanggalSelesai,
                is_active: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Tahun ajaran berhasil dibuat",
            data: newTahun,
        });
    } catch (error) {
        console.error("Error creating tahun ajaran:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal menambahkan tahun ajaran baru",
            error: error.message,
        });
    }
};



// UPDATE
const updateTahunAjaran = async (req, res) => {
    try {
        const { id } = req.params;
        const { tahun_ajaran, tanggal_mulai, tanggal_selesai, is_active } = req.body;

        if (!tahun_ajaran) {
            return res.status(400).json({
                success: false,
                message: "Tahun ajaran wajib diisi",
            });
        }

        // Validasi format
        const formatValid = /^\d{4}\/\d{4}$/.test(tahun_ajaran);
        if (!formatValid) {
            return res.status(400).json({
                success: false,
                message: "Format tahun ajaran tidak valid. Gunakan format: 2024/2025",
            });
        }

        // Cek data yang akan diupdate
        const existingTahun = await prisma.Tahun.findFirst({
            where: { id: parseInt(id), deleted_at: null },
        });

        if (!existingTahun) {
            return res.status(404).json({
                success: false,
                message: "Tahun ajaran tidak ditemukan",
            });
        }

        // Cek duplikat (selain dirinya sendiri)
        const duplicate = await prisma.Tahun.findFirst({
            where: {
                tahun_ajaran,
                deleted_at: null,
                NOT: { id: parseInt(id) },
            },
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Tahun ajaran sudah ada",
            });
        }

        // Jika is_active di-set true, nonaktifkan yang lain
        if (is_active === true) {
            await prisma.Tahun.updateMany({
                where: {
                    is_active: true,
                    deleted_at: null,
                    NOT: { id: parseInt(id) },
                },
                data: { is_active: false, updated_at: new Date() },
            });
        }

        const updatedTahun = await prisma.Tahun.update({
            where: { id: parseInt(id) },
            data: {
                tahun_ajaran,
                ...(tanggal_mulai && { tanggal_mulai: new Date(tanggal_mulai) }),
                ...(tanggal_selesai && { tanggal_selesai: new Date(tanggal_selesai) }),
                ...(is_active !== undefined && { is_active }),
                updated_at: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: "Data tahun ajaran berhasil diupdate",
            data: updatedTahun,
        });
    } catch (error) {
        console.error("Error updating tahun:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengupdate data tahun ajaran",
            error: error.message,
        });
    }
};



// DELETE (soft delete)

const deleteTahunAjaran = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.Tahun.findFirst({
            where: { id: parseInt(id), deleted_at: null },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Data tahun ajaran tidak ditemukan",
            });
        }

        // Tidak boleh hapus tahun ajaran yang sedang aktif
        if (existing.is_active) {
            return res.status(400).json({
                success: false,
                message: "Tidak dapat menghapus tahun ajaran yang sedang aktif",
            });
        }

        // Tidak boleh hapus jika masih dipakai di kelas
        const usedInKelas = await prisma.kelas.count({
            where: { tahun_ajaran_id: parseInt(id), deleted_at: null },
        });

        if (usedInKelas > 0) {
            return res.status(400).json({
                success: false,
                message: "Data tahun ajaran masih digunakan di kelas, tidak dapat dihapus",
                details: `Terdapat ${usedInKelas} kelas yang menggunakan tahun ajaran ini`,
            });
        }

        await prisma.Tahun.update({
            where: { id: parseInt(id) },
            data: { deleted_at: new Date() },
        });

        return res.status(200).json({
            success: true,
            message: "Data tahun ajaran berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting tahun:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal menghapus data tahun ajaran",
            error: error.message,
        });
    }
};


module.exports = {
    getAllTahunAjaran,
    getTahunAjaranById,
    createTahunAjaran,
    updateTahunAjaran,
    deleteTahunAjaran,
    autoCreateTahunAjaran,
};