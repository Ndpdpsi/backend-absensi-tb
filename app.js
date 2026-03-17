var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

// Inisialisasi layanan Telegram
require('./src/services/telegramServices');

var indexRouter = require('./src/routes/index');
var tahunRoutes = require('./src/routes/tahunRoutes');
var jurusanRoutes = require('./src/routes/jurusanRoutes');
var mapelRoutes = require('./src/routes/mapelRoutes');
var guruRoutes = require('./src/routes/guruRoutes');
var orangTuaRoutes = require('./src/routes/orangTuaRoutes')
var kelasRoutes = require('./src/routes/kelasRoutes')
var jadwalRoutes = require('./src/routes/jadwalRoutes')
var rfidRoutes = require('./src/routes/rfidRoutes')
var siswaRoutes = require('./src/routes/siswaRoutes');
var absensiSiswaRoutes = require('./src/routes/absensiSiswaRoutes');
var detailAbsensi = require('./src/routes/detailAbsensiRoutes')
var users = require('./src/routes/usersRoutes');
var auth = require('./src/routes/authRoutes');


// cron job
require("./src/cron/tahunAjaran");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: 'http://localhost:4321',
  credentials: true
}));


// routes
app.use('/', indexRouter);
app.use('/api/v1/siswa', siswaRoutes);
app.use('/api/v1/tahun-ajaran', tahunRoutes);
app.use('/api/v1/mata-pelajaran', mapelRoutes);
app.use('/api/v1/guru', guruRoutes);
app.use('/api/v1/orang-tua', orangTuaRoutes)
app.use('/api/v1/kelas', kelasRoutes)
app.use('/api/v1/jadwal', jadwalRoutes)
app.use('/api/v1/jurusan', jurusanRoutes);
app.use('/api/v1/rfid', rfidRoutes);
app.use('/api/v1/absensi-siswa', absensiSiswaRoutes);
app.use('/api/v1/detail-absensi', detailAbsensi)
app.use('/api/v1/users', users);
app.use('/api/v1/auth', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});



// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
