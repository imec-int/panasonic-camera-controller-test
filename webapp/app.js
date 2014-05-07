var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
var net = require('net');
var controller = require('panasonic-camera-controller');

var cam1 = new controller.Camera('192.168.0.12');
var cam2 = new controller.Camera('192.168.0.15');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

var webserver = http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

// Socket IO
var io = socketio.listen(webserver);
io.set('log level', 0);


app.get('/', function(req, res) {
    res.render('controller', { title: 'Panasonic Camera Controller' });
});

app.get('/3d', function(req, res) {
    res.render('3d', { title: '3D Studio' });
});


io.sockets.on('connection', function (socket) {
    console.log('[' + socket.handshake.address.address + '] user connected');

    socket.on('preset.move', function (preset, socketCallback) {

        console.log("setting preset ", preset);

        cam1.moveToPreset(preset, function (err, res) {
            if(err) return console.log(err);
            console.log(res);
        });

        //respond immediatly:
        socketCallback();
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


