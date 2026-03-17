const TelegramBot = require('node-telegram-bot-api');
const prisma = require('../config/prisma');

// cek token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN tidak ada');
  process.exit(1);
}

// init bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

console.log('Telegram bot berjalan');



// PESAN SAMBUTAN
const pesanSambutan = `👋 Halo! Saya bot notifikasi absensi sekolah.

Untuk mendaftarkan grup ini ke kelas, gunakan perintah:

/daftarkan_grup <id_kelas>

Contoh: /daftarkan_grup 1

ID kelas bisa dilihat di aplikasi manajemen sekolah.`;



// COMMAND /start (PRIVATE ONLY)
bot.onText(/\/start/, async (msg) => {

  if (msg.chat.type !== 'private') return;

  await bot.sendMessage(
    msg.chat.id,
    '👋 Halo! Saya bot notifikasi absensi sekolah.\n\nUntuk mengaktifkan notifikasi, silakan tambahkan saya ke grup kelas Anda, lalu gunakan perintah /daftarkan_grup di dalam grup tersebut.'
  );
});



// TANGANI BOT DITAMBAHKAN KE GRUP
// Event utama: my_chat_member (tidak butuh privacy mode off)
bot.on('my_chat_member', async (msg) => {

  try {
    const newStatus = msg.new_chat_member.status;
    const chat = msg.chat;

    if (
      (chat.type === 'group' || chat.type === 'supergroup') &&
      (newStatus === 'member' || newStatus === 'administrator')
    ) {
      await bot.sendMessage(chat.id, pesanSambutan);
    }
  } catch (error) {
    console.error('Error my_chat_member:', error.message);
  }
});

// Event fallback: new_chat_members
bot.on('new_chat_members', async (msg) => {

  try {
    const newMembers = msg.new_chat_members;
    const botInfo = await bot.getMe();
    const botDitambahkan = newMembers.some(member => member.id === botInfo.id);

    if (!botDitambahkan) return;

    await bot.sendMessage(msg.chat.id, pesanSambutan);
  } catch (error) {
    console.error('Error new_chat_members:', error.message);
  }
});



// COMMAND /daftarkan_grup <id_kelas> (GROUP ONLY)
bot.onText(/\/daftarkan_grup (.+)/, async (msg, match) => {

  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    return bot.sendMessage(msg.chat.id, '❌ Perintah ini hanya bisa digunakan di dalam grup.');
  }

  const groupId = String(msg.chat.id);
  const kelasId = parseInt(match[1]);

  if (isNaN(kelasId)) {
    return bot.sendMessage(
      msg.chat.id,
      '❌ Format salah. Gunakan: /daftarkan_grup <id_kelas>\nContoh: /daftarkan_grup 1'
    );
  }

  try {

    // Cek apakah kelas ada
    const kelas = await prisma.kelas.findFirst({
      where: {
        id: kelasId,
        deleted_at: null
      },
      include: {
        jurusan: true,
        tahun: true
      }
    });

    if (!kelas) {
      return bot.sendMessage(
        msg.chat.id,
        `❌ Kelas dengan ID *${kelasId}* tidak ditemukan.`,
        { parse_mode: 'Markdown' }
      );
    }

    // Cek apakah grup ini sudah terdaftar ke kelas lain
    const grupSudahTerdaftar = await prisma.kelas.findFirst({
      where: {
        telegram_group_id: groupId,
        deleted_at: null
      }
    });

    if (grupSudahTerdaftar && grupSudahTerdaftar.id !== kelasId) {
      return bot.sendMessage(
        msg.chat.id,
        `⚠️ Grup ini sudah terdaftar ke kelas lain (ID: ${grupSudahTerdaftar.id}).\n\nGunakan /hapus_grup terlebih dahulu sebelum mendaftarkan ke kelas baru.`
      );
    }

    // Cek apakah kelas ini sudah terdaftar ke grup lain
    if (kelas.telegram_group_id && kelas.telegram_group_id !== groupId) {
      return bot.sendMessage(
        msg.chat.id,
        `⚠️ Kelas *${kelas.kelas}* sudah terdaftar ke grup lain.\n\nHubungi admin untuk menghapus pendaftaran grup sebelumnya.`,
        { parse_mode: 'Markdown' }
      );
    }

    // Simpan telegram_group_id ke kelas
    await prisma.kelas.update({
      where: { id: kelasId },
      data: { telegram_group_id: groupId }
    });

    await bot.sendMessage(
      msg.chat.id,
      `✅ *Grup berhasil didaftarkan!*\n\n🏫 Kelas: ${kelas.kelas} - ${kelas.jurusan.nama_jurusan}\n📅 Tahun Ajaran: ${kelas.tahun.tahun_ajaran}\n\nNotifikasi absensi siswa kelas ini akan dikirim ke grup ini.`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error('Error daftarkan grup:', error);
    await bot.sendMessage(msg.chat.id, '❌ Terjadi kesalahan server.');
  }
});



// COMMAND /info (GROUP ONLY)
bot.onText(/\/info/, async (msg) => {

  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;

  const groupId = String(msg.chat.id);

  try {

    const kelas = await prisma.kelas.findFirst({
      where: {
        telegram_group_id: groupId,
        deleted_at: null
      },
      include: {
        jurusan: true,
        tahun: true,
        siswa: {
          where: { deleted_at: null },
          select: { nama: true }
        }
      }
    });

    if (!kelas) {
      return bot.sendMessage(
        msg.chat.id,
        '❌ Grup ini belum terdaftar.\n\nGunakan: /daftarkan_grup <id_kelas>'
      );
    }

    const jumlahSiswa = kelas.siswa.length;

    await bot.sendMessage(
      msg.chat.id,
      `ℹ️ *Info Grup*\n\n🏫 Kelas: ${kelas.kelas} - ${kelas.jurusan.nama_jurusan}\n📅 Tahun Ajaran: ${kelas.tahun.tahun_ajaran}\n👥 Jumlah Siswa: ${jumlahSiswa} orang\n🆔 Group ID: ${groupId}`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error('Error info grup:', error);
    await bot.sendMessage(msg.chat.id, '❌ Terjadi kesalahan server.');
  }
});



// COMMAND /hapus_grup (GROUP ONLY)
bot.onText(/\/hapus_grup/, async (msg) => {

  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;

  const groupId = String(msg.chat.id);

  try {

    const kelas = await prisma.kelas.findFirst({
      where: {
        telegram_group_id: groupId,
        deleted_at: null
      }
    });

    if (!kelas) {
      return bot.sendMessage(msg.chat.id, '❌ Grup ini belum terdaftar di sistem.');
    }

    await prisma.kelas.update({
      where: { id: kelas.id },
      data: { telegram_group_id: null }
    });

    await bot.sendMessage(
      msg.chat.id,
      '✅ Pendaftaran grup berhasil dihapus. Notifikasi tidak akan dikirim ke grup ini lagi.'
    );

  } catch (error) {
    console.error('Error hapus grup:', error);
    await bot.sendMessage(msg.chat.id, '❌ Terjadi kesalahan server.');
  }
});



// KIRIM TAP IN KE GRUP KELAS
const sendTapInNotification = async (telegramGroupId, data) => {

  if (!telegramGroupId) return;

  const message = `
📢 *NOTIFIKASI TAP IN*

👤 Nama: ${data.nama}
🏫 Kelas: ${data.kelas}
📅 Tanggal: ${data.tanggal}
⏰ Waktu: ${data.tap_in}
📌 Status: ${data.status_tapin === 'TEPAT_WAKTU' ? '✅ Tepat Waktu' : '⚠️ Terlambat'}
`;

  try {
    await bot.sendMessage(String(telegramGroupId), message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error kirim tap in ke grup:', error.message);
  }
};



// KIRIM TAP OUT KE GRUP KELAS
const sendTapOutNotification = async (telegramGroupId, data) => {

  if (!telegramGroupId) return;

  const message = `
📢 *NOTIFIKASI TAP OUT*

👤 Nama: ${data.nama}
🏫 Kelas: ${data.kelas}
📅 Tanggal: ${data.tanggal}
⏰ Waktu: ${data.tap_out}
`;

  try {
    await bot.sendMessage(String(telegramGroupId), message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error kirim tap out ke grup:', error.message);
  }
};



// POLLING ERROR HANDLER
bot.on('polling_error', (error) => {
  if (error.message.includes('409')) {
    console.error('⚠️ Instance bot lain sedang berjalan. Jalankan: taskkill /F /IM node.exe');
  } else {
    console.error('Polling error:', error.message);
  }
});



module.exports = {
  bot,
  sendTapInNotification,
  sendTapOutNotification
};