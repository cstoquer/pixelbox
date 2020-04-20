/**
 * Pixelbox Bootstrap
 * @author Cedric Stoquer
 *
 * @license
 * This file is part of the Pixelbox SDK.
 *
 * Copyright (C) 2016-2020 Cedric Stoquer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var projectData = require('./projectData.json');
// projectData.settings.buildTime = __BUILD_TIME__;
// projectData.settings.version = __GAME_VERSION__;
// projectData.settings.pixelboxVersion = __PIXELBOX_VERSION__;
window.settings = projectData.settings;

var assetLoader = require('./assetLoader');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// built-in modules

window.inherits = require('./inherits');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// electron
if (__BUILD_TYPE__ === 'electron') {
	var remote = require('electron').remote;
	window.setFullScreen = function(value) {
		remote.getCurrentWindow().setFullScreen(value);
	}
} else {
	window.setFullScreen = function () {};
}

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
// Polyfill to ensure only one instance of AudioContext
(function(){
	var audioContextInstance = null;
	var AudioContext = window.AudioContext || window.webkitAudioContext;

	function resumeContext() {
		audioContextInstance.resume();
		document.body.removeEventListener('mousedown',  resumeContext);
		document.body.removeEventListener('touchstart', resumeContext);
	}

	window.AudioContext = window.webkitAudioContext = function () {
		if (audioContextInstance) return audioContextInstance;
		audioContextInstance = new AudioContext();

		document.body.addEventListener('mousedown',  resumeContext);
		document.body.addEventListener('touchstart', resumeContext);

		return audioContextInstance;
	}
})();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// Audio Manager
if (__USE_AUDIO__ || __USE_BLEEPER__) {
	var AudioManager = require('audio-manager');
	var audioManager = window.audioManager = new AudioManager(['sfx']);
	audioManager.settings.audioPath = 'audio/';
	audioManager.settings.defaultFade = 0.3;

	audioManager.init();
	audioManager.setVolume('sfx', 1.0);

	window.sfx = function (soundId, volume, panoramic, pitch) {
		audioManager.playSound('sfx', soundId, volume, panoramic, pitch);
	};

	window.music = function (soundId, volume, loopStart, loopEnd) {
		if (!soundId) {
			audioManager.stopLoopSound('sfx');
			return;
		}
		audioManager.playLoopSound('sfx', soundId, volume, 0, 0, loopStart, loopEnd);
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

	window.addEventListener('keydown', function onKeyPressed(e) {
		e.preventDefault();
		if (e.repeat) return;
		keyChange(e.keyCode, true);
	});

	window.addEventListener('keyup', function onKeyRelease(e) {
		e.preventDefault();
		keyChange(e.keyCode, false);
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// utility functions

window.chr$ = function (chr) {
	return String.fromCharCode(chr);
};

window.clamp = function (value, min, max) {
	return Math.max(min, Math.min(max, value));
};

window.random = function (n, max) {
	if (max === undefined) return ~~(n * Math.random());
	return ~~(n + Math.random() * (max - n));
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// pixelbox Core

var webGL;

if (__USE_CORE__) {
	var Texture = require('./Texture');
	var TileMap = require('./TileMap');

	if (__USE_WEBGL__) {
		webGL = require('./webGL');
		require('./Texture/webGL');
		require('./TileMap/webGL');
		if (__MINI_TEXT__) require('./Texture/textWebGL');
	} else {
		require('./Texture/canvas2D');
		if (__MINI_TEXT__) require('./Texture/textCanvas2D');
	}

	var TILE_WIDTH  = settings.tileSize.width;
	var TILE_HEIGHT = settings.tileSize.height;
	Texture.setTileSize(TILE_WIDTH, TILE_HEIGHT);
	TileMap.setTileSize(TILE_WIDTH, TILE_HEIGHT);

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// Texture

	window.texture = function (img) {
		var texture = new Texture(img.width, img.height);
		texture.clear().draw(img, 0, 0);
		return texture;
	}
	/** change default tilesheet used.
	 * @param {Image | Texture | Map} img - tilesheet to use as default.
	 *                         It can be any renderable thing in Pixelbox
	 */
	window.tilesheet = function(img) {
		return Texture.prototype.setGlobalTilesheet(img);
	};

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// screen

	function createScreen() {
		var params    = settings.screen;
		var width     = params.width;
		var height    = params.height;
		var pixelSize = params.pixelSize;

		var texture = window.$screen = new Texture(width, height);
		if (__USE_WEBGL__) texture.canvas = webGL.context.canvas;
		var canvas = texture.canvas;
		var style  = canvas.style;

		document.body.appendChild(canvas);

		if (params.fullscreen) {
			if (params.keepAspectRatio) {
				function resizeScreen() {
					var iw = window.innerWidth;
					var ih = window.innerHeight;
					var sw = width  * pixelSize.width;
					var sh = height * pixelSize.height;
					var ratio = Math.min(iw / sw, ih / sh);
					var fw = sw * ratio;
					var fh = sh * ratio;
					// get current canvas (allow $screen redefinition, e.g. webGL)
					var style = $screen.canvas.style;
					style.width  = fw + 'px';
					style.height = fh + 'px';
					style.left = (iw - fw) / 2 + 'px';
					style.top  = (ih - fh) / 2 + 'px';
				}
				addEventListener('resize', resizeScreen);
				resizeScreen();
			} else {
				style.width = style.height = '100%';
			}
		} else {
			style.width  = width  * pixelSize.width  + 'px';
			style.height = height * pixelSize.height + 'px';
		}

		return texture;
	}

	var screen = createScreen();

	window.cls      = function ()                 { return screen.cls();                    };
	window.sprite   = function (s, x, y, h, v, r) { return screen.sprite(s, x, y, h, v, r); };
	window.draw     = function (i, x, y, h, v, r) { return screen.draw(i, x, y, h, v, r);   };
	window.rect     = function (x, y, w, h)       { return screen.rect(x, y, w, h);         };
	window.rectf    = function (x, y, w, h)       { return screen.rectf(x, y, w, h);        };
	window.camera   = function (x, y)             { return screen.setCamera(x, y);          };
	window.pen      = function (paletteIndex)     { return screen.pen(paletteIndex);        };
	window.paper    = function (paletteIndex)     { return screen.paper(paletteIndex);      };

	if (__MINI_TEXT__) {
		window.locate  = function (i, j)            { return screen.locate(i, j);           };
		window.print   = function (text, x, y)      { return screen.print(text, x, y);      };
		window.println = function (text)            { return screen.println(text);          };
	}

	window.getMap   = TileMap.getMap;
	window.rectfill = window.rectf; // legacy

	if (__NO_CONTEXT_MENU__) {
		// disable browser's context menu
		screen.canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); return false; });
	}
} else {
	if (__NO_CONTEXT_MENU__) {
		document.body.addEventListener('contextmenu', function (e) { e.preventDefault(); return false; });
	}
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

window.frameId = 0;

function onAssetsLoaded(error, assets) {
	if (__USE_CORE__) paper(0).pen(1).cls();

	if (error) {
		console.error(error);
		print(error);
		return;
	}

	window.assets = assets;

	if (__USE_BLEEPER__) {
		var bleeper = window.bleeper = require('./bleeper');
		// NOTA: `assets.bleeper` program is overwritten with a sound map
		if (assets.bleeper) bleeper.loadProgram(assets.bleeper);
	}

	if (__USE_TRACKER__) {
		var patatracker = window.patatracker = require('./pataTracker');
		if (assets.patatracker) patatracker.loadData(assets.patatracker);
	}

	if (__HAS_ATLAS__) {
		require('./spritesheet').unpackSpritesheets();
	}

	if (__USE_CORE__) {
		// extract palette
		function getPalette() {
			var Color = require('./Color');
			var palette = settings.palette;

			if (palette.file) {
				// TODO: allow file to be json data
				var paths = palette.file.split('/');
				var img = assets;
				while (img && paths.length) img = img[paths.shift()];
				if (!img) return; // TODO: default palette

				var w = img.width;
				var h = img.height;
				var ox = img.x || 0;
				var oy = img.y || 0;
				if (img._isSprite) img = img.img;

				var createCanvas = require('./domUtils/createCanvas');
				var ctx = createCanvas(w, h).getContext('2d');
				ctx.drawImage(img, ox, oy, w, h, 0, 0, w, h);
				var pixels = ctx.getImageData(0, 0, w, h).data;

				var colors = [];
				for (var i = 0; i < pixels.length; i += 4) {
					if (pixels[i + 3] <= 1) continue;
					colors.push(new Color().fromPixel(pixels, i));
				}
				screen.setPalette(colors);
			} else {
				var colorConfig;
				if (palette.colors) {
					colorConfig = palette.colors
				} else {
					// TODO: to be deprecated. assuming legacy format, an array of css colors strings
					colorConfig = palette;
				}

				var colors = [];
				for (var i = 0; i < colorConfig.length; i++) {
					colors.push(new Color().fromString(colorConfig[i]));
				}

				screen.setPalette(colors);
			}
		}

		getPalette();

		// set default tilesheet
		if (assets.tilesheet) tilesheet(assets.tilesheet);

		// setup all maps
		TileMap.loadBank(assets.maps);
	}

	if (__GAMEPAD__) {
		var gamepad = require('./gamepad');
		var gamepadSettings = settings.gamepad || {};
		if (gamepadSettings.analogToDpad) {
			gamepad.mapAnalogStickToDpad(gamepadSettings.deadZone);
		}
	}

	// `main.js` from `node_modules/pixelbox/boostrap`
	var main = require('../../src/main.js');

	if (!main.update) {
		if (__USE_WEBGL__) {
			// still need an update loop to commit webGL
			function updateWebGL() {
				webGL.commit();
				requestAnimationFrame(updateWebGL);
			}
			updateWebGL();
		}
		return;
	}

	if (__USE_WEBGL__) webGL.batcher.flush();

	function update() {
		window.frameId += 1;
		if (__USE_TINA__) TINA.update(); // update all tweeners
		if (__GAMEPAD__) gamepad.update();
		main.update(); // call main update function
		if (__KEYBOARD__) resetControlTriggers(); // reset button pressed and release
		// TODO: pointer/cursor/mouse/touch reset
		if (__USE_WEBGL__) webGL.commit();
		requestAnimationFrame(update);
	}

	if (__KEYBOARD__) resetControlTriggers();
	update();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// loader progress bar

if (__CUSTOM_LOADER__) {
	var customLoader = require('../src/' + __CUSTOM_LOADER__);
	function nopAsync(cb) { return cb(); }

	var customStart    = customLoader.onStart || nopAsync;
	var customEnd      = customLoader.onEnd   || nopAsync;
	var customProgress = customLoader.onProgress || function (load, current, count, percent) {};

	customStart(function () {
		assetLoader.preloadStaticAssets(
			projectData,
			function (error, assets) {
				customEnd(function () {
					onAssetsLoaded(error, assets);
				}, error);
			},
			customProgress
		);
	});

} else if (__USE_CORE__) {

	var CENTER     = ~~(settings.screen.width  / 2);
	var HALF_WIDTH = ~~(settings.screen.width  / 4);
	var MIDDLE     = ~~(settings.screen.height / 2);

	function showProgress(load, current, count, percent) {
		rect(CENTER - HALF_WIDTH - 2, MIDDLE - 4, HALF_WIDTH * 2 + 4, 8);
		rectf(CENTER - HALF_WIDTH, MIDDLE - 2, ~~(percent * HALF_WIDTH * 2), 4);
		if (__USE_WEBGL__) webGL.commit();
	}

	var DEFAULT_LOADER_COLORS = ['#000', '#FFF'];
	var loaderColors = (settings.loader && settings.loader.colors) || settings.loaderColors || DEFAULT_LOADER_COLORS;
	if (!Array.isArray(loaderColors)) loaderColors = DEFAULT_LOADER_COLORS;
	var Color = require('./Color');
	screen.setPalette([
		new Color().fromString(loaderColors[0]),
		new Color().fromString(loaderColors[1])
	]);

	paper(0);
	cls();
	paper(1);
	pen(1);

	rect(CENTER - HALF_WIDTH - 2, MIDDLE - 4, HALF_WIDTH * 2 + 4, 8); // loading bar border
	if (__USE_WEBGL__) webGL.commit();
	assetLoader.preloadStaticAssets(projectData, onAssetsLoaded, showProgress);

} else {
	assetLoader.preloadStaticAssets(projectData, onAssetsLoaded);
}
