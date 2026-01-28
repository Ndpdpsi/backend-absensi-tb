/*
  Warnings:

  - You are about to drop the column `nama_siswa` on the `siswa` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[telegram_id]` on the table `orang_tua` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `telegram_id` to the `orang_tua` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama` to the `siswa` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GURU');

-- DropIndex
DROP INDEX "guru_deleted_at_idx";

-- AlterTable
ALTER TABLE "guru" ALTER COLUMN "nama" SET DATA TYPE TEXT,
ALTER COLUMN "nomor_telepon" SET DATA TYPE TEXT,
ALTER COLUMN "tanggal_lahir" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "NIP" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "orang_tua" ADD COLUMN     "telegram_id" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "siswa" DROP COLUMN "nama_siswa",
ADD COLUMN     "nama" TEXT NOT NULL,
ALTER COLUMN "nomor_telepon" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "guru_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_guru_id_key" ON "users"("guru_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "orang_tua_telegram_id_key" ON "orang_tua"("telegram_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;
