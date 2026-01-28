const TelegramBot = require('node-telegram-bot-api');
const prisma = require('../config/prisma');

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN tidak ada');
  process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

console.log('Telegram bot berjalan');

// ketika orang tua mengirim pesan pertama (apa saja)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // jika sudah kirim contact, biarkan handler contact yang jalan
  if (msg.contact) return;

  await bot.sendMessage(
    chatId,
    'Silakan kirim nomor telepon Telegram Anda untuk mengaktifkan notifikasi absensi.',
    {
      reply_markup: {
        keyboard: [
          [{ text: 'Kirim Nomor Telepon', request_contact: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }
  );
});

// terima nomor telepon
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  let phone = msg.contact.phone_number;

  // normalisasi nomor Indonesia
  if (phone.startsWith('+62')) {
    phone = '0' + phone.slice(3);
  }

  try {
    const orangTua = await prisma.orangTua.findFirst({
      where: {
        nomor_telepon: phone,
        deleted_at: null
      }
    });

    if (!orangTua) {
      return bot.sendMessage(
        chatId,
        'Nomor telepon tidak terdaftar di sistem sekolah.'
      );
    }

    await prisma.orangTua.update({
      where: { id: orangTua.id },
      data: {
        telegram_id: BigInt(chatId)
      }
    });

    await bot.sendMessage(
      chatId,
      'Notifikasi absensi berhasil diaktifkan.'
    );
  } catch (error) {
    console.error(error);
    await bot.sendMessage(
      chatId,
      'Terjadi kesalahan server.'
    );
  }
});

// kirim notifikasi tap in
const sendTapInNotification = async (chatId, data) => {
  const {
    nama,
    kelas,
    tanggal,
    tap_in,
    status_tapin
  } = data;

  const statusText = status_tapin === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat';
  const keterangan = status_tapin === 'TEPAT_WAKTU'
    ? 'Siswa datang tepat waktu'
    : 'Siswa datang terlambat';

  const message =
    `NOTIFIKASI TAP IN

Nama: ${nama}
Kelas: ${kelas}
Tanggal: ${tanggal}
Waktu: ${tap_in}
Status: ${statusText}

${keterangan}`;


  await bot.sendMessage(chatId, message);
};

// kirim notifikasi tap out
const sendTapOutNotification = async (chatId, data) => {
  const {
    nama,
    kelas,
    tanggal,
    tap_out
  } = data;

  const message =
    `NOTIFIKASI TAP OUT

Nama: ${nama}
Kelas: ${kelas}
Tanggal: ${tanggal}
Waktu: ${tap_out}`;

  await bot.sendMessage(chatId, message);
};

module.exports = {
  bot,
  sendTapInNotification,
  sendTapOutNotification
};
