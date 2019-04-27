const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const session = require("express-session")({ secret: "laalsa", resave: true, saveUninitialized: true });
const cookieparser = require('cookie-parser');
const debug = require('debug');
const sharedsession = require("express-socket.io-session");


const multiPartUploader = require('./test');

// session configuration 
// app.set('laalsa', 1); // laalsa proxy
// app.use(session({ secret: 'laalsa', proxy: true, resave: true, saveUninitialized: true }));

// cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-access-token',
  );
  res.header(
    'Access-Control-Expose-Headers',
    'Content-Disposition, x-access-token',
  );
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'views')));

app.use(session);
io.use(sharedsession(session, { autoSave: true }));

//app.use(session({ secret: 'laalsa', resave: true, saveUninitialized: true, }));

io.on('connect', function (socket) {

  console.log('socket id ::: ', socket.id);
  console.log("client connected .... ");

  socket.on('start', async function (file) {

    console.log('dtat file :: ', file);
    console.log('sessionID in start on method ::: ' + socket.handshake.sessionID);

    var value = socket.handshake.session.userdata = file.userid;
    
    socket.handshake.session.save();
    // socket.handshake.headers.cookie = file.userid;
    console.log('session data need cookie ::::: ', socket.handshake.session);

    let mutiPartId = await multiPartUploader.createMultipartUpload(file.fileName, file.fileSize, socket.handshake.session.userdata);
    console.log('multi part id :: ', mutiPartId);
    socket.emit("uploadToken1", { uploadToken: mutiPartId });
  });

  socket.on('data', async function (data) {
    console.log('data itterating every time :: :: ', socket.handshake.session.userdata);
    await multiPartUploader.initUpload(data.multipart, data.partNum, data.buffer, data.fileSize, data.fileKey);
    socket.emit('nextChunk');
  })

  socket.on('end', function (data) {
    console.log("end event");
    if (socket.handshake.session.userdata) {
      delete socket.handshake.session.userdata;
      socket.handshake.session.save();
    }
    //delete socket.handshake.cookies;
    console.log('session cookie', socket.Session);
    console.log('session cookie in end method ::: ', socket.handshake.session.userdata);
  })

});

server.listen(process.env.PORT || 3030);

server.on('listening', () => {
  console.log("server started at : 3030");
});
