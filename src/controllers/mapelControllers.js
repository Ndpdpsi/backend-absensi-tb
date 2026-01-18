const prisma = require("../config/prisma");

// GET ALL mapel 

const getAllMapel = async (req, res) => {
    try {
        const mapel = await prisma.MataPelajaran.findMany({
            where: {
                deleted_at: null
            },
            orderBy: {
                created_at: "desc"
            }
        });
        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data mata pelajaran",
            data: mapel
        });
    } catch (error) {
        console.log("Error getting mapel:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}


// GET BY ID mapel

const getMapelById = async (req, res) => {
    try {
        const { id } = req.params;

        const mapel = await prisma.MataPelajaran.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!mapel) {
            return res.status(404).json({
                success: false,
                message: "Mata pelajaran tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data mata pelajaran",
            data: mapel
        });
    } catch (error) {
        console.log("Error getting mapel:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}

// create mapel 

const createMapel = async (req, res) => {
    try {
        const { nama_mapel} = req.body;

        // Valdisasi input
        if (!nama_mapel) {
            return res.status(400).json({
                success: false,
                message: "Nama mata pelajaran wajib diisi"
            });
        }

        // Cek duplikasi nama mapel

        const existingMapel = await prisma.MataPelajaran.findFirst({
            where: {
                nama_mapel: nama_mapel,
                deleted_at: null
            }
        });

        if (existingMapel) {
            return res.status(409).json({
                success: false,
                message: "Nama mata pelajaran sudah ada"
            });
        }


        // Buat data baru
        const newMapel = await prisma.MataPelajaran.create({
            data: {
                nama_mapel: nama_mapel
            }
        });

        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan mata pelajaran",
            data: newMapel
        })
    } catch (error) {
        console.log("Error creating mapel:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}


// update - update data mapel

const updateMapel = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_mapel } = req.body;

        // Validasi input
        if (!nama_mapel) {
            return res.status(400).json({
                success: false,
                message: "Nama mata pelajaran wajib diisi"
            });
        }

        // cek apakah jurusan ada

        const existingMapel = await prisma.MataPelajaran.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingMapel) {
            return res.status(404).json({
                success: false,
                message: "Mata pelajaran tidak ditemukan"
            });
        }

        // cek duplikasi nama mapel

        const duplicateMapel = await prisma.MataPelajaran.findFirst({
            where: {
                nama_mapel: nama_mapel,
                deleted_at: null,
                NOT: {
                    id: parseInt(id)
                }
            }
        }); 

        if (duplicateMapel) {
            return res.status(409).json({
                success: false,
                message: "Nama mata pelajaran sudah ada"
            });
        }

        // update mapel

        const updatedMapel = await prisma.MataPelajaran.update({
            where: {
                id: parseInt(id)
            },
            data: {
                nama_mapel: nama_mapel
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil memperbarui mata pelajaran",
            data: updatedMapel
        });
    } catch (error) {
        console.log("Error updating mapel:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}


// delete mapel (soft delete)

const deleteMapel = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah mapel ada
        const existingMapel = await prisma.MataPelajaran.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingMapel) {
            return res.status(404).json({
                success: false,
                message: "Mata pelajaran tidak ditemukan"
            });
        }

        // Cek apakah mapel digunakan di tabel lain

        const usedInJadwal = await prisma.Jadwal.count({
            where: {
                mapel_id: parseInt(id),
                deleted_at: null
            }
        });

        if (usedInJadwal > 0) {
            return res.status(400).json({
                success: false,
                message: "Mata pelajaran masih digunakan di jadwal"
            });
        }


        // soft delete mapel
        await prisma.MataPelajaran.update({
            where: {
                id: parseInt(id)
            },
            data: {
                deleted_at: new Date()
            }
        })
        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus mata pelajaran"
        });
    } catch (error) {
        console.log("Error deleting mapel:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        }); 
    }  
}


module.exports = {
    getAllMapel,
    getMapelById,
    createMapel,
    updateMapel,
    deleteMapel
}