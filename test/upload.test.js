const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const className = require('../views/client');
const addClass = className.handleImage;

var should = require('should');
var io = require('socket.io');

var socketURL = 'http://localhost:3030';

// var options ={
//   transports: ['websocket'],
//   'force new connection': true
// };

//chai.use(chaiHttp);


describe("Chat Server", function () {
    it('Should broadcast connection', function (done) {
        var client1 = io.connect(socketURL);

        client1.on('connect', function () {
            client1.emit('connection name', chatUser1);

            //   client2.on('new user', function(usersName){
            //     usersName.should.equal(chatUser2.name + " has joined.");
            //     client2.disconnect();
            //   });

        });
    });
});

// describe("Color Code Converter", function () {

//     it('should accept a message as the 3rd argument', function () {
//         err(function () {
//             assert.fail(0, 1, 'this has failed');
//         }, /this has failed/);
//     });

// });