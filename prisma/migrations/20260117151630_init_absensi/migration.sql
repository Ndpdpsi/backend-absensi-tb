-- CreateTable
CREATE TABLE `Siswa` (
    `id` CHAR(36) NOT NULL,
    `NISN` INTEGER NOT NULL,
    `NIPD` INTEGER NOT NULL,
    `nama_siswa` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `tanggal_lahir` DATETIME(3) NOT NULL,
    `nomor_telepon` VARCHAR(191) NOT NULL,
    `orangtua_id` INTEGER NOT NULL,
    `kelas_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `Siswa_NISN_key`(`NISN`),
    INDEX `Siswa_kelas_id_idx`(`kelas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrangTua` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_orangtua` VARCHAR(191) NOT NULL,
    `nomor_telepon` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RFID` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `uid_rfid` BIGINT NOT NULL,
    `siswa_id` CHAR(36) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `RFID_uid_rfid_key`(`uid_rfid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AbsensiSiswa` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `siswa_id` CHAR(36) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `tap_in` BIGINT NULL,
    `tap_out` BIGINT NULL,
    `rfid_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `AbsensiSiswa_siswa_id_tanggal_idx`(`siswa_id`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetailAbsensiSiswa` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `absensi_id` BIGINT NOT NULL,
    `jadwal_id` BIGINT NOT NULL,
    `guru_id` BIGINT NOT NULL,
    `status` ENUM('HADIR', 'IZIN', 'SAKIT', 'ALPHA') NOT NULL,
    `jam_absen` DATETIME(3) NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `DetailAbsensiSiswa_jadwal_id_idx`(`jadwal_id`),
    INDEX `DetailAbsensiSiswa_guru_id_idx`(`guru_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guru` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `NIP` INTEGER NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `nomor_telepon` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `tanggal_lahir` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `Guru_NIP_key`(`NIP`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jadwal` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tanggal_jadwal` DATETIME(3) NOT NULL,
    `kelas_id` INTEGER NOT NULL,
    `mapel_id` BIGINT NOT NULL,
    `guru_id` BIGINT NOT NULL,
    `jam_mulai` DATETIME(3) NOT NULL,
    `jam_selesai` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `Jadwal_kelas_id_tanggal_jadwal_idx`(`kelas_id`, `tanggal_jadwal`),
    INDEX `Jadwal_guru_id_tanggal_jadwal_idx`(`guru_id`, `tanggal_jadwal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MataPelajaran` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_mapel` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kelas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kelas` VARCHAR(191) NOT NULL,
    `jurusan_id` BIGINT NOT NULL,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `Kelas_jurusan_id_idx`(`jurusan_id`),
    INDEX `Kelas_tahun_ajaran_id_idx`(`tahun_ajaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jurusan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_jurusan` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tahun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun_ajaran` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Siswa` ADD CONSTRAINT `Siswa_orangtua_id_fkey` FOREIGN KEY (`orangtua_id`) REFERENCES `OrangTua`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Siswa` ADD CONSTRAINT `Siswa_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `Kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RFID` ADD CONSTRAINT `RFID_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `Siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbsensiSiswa` ADD CONSTRAINT `AbsensiSiswa_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `Siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbsensiSiswa` ADD CONSTRAINT `AbsensiSiswa_rfid_id_fkey` FOREIGN KEY (`rfid_id`) REFERENCES `RFID`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailAbsensiSiswa` ADD CONSTRAINT `DetailAbsensiSiswa_absensi_id_fkey` FOREIGN KEY (`absensi_id`) REFERENCES `AbsensiSiswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailAbsensiSiswa` ADD CONSTRAINT `DetailAbsensiSiswa_jadwal_id_fkey` FOREIGN KEY (`jadwal_id`) REFERENCES `Jadwal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailAbsensiSiswa` ADD CONSTRAINT `DetailAbsensiSiswa_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `Guru`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jadwal` ADD CONSTRAINT `Jadwal_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `Kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jadwal` ADD CONSTRAINT `Jadwal_mapel_id_fkey` FOREIGN KEY (`mapel_id`) REFERENCES `MataPelajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jadwal` ADD CONSTRAINT `Jadwal_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `Guru`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kelas` ADD CONSTRAINT `Kelas_jurusan_id_fkey` FOREIGN KEY (`jurusan_id`) REFERENCES `Jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kelas` ADD CONSTRAINT `Kelas_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `Tahun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
