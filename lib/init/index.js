//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox main framework module
 * 
 * @author Cedric Stoquer
 */

var settings    = require('../settings.json');
window.settings = settings;

var assetLoader = require('assetLoader');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// built-in modules

window.inherits = function (Child, Parent) {
	Child.prototype = Object.create(Parent.prototype, {
		constructor: {
			value:        Child,
			enumerable:   false,
			writable:     true,
			configurable: true
		}
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// TINA
if (__USE_TINA__) {
	var TINA = require('tina');
	window.TINA = TINA;

	// setup TINA with a ticker
	var ticker = new TINA.Ticker().useAsDefault();
	TINA.add(ticker);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// Audio Manager
if (__USE_AUDIO__) {
	var AudioManager = require('audio-manager');
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
} else {
	// create AudioManager placeholder
	function noop() {};
	window.sfx   = noop;
	window.music = noop;
	window.audioManager = {
		addChannel:        noop,
		loadSound:         noop,
		playLoopSound:     noop,
		playSound:         noop,
		playSoundGroup:    noop,
		release:           noop,
		setMute:           noop,
		setVolume:         noop,
		setup:             noop,
		stopAllLoopSounds: noop,
		stopLoopSound:     noop,
		settings:          {}
	};
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// controls

var button   = window.btn  = {};
var bpress   = window.btnp = {};
var brelease = window.btnr = {};
var keyMap   = {};
var buttonNames  = [];
var buttonLength = 0;

(function setupKeyMap() {
	var controls = settings.controls || { up: 38, down: 40, left: 37, right: 39, A: 32, B: 88 };
	for (var key in controls) {
		var keyCode = controls[key];
		keyMap[keyCode] = key;
		button[key]   = false;
		bpress[key]   = false;
		brelease[key] = false;
		buttonNames.push(key);
	}
	buttonLength = buttonNames.length;
})();


if (__KEYBOARD__) {

	function resetControlTriggers() {
		for (var i = 0; i < buttonLength; i++) {
			bpress[buttonNames[i]]   = false;
			brelease[buttonNames[i]] = false;
		}
	}

	function keyChange(keyCode, isPressed) {
		var key = keyMap[keyCode];
		if (!key) return;
		if ( isPressed && !button[key])   bpress[key] = true;
		if (!isPressed &&  button[key]) brelease[key] = true;
		button[key] = isPressed;
	}

	window.addEventListener('keydown', function onKeyPressed(e) { e.preventDefault(); keyChange(e.keyCode, true);  });
	window.addEventListener('keyup',   function onKeyRelease(e) { e.preventDefault(); keyChange(e.keyCode, false); });
}

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
// pixelbox Core

if (__USE_CORE__) {
	var Texture = require('Texture');
	var Map     = require('Map');

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// Texture

	window.texture = function (img) {
		var texture = new Texture(img.width, img.height);
		texture.ctx.drawImage(img, 0, 0);
		return texture;
	}
	/** change default tilesheet used.
	 * @param {Image | Texture | Map} img - tilesheet to use as default.
	 *                         It can be aby renderable thing in Pixelbox
	 */
	window.tilesheet = function(img) {
		return Texture.prototype.setGlobalTilesheet(img);
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
	window.draw     = function (i, x, y, h, v, r) { return screen.draw(i, x, y, h, v, r);   };
	window.rect     = function (x, y, w, h)       { return screen.rect(x, y, w, h);         };
	window.rectfill = function (x, y, w, h)       { return screen.rectfill(x, y, w, h);     };
	window.camera   = function (x, y)             { return screen.setCamera(x, y);          };
	window.pen      = function (p)                { return screen.pen(p);                   };
	window.paper    = function (p)                { return screen.paper(p);                 };
	window.locate   = function (i, j)             { return screen.locate(i, j);             };
	window.print    = function (str, x, y)        { return screen.print(str, x, y);         };
	window.println  = function (str)              { return screen.println(str);             };

	window.getMap   = Map.getMap;

	/*Object.defineProperty(window, 'cls', {
		get: function () { return screen.cls(); },
		set: function () {}
	});*/
}

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
	if (__USE_CORE__) paper(0).pen(1).cls();

	if (error) {
		print(error);
		return console.error(error);
	}

	window.assets = assets;

	if (__USE_CORE__) {
		// set default tilesheet
		if (assets.tilesheet) tilesheet(assets.tilesheet);

		// setup all maps
		Map.loadBank(assets.maps);
	}

	var main = require('../src/main.js');

	if (!main.update) return;

	function update() {
		if (__USE_TINA__) TINA.update(); // update all tweeners
		main.update(); // call main update function
		if (__KEYBOARD__) resetControlTriggers(); // reset button pressed and release
		requestAnimationFrame(update);
	}

	if (__KEYBOARD__) resetControlTriggers();
	update();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// loader progress bar

if (__USE_CORE__) {
	var CENTER     = ~~(settings.screen.width  / 2);
	var HALF_WIDTH = ~~(settings.screen.width  / 4);
	var MIDDLE     = ~~(settings.screen.height / 2);

	function showProgress(load, current, count, percent) {
		rectfill(CENTER - HALF_WIDTH, MIDDLE - 2, ~~(percent * HALF_WIDTH * 2), 4);
	}

	var loaderColors = settings.loaderColors || [0, 1];
	if (!Array.isArray(loaderColors)) loaderColors = [0, 1];
	var c0 = ~~loaderColors[0];
	var c1 = ~~loaderColors[1];

	paper(c0).cls().paper(c1).pen(c1);
	rect(CENTER - HALF_WIDTH - 2, MIDDLE - 4, HALF_WIDTH * 2 + 4, 8); // loading bar
	assetLoader.preloadStaticAssets(onAssetsLoaded, showProgress);
} else {
	assetLoader.preloadStaticAssets(onAssetsLoaded);
}
