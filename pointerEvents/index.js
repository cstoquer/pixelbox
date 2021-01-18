var pixelbox       = require('..');
var settings       = pixelbox.settings;
var PIXEL_WIDTH    = ~~settings.screen.pixelSize.width;
var PIXEL_HEIGHT   = ~~settings.screen.pixelSize.height;
var CANVAS         = pixelbox.$screen.canvas;
var SINGLETOUCH    = true;
var MOUSE_ID       = 0;
var TOUCH_OFFSET_X = 0;
var TOUCH_OFFSET_Y = 0;

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
var MOUSE = { x: 0, y: 0, pressed: false };

var onStart   = null;
var onMove    = null;
var onRelease = null;
var onCancel  = null;
var onScroll  = null;

var touchIdentifier = 0;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
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
}

if (touchEventSettings.multiTouch) {
	SINGLETOUCH = false;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
CANVAS.addEventListener('mousedown', function (e) {
	e.preventDefault();
	window.focus();
	MOUSE.pressed = true;
	MOUSE.x = ~~(e.layerX / PIXEL_WIDTH);
	MOUSE.y = ~~(e.layerY / PIXEL_HEIGHT);
	onStart && onStart(MOUSE.x, MOUSE.y, MOUSE_ID, e);
});

CANVAS.addEventListener('mousemove', function (e) {
	e.preventDefault();
	MOUSE.x = ~~(e.layerX / PIXEL_WIDTH);
	MOUSE.y = ~~(e.layerY / PIXEL_HEIGHT);
	onMove && onMove(MOUSE.x, MOUSE.y, MOUSE_ID, e);
});

window.addEventListener('mouseup', function (e) {
	e.preventDefault();
	if (!MOUSE.pressed) return;
	MOUSE.pressed = false;
	MOUSE.x = ~~(e.layerX / PIXEL_WIDTH);
	MOUSE.y = ~~(e.layerY / PIXEL_HEIGHT);
	onRelease && onRelease(MOUSE.x, MOUSE.y, MOUSE_ID, e);
});

document.addEventListener('mouseleave', function (e) {
	if (!MOUSE.pressed) return;
	MOUSE.pressed = false;
	if (onCancel) {
		onCancel(MOUSE_ID, e)
	} else {
		onRelease && onRelease(MOUSE.x, MOUSE.y, MOUSE_ID, e);
	}
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
CANVAS.addEventListener('touchstart', function (e) {
	e.preventDefault();
	if (!onStart) return;

	var touches = e.changedTouches;

	// single touch
	if (SINGLETOUCH) {
		var touch = touches[0];
		touchIdentifier = touch.identifier;
		MOUSE.pressed = true;
		MOUSE.x = ~~((touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH);
		MOUSE.y = ~~((touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT);
		onStart(MOUSE.x, MOUSE.y, touch.identifier, touch);
		return;
	}

	// multi touch
	for (var t = 0; t < touches.length; t++) {
		var touch = touches[t];
		var x = ~~((touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH);
		var y = ~~((touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT);
		onStart(x, y, touch.identifier, touch);
	}
});

CANVAS.addEventListener('touchmove', function (e) {
	e.preventDefault();
	if (!onMove) return;

	var touches = e.changedTouches;
	for (var t = 0; t < touches.length; t++) {
		var touch = touches[t];
		var identifier = touch.identifier;

		// single touch
		if (SINGLETOUCH) {
			if (identifier !== touchIdentifier) continue;
			MOUSE.x = ~~((touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH);
			MOUSE.y = ~~((touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT);
			onMove(MOUSE.x, MOUSE.y, touch.identifier, touch);
			return;
		}

		// multitouch
		var x = ~~((touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH);
		var y = ~~((touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT);
		onMove(x, y, touch.identifier, touch);
	}
});

CANVAS.addEventListener('touchend', function (e) {
	e.preventDefault();
	if (!onRelease) return;

	var touches = e.changedTouches;
	for (var t = 0; t < touches.length; t++) {
		var touch = touches[t];
		var identifier = touch.identifier;

		// single touch
		if (SINGLETOUCH) {
			if (identifier !== touchIdentifier) continue;
			MOUSE.pressed = false;
			MOUSE.x = ~~((touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH);
			MOUSE.y = ~~((touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT);
			onRelease(MOUSE.x, MOUSE.y, touch.identifier, touch);
			return;
		}

		// multitouch
		var x = ~~((touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH);
		var y = ~~((touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT);
		onRelease(x, y, touch.identifier, touch);
	}
});

CANVAS.addEventListener('touchcancel', function (e) {
	e.preventDefault();
	if (!onCancel) return;

	var touches = e.changedTouches;
	for (var t = 0; t < touches.length; t++) {
		var touch = touches[t];
		var identifier = touch.identifier;

		// single touch
		if (SINGLETOUCH) {
			if (identifier !== touchIdentifier) continue;
			MOUSE.pressed = false;
			onCancel(touch.identifier, touch);
			return;
		}

		// multitouch
		onCancel(touch.identifier, touch);
	}
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
CANVAS.addEventListener('wheel', function (e) {
	e.preventDefault();
	var delta = e.wheelDeltaY;
	if (delta === 0) return;
	// NOTE: mouse scroll is usually 120 units. trackpad is much finer (3 units)
	onScroll && onScroll(delta, e);
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.onPress   = function (cb) { onStart   = cb }
exports.onRelease = function (cb) { onRelease = cb }
exports.onMove    = function (cb) { onMove    = cb }
exports.onCancel  = function (cb) { onCancel  = cb }
exports.onScroll  = function (cb) { onScroll  = cb }
exports.pointer   = MOUSE;
