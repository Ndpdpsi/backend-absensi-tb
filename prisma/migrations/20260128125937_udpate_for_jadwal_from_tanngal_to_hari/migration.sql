/*
  Warnings:

  - You are about to drop the column `tanggal_jadwal` on the `jadwal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[siswa_id,tanggal]` on the table `absensi_siswa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kelas_id,hari,jam_mulai]` on the table `jadwal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[NISN]` on the table `siswa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[NIPD]` on the table `siswa` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hari` to the `jadwal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Hari" AS ENUM ('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU');

-- DropIndex
DROP INDEX "jadwal_guru_id_tanggal_jadwal_idx";

-- DropIndex
DROP INDEX "jadwal_kelas_id_tanggal_jadwal_jam_mulai_key";

-- AlterTable
ALTER TABLE "jadwal" DROP COLUMN "tanggal_jadwal",
ADD COLUMN     "hari" "Hari" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "absensi_siswa_siswa_id_tanggal_key" ON "absensi_siswa"("siswa_id", "tanggal");

-- CreateIndex
CREATE INDEX "jadwal_guru_id_hari_idx" ON "jadwal"("guru_id", "hari");

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_kelas_id_hari_jam_mulai_key" ON "jadwal"("kelas_id", "hari", "jam_mulai");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_NISN_key" ON "siswa"("NISN");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_NIPD_key" ON "siswa"("NIPD");
