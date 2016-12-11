var PIXEL_WIDTH    = settings.screen.pixelSize[0];
var PIXEL_HEIGHT   = settings.screen.pixelSize[1];
var SINGLETOUCH    = false; // TODO: from settings
var ENABLED        = true;
var TOUCH_ID       = null;
var MOUSE_ID       = 0;
var CANVAS         = null;
var TOUCH_OFFSET_X = 0;
var TOUCH_OFFSET_Y = 0;

// TODO ?
// exports.pointer = { click: false, x: 0, y: 0, allow: true };


// callback list
var _events = {
	start: { mouseEvent: null, mouseId: 'mousedown', touchEvent: null, touchId: 'touchstart' },
	end:   { mouseEvent: null, mouseId: 'mouseup',   touchEvent: null, touchId: 'touchend' },
	move:  { mouseEvent: null, mouseId: 'mousemove', touchEvent: null, touchId: 'touchmove' },
	// TODO touchcancel
};

/*
window.oncontextmenu = function () { return false; };

// Use document as opposed to window for IE8 compatibility
document.oncontextmenu = function () { return false; };

// Not compatible with IE < 9
window.addEventListener('contextmenu', function (e) { e.preventDefault(); }, false);
*/

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// TODO: this is for when canvas is resized or when an overlay is put on it
// TODO when the window resize or rotate (touch devices) this function must be call again
function setTarget(target) {
	CANVAS = target || CANVAS || $screen.canvas;
	var canvasPosition = CANVAS.getBoundingClientRect();
	TOUCH_OFFSET_X = canvasPosition.left;
	TOUCH_OFFSET_Y = canvasPosition.top;

	if (settings.touchEvent.disableContextMenu) {
		// disable right clic context menu
		CANVAS.oncontextmenu = function () {
			return false;
		};
	}

	if (settings.touchEvent.hideMousePointer) {
		CANVAS.style.cursor = 'none';
		// TODO other browser compatibility
	}

	// TODO: if fullscreen is set in configuration file:
	//  - recalculate PIXEL_WIDTH and PIXEL_HEIGHT
	//  - TOUCH_OFFSET
}

setTarget();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function disableContextMenu() {
	CANVAS.oncontextmenu = function () {
		return false;
	};
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.enable = function (enable) {
	enable = !!enable;
	if (ENABLED === enable) return;

	ENABLED = enable;
	
	if (ENABLED) {
		if (event.mouseEvent) CANVAS.addEventListener(event.mouseId, event.mouseEvent);
		if (event.touchEvent) CANVAS.addEventListener(event.touchId, event.touchEvent);
	} else {
		if (event.mouseEvent) CANVAS.removeEventListener(event.mouseId, event.mouseEvent);
		if (event.touchEvent) CANVAS.removeEventListener(event.touchId, event.touchEvent);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// exports.allowMultiTouch = function (allow) {
// 	// Do we want that ?
// 	// Should be set once and for all in the configuration file
// };

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function setEvent(id, cb) {
	var event = _events[id];

	if (ENABLED) {
		if (event.mouseEvent) CANVAS.removeEventListener(event.mouseId, event.mouseEvent);
		if (event.touchEvent) CANVAS.removeEventListener(event.touchId, event.touchEvent);
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

		// if (SINGLETOUCH && TOUCH_ID !== null && id === 'start') return;
		// TODO: single touch / multi touch

		var touches = e.changedTouches;

		for (var t = 0; t < touches.length; t++) {
			var touch = touches[t];
			var x = (touch.clientX  - TOUCH_OFFSET_X) / PIXEL_WIDTH;
			var y = (touch.clientY  - TOUCH_OFFSET_Y) / PIXEL_HEIGHT;
			cb(x, y, touch.identifier, touch);
		}
	};

	if (ENABLED) {
		CANVAS.addEventListener(event.mouseId, event.mouseEvent);
		CANVAS.addEventListener(event.touchId, event.touchEvent);
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.onStart = function (cb) { setEvent('start', cb); };
exports.onEnd   = function (cb) { setEvent('end',   cb); };
exports.onMove  = function (cb) { setEvent('move',  cb); };

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
