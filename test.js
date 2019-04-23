var fs = require('fs');
var AWS = require('aws-sdk');
//const fileClient = require('./views/client');
DigitalOceanDEV = {
    DigitalOceanAccessKeyId: '2KC2QSC2N6J2XH5QWFL7',
    DigitalOceanSecretAccessKey: 'KHeWb7W5tQCOKlK9Kc9qgY4pH1OR2KXZVHSIoIXZONg',
    DigitalOceanEndpoint: 'sgp1.digitaloceanspaces.com',
    DigitalOceanBucket: 'laalsadev',
    // DigitalOceanFolder: 'onboarding.form',
    DigitalOceanLink: 'https://laalsadev.sgp1.digitaloceanspaces.com',
    // DigitalOceanAcl: 'private', // public-read
    DigitalOceanEncoding: 'base64'
};

const spacesEndpoint = new AWS.Endpoint(DigitalOceanDEV.DigitalOceanEndpoint);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: DigitalOceanDEV.DigitalOceanAccessKeyId,
    secretAccessKey: DigitalOceanDEV.DigitalOceanSecretAccessKey,
});

// File

// // S3 Upload options
//console.log('client function in server   ::::: ',fileClient);
// var fileName = '5.pdf';
// var filePath = './' + fileName;
// var fileKey = fileName;
// var buffer = fs.readFileSync('./' + filePath);

var bucket = 'laalsadev';
var multipartMap = {
    Parts: []
};
// // Upload
var startTime = new Date();
// var partNum = 0;
var partSize = 1024 * 1024 * 5; // Minimum 5MB per chunk (except the last part) http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadComplete.html
// console.log('buffer length :: ',buffer.length);
//var numPartsLeft = Math.ceil(buffer.length / partSize);
var numPartsLeft;
var maxUploadTries = 3;


function completeMultipartUpload(s3, doneParams) {
    return new Promise((resolve, reject) => {
      console.log("doneParams with upload Id ::: ",doneParams);
      
      s3.completeMultipartUpload(doneParams, function (err, data) {
        if (err) {
          console.log("An error occurred while completing the multipart upload");
          console.log(err);
          reject(err);
        } else {
          var delta = (new Date() - startTime) / 1000;
          //socket.emit("mydata", { uploadToken: "mutiPartId" });
         
          console.log('Completed upload in', delta, 'seconds');
          console.log('Final upload data:', data);
          resolve('');
        }
      });
    })
  
  }
function uploadPart(s3, multipart, partParams, tryNum) {

    return new Promise((resolve, reject) => {
        var tryNum = tryNum || 1;
        s3.uploadPart(partParams, async function (multiErr, mData) {
            console.log('what is multi :: ',mData);
            if (multiErr) {
                console.log('multiErr, upload part error:', multiErr);
                if (tryNum < maxUploadTries) {
                  console.log('Retrying upload of part: #', partParams.PartNumber)
                  uploadPart(s3, multipart, partParams, tryNum + 1);
                } else {
                  console.log('Failed uploading part: #', partParams.PartNumber)
                }
                return;
              }
            multipartMap.Parts[this.request.params.PartNumber - 1] = {
                ETag: mData.ETag,
                PartNumber: Number(this.request.params.PartNumber)
            };
            console.log("Completed part", this.request.params.PartNumber);
            // console.log('ETag', mData);
            if (--numPartsLeft > 0) { resolve(); return; } // complete only when all parts uploaded

            var doneParams = {
                Bucket: bucket,
                Key: partParams.Key,
                MultipartUpload: multipartMap,
                UploadId: multipart.UploadId
            };
            console.log("DONEPARAMS", doneParams);
            
            console.log("Completing upload...");
            await completeMultipartUpload(s3, doneParams);
            console.log('number of chunks :: ', numPartsLeft);
            resolve();
            return;
        });
    });
}

// Multipart
//console.log("Creating multipart upload for:", fileKey);
function test() {
    s3.createMultipartUpload(multiPartParams, function (mpErr, multipart) {
        if (mpErr) { console.log('Error!', mpErr); return; }
        console.log("Got upload ID", multipart.UploadId);

        // Grab each partSize chunk and upload it as a part
        for (var rangeStart = 0; rangeStart < buffer.length; rangeStart += partSize) {
            partNum++;
            var end = Math.min(rangeStart + partSize, buffer.length),
                partParams = {
                    Body: buffer.slice(rangeStart, end),
                    Bucket: bucket,
                    Key: multipart.fileKey,
                    PartNumber: String(partNum),
                    UploadId: multipart.UploadId
                };

            // Send a single part
            console.log('Uploading part: #', partParams.PartNumber, ', Range start:', rangeStart);
            uploadPart(s3, multipart, partParams);
        }
    });
}

async function createMultipartUpload(file) {
    console.log(file);
    var multiPartParams = {
        Bucket: bucket, 
        Key: file,
        ACL: 'public-read'
        // ContentType: 'application/pdf'
    };
    console.log(multiPartParams);
    return new Promise((resolve, reject) => {
        s3.createMultipartUpload(multiPartParams, function (mpErr, multipart) {
            if (mpErr) { console.log('Error!', mpErr); reject(multipart); }
            console.log("Got upload ID", multipart.UploadId);
            resolve(multipart);
        })
    })
}

async function initUpload(multipart, partNum, buffer, fileSize, fileName) {
    
    numPartsLeft = Math.ceil(fileSize / partSize)
    console.log('no of chunks from client to sever :: ',partNum);
    console.log('init upload multipart ::: ',multipart);
    console.log('init upload file data :: '+ fileName+'  fileSize '+ fileSize);

    let partParams = {
        Body: buffer,
        Bucket: bucket,
        Key: fileName,
        PartNumber: String(partNum),
        UploadId: multipart.UploadId
    };
    console.log('partParams',partParams);
    
    await uploadPart(s3, multipart, partParams);
    console.log("upload part complete");
    return;
}

module.exports = { createMultipartUpload, initUpload };