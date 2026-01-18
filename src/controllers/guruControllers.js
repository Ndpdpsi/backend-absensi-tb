const prisma = require("../config/prisma");

// get all
const getAllGuru = async (req, res) => {
    try {
        const guru = await prisma.Guru.findMany({
            where: {
                deleted_at: null
            },
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data guru beserta jadwal",
            data: guru
        });
    } catch (error) {
        console.error("Error getting guru:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};


// get by id
const getGuruById = async (req, res) => {
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "ID guru tidak valid"
            });
        }

        const guru = await prisma.Guru.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            },
            include: {
                jadwal: {
                    where: {
                        deleted_at: null
                    },
                    orderBy: {
                        tanggal_jadwal: "asc"
                    },
                    select: {
                        tanggal_jadwal: true,
                        jam_mulai: true,
                        jam_selesai: true,
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
                        mata_pelajaran: {
                            select: {
                                nama_mapel: true
                            }
                        }
                    }
                }
            }
        });

        if (!guru) {
            return res.status(404).json({
                success: false,
                message: "Guru tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data guru beserta jadwal",
            data: guru
        });
    } catch (error) {
        console.error("Error getting guru:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};


// Create guru

const createGuru = async (req, res) => {
    try {
        const { NIP, nama, nomor_telepon, alamat, tanggal_lahir } = req.body;

        // validasi input 
        if (!NIP || !nama || !nomor_telepon || !alamat || !tanggal_lahir) {
            return res.status(400).json({
                success: false,
                message: "Semua field harus diisi"
            });
        }

        // cek duplikasi NIP
        const existingGuru = await prisma.Guru.findFirst({
            where: {
                NIP: NIP,
                deleted_at: null
            }
        });

        if (existingGuru) {
            return res.status(409).json({
                success: false,
                message: "Guru dengan NIP tersebut sudah ada"
            });
        }

        // Konversi tanggal
        const tanggalLahirDate = new Date(
            tanggal_lahir.replace(" ", "T")
        );

        if (isNaN(tanggalLahirDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal lahir tidak valid"
            });
        }

        // buat data guru baru
        const newGuru = await prisma.Guru.create({
            data: {
                NIP,
                nama,
                nomor_telepon,
                alamat,
                tanggal_lahir: tanggalLahirDate
            }
        });

        return res.status(201).json({
            success: true,
            message: "Berhasil menambahkan guru baru",
            data: newGuru
        })
    } catch (error) {
        console.log("Error creating guru:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}


// update guru 

const updateGuru = async (req, res) => {
    try {
        const { id } = req.params;
        const { NIP, nama, nomor_telepon, alamat, tanggal_lahir } = req.body;

        // validasi input
        if (!NIP || !nama || !nomor_telepon || !alamat || !tanggal_lahir) {
            return res.status(400).json({
                success: false,
                message: "Semua field harus diisi"
            });
        }


        // cek apakah guru ada
        const existingGuru = await prisma.Guru.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingGuru) {
            return res.status(404).json({
                success: false,
                message: "Guru tidak ditemukan"
            });
        }

        // cek duplikasi NIP
        const duplicateGuru = await prisma.Guru.findFirst({
            where: {
                NIP: NIP,
                deleted_at: null,
                NOT: {
                    id: parseInt(id)
                }
            }
        });

        if (duplicateGuru) {
            return res.status(409).json({
                success: false,
                message: "Guru dengan NIP tersebut sudah ada"
            });
        }

        // update data guru
        const updatedGuru = await prisma.Guru.update({
            where: {
                id: parseInt(id)
            },
            data: {
                NIP,
                nama,
                nomor_telepon,
                alamat,
                tanggal_lahir
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil mengupdate data guru",
            data: updatedGuru
        });
    } catch (error) {
        console.log("Error updating guru:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}

// delete guru (soft delete)
const deleteGuru = async (req, res) => {
    try {
        const { id } = req.params;

        // cek apakah guru ada
        const existingGuru = await prisma.Guru.findFirst({
            where: {
                id: parseInt(id),
                deleted_at: null
            }
        });

        if (!existingGuru) {
            return res.status(404).json({
                success: false,
                message: "Guru tidak ditemukan"
            });
        }

        // cek apakah guru terkait dengan data lain
        const relatedJadwal = await prisma.Jadwal.findFirst({
            where: {
                guru_id: parseInt(id),
                deleted_at: null
            }
        });

        if (relatedJadwal) {
            return res.status(400).json({
                success: false,
                message: "Guru tidak dapat dihapus karena terkait dengan data jadwal mengajar"
            });
        }

        // lakukan soft delete
        const deletedGuru = await prisma.Guru.update({
            where: {
                id: parseInt(id)
            },
            data: {
                deleted_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Berhasil menghapus guru",
            data: deletedGuru
        });
    } catch (error) {
        console.log("Error deleting guru:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
}


module.exports = {
    getAllGuru,
    getGuruById,
    createGuru,
    updateGuru,
    deleteGuru
}