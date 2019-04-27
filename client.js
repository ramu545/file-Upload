let uploadToken;
let file = {};
var partSize;
var userID = 12345;

const socket = io.connect('http://localhost:3030', {
    'reconnection': true,
    'reconnectionDelay': 100,
    'reconnectionDelayMax' : 500,
    'reconnectionAttempts': 5
});

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
    const fileName = file.name;
    let fileSize = file.size;
    socket.emit('start', { fileName: fileName, fileSize: fileSize, userid:userID });
}

socket.on('uploadToken1', (data) => {
    uploadToken = data.uploadToken;
    startUpload();
})

function startUpload() {
    let reader = new FileReader();
    let partNum = 0;
    let fileSize = file.size;
    const fileName = file.name;
    var totalSizeMB = fileSize / Math.pow(1024, 2);
    if (totalSizeMB > 524288000) {
        partSize = 1024 * 1024 * 250;
    } else {
        partSize = 1024 * 1024 * 5;
    }
    var numPartsLeft = Math.ceil(fileSize / partSize);

    if (partNum <= numPartsLeft) {
        reader.onloadend = function (evt) {
            partNum += 1;

            console.log("evt No :: ", partNum);

            socket.emit('data', {
                fileKey: fileName,
                buffer: evt.target.result,
                multipart: uploadToken,
                partNum: partNum,
                fileSize: fileSize
            })
        }
    }
    let chunkSize = partSize;
    let byteProcessed = 0;
    let leftBytes = fileSize;
    let { start, chunksProcessed } = initRead(reader, file, fileSize, 0, chunkSize, leftBytes, byteProcessed);
    leftBytes = leftBytes - chunksProcessed;
    byteProcessed += chunksProcessed;
    
    socket.on('nextChunk', () => {
        ({ start, chunksProcessed, complete } = initRead(reader, file, fileSize, start, chunkSize, leftBytes, byteProcessed));
        if (complete) {
            socket.emit('end');
            //location.reload();
        } else {
            leftBytes = leftBytes - chunksProcessed;
            byteProcessed += chunksProcessed;
        }
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

socket.emit('sescom',()=>{
    console.log('session not completed please try after completing the session');
});
socket.on('reconnect', () => {
    //socket.io.connect();
    // socket.io.on('connect', function(){
    //     console.log('...reconnected');
    // })
});
