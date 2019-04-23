var fs = require('fs');
var AWS = require('aws-sdk');

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

var bucketName = 'laalsadev';

function uploadMultipart(absoluteFilePath, fileName, uploadCb) {
    s3.createMultipartUpload({ Bucket: bucketName, Key: fileName }, (mpErr, multipart) => {
      if(!mpErr){
        //console.log("multipart created", multipart.UploadId);
        fs.readFile(absoluteFilePath, (err, fileData) => {
  
          var partSize = 1024 * 1024 * 5;
          var parts = Math.ceil(fileData.length / partSize);
  
          async.timesSeries(parts, (partNum, next) => {
  
            var rangeStart = partNum*partSize;
            var end = Math.min(rangeStart + partSize, fileData.length);
  
            console.log("uploading ", fileName, " % ", (partNum/parts).toFixed(2));
  
            partNum++;  
            async.retry((retryCb) => {
              s3.uploadPart({
                Body: fileData.slice(rangeStart, end),
                Bucket: bucketName,
                Key: fileName,
                PartNumber: partNum,
                UploadId: multipart.UploadId
              }, (err, mData) => {
                retryCb(err, mData);
              });
            }, (err, data)  => {
              //console.log(data);
              next(err, {ETag: data.ETag, PartNumber: partNum});
            });
  
          }, (err, dataPacks) => {
            s3.completeMultipartUpload({
              Bucket: bucketName,
              Key: fileName,
              MultipartUpload: {
                Parts: dataPacks
              },
              UploadId: multipart.UploadId
            }, uploadCb);
          });
        });
      }else{
        uploadCb(mpErr);
      }
    });
  }

  module.exports = {uploadMultipart};