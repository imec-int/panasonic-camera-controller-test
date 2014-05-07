require([
	'goo/entities/GooRunner',
	'goo/fsmpack/statemachine/StateMachineSystem',
	'goo/entities/systems/HtmlSystem',
	'goo/timelinepack/TimelineSystem',
	'goo/loaders/DynamicLoader',
	'goo/math/MathUtils',

	'/javascripts/3d/CanvasWrapper.js',
	'/javascripts/3d/checkBrowser.js',

	'goo/fsmpack/StateMachineComponentHandler',
	'goo/fsmpack/MachineHandler',
	'goo/timelinepack/TimelineComponentHandler',
	'goo/quadpack/QuadComponentHandler'
], function (
	GooRunner,
	StateMachineSystem,
	HtmlSystem,
	TimelineSystem,
	DynamicLoader,
	MathUtils,
	CanvasWrapper,
	checkBrowser
) {
	'use strict';

	function setup(goo, loader) {
			// Application code goes here!
			// gooRunner.world.by.name('Cam_Left').first().setAsMainCamera();
			// console.log(gooRunner.world.by.name('Cam_Left').first().scriptComponent.scripts[0]);
			camController["Front"] = goo.world.by.name('Cam_Center_Far').first();
			camController["Right"] = goo.world.by.name('Cam_Right').first();
			camController["Back L"] = goo.world.by.name('Cam_Rear_Right').first();
			camController["Back R"] = goo.world.by.name('Cam_Rear_Left').first();
			camController["Left"] = goo.world.by.name('Cam_Left').first();
			console.log("Cams loaded");
			console.log(camController);
			// console.log(camController["Front"].scriptComponent.scripts[0].parameters.speed);

			// console.log(camController["Front"].getRotation().data);
			showCameraInfo(camController["Front"]);
			activeCamId = 'Front';
			/*
			To get a hold of entities, one can use the World's selection functions:
			var allEntities = gooRunner.world.getEntities();                  // all
			var entity      = gooRunner.world.by.name('EntityName').first();  // by name
			*/
	}

	function init() {
		// Prevent browser peculiarities to mess with our controls.
		document.body.addEventListener('touchstart', function(event) {
			event.preventDefault();
		}, false);

		// Check that the browser supports webGL
		checkBrowser();

		// Init the GooEngine
		var gooRunner = initGoo();

		// Load the project
		loadProject(gooRunner).then(function(loader) {
			gooRunner.world.process();
			return setup(gooRunner, loader);
		}).then(function() {
			// Hide the loading overlay.
			document.getElementById('loading-overlay').style.display = 'none';
			CanvasWrapper.show();
			gooRunner.world.process();
			CanvasWrapper.resize();
			// Start the rendering loop!
			gooRunner.startGameLoop();

			gooRunner.renderer.domElement.focus();
		}).then(null, function(e) {
			// If something goes wrong, 'e' is the error message from the engine.
			alert('Failed to load project: ' + e);
		});

	}


	function initGoo() {
		// Create typical Goo application.
		var gooRunner = new GooRunner({
			antialias: true,
			manuallyStartGameLoop: true,
			useDevicePixelRatio: true
		});

		gooRunner.world.add(new StateMachineSystem(gooRunner));
		gooRunner.world.add(new HtmlSystem(gooRunner.renderer));
		gooRunner.world.add(new TimelineSystem());

		return gooRunner;
	}


	function loadProject(gooRunner) {
		/**
		 * Callback for the loading screen.
		 *
		 * @param  {number} handled
		 * @param  {number} total
		 */
		var progressCallback = function (handled, total) {
			var loadedPercent = (100 * handled / total).toFixed();
			var loadingOverlay = document.getElementById("loading-overlay");
			var progressBar = document.getElementById("progress-bar");
			var progress = document.getElementById("progress");
			var loadingMessage = document.getElementById("loading-message");

			loadingOverlay.style.display = "block";
			loadingMessage.style.display = "block";
			progressBar.style.display = "block";
			progress.style.width = loadedPercent + "%";
		};

		// The loader takes care of loading the data.
		var loader = new DynamicLoader({
			world: gooRunner.world,
			rootPath: 'res'
		});

		return loader.load('root.bundle', {
			preloadBinaries: true,
			progressCallback: progressCallback
		}).then(function(result) {
			var project = null;

			// Try to get the first project in the bundle.
			for (var key in result) {
				if (/\.project$/.test(key)) {
					project = result[key];
					break;
				}
			}

			if (!project || !project.id) {
				alert('Error: No project in bundle'); // Should never happen.
				return null;
			}

			// Setup the canvas configuration (sizing mode, resolution, aspect
			// ratio, etc).
			var scene = result[project.mainSceneRef];
			var canvasConfig = scene ? scene.canvas : {};
			CanvasWrapper.setup(gooRunner.renderer.domElement, canvasConfig);
			CanvasWrapper.add();
			CanvasWrapper.hide();



			return loader.load(project.id);
		});
	}

	function initEvents(){
		console.log("initEvents");
		$("#camButtons>span").click(function(){
			changeCam($(this).html());
			$("#camButtons span").removeClass("activeCam");
			$(this).addClass("activeCam");
		});
		$(document).mouseup(function(){
			showCameraInfo(camController[activeCamId]);
		});
	}

	function changeCam(e){
		//console.log(camController[e]);
		activeCamId = e;
		camController[e].setAsMainCamera();
		showCameraInfo(camController[e]);
	}

	function showCameraInfo(cam){
		for (var i = 0; i < 3; i++) {
				$('#translate_'+i).val(cam.getTranslation().data[i].toFixed(2));
		};
		//rotate
		for (var i = 0; i < 3; i++) {
			$('#rotate_'+i).val(MathUtils.degFromRad(cam.getRotation().data[i]).toFixed(2)) ;
		};
		//Zoom
		$('#zoom_0').val(cam.cameraComponent.camera.fov);
	}

	var cams = [null];
	var camController = {};
	var activeCamId = '';

	init();
	initEvents();
});
