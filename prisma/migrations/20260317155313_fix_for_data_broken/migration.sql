/*
  Warnings:

  - You are about to alter the column `nama` on the `guru` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `nomor_telepon` on the `guru` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `NIP` on the `guru` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `nomor_telepon` on the `siswa` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `NIPD` on the `siswa` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `NISN` on the `siswa` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `nama` on the `siswa` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Made the column `tanggal_lahir` on table `guru` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "detail_absensi_siswa" DROP CONSTRAINT "detail_absensi_siswa_guru_id_fkey";

-- DropForeignKey
ALTER TABLE "detail_absensi_siswa" DROP CONSTRAINT "detail_absensi_siswa_jadwal_id_fkey";

-- DropIndex
DROP INDEX "detail_absensi_siswa_absensi_id_jadwal_id_key";

-- AlterTable
ALTER TABLE "detail_absensi_siswa" ALTER COLUMN "guru_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "guru" ALTER COLUMN "nama" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "nomor_telepon" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "tanggal_lahir" SET NOT NULL,
ALTER COLUMN "tanggal_lahir" SET DATA TYPE DATE,
ALTER COLUMN "NIP" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "siswa" ALTER COLUMN "nomor_telepon" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "NIPD" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "NISN" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "nama" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "detail_absensi_siswa_absensi_id_idx" ON "detail_absensi_siswa"("absensi_id");

-- CreateIndex
CREATE INDEX "guru_deleted_at_idx" ON "guru"("deleted_at");

-- CreateIndex
CREATE INDEX "jadwal_hari_kelas_id_idx" ON "jadwal"("hari", "kelas_id");

-- AddForeignKey
ALTER TABLE "detail_absensi_siswa" ADD CONSTRAINT "detail_absensi_siswa_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_absensi_siswa" ADD CONSTRAINT "detail_absensi_siswa_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;
