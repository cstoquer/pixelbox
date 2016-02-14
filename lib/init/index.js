//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox main framework module
 * 
 * @author Cedric Stoquer
 */

var settings     = require('../settings.json');
var assetLoader  = require('assetLoader');
var AudioManager = require('audio-manager');
var Texture      = require('Texture');
var TINA         = require('TINA');
var EventEmitter = require('EventEmitter');
var Map          = require('Map');


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// built-in modules

window.EventEmitter = EventEmitter;
window.Map          = Map;
window.TINA         = TINA;

window.inherits = function (Child, Parent) {
	Child.prototype = Object.create(Parent.prototype, {
		constructor: {
			value: Child,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// audio

var audioManager = window.audioManager = new AudioManager(['sfx']);
audioManager.settings.audioPath = 'audio/';
audioManager.settings.defaultFade = 0.3;

audioManager.init();
audioManager.setVolume('sfx', 1.0);

window.sfx = function (soundId, volume, panoramic, pitch) {
	audioManager.playSound('sfx', soundId, volume, panoramic, pitch);
};

window.music = function (soundId, volume) {
	if (!soundId) {
		audioManager.stopLoopSound('sfx');
		return;
	}
	audioManager.playLoopSound('sfx', soundId, volume);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// controls

var button   = window.btn  = { up: false, down: false, left: false, right: false, A: false, B: false };
var bpress   = window.btnp = { up: false, down: false, left: false, right: false, A: false, B: false };
var brelease = window.btnr = { up: false, down: false, left: false, right: false, A: false, B: false };

function resetControlTriggers() {
	bpress.up      = false;
	bpress.down    = false;
	bpress.left    = false;
	bpress.right   = false;
	bpress.A       = false;
	bpress.B       = false;
	brelease.up    = false;
	brelease.down  = false;
	brelease.left  = false;
	brelease.right = false;
	brelease.A     = false;
	brelease.B     = false;
}

var keyMap = {
	37: 'left',
	38: 'up',
	39: 'right',
	40: 'down',
	32: 'A',
	81: 'B'
};

function keyChange(keyCode, isPressed) {
	var key = keyMap[keyCode];
	if (!key) return;
	if ( isPressed && !button[key])   bpress[key] = true;
	if (!isPressed &&  button[key]) brelease[key] = true;
	button[key] = isPressed;
}

window.addEventListener('keydown', function onKeyPressed(e) { keyChange(e.keyCode, true);  });
window.addEventListener('keyup',   function onKeyRelease(e) { keyChange(e.keyCode, false); });


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// gamepads

var gamepads = window.gamepads = {};

(function(){
	var currentGamepads = navigator.getGamepads();
	for (var i = 0; i < currentGamepads.length; i++) {
		var gamepad = currentGamepads[i];
		if (!gamepad) continue;
		gamepads[gamepad.index] = gamepad;
	}
})();

function gamepadHandler(event, connecting) {
	var gamepad = event.gamepad;
	if (connecting) {
		gamepads[gamepad.index] = gamepad;
	} else {
		delete gamepads[gamepad.index];
	}
}

window.addEventListener("gamepadconnected",    function (e) { gamepadHandler(e, true);  }, false);
window.addEventListener("gamepaddisconnected", function (e) { gamepadHandler(e, false); }, false);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// Texture

var currentSpritesheet = Texture.prototype.currentSpritesheet;
var textCharset = Texture.prototype.textCharset;

window.Texture = Texture;

window.texture = function (img) {
	var texture = new Texture(img.width, img.height);
	texture.ctx.drawImage(img, 0, 0);
	return texture;
}

window.spritesheet = function(img) {
	return Texture.prototype.setGlobalSpritesheet(img);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// screen

function createScreen(width, height, pixelSize) {
	var texture = new Texture(width, height);
	var canvas = texture.canvas;
	document.body.appendChild(canvas);
	var style = canvas.style;
	style.width  = width  * pixelSize[0] + 'px';
	style.height = height * pixelSize[1] + 'px';
	return texture;
}

var screen = window.$screen = createScreen(settings.screen.width, settings.screen.height, settings.screen.pixelSize);
screen.setPalette(settings.palette);

window.cls      = function ()                 { return screen.cls();                    };
window.sprite   = function (s, x, y, h, v, r) { return screen.sprite(s, x, y, h, v, r); };
window.draw     = function (img, x, y)        { return screen.draw(img, x, y);          };
window.rect     = function (x, y, w, h)       { return screen.rect(x, y, w, h);         };
window.rectfill = function (x, y, w, h)       { return screen.rectfill(x, y, w, h);     };
window.camera   = function (x, y)             { return screen.setCamera(x, y);          };
window.pen      = function (p)                { return screen.pen(p);                   };
window.paper    = function (p)                { return screen.paper(p);                 };
window.locate   = function (i, j)             { return screen.locate(i, j);             };
window.print    = function (str, x, y)        { return screen.print(str, x, y);         };
window.println  = function (str)              { return screen.println(str);             };

/*Object.defineProperty(window, 'cls', {
	get: function () { return screen.cls(); },
	set: function () {}
});*/

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// utility functions

window.chr$ = function (chr) {
	return String.fromCharCode(chr);
};

window.clip = function (value, min, max) {
	return Math.max(min, Math.min(max, value));
};

window.random = function (n) {
	return ~~Math.round(n * Math.random());
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// simple clock divider utility class
function Clock(m) {
	this.m = m || 1;
	this.i = 0;
}
window.Clock = Clock;

Clock.prototype.tick = function(n) {
	this.i += n || 1;
	if (this.i > this.m) {
		this.i = 0;
		return true;
	}
	return false;
};
Clock.prototype.tic = Clock.prototype._tick; // deprecated

/*Object.defineProperty(Clock.prototype, 'tick', {
	get: function () { return this._tick(); },
	set: function () {}
});*/

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// main

var FRAME_INTERVAL = 1 / 60;

var requestAnimationFrame = 
	window.requestAnimationFrame       ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	window.oRequestAnimationFrame      ||
	window.msRequestAnimationFrame     ||
	function nextFrame(callback) { window.setTimeout(callback, FRAME_INTERVAL); };


function onAssetsLoaded(error, assets) {
	paper(0).pen(1).cls();

	if (error) {
		print(error);
		return console.error(error);
	}

	window.assets = assets;

	// set default spritesheet
	if (assets.spritesheet) spritesheet(assets.spritesheet);

	// setup all maps
	for (var i = 0; i < assets.maps.length; i++) {
		assets.maps[i] = new Map().load(assets.maps[i]);
	}

	// setup TINA with a ticker
	var ticker = new TINA.Ticker().useAsDefault();
	TINA.add(ticker);

	var main = require('../src/main.js');

	if (!main.update) return;

	function update() {
		TINA.update(); // update all tweeners
		main.update(); // call main update function
		resetControlTriggers(); // reset button pressed and release
		requestAnimationFrame(update);
	}

	resetControlTriggers();
	update();
}

var CENTER     = ~~(settings.screen.width  / 2);
var HALF_WIDTH = ~~(settings.screen.width  / 4);
var MIDDLE     = ~~(settings.screen.height / 2);


function showProgress(load, current, count, percent) {
	rectfill(CENTER - HALF_WIDTH, MIDDLE - 2, ~~(percent * HALF_WIDTH * 2), 4);
}

cls().paper(1).pen(1).rect(CENTER - HALF_WIDTH - 2, MIDDLE - 4, HALF_WIDTH * 2 + 4, 8); // loading bar
assetLoader.preloadStaticAssets(onAssetsLoaded, showProgress);
