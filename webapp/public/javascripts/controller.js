var ControllerApp = function (options){

	var socket = null;

	var init = function (){
		initSocket();
		addHandlers();
		FastClick.attach(document.body);
	};

	var initSocket = function (){
		if(socket) return; // already initialized

		socket = io.connect(window.location.hostname);

		// some debugging statements concerning socket.io
		socket.on('reconnecting', function(seconds){
			console.log('reconnecting in ' + seconds + ' seconds');
		});
		socket.on('reconnect', function(){
			console.log('reconnected');
		});
		socket.on('reconnect_failed', function(){
			console.log('failed to reconnect');
		});
		socket.on('connect', function() {
			console.log('socket connected');
		});
	};

	var addHandlers = function () {
		$('.preset').click( onPresetClick );
	};

	var onPresetClick = function (event){
		var preset = $(this).attr('data-preset');

		console.log(preset);

		socket.emit('preset.move', preset, function (data) {
			console.log(data);
		});
	};

	return {
		init: init
	};
};



$(function(){
	var app = new ControllerApp();
	app.init();
});


