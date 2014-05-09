#!/usr/bin/env node

var http = require('http')
var express = require('express');
var path = require('path');
var socketio = require('socket.io');
var net = require('net');
var _ = require('underscore');
var util = require('util')

var controller = require('panasonic-camera-controller');
var cam1 = new controller.Camera('192.168.0.12');
var cam2 = new controller.Camera('192.168.0.15');

var maincam = cam1;

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('tiny'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('123456789987654321'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

var webserver = http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

app.get('/', function (req, res) {
	res.render('controller.jade', { title: 'Panasonic Camera Controller', commands: convertCommands2HTMLData(controller.commands) });
});

function convertCommands2HTMLData (commands) {
	// convert commands to html input and output fields:

	var items = [];

	for (var i = 0; i < controller.commands.length; i++) {
		var command = controller.commands[i];

		var item = {
			data: command,
			html: {
				control: {
					enabled: false,
					inputfields: []
				},
				confirmation: {
					enabled: false
				},
				outputfields: []
			}
		}

		// is there a control input:
		if(command.commands.control){
			item.html.control.enabled = true;

			// find the number of [Data]-occurences (these are inputs);
			var match = command.commands.control.match(/\[Data\d*\]/g);
			if(match){
				for (var j = 0; j < match.length; j++) {
					// let's call this [Data1] the id for the inputfield:
					var id = match[j];

					// find values for that id:
					var values = command.values[id];

					item.html.control.inputfields.push({
						name: id,
						id: id,
						values: values
					});
				};
			}
		}

		// is there a confirmation input:
		if(command.commands.confirmation){
			item.html.confirmation.enabled = true;
		}

		// what are the outputfields:
		if(command.commands.response){
			// find the number of [Data]-occurences (these are inputs);
			var match = command.commands.response.match(/\[Data\d*\]/g);
			if(match){
				for (var j = 0; j < match.length; j++) {
					// let's call this [Data1] the id for the outputfield:
					var id = match[j];

					item.html.outputfields.push({
						name: id,
						id: id
					});
				};
			}
		}

		// console.log( util.inspect(item, false, null, true) );

		items.push(item);
	};

	return items;
}

app.get('/3d', function(req, res) {
	res.render('3d.ejs', { title: '3D Studio' });
});


// Socket IO
var io = socketio.listen(webserver);
io.set('log level', 0);


io.sockets.on('connection', function (socket) {
	console.log('[' + socket.handshake.address.address + '] user connected');

	socket.on('preset.move', function (preset, socketCallback) {

		console.log("setting preset ", preset);

		maincam.moveToPreset(preset, function (err, res) {
			if(err) return console.log(err);
			console.log(res);

			//respond immediately:
			socketCallback(res);
		});
	});


	socket.on('pantilt.absolute', function (data) {
		console.log('pantilt.absolute', data);


		maincam.pantiltAbsolute(data.pan, data.tilt, function (err, res) {
			if(err) return console.log(err);
			console.log(res);
		});
	});

	socket.on('command.control', function (data, socketCallback) {

		// console.log("data ", data);

		var command = _.find(controller.commands, function (command) {
			return command.item == data.item;
		});

		// console.log(command);

		var controlcommand = command.commands.control;

		for(var key in data.inputs){
			var value = data.inputs[key];

			// console.log("key", key, "value", value);

			controlcommand = controlcommand.replace(key, value);
		}

		// console.log("controlcommand", controlcommand);


		if(command.type == "pt"){
			maincam.sendPtCommand(controlcommand, function (err, res) {
				if(err) return console.log(err);
				console.log(res);

				//respond immediately:
				socketCallback(res);
			});
		}


		if(command.type == "camera"){
			maincam.sendCameraCommand(controlcommand, function (err, res) {
				if(err) return console.log(err);
				console.log(res);

				//respond immediately:
				socketCallback(res);
			});
		}


	});


});


// simple tcp server:
var tcpport = 35202;
var tcpserver = net.createServer(function (socket) {

	console.log('tcp socket connected: ' + socket.remoteAddress);

	socket.on('data', function (data) {
		data = data.toString();
		console.log('tcp data:', data);
	});


	socket.on('end', function () {
		console.log('tcp socket disconnected');
	});

	socket.on('error', function (err) {
		console.log(err);
	});
});

tcpserver.listen(tcpport);
console.log('TCP server listening on port ' + tcpport);


