const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
// const cros = require('cors');
const server = require('http').createServer(app);
const io = require ('socket.io').listen(server);

const multiPartUploader = require('./test');

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
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'views')));

io.on('connect', function (socket) {
    console.log("socket connected .. ");
    socket.on('start', async function (file) {
      console.log('dtat file :: ',file);
      let mutiPartId = await multiPartUploader.createMultipartUpload(file.fileName);
      console.log('multi part id :: ',mutiPartId);
      socket.emit("uploadToken1", { uploadToken: mutiPartId });
      //socket.emit("uploadToken1");
    });
    
      socket.on('data', async function (data) {
        console.log("data event :: ",data);
        // console.log('multipart upload in server page  :: ',data.multipart);
        await multiPartUploader.initUpload(data.multipart, data.partNum, data.buffer, data.fileSize, data.fileKey);
        socket.emit('nextChunk');
      })

      // socket.on('mydata', (data) => {
      //   socket.emit('uploadToken', {
      //     uploadToken: data
      //   })
      //   console.log("mydata",data);
      // })

      socket.on('end', function (data) {
        console.log("end event");
        // console.log(data);
        /*"test": "./node_modules/.bin/mocha --reporter spec",*/ 
        // process.exit(1);
      })

});

server.listen(process.env.PORT || 3030);

server.on('listening', () => {
    console.log("server started at : 3030");
});