let uploadToken;
let file = {};
const socket = io.connect('http://localhost:3030');

const xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        console.log(this);
    } else {
        console.log(this);
    }
};
function sendRequest(method, url) {
    xhttp.open(method, url, true);
    xhttp.send();
}
function readerReady(reader) {
    console.log(reader.readyState, FileReader.DONE)
    return reader.readyState === FileReader.DONE || reader.readyState === FileReader.EMPTY
}

function handleImage() {
    file = document.getElementById('file').files[0];
    console.log(file.name);
    const fileName = file.name;
    console.log('client ::: ',fileName);
    socket.emit('start',{fileName:fileName});
}

socket.on('uploadToken1', (data) => {
    // console.log(data);
    uploadToken = data.uploadToken;
    startUpload();
})

function startUpload() {
    let reader = new FileReader();
    let partNum = 0;
    //file = document.getElementById('file').files[0];
    console.log('start Upload Counter :: ',file);
    //console.log(file.name);
    let fileSize = file.size;
    const fileName = file.name;
    
    var partSize = 1024 * 1024 * 5; // Minimum 5MB per chunk (except the last part) http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadComplete.html
    var numPartsLeft = Math.ceil(fileSize / partSize);
    // console.log("readyState", reader.readyState);
    if (partNum <= numPartsLeft) {
        reader.onloadend = function (evt) {
            partNum += 1;
            
      
            socket.on('uploadToken', (data) => {
                console.log(data);
            })
            // const bytes = new Uint8Array(evt.target.result);
            // console.log('array buffer length :: ',bytes.length);
            console.log("evt", partNum);
            //console.log('file Object ::: ', file);
            socket.emit('data', {
                fileKey: fileName,
                buffer: evt.target.result,
                multipart: uploadToken,
                partNum: partNum,
                fileSize: fileSize
            })
        }
    }
    let chunkSize = 5242880;
    // let numberOfChunks = fileSize % chunkSize;
    let byteProcessed = 0;
    let leftBytes = fileSize;
    // console.log("leftBytes : ", leftBytes);
    let { start, chunksProcessed } = initRead(reader, file, fileSize, 0, chunkSize, leftBytes, byteProcessed);
    leftBytes = leftBytes - chunksProcessed;
    byteProcessed += chunksProcessed;
    console.log("byteProcessed in client ", byteProcessed);
    console.log("chunksProcessed ", chunksProcessed);
    socket.on('nextChunk', () => {
        // if (readerReady(reader)) {
        ({ start, chunksProcessed, complete } = initRead(reader, file, fileSize, start, chunkSize, leftBytes, byteProcessed));
        if (complete) {
            socket.emit('end');
            location.reload();
        } else {
            leftBytes = leftBytes - chunksProcessed;
            byteProcessed += chunksProcessed;
            // console.log("chunksProcessed",chunksProcessed);
            // alert("hi")
        }
        // }
    });
};

function initRead(reader, file, fileSize, start, chunkSize, leftBytes, byteProcessed) {
    let currentChunkSize;
    if (byteProcessed != fileSize) {
        if ((leftBytes - chunkSize) >= 0) {
            currentChunkSize = chunkSize;
        } else {
            currentChunkSize = leftBytes;
        }
        //   console.log("currentChunkSize", currentChunkSize);
        start = readFile(file, reader, start, currentChunkSize);
        return { start, chunksProcessed: currentChunkSize, complete: false };
    } else {
        return { start, chunksProcessed: currentChunkSize, complete: true };
    }

}
function readFile(file, reader, start = 0, chunkSize) {
    let blob = file.slice(start, start + chunkSize);
    reader.readAsArrayBuffer(blob);
    return start + chunkSize;
}