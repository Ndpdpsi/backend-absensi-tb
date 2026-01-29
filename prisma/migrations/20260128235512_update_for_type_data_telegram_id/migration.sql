/*
  Warnings:

  - The `telegram_id` column on the `orang_tua` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "orang_tua" DROP COLUMN "telegram_id",
ADD COLUMN     "telegram_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "orang_tua_telegram_id_key" ON "orang_tua"("telegram_id");

-- CreateIndex
CREATE INDEX "orang_tua_telegram_id_idx" ON "orang_tua"("telegram_id");
