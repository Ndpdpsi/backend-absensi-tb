-- CreateEnum
CREATE TYPE "StatusAbsensi" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPHA');

-- CreateEnum
CREATE TYPE "StatusKedatangan" AS ENUM ('TELAMBAT', 'TEPAT_WAKTU');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('L', 'P');

-- CreateTable
CREATE TABLE "siswa" (
    "id" UUID NOT NULL,
    "nisn" VARCHAR(20) NOT NULL,
    "nipd" VARCHAR(20) NOT NULL,
    "nama_siswa" VARCHAR(255) NOT NULL,
    "alamat" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "nomor_telepon" VARCHAR(15) NOT NULL,
    "orangtua_id" INTEGER,
    "kelas_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orang_tua" (
    "id" SERIAL NOT NULL,
    "nama_orangtua" VARCHAR(255) NOT NULL,
    "nomor_telepon" VARCHAR(15) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "orang_tua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfid" (
    "id" SERIAL NOT NULL,
    "uid_rfid" VARCHAR(50) NOT NULL,
    "siswa_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "rfid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absensi_siswa" (
    "id" SERIAL NOT NULL,
    "siswa_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "tap_in" TIMESTAMPTZ(6),
    "tap_out" TIMESTAMPTZ(6),
    "rfid_id" INTEGER,
    "status_tapin" "StatusKedatangan",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "absensi_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_absensi_siswa" (
    "id" SERIAL NOT NULL,
    "absensi_id" INTEGER NOT NULL,
    "jadwal_id" INTEGER NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "status" "StatusAbsensi" NOT NULL,
    "jam_absen" TIMESTAMPTZ(6) NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "detail_absensi_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guru" (
    "id" SERIAL NOT NULL,
    "nip" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "nomor_telepon" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "alamat" TEXT NOT NULL,
    "tanggal_lahir" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal" (
    "id" SERIAL NOT NULL,
    "tanggal_jadwal" DATE NOT NULL,
    "kelas_id" INTEGER NOT NULL,
    "mapel_id" INTEGER NOT NULL,
    "guru_id" INTEGER NOT NULL,
    "jam_mulai" TIME(6) NOT NULL,
    "jam_selesai" TIME(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_pelajaran" (
    "id" SERIAL NOT NULL,
    "nama_mapel" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "mata_pelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" SERIAL NOT NULL,
    "kelas" VARCHAR(10) NOT NULL,
    "jurusan_id" INTEGER NOT NULL,
    "tahun_ajaran_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurusan" (
    "id" SERIAL NOT NULL,
    "nama_jurusan" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "jurusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahun_ajaran" (
    "id" SERIAL NOT NULL,
    "tahun_ajaran" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tahun_ajaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nisn_key" ON "siswa"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nipd_key" ON "siswa"("nipd");

-- CreateIndex
CREATE INDEX "siswa_kelas_id_idx" ON "siswa"("kelas_id");

-- CreateIndex
CREATE INDEX "siswa_orangtua_id_idx" ON "siswa"("orangtua_id");

-- CreateIndex
CREATE INDEX "siswa_deleted_at_idx" ON "siswa"("deleted_at");

-- CreateIndex
CREATE INDEX "orang_tua_deleted_at_idx" ON "orang_tua"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "rfid_uid_rfid_key" ON "rfid"("uid_rfid");

-- CreateIndex
CREATE INDEX "rfid_siswa_id_idx" ON "rfid"("siswa_id");

-- CreateIndex
CREATE INDEX "rfid_is_active_idx" ON "rfid"("is_active");

-- CreateIndex
CREATE INDEX "rfid_deleted_at_idx" ON "rfid"("deleted_at");

-- CreateIndex
CREATE INDEX "absensi_siswa_tanggal_idx" ON "absensi_siswa"("tanggal");

-- CreateIndex
CREATE INDEX "absensi_siswa_rfid_id_idx" ON "absensi_siswa"("rfid_id");

-- CreateIndex
CREATE INDEX "absensi_siswa_status_tapin_idx" ON "absensi_siswa"("status_tapin");

-- CreateIndex
CREATE INDEX "absensi_siswa_deleted_at_idx" ON "absensi_siswa"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "absensi_siswa_siswa_id_tanggal_key" ON "absensi_siswa"("siswa_id", "tanggal");

-- CreateIndex
CREATE INDEX "detail_absensi_siswa_jadwal_id_idx" ON "detail_absensi_siswa"("jadwal_id");

-- CreateIndex
CREATE INDEX "detail_absensi_siswa_guru_id_idx" ON "detail_absensi_siswa"("guru_id");

-- CreateIndex
CREATE INDEX "detail_absensi_siswa_status_idx" ON "detail_absensi_siswa"("status");

-- CreateIndex
CREATE INDEX "detail_absensi_siswa_deleted_at_idx" ON "detail_absensi_siswa"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "detail_absensi_siswa_absensi_id_jadwal_id_key" ON "detail_absensi_siswa"("absensi_id", "jadwal_id");

-- CreateIndex
CREATE UNIQUE INDEX "guru_nip_key" ON "guru"("nip");

-- CreateIndex
CREATE INDEX "guru_deleted_at_idx" ON "guru"("deleted_at");

-- CreateIndex
CREATE INDEX "jadwal_guru_id_tanggal_jadwal_idx" ON "jadwal"("guru_id", "tanggal_jadwal");

-- CreateIndex
CREATE INDEX "jadwal_mapel_id_idx" ON "jadwal"("mapel_id");

-- CreateIndex
CREATE INDEX "jadwal_deleted_at_idx" ON "jadwal"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_kelas_id_tanggal_jadwal_jam_mulai_key" ON "jadwal"("kelas_id", "tanggal_jadwal", "jam_mulai");

-- CreateIndex
CREATE INDEX "mata_pelajaran_deleted_at_idx" ON "mata_pelajaran"("deleted_at");

-- CreateIndex
CREATE INDEX "kelas_jurusan_id_idx" ON "kelas"("jurusan_id");

-- CreateIndex
CREATE INDEX "kelas_tahun_ajaran_id_idx" ON "kelas"("tahun_ajaran_id");

-- CreateIndex
CREATE INDEX "kelas_deleted_at_idx" ON "kelas"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_kelas_jurusan_id_tahun_ajaran_id_key" ON "kelas"("kelas", "jurusan_id", "tahun_ajaran_id");

-- CreateIndex
CREATE UNIQUE INDEX "jurusan_nama_jurusan_key" ON "jurusan"("nama_jurusan");

-- CreateIndex
CREATE INDEX "jurusan_deleted_at_idx" ON "jurusan"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tahun_ajaran_tahun_ajaran_key" ON "tahun_ajaran"("tahun_ajaran");

-- CreateIndex
CREATE INDEX "tahun_ajaran_is_active_idx" ON "tahun_ajaran"("is_active");

-- CreateIndex
CREATE INDEX "tahun_ajaran_deleted_at_idx" ON "tahun_ajaran"("deleted_at");

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_orangtua_id_fkey" FOREIGN KEY ("orangtua_id") REFERENCES "orang_tua"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfid" ADD CONSTRAINT "rfid_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_siswa" ADD CONSTRAINT "absensi_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_siswa" ADD CONSTRAINT "absensi_siswa_rfid_id_fkey" FOREIGN KEY ("rfid_id") REFERENCES "rfid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_absensi_siswa" ADD CONSTRAINT "detail_absensi_siswa_absensi_id_fkey" FOREIGN KEY ("absensi_id") REFERENCES "absensi_siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_absensi_siswa" ADD CONSTRAINT "detail_absensi_siswa_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_absensi_siswa" ADD CONSTRAINT "detail_absensi_siswa_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "jurusan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
