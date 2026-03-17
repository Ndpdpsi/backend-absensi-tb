/*
  Warnings:

  - Added the required column `tanggal_mulai` to the `tahun_ajaran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal_selesai` to the `tahun_ajaran` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tahun_ajaran" ADD COLUMN     "tanggal_mulai" DATE NOT NULL,
ADD COLUMN     "tanggal_selesai" DATE NOT NULL;
