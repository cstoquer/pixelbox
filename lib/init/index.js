//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox main framework module
 * 
 * @author Cedric Stoquer
 */

var assetLoader  = require('assetLoader');
var AudioManager = require('audio-manager');

var PIXEL_SIZE = 4;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// audio

var audioManager = window.audioManager = new AudioManager(['sfx']);
audioManager.settings.audioPath = 'audio/';
audioManager.settings.defaultFade = 0.3;

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
// Texture

function createCanvas(w, h) {
	var canvas = document.createElement('canvas');
	canvas.width  = w;
	canvas.height = h;
	return canvas;
}

function Texture(w, h) {
	this.canvas = createCanvas(w, h);
	this.ctx = this.canvas.getContext('2d');
	this.ctx.fillStyle = '#000';
	// TODO camera offset
}

var currentCharset = new Texture(128, 128);

Texture.prototype.sprite = function (sprite, x, y, flipH, flipV) {
	var sx = sprite % 16;
	var sy = ~~(sprite / 16);
	this.ctx.drawImage(currentCharset, sx * 8, sy * 8, 8, 8, ~~x, ~~y, 8, 8);
};

Texture.prototype.blit = function (texture, x, y) {
	this.ctx.drawImage(texture, ~~x, ~~y);
};

Texture.prototype.clear = function () {
	this.ctx.fillRect(0, 0, 128, 128);
};

window.Texture = Texture;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// screen

function createScreen() {
	var texture = new Texture(128, 128);
	var canvas = texture.canvas;
	document.body.appendChild(canvas);
	var style = canvas.style;
	style.width  = 128 * PIXEL_SIZE + 'px';
	style.height = 128 * PIXEL_SIZE + 'px';
	return texture;
}

var screen = createScreen();

window.cls = function () {
	screen.clear();
};

window.sprite = function (sprite, x, y, flipH, flipV) {
	screen.sprite(sprite, x, y, flipH, flipV);
};

window.charset = function(img) {
	currentCharset = img;
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// main

var nop = function () {};

function onLoaded(error, assets) {
	if (error) {
		// TODO
		return console.error(error);
	}

	window.assets = assets;

	var main   = require('../src/main.js');
	var init   = main.init   || nop;
	var update = main.update || nop;

	init();
	update();
}

function showProgress(load, current, count) {
	// TODO
	console.log(load, current, count);
}

assetLoader.preloadStaticAssets(onLoaded, showProgress);
