/*
  Warnings:

  - Made the column `telegram_id` on table `orang_tua` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "orang_tua_telegram_id_key";

-- AlterTable
ALTER TABLE "orang_tua" ALTER COLUMN "telegram_id" SET NOT NULL,
ALTER COLUMN "telegram_id" SET DATA TYPE VARCHAR(50);
