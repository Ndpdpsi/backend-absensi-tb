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



// COMMAND /start (PRIVATE ONLY)
bot.onText(/\/start/, async (msg) => {

  if (msg.chat.type !== 'private') return;

  const chatId = msg.chat.id;

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



// TERIMA CONTACT
bot.on('contact', async (msg) => {

  if (msg.chat.type !== 'private') return;

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

    // simpan telegram_id
    await prisma.orangTua.update({
      where: { id: orangTua.id },
      data: {
        telegram_id: String(chatId)
      }
    });

    await bot.sendMessage(
      chatId,
      'Notifikasi absensi berhasil diaktifkan.',
      {
        reply_markup: { remove_keyboard: true }
      }
    );

  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, 'Terjadi kesalahan server.');
  }
});



// KIRIM TAP IN KE ORANG TUA
const sendTapInNotification = async (telegramId, data) => {

  if (!telegramId) return;

  const message = `
📢 NOTIFIKASI TAP IN

👤 Nama: ${data.nama}
🏫 Kelas: ${data.kelas}
📅 Tanggal: ${data.tanggal}
⏰ Waktu: ${data.tap_in}
📌 Status: ${data.status_tapin === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
`;

  try {
    await bot.sendMessage(String(telegramId), message);
  } catch (error) {
    console.error('Error kirim tap in:', error);
  }
};



// KIRIM TAP OUT KE ORANG TUA
const sendTapOutNotification = async (telegramId, data) => {

  if (!telegramId) return;

  const message = `
📢 NOTIFIKASI TAP OUT

👤 Nama: ${data.nama}
🏫 Kelas: ${data.kelas}
📅 Tanggal: ${data.tanggal}
⏰ Waktu: ${data.tap_out}
`;

  try {
    await bot.sendMessage(String(telegramId), message);
  } catch (error) {
    console.error('Error kirim tap out:', error);
  }
};


module.exports = {
  bot,
  sendTapInNotification,
  sendTapOutNotification
};