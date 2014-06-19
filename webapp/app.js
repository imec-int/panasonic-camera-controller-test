#!/usr/bin/env node

var http = require('http')
var express = require('express');
var path = require('path');
var socketio = require('socket.io');
var net = require('net');
var _ = require('underscore');
var util = require('util');

var controller = require('panasonic-camera-controller');
var cam1 = new controller.Camera('10.32.206.37');
var cam2 = new controller.Camera('10.32.206.38'); // 10.32.206.39

var maincam = cam2;

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
		var cmd = controller.commands[i];

		var item = {
			cmd: cmd,
			html: {
				inputfields: [],
				outputfields: []
			}
		}


		// find the number of [Data]-occurences (these are inputs);
		var match = cmd.input.match(/\[Data\d*\]/g);
		if(match){
			for (var j = 0; j < match.length; j++) {
				// let's call this [Data1] the id for the inputfield:
				var id = match[j];

				// find values for that id:
				var values = cmd.values[id];

				item.html.inputfields.push({
					name: id.replace(/\[|\]/g, ''), // removed the '[' and ']'
					id: id,
					values: values
				});
			};
		}


		// what are the outputfields:
		if(cmd.output){
			// find the number of [Data]-occurences (these are inputs);
			var match = cmd.output.match(/\[Data\d*\]/g);
			if(match){
				for (var j = 0; j < match.length; j++) {
					// let's call this [Data1] the id for the outputfield:
					var id = match[j];

					item.html.outputfields.push({
						name: id.replace(/\[|\]/g, ''), // removed the '[' and ']'
						id: id
					});
				};
			}
		}

		console.log( util.inspect(item, false, null, true) );

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

	socket.on('command', function (data, socketCallback) {

		// console.log("data ", data);

		var cmd = _.find(controller.commands, function (cmd) {
			return cmd.name == data.name; // TODO: add type to be sure
		});

		// console.log(cmd);

		var input = cmd.input;

		for(var key in data.inputs){
			var value = data.inputs[key];

			// console.log("key", key, "value", value);

			input = input.replace(key, value);
		}

		// console.log("input", input);


		if(cmd.type == "pt"){
			maincam.sendPtCommand(input, function (err, res) {
				if(err) return console.log(err);
				console.log(res);

				//respond immediately:
				socketCallback(res);
			});
		}


		if(cmd.type == "camera"){
			maincam.sendCameraCommand(input, function (err, res) {
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






