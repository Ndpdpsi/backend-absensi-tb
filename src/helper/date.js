// format tanggal dan waktu ke dalam format Indonesia
const formatDateTime = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
};

const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
    });
};

const formatTime = (time) => {
    if (!time) return null;
    if (typeof time === 'string') {
        return time.substring(0, 5);
    }
    return new Date(time).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
};

// get hari untuk validasi hari untuk tapin absensi
const validateHari = (hari) => {
    const validHari = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return validHari[hari.getDay()];
};

const validateTimeFormat = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

module.exports = {
    formatDateTime,
    formatDate,
    formatTime,
    validateHari,
    validateTimeFormat
};