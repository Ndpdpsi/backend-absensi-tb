/*
  Warnings:

  - You are about to drop the column `email` on the `guru` table. All the data in the column will be lost.
  - You are about to drop the column `nip` on the `guru` table. All the data in the column will be lost.
  - You are about to drop the column `nipd` on the `siswa` table. All the data in the column will be lost.
  - You are about to drop the column `nisn` on the `siswa` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[NIP]` on the table `guru` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[NISN]` on the table `siswa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[NIPD]` on the table `siswa` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `NIP` to the `guru` table without a default value. This is not possible if the table is not empty.
  - Added the required column `NIPD` to the `siswa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `NISN` to the `siswa` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "guru_nip_key";

-- DropIndex
DROP INDEX "siswa_nipd_key";

-- DropIndex
DROP INDEX "siswa_nisn_key";

-- AlterTable
ALTER TABLE "guru" DROP COLUMN "email",
DROP COLUMN "nip",
ADD COLUMN     "NIP" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "siswa" DROP COLUMN "nipd",
DROP COLUMN "nisn",
ADD COLUMN     "NIPD" INTEGER NOT NULL,
ADD COLUMN     "NISN" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "guru_NIP_key" ON "guru"("NIP");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_NISN_key" ON "siswa"("NISN");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_NIPD_key" ON "siswa"("NIPD");
