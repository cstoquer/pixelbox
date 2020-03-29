
var settings       = window.settings;
var PIXEL_WIDTH    = ~~settings.screen.pixelSize.width;
var PIXEL_HEIGHT   = ~~settings.screen.pixelSize.height;
var CANVAS         = null;
var SINGLETOUCH    = true;
var MOUSE_ID       = 0;
var TOUCH_OFFSET_X = 0;
var TOUCH_OFFSET_Y = 0;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getCanvas() { return CANVAS; }
function getGlobal() { return window; }

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

// callback list
var _events = {
	start: { emitter: getCanvas, mouseId: 'mousedown', touchId: 'touchstart' },
	move:  { emitter: getCanvas, mouseId: 'mousemove', touchId: 'touchmove' },
	end:   { emitter: getGlobal, mouseId: 'mouseup',   touchId: 'touchend' },
};

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
	}

	if (touchEventSettings.multiTouch) {
		SINGLETOUCH = false;
	}
}

init();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function setEvent(id, cb) {
	var event = _events[id];

	var emitter = event.emitter();

	if (event.mouseEvent) emitter.removeEventListener(event.mouseId, event.mouseEvent);
	if (event.touchEvent) emitter.removeEventListener(event.touchId, event.touchEvent);

	event.mouseEvent = function (e) {
		e.preventDefault();
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

	emitter.addEventListener(event.mouseId, event.mouseEvent);
	emitter.addEventListener(event.touchId, event.touchEvent);
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
