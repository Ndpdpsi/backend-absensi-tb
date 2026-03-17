-- AlterTable
ALTER TABLE "kelas" ADD COLUMN     "telegram_group_id" VARCHAR(50);

-- AlterTable
ALTER TABLE "orang_tua" ALTER COLUMN "telegram_id" DROP NOT NULL;
