var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

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


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// routes
app.use('/', indexRouter);
app.use('/api/siswa', siswaRoutes);
app.use('/api/tahun-ajaran', tahunRoutes);
app.use('/api/mata-pelajaran', mapelRoutes);
app.use('/api/guru', guruRoutes);
app.use('/api/orang-tua', orangTuaRoutes)
app.use('/api/kelas', kelasRoutes)
app.use('/api/jadwal', jadwalRoutes)
app.use('/api/jurusan', jurusanRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/absensi-siswa', absensiSiswaRoutes);

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
