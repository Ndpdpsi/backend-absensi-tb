/*
  Warnings:

  - The primary key for the `absensisiswa` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `absensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `tap_in` on the `absensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `tap_out` on the `absensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `rfid_id` on the `absensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `detailabsensisiswa` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `detailabsensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `absensi_id` on the `detailabsensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `jadwal_id` on the `detailabsensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `guru_id` on the `detailabsensisiswa` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `guru` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `guru` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `jadwal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `jadwal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `mapel_id` on the `jadwal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `guru_id` on the `jadwal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `jurusan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `jurusan` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `jurusan_id` on the `kelas` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `matapelajaran` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `matapelajaran` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `rfid` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `rfid` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `uid_rfid` on the `rfid` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - Added the required column `gender` to the `Siswa` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `absensisiswa` DROP FOREIGN KEY `AbsensiSiswa_rfid_id_fkey`;

-- DropForeignKey
ALTER TABLE `detailabsensisiswa` DROP FOREIGN KEY `DetailAbsensiSiswa_absensi_id_fkey`;

-- DropForeignKey
ALTER TABLE `detailabsensisiswa` DROP FOREIGN KEY `DetailAbsensiSiswa_guru_id_fkey`;

-- DropForeignKey
ALTER TABLE `detailabsensisiswa` DROP FOREIGN KEY `DetailAbsensiSiswa_jadwal_id_fkey`;

-- DropForeignKey
ALTER TABLE `jadwal` DROP FOREIGN KEY `Jadwal_guru_id_fkey`;

-- DropForeignKey
ALTER TABLE `jadwal` DROP FOREIGN KEY `Jadwal_mapel_id_fkey`;

-- DropForeignKey
ALTER TABLE `kelas` DROP FOREIGN KEY `Kelas_jurusan_id_fkey`;

-- AlterTable
ALTER TABLE `absensisiswa` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `tap_in` INTEGER NULL,
    MODIFY `tap_out` INTEGER NULL,
    MODIFY `rfid_id` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `detailabsensisiswa` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `absensi_id` INTEGER NOT NULL,
    MODIFY `jadwal_id` INTEGER NOT NULL,
    MODIFY `guru_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `guru` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `jadwal` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `mapel_id` INTEGER NOT NULL,
    MODIFY `guru_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `jurusan` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `kelas` MODIFY `jurusan_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `matapelajaran` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `rfid` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `uid_rfid` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `siswa` ADD COLUMN `gender` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `AbsensiSiswa` ADD CONSTRAINT `AbsensiSiswa_rfid_id_fkey` FOREIGN KEY (`rfid_id`) REFERENCES `RFID`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailAbsensiSiswa` ADD CONSTRAINT `DetailAbsensiSiswa_absensi_id_fkey` FOREIGN KEY (`absensi_id`) REFERENCES `AbsensiSiswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailAbsensiSiswa` ADD CONSTRAINT `DetailAbsensiSiswa_jadwal_id_fkey` FOREIGN KEY (`jadwal_id`) REFERENCES `Jadwal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailAbsensiSiswa` ADD CONSTRAINT `DetailAbsensiSiswa_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `Guru`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jadwal` ADD CONSTRAINT `Jadwal_mapel_id_fkey` FOREIGN KEY (`mapel_id`) REFERENCES `MataPelajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jadwal` ADD CONSTRAINT `Jadwal_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `Guru`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kelas` ADD CONSTRAINT `Kelas_jurusan_id_fkey` FOREIGN KEY (`jurusan_id`) REFERENCES `Jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
