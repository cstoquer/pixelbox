
var settings = window.settings;
var PIXEL_WIDTH    = ~~settings.screen.pixelSize.width;
var PIXEL_HEIGHT   = ~~settings.screen.pixelSize.height;
var SINGLETOUCH    = true;
var ENABLED        = true;
var MOUSE_ID       = 0;
var CANVAS         = $screen.canvas;
var TOUCH_OFFSET_X = 0;
var TOUCH_OFFSET_Y = 0;

var MOUSE_EMITTER = CANVAS;
var TOUCH_EMITTER = CANVAS;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// auto update pixel size when game is full screen

if (settings.screen.fullscreen) {

	var SCREEN_WIDTH  = settings.screen.width;
	var SCREEN_HEIGHT = settings.screen.height;
	var resizeTimeout = null;

	function resizePixels() {
		resizeTimeout = null;
		var rect = CANVAS.getBoundingClientRect();
		PIXEL_WIDTH  = rect.width  / SCREEN_WIDTH;
		PIXEL_HEIGHT = rect.height / SCREEN_HEIGHT;
	}

	window.onresize = function () {
		if (resizeTimeout) window.clearTimeout(resizeTimeout);
		resizeTimeout = window.setTimeout(resizePixels, 300);
	};

	// call resize once when the module is required
	resizePixels();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

// TODO ?
// exports.pointer = { click: false, x: 0, y: 0, allow: true };


// callback list
var _events = {
	start: { mouseEvent: null, mouseId: 'mousedown', touchEvent: null, touchId: 'touchstart' },
	end:   { mouseEvent: null, mouseId: 'mouseup',   touchEvent: null, touchId: 'touchend' },
	move:  { mouseEvent: null, mouseId: 'mousemove', touchEvent: null, touchId: 'touchmove' },
	// TODO touchcancel
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// function createTouchEmitterProxy() {
// 	var emitter = new EventEmitter();
// 	var TOUCH_ID = null;

// 	// rebind touch events
// 	CANVAS.addEventListener('touchstart', function (e) {
// 		// TODO
// 		// emitter.emit('touchstart', e);
// 	});

// 	return emitter;
// }

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function init(target) {
	CANVAS = target || CANVAS || $screen.canvas;
	var canvasPosition = CANVAS.getBoundingClientRect();
	TOUCH_OFFSET_X = canvasPosition.left;
	TOUCH_OFFSET_Y = canvasPosition.top;

	var touchEventSettings = settings.touchEvent || {};

	if (touchEventSettings.disableContextMenu) {
		// disable right clic context menu
		CANVAS.oncontextmenu = function () {
			return false;
		};
	}

	if (touchEventSettings.hideMousePointer) {
		CANVAS.style.cursor = 'none';
		// TODO other browser compatibility (use blank cursor)
	}

	if (touchEventSettings.multiTouch) {
		SINGLETOUCH = false;
	}

	// TODO: if fullscreen is set in configuration file:
	//  - recalculate PIXEL_WIDTH and PIXEL_HEIGHT
	//  - TOUCH_OFFSET

	// TOUCH_EMITTER = SINGLETOUCH ? createTouchEmitterProxy() : CANVAS;
	TOUCH_EMITTER = CANVAS; // TODO
}

init();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// function disableContextMenu() {
// 	CANVAS.oncontextmenu = function () {
// 		return false;
// 	};
// }

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.enable = function (enable) {
	enable = !!enable;
	if (ENABLED === enable) return;

	ENABLED = enable;

	if (ENABLED) {
		if (event.mouseEvent) MOUSE_EMITTER.addEventListener(event.mouseId, event.mouseEvent);
		if (event.touchEvent) TOUCH_EMITTER.addEventListener(event.touchId, event.touchEvent);
	} else {
		if (event.mouseEvent) MOUSE_EMITTER.removeEventListener(event.mouseId, event.mouseEvent);
		if (event.touchEvent) TOUCH_EMITTER.removeEventListener(event.touchId, event.touchEvent);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function setEvent(id, cb) {
	var event = _events[id];

	if (ENABLED) {
		if (event.mouseEvent) MOUSE_EMITTER.removeEventListener(event.mouseId, event.mouseEvent);
		if (event.touchEvent) TOUCH_EMITTER.removeEventListener(event.touchId, event.touchEvent);
	}

	event.mouseEvent = function (e) {
		e.preventDefault();
		// TODO: click information (which, etc.)
		var x = e.layerX / PIXEL_WIDTH;
		var y = e.layerY / PIXEL_HEIGHT;
		cb(x, y, MOUSE_ID, e);
	};

	event.touchEvent = function (e) {
		e.preventDefault();

		var touches = e.changedTouches;

		for (var t = 0; t < touches.length; t++) {
			var touch = touches[t];
			var x = (touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH;
			var y = (touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT;
			cb(x, y, touch.identifier, touch);
		}
	};

	if (ENABLED) {
		MOUSE_EMITTER.addEventListener(event.mouseId, event.mouseEvent);
		TOUCH_EMITTER.addEventListener(event.touchId, event.touchEvent);
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.onPress   = function (cb) { setEvent('start', cb); };
exports.onRelease = function (cb) { setEvent('end',   cb); };
exports.onMove    = function (cb) { setEvent('move',  cb); };

exports.onScroll  = function (cb) {
	function onMouseScroll(e) {
		e.preventDefault();
		var delta = e.wheelDeltaY;
		if (delta === 0) return;
		// NOTE: mouse scroll is usually 120 units. trackpad is much finer (3 units)
		cb(delta, e);
	}
	$screen.canvas.addEventListener('wheel', onMouseScroll);
};

exports.onEnter = function (cb) {
	// TODO
};

exports.onExit = function (cb) {
	// TODO
};

// //▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// // optionnal / to think about
// exports.onTap = function (cb) {
// 	// function (x, y, touchId) { /* .. */ });
// };

// //▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// // optionnal / to think about
// exports.onSwipe = function (cb) {
// 	// function (swipe, touchId) { /* .. */ });
// };
