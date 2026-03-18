-- AlterTable
ALTER TABLE "kelas" ADD COLUMN     "walas_id" INTEGER;

-- CreateIndex
CREATE INDEX "kelas_walas_id_idx" ON "kelas"("walas_id");

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_walas_id_fkey" FOREIGN KEY ("walas_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
