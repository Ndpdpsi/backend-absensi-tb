/*
  Warnings:

  - You are about to drop the column `telegram_id` on the `orang_tua` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "orang_tua_telegram_id_idx";

-- AlterTable
ALTER TABLE "orang_tua" DROP COLUMN "telegram_id";
