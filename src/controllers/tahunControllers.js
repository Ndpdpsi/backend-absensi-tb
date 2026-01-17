const prisma = require("../config/prisma");

// get all tahun ajaran
const getAllTahunAjaran = async (req, res) => {
    try {
        const tahun = await prisma.Tahun.findMany({
            where: {
                deleted_at: null
            },
            orderBy: {
                created_at: "desc"
            }
        });
        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data tahun ajaran",
            data: tahun
        });
    } catch (error) {
        console.error("Error getting tahun ajaran:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server"
        });
    }
}

//  get tahun ajaran by ID
const getTahunAjaranById = async (req, res) => {
    try {
        const { id } = req.params;

        const tahun = await prisma.Tahun.findUnique({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!tahun) {
            return res.status(404).json({
                success: false,
                message: "Tahun ajaran tidak ditemukan"
            });
        }


        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data tahun ajaran",
            data: tahun
        })
    } catch (error) {
        console.error('error gagal mendapatkan tahun ajaran by ID:', error);
        return res.status(500).json({
            success: false,
            message: "gagal mengambil data tahun ajaran"
        });

    }
}


const createTahunAjaran = async (req, res) => {
    try {
        const { tahun_ajaran } = req.body;

        // validasi input tahun ajaran
        if (!tahun_ajaran) {
            return res.status(400).json({
                success: false,
                message: "Tahun ajaran wajib diisi"
            });
        }

        // cek duplikat tahun ajaran
        const existingTahun = await prisma.Tahun.findFirst({
            where: {
                tahun_ajaran,
                deleted_at: null
            }
        });

        if (existingTahun) {
            return res.status(409).json({
                success: false,
                message: "Tahun ajaran sudah ada"
            });
        }

        // buat tahun ajaran baru

        const newTahun = await prisma.Tahun.create({
            data: {
                tahun_ajaran
            }
        });

        return res.status(201).json({
            success: true,
            message: "Tahun ajaran berhasil dibuat",
            data: newTahun
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Gagal menambahkan tahun ajaran baru"
        });
    }
}


// update tahun ajaran

const updateTahunAjaran = async (req, res) => {
    try {
        const { id } = req.params;
        const { tahun_ajaran } = req.body;

        // validasi input tahun ajaran
        if (!tahun_ajaran) {
            return res.status(400).json({
                success: false,
                message: "Tahun ajaran wajib diisi"
            });
        }

        // cek apakah tahun ajaran ada
        const existingTahun = await prisma.Tahun.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null,
            }
        });

        if (!existingTahun) {
            return res.status(404).json({
                success: false,
                message: "Tahun ajaran tidak ditemukan"
            });
        }

        const duplicate = await prisma.tahun.findFirst({
            where: {
                tahun_ajaran,
                deleted_at: null,
                NOT: {
                    id: parseInt(id),
                },
            },
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: 'Tahun ajaran sudah ada',
            });
        }

        // Update data
        const updatedTahun = await prisma.tahun.update({
            where: {
                id: parseInt(id),
            },
            data: {
                tahun_ajaran,
                updated_at: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Data tahun ajaran berhasil diupdate',
            data: updatedTahun,
        });
    } catch (error) {
        console.error('Error updating tahun:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengupdate data tahun ajaran',
        });
    }
}

// delete tahun ajaran (soft delete)

const deleteTahunAjaran = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah data ada
        const existing = await prisma.tahun.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Data tahun ajaran tidak ditemukan',
            });
        }

        // Cek apakah masih digunakan di tabel lain
        const usedInKelas = await prisma.kelas.count({
            where: {
                tahun_ajaran_id: parseInt(id),
                deleted_at: null,
            },
        });

        if (usedInKelas > 0) {
            return res.status(400).json({
                success: false,
                message: 'Data tahun ajaran masih digunakan di kelas, tidak dapat dihapus',
                details: `Terdapat ${usedInKelas} kelas yang menggunakan tahun ajaran ini`,
            });
        }

        // Soft delete
        await prisma.tahun.update({
            where: {
                id: parseInt(id),
            },
            data: {
                deleted_at: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Data tahun ajaran berhasil dihapus',
        });
    } catch (error) {
        console.error('Error deleting tahun:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus data tahun ajaran',
        });
    }

}

module.exports = {
    getAllTahunAjaran,
    getTahunAjaranById,
    createTahunAjaran,
    updateTahunAjaran,
    deleteTahunAjaran
};