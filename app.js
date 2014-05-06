#!/usr/bin/env node

var net = require('net');
var httpreq = require('httpreq');
var sprintf = require('sprintf').sprintf;

var controller = require('camera-controller');

var cam1 = new controller.Camera('192.168.0.12');
var cam2 = new controller.Camera('192.168.0.15');

cam1.moveToPreset(4, function (err, res) {
	if(err) return console.log(err);
	console.log(res);
});


// simple tcp server:
// var tcpport = 8000;
// var tcpserver = net.createServer(function (socket) {

// 	console.log('tcp socket connected: ' + socket.remoteAddress);

// 	socket.on('data', function (data) {
// 		data = data.toString();
// 		console.log('tcp data:', data);
// 		io.sockets.emit('action', data);
// 	});


// 	socket.on('end', function () {
// 		console.log('tcp socket disconnected');
// 	});

// 	socket.on('error', function (err) {
// 		console.log(err);
// 	});
// });

// tcpserver.listen(tcpport);
// console.log('> tcp server listening on port ' + tcpport);

