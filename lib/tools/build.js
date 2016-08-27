(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function EventEmitter() {
	this._events = {};
};

module.exports = EventEmitter;

EventEmitter.listenerCount = function (emitter, evt) {
	var handlers = emitter._events[evt];
	return handlers ? handlers.length : 0;
};

EventEmitter.prototype.on = function (evt, fn) {
	if (typeof fn !== 'function') {
		throw new TypeError('Tried to register non-function as event handler for event: ' + evt);
	}

	// we emit first, because if evt is "newListener" it would go recursive
	this.emit('newListener', evt, fn);

	var allHandlers = this._events;
	var evtHandlers = allHandlers[evt];
	if (evtHandlers === undefined) {
		// first event handler for this event type
		allHandlers[evt] = [fn];
	} else {
		evtHandlers.push(fn);
	}

	return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function (evt, fn) {
	if (!fn.once) {
		fn.once = 1;
	} else {
		fn.once += 1;
	}

	return this.on(evt, fn);
};

EventEmitter.prototype.setMaxListeners = function () {
	console.warn('Method setMaxListeners not supported, there is no limit to the number of listeners');
};

EventEmitter.prototype.removeListener = function (evt, handler) {
	// like node.js, we only remove a single listener at a time, even if it occurs multiple times

	var handlers = this._events[evt];
	if (handlers !== undefined) {
		var index = handlers.indexOf(handler);
		if (index !== -1) {
			handlers.splice(index, 1);

			if (handlers.length === 0) {
				delete this._events[evt];
			}

			this.emit('removeListener', evt, handler);
		}
	}
	return this;
};

EventEmitter.prototype.removeAllListeners = function (evt) {
	if (evt) {
		delete this._events[evt];
	} else {
		this._events = {};
	}
	return this;
};

EventEmitter.prototype.hasListeners = function (evt) {
	return this._events[evt] !== undefined;
};

EventEmitter.prototype.listeners = function (evt) {
	var handlers = this._events[evt];
	if (handlers !== undefined) {
		return handlers.slice();
	}

	return [];
};

EventEmitter.prototype.emit = function (evt) {
	var handlers = this._events[evt];
	if (handlers === undefined) {
		return false;
	}

	// copy handlers into a new array, so that handler removal doesn't affect array length
	handlers = handlers.slice();

	var hadListener = false;

	// copy all arguments, but skip the first (the event name)
	var args = [];
	for (var i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	for (var i = 0, len = handlers.length; i < len; i++) {
		var handler = handlers[i];

		handler.apply(this, args);
		hadListener = true;

		if (handler.once) {
			if (handler.once > 1) {
				handler.once--;
			} else {
				delete handler.once;
			}

			this.removeListener(evt, handler);
		}
	}

	return hadListener;
};
},{}],2:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Map
 * @author Cedric Stoquer
 */

// var settings = require('../../settings.json');
var Texture  = require('../Texture');

var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];


var _mapById = {};
window.getMap = function (name) {
	return _mapById[name];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapItem(x, y, sprite, flipH, flipV, flipR, flagA, flagB) {
	this.x      = ~~x;
	this.y      = ~~y;
	this.sprite = ~~sprite;
	this.flipH  = !!flipH;
	this.flipV  = !!flipV;
	this.flipR  = !!flipR;
	this.flagA  = !!flagA;
	this.flagB  = !!flagB;
}

MapItem.prototype.draw = function (texture) {
	texture.sprite(this.sprite, this.x * SPRITE_WIDTH, this.y * SPRITE_HEIGHT, this.flipH, this.flipV, this.flipR);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function PixelboxMap(width, height) {
	this._name  = '';
	this.width  = 0;
	this.height = 0;
	this.items  = [];
	this.texture = new Texture(width * SPRITE_WIDTH, height * SPRITE_HEIGHT);
	this._spritesheetPath = '';

	if (width && height) this._init(width, height);
}
module.exports = PixelboxMap;

PixelboxMap.prototype._isMap = true;

Object.defineProperty(PixelboxMap.prototype, 'name', {
	get: function () { return this._name; },
	set: function (name) {
		if (this._name && _mapById[this._name] && _mapById[this._name] === this) delete _mapById[this._name];
		this._name = name;
		if (name && !_mapById[name]) _mapById[name] = this;
	}
});

PixelboxMap.prototype._init = function (width, height) {
	this.texture.resize(width * SPRITE_WIDTH, height * SPRITE_HEIGHT);
	this.width  = width;
	this.height = height;
	this.items  = [];
	for (var x = 0; x < width; x++) {
		this.items.push([]);
		for (var y = 0; y < height; y++) {
			this.items[x][y] = null;
		}
	}
};

PixelboxMap.prototype.resize = function (width, height) {
	var items = this.items;
	var w = Math.min(this.width,  width);
	var h = Math.min(this.height, height);
	this.texture.resize(width * SPRITE_WIDTH, height * SPRITE_HEIGHT);
	this._init(width, height);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		this.items[x][y] = items[x][y];
	}}
	this.redraw();
	return this;
};

PixelboxMap.prototype.set = function (x, y, sprite, flipH, flipV, flipR, flagA, flagB) {
	if (sprite === null || sprite === undefined) return this.remove(x, y);
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	var item = this.items[x][y] = new MapItem(x, y, sprite, flipH, flipV, flipR, flagA, flagB);
	this.texture.ctx.clearRect(x * SPRITE_WIDTH, y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
	item.draw(this.texture);
	return this;
};

PixelboxMap.prototype.remove = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	this.items[x][y] = null;
	this.texture.ctx.clearRect(x * SPRITE_WIDTH, y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
	return this;
};

PixelboxMap.prototype.get = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
	return this.items[x][y];
};

PixelboxMap.prototype.redraw = function () {
	this.texture.clear();
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] && this.items[x][y].draw(this.texture);
	}}
	return this;
};

PixelboxMap.prototype.draw = function (x, y) {
	draw(this.texture, x, y);
};

PixelboxMap.prototype.setSpritesheet = function (spritesheet) {
	this._spritesheetPath = spritesheet && spritesheet.path || '';
	this.texture.setSpritesheet(spritesheet);
	this.redraw();
	return this;
};

PixelboxMap.prototype._setSpritesheetPath = function (path) {
	this._spritesheetPath = path || '';
	if (!path) return this.setSpritesheet();
	path = path.split('/');
	fileId = path.pop();
	var dir = assets;
	for (var i = 0; i < path.length; i++) {
		dir = dir[path[i]];
		if (!dir) return console.warn('Could not find spritesheet', path); // failed to find spritesheet.
	}
	var img = dir[fileId];
	if (img && img instanceof Image) this.setSpritesheet(img);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var encode, decode;

(function () {
	var BASE = "#$%&'()*+,-~/0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}. !";
	var INVERSE = {};
	for (var i = 0; i < BASE.length; i++) INVERSE[BASE[i]] = i;

	var LENGTH = BASE.length;
	var NULL = LENGTH * LENGTH - 1;
	var DUPL = Math.pow(2, 13);
	var MAX_DUPL = NULL - DUPL - 1;

	function getCode(value) {
		var be = ~~(value / LENGTH);
		var le = value % LENGTH;
		return BASE[be] + BASE[le];
	}

	encode = function (arr) {
		str = '';
		count = 0;
		for (var i = 0; i < arr.length; i++) {
			var value = arr[i];
			if (value === arr[i + 1] && ++count < MAX_DUPL) continue;
			if (value === null) value = NULL;
			str += getCode(value);
			if (count === MAX_DUPL) count--;
			if (count !== 0) str += getCode(DUPL + count);
			count = 0;
		}

		if (count === MAX_DUPL) count--;
		if (count !== 0) str += getCode(DUPL + count);
		return str;
	}

	decode = function (str) {
		arr = [];
		for (var i = 0; i < str.length;) {
			var be = str[i++];
			var le = str[i++];
			var value = INVERSE[be] * LENGTH + INVERSE[le];
			if (value === NULL) {
				arr.push(null);
			} else if (value > DUPL) {
				var count = value - DUPL;
				var duplicate = arr[arr.length - 1];

				for (var j = 0; j < count; j++) {
					arr.push(duplicate);
				}
			} else {
				arr.push(value);
			}
		}
		return arr;
	}
})();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
PixelboxMap.prototype.save = function () {
	var w = this.width;
	var h = this.height;
	var arr = new Array(w * h);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var item = this.items[x][y];
		arr[x + y * w] = item ? item.sprite + (item.flipH << 8) + (item.flipV << 9) + (item.flipR << 10) + (item.flagA << 11)  + (item.flagB << 12) : null;
	}}

	var obj = { w: w, h: h, name: this.name, sheet: this._spritesheetPath || '', data: encode(arr) };
	return obj;
};

PixelboxMap.prototype.load = function (obj) {
	var w = obj.w;
	var h = obj.h;
	this._init(w, h);
	this.name = obj.name || '';
	this._setSpritesheetPath(obj.sheet);
	var arr = decode(obj.data);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var d = arr[x + y * w];
		if (d === null) continue;
		var sprite =  d & 255;
		var flipH  = (d >> 8 ) & 1;
		var flipV  = (d >> 9 ) & 1;
		var flipR  = (d >> 10) & 1;
		var flagA  = (d >> 11) & 1;
		var flagB  = (d >> 12) & 1;
		this.set(x, y, sprite, flipH, flipV, flipR, flagA, flagB);
	}}

	this.redraw();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
PixelboxMap.prototype.copy = function (x, y, w, h) {
	x = x || 0;
	y = y || 0;
	if (w === undefined || w === null) w = this.width; 
	if (h === undefined || h === null) h = this.height;
	var map = new PixelboxMap(w, h);
	map.paste(this, -x, -y);
	return map;
};

PixelboxMap.prototype.paste = function (map, x, y, merge) {
	x = x || 0;
	y = y || 0;
	var width  = Math.min(map.width,  this.width  - x);
	var height = Math.min(map.height, this.height - y);
	var sx = Math.max(0, -x);
	var sy = Math.max(0, -y);

	for (var i = sx; i < width; i++) {
		for (var j = sy; j < height; j++) {
			var item = map.items[i][j];
			if (!item) {
				if (merge) continue;
				this.remove(i + x, j + y);
				continue;
			}
			this.set(i + x, j + y, item.sprite, item.flipH, item.flipV, item.flipR, item.flagA, item.flagB);
		}
	}
	this.redraw();
	return this;
};

PixelboxMap.prototype.clear = function () {
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] = null;
	}}
	this.texture.clear();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
PixelboxMap.prototype._findNull = function () {
	var result = [];
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		if (this.items[x][y] === null) result.push({ x: x, y: y });
	}}
	return result;
};

PixelboxMap.prototype.find = function (sprite, flagA, flagB) {
	if (sprite === null) return this._findNull();
	if (flagA === undefined) flagA = null;
	if (flagB === undefined) flagB = null;
	var result = [];
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		var item = this.items[x][y];
		if (!item) continue;
		var isSameFlagA = flagA === null || item.flagA === flagA;
		var isSameFlagB = flagB === null || item.flagB === flagB;
		if (item.sprite === sprite && isSameFlagA && isSameFlagB) result.push(item);
	}}
	return result;
};


},{"../Texture":3}],3:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Texture
 * @author Cedric Stoquer
 */

// var settings = require('../../settings.json');
var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var SPRITES_PER_LINE = 16;

function createCanvas(width, height) {
	var canvas = document.createElement('canvas');
	canvas.width  = width;
	canvas.height = height;
	return canvas;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Texture(width, height) {
	this.canvas  = createCanvas(width, height);
	this.ctx     = this.canvas.getContext('2d');
	this._cursor = { i: 0, j: 0 };
	this._paper  = 0;
	this._pen    = 1;

	this._textColumn  = ~~(width  / 4);
	this._textLine    = ~~(height / 6);
	this._textOffset  = 1; // TODO
	this._textPadding = height - this._textLine * 6 - this._textOffset;

	// camera offset
	this.camera = { x: 0, y: 0 };

	this.ctx.fillStyle   = this.palette[0];
	this.ctx.strokeStyle = this.palette[1];
}
module.exports = Texture;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype._isTexture = true;

// FIXME better have all these private
Texture.prototype.palette = ['#000000', '#FFFFFF']; // default palette
Texture.prototype.spritesheet = new Texture(SPRITE_WIDTH * SPRITES_PER_LINE, SPRITE_HEIGHT * SPRITES_PER_LINE);
Texture.prototype.textCharset = new Texture(128 * 3, 5 * Texture.prototype.palette.length);


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.resize = function (width, height) {
	this.canvas.width  = width;
	this.canvas.height = height;
	this._textColumn = ~~(width  / 4);
	this._textLine   = ~~(height / 6);
	this._textOffset = 1; // TODO
	this._cursor.i = 0;
	this._cursor.j = 0;
	this.clear();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// text charset generation

function getTextCharcodes(texture) {
	var canvas = texture.canvas;
	var ctx = texture.ctx;
	var charcodes = [];
	for (var chr = 0; chr < 128; chr++) {
		var imageData = ctx.getImageData(chr * 3, 0, 3, 5);
		var pixels = imageData.data;
		var code = 0;
		var bit = 0;
		for (var i = 0, len = pixels.length; i < len; i += 4) {
			var pixel = pixels[i]; // only the first pixel is enough
			if (pixel > 0) code += 1 << bit;
			bit += 1;
		}
		charcodes.push(code);
	}
	return charcodes;
}

function generateTextCharset(ctx, palette) {
	var codes = [
		219,438,511,14016,14043,14326,14335,28032,28123,28086,28159,32704,32731,
		32758,32767,128,146,384,402,9344,9362,9600,9618,192,210,448,466,9408,9426,
		9664,9682,32767,0,8338,45,11962,5588,21157,29354,10,17556,5265,21973,1488,
		5312,448,13824,5268,31599,29843,29671,31143,18925,31183,31689,18735,31727,
		18927,1040,5136,17492,3640,5393,8359,25450,23530,31467,25166,15211,29391,
		4815,27470,23533,29847,15142,23277,29257,23421,23403,11114,4843,26474,
		23279,14798,9367,27501,12141,24429,23213,14829,29351,25750,17553,13459,
		9402,28672,34,23530,31467,25166,15211,29391,4815,27470,23533,29847,15142,
		23277,29257,23421,23403,11114,4843,26474,23279,14798,9367,27501,12141,
		24429,23213,14829,29351,25686,9362,13587,42,21845
	];

	for (var pen = 0; pen < palette.length; pen++) {
		ctx.fillStyle = palette[pen];
		for (var i = 0; i < codes.length; i++) {
			var code = codes[i];
			for (var bit = 0; bit < 15; bit++) {
				var x = bit % 3;
				var y = ~~(bit / 3);
				var pixel = (code >> bit) & 1;
				if (pixel !== 1) continue;
				ctx.fillRect(i * 3 + x, pen * 5 + y, 1, 1);
			}
		}
	}
	ctx.fillStyle = palette[0];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setPalette = function (palette) {
	Texture.prototype.palette = palette;
	Texture.prototype.textCharset = new Texture(128 * 3, 5 * palette.length);
	generateTextCharset(Texture.prototype.textCharset.ctx, palette);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setGlobalSpritesheet = function (spritesheet) {
	Texture.prototype.spritesheet.clear().draw(spritesheet, 0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setSpritesheet = function (spritesheet) {
	if (!spritesheet) {
		delete this.spritesheet;
		return;
	} 
	if (this.spritesheet === Texture.prototype.spritesheet) {
		this.spritesheet = new Texture(SPRITE_WIDTH * SPRITES_PER_LINE, SPRITE_HEIGHT * SPRITES_PER_LINE);
	}
	this.spritesheet.clear().draw(spritesheet, 0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setCamera = function (x, y) {
	this.camera.x = x || 0;
	this.camera.y = y || 0;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var PI2 = Math.PI / 2;

Texture.prototype.sprite = function (sprite, x, y, flipH, flipV, rot) {
	var sx = sprite % SPRITES_PER_LINE;
	var sy = ~~(sprite / SPRITES_PER_LINE);
	var ctx = this.ctx;

	// add camera and round to the pixel
	x = x || 0;
	y = y || 0;
	x = ~~Math.round(x - this.camera.x);
	y = ~~Math.round(y - this.camera.y);

	if (!flipH && !flipV && !rot) {
		ctx.drawImage(this.spritesheet.canvas, sx * SPRITE_WIDTH, sy * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT, x, y, SPRITE_WIDTH, SPRITE_HEIGHT);
		return this;
	}
	ctx.save();

	if (flipH) {
		ctx.scale(-1, 1);
		x *= -1;
		x -= SPRITE_WIDTH;
	}

	if (flipV) {
		ctx.scale(1, -1);
		y *= -1
		y -= SPRITE_HEIGHT;
	}

	if (rot) {
		ctx.translate(x + SPRITE_HEIGHT, y);
		ctx.rotate(PI2);
	} else {
		ctx.translate(x, y);
	}

	ctx.drawImage(this.spritesheet.canvas, sx * SPRITE_WIDTH, sy * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT, 0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
	ctx.restore();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.draw = function (img, x, y, flipH, flipV) {
	if (img._isMap) img = img.texture.canvas;
	if (img._isTexture) img = img.canvas;
	var px = ~~Math.round((x || 0) - this.camera.x);
	var py = ~~Math.round((y || 0) - this.camera.y);
	if (!flipH && !flipV) {
		// fast version
		this.ctx.drawImage(img, px, py);
		return this;
	}
	var ctx = this.ctx;
	ctx.save();
	if (flipH) {
		ctx.scale(-1, 1);
		px *= -1;
		px -= img.width;
	}
	if (flipV) {
		ctx.scale(1, -1);
		py *= -1
		py -= img.height;
	}
	ctx.translate(px, py);
	this.ctx.drawImage(img, 0, 0);
	ctx.restore();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.clear = function () {
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.cls = function () {
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.locate(0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// colors

Texture.prototype.pen = function (p) {
	this._pen = p % this.palette.length;
	this.ctx.strokeStyle = this.palette[this._pen];
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.paper = function (p) {
	this._paper = p % this.palette.length;
	this.ctx.fillStyle = this.palette[this._paper];
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// shape

Texture.prototype.rect = function (x, y, w, h) {
	this.ctx.strokeRect(~~(x - this.camera.x) + 0.5, ~~(y - this.camera.y) + 0.5, w - 1, h - 1);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.rectfill = function (x, y, w, h) {
	this.ctx.fillRect(~~(x - this.camera.x), ~~(y - this.camera.y), w, h);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// text

Texture.prototype.locate = function (i, j) {
	this._cursor.i = ~~i;
	this._cursor.j = ~~j;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.print = function (str, x, y) {
	if (typeof str === 'object') {
		try {
			str = JSON.stringify(str);
		} catch (error) {
			str = "[Object]";
		}
	} else if (typeof str !== 'string') {
		str = str.toString();
	}
	if (x !== undefined) {
		x = ~~Math.round(x - this.camera.x);
		y = ~~Math.round(y - this.camera.y);
		for (var i = 0; i < str.length; i++) {
			this.ctx.drawImage(
				this.textCharset.canvas,
				3 * str.charCodeAt(i),
				5 * this._pen,
				3, 5,
				x, y,
				3, 5
			);
			x += 4;
		}
		return this;
	}
	for (var i = 0; i < str.length; i++) {
		if (this._cursor.j >= this._textLine) {
			this.textScroll();
		}
		var chr = str.charCodeAt(i);
		if (chr === 10 || chr === 13) {
			this._cursor.i = 0;
			this._cursor.j += 1;
			continue;
		}
		this.ctx.drawImage(
			this.textCharset.canvas,
			3 * chr,
			5 * this._pen,
			3, 5,
			this._cursor.i * 4,
			this._cursor.j * 6 + this._textOffset,
			3, 5
		);
		this._cursor.i += 1;
		if (this._cursor.i > this._textColumn) {
			this._cursor.i = 0;
			this._cursor.j += 1;
		}
	}
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.println = function (str) {
	this.print(str);
	this.print('\n');
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.textScroll = function (n) {
	if (n === undefined) n = 1;
	this._cursor.j -= n;
	n *= 6;
	this.ctx.drawImage(this.canvas, 0, -n);
	this.ctx.fillRect(0, this.canvas.height - n - this._textPadding, this.canvas.width, n + this._textPadding);
	return this;
};


},{}],4:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @module loader
 * @desc   Loading functions helpers
 *
 * @author Cedric Stoquer
 */


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.loadJson
 * @desc     load a json file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadJson(path, cb) {
	var xobj = new XMLHttpRequest();
	xobj.onreadystatechange = function () {
		if (~~xobj.readyState !== 4) return;
		if (~~xobj.status !== 200) return cb('xhr:' + xobj.status);
		return cb && cb(null, JSON.parse(xobj.response));
	};
	xobj.open('GET', path, true);
	xobj.send();
}
exports.loadJson = loadJson;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.sendRequest
 * @desc     send some data to server
 *
 * @param {Object}   data - data to send to the server
 * @param {Function} cb   - asynchronous callback function
 */
function sendRequest(data, cb) {
	var xobj = new XMLHttpRequest();
	xobj.open('POST', 'req', true);
	xobj.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	xobj.onreadystatechange = function () {
		if (~~xobj.readyState !== 4) return;
		if (~~xobj.status !== 200) return cb && cb('xhr:' + xobj.status);
		var res = JSON.parse(xobj.response);
		return cb && cb(res.error, res.result);
	};
	xobj.send(JSON.stringify(data));
}
exports.sendRequest = sendRequest;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function  module:loader.loadImage
 * @desc      load an image file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadImage(path, cb) {
	var img = new Image();
	// TODO: remove listeners when load / error
	img.onload  = function () {
		this.onload  = null;
		this.onerror = null;
		cb && cb(null, this);
	};
	img.onerror = function () {
		this.onload  = null;
		this.onerror = null;
		cb && cb('img:' + path);
	};
	img.src = path;
}
exports.loadImage = loadImage;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.loadSound
 * @desc     load an image file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadSound(path, cb) {
	var snd = new Audio();
	snd.preload = true;
	snd.loop = false;
	
	function onSoundLoad() {
		cb && cb(null, snd);
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	function onSoundError() {
		cb && cb('snd:load');
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	snd.addEventListener('canplaythrough', onSoundLoad);
	snd.addEventListener('error', onSoundError);
	snd.src = path;
	snd.load();
}
exports.loadSound = loadSound;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.preloadStaticAssets
 *
 * @desc   Preload all static assets of the game.
 *         The function first ask the server for the asset list.
 *         Server respond with an object containing the list of images
 *         to load and all data that are put in the www/asset folder.
 *         At this step, if request fail, function send an error.
 *         The function then proceed the loading of image assets. 
 *         If an image loading fail, the loading continue, and loading
 *         status is set to 1 (an image load fail).
 *         Images are load by 5 in parallel.
 *
 *         Function end and wil return an object that mix all data and 
 *         all assets so that it will have the same structure as the 
 *         'www/asset' folder.
 *
 *
 *         Assets list and data are automaticaly generated by server
 *         Just drop images and json files in the www/asset/ folder
 *         and the server will take care of it !
 *                 
 *
 * @param {Function} cb         - asynchronous callback function to 
 *                                call when all is preloaded
 *
 * @param {Function} onEachLoad - optional callback function called
 *                                every time one file is loaded
 *                                (for loading progress purpose)
 *                          
 */

function preloadStaticAssets(cb, onEachLoad) {
	loadJson('build/data.json', function onAssetListLoaded(error, assetList) {
		if (error) return cb(error);
		var data     = assetList.dat;
		var imgCount = assetList.img.length;
		var count    = imgCount + assetList.snd.length;
		var root     = assetList.root;
		var load     = 0;
		var done     = 0;
		function storeAsset(path, obj) {
			var splitted = path.split('/');
			var filename = splitted.pop();
			var id = filename.split('.');
			id.pop();
			id = id.join('.');
			var container = data;
			for (var i = 0, len = splitted.length; i < len; i++) {
				container = container[splitted[i]];
			}
			container[id] = obj;
			splitted.push(id);
			obj.name = id;
			obj.path = splitted.join('/');
		}
		function loadAssets() {
			var current = load + done;
			var percent = current / count;
			onEachLoad && onEachLoad(load, current, count, percent);
			var path;
			var loadFunc;
			if (current < imgCount) {
				path = assetList.img[current];
				loadFunc = loadImage;
			} else {
				path = assetList.snd[current - imgCount];
				loadFunc = loadSound;
			}
			done += 1;
			loadFunc(root + path, function onAssetLoaded(error, img) {
				if (!error) storeAsset(path, img);
				load += 1;
				done -= 1;
				if (load + done < count) loadAssets()
				else if (done === 0) cb(null, data);
			});
		}
		// loading assets in parallel, with a limit of 5 parallel downloads.
		if (count === 0) return cb(null, data);
		var parallel = Math.min(5, count - 1);
		for (var j = 0; j <= parallel; j++) loadAssets();
	});
}
exports.preloadStaticAssets = preloadStaticAssets;

},{}],5:[function(require,module,exports){
// dom utilities

var DOCUMENT_BODY = document.getElementsByTagName('body')[0];

exports.createDom = function (type, className, parent) {
	parent = parent || DOCUMENT_BODY;
	var dom = document.createElement(type);
	parent.appendChild(dom);
	if (className) dom.className = className;
	return dom;
};

exports.createDiv = function (className, parent) {
	return exports.createDom('div', className, parent);
};

exports.removeDom = function (dom, parent) {
	parent = parent || DOCUMENT_BODY;
	parent.removeChild(dom);
};

exports.makeButton = function (dom, onClic) {
	dom.addEventListener('mousedown', function (e) {
		e.stopPropagation();
		e.preventDefault();
		onClic(e, dom);
	});
	return dom;
};

function startDrag(dom, e) {
	var d = document;

	rect = dom.getBoundingClientRect();

	var startX = e.clientX - rect.left;
	var startY = e.clientY - rect.top;

	function dragMove(e) {
		e.preventDefault();
		dom.style.left = (e.clientX - startX) + 'px';
		dom.style.top  = (e.clientY - startY) + 'px';
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
}

exports.makeDragable = function (dom, target) {
	target = target || dom;
	dom.addEventListener('mousedown', function (e) {
		e.stopPropagation();
		e.preventDefault();
		startDrag(target, e);
	});
	return dom;
};

},{}],6:[function(require,module,exports){
module.exports = function inherits(Child, Parent) {
	Child.prototype = Object.create(Parent.prototype, {
		constructor: {
			value:        Child,
			enumerable:   false,
			writable:     true,
			configurable: true
		}
	});
};
},{}],7:[function(require,module,exports){
var Panel        = require('./Panel.js');
var addTooltip   = require('./tooltip.js');
var gridImages   = require('./grid.js');
var dragManager  = require('./dragManager.js');
var keyboard     = require('./keyboard.js');
var helper       = require('./helper.js');
var assetLoader  = require('../../common/assetLoader');
var Texture      = require('../../common/Texture');
var PixelboxMap  = require('../../common/Map');
var inherits     = require('../../common/inherits');
var domUtils     = require('../../common/domUtils');

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;

var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE    = settings.PIXEL_SIZE;
var MAP_MAX_UNDO  = 5;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

function MapLayerDropArea(editor, parent, layer) {
	this.dom = createDiv('mapLayerDropArea' + (layer === 'foreground' ? ' mapLayerDropAreaForeground' : ''), parent);
	this.editor = editor;
	this.layer  = layer;
	dragManager.setAsDroppable(this.dom, this);
}

MapLayerDropArea.prototype.onDragEnter = function (id, item) {
	// if (id === 'paletteColor' && this.layer === 'foreground') return;
	this.dom.style.borderColor = '#FF2';
};

MapLayerDropArea.prototype.onDragLeave = function (id, item) {
	this.dom.style.borderColor = '';
};

MapLayerDropArea.prototype.onDragEnd = function (id, item) {
	this.dom.style.borderColor = '';
};

MapLayerDropArea.prototype.drop = function (id, item) {
	if (id !== 'paletteColor' && id !== 'imageFile' && id != 'mapFile') return;
	if (id === 'paletteColor' && this.layer === 'foreground') return;
	this.editor.addLayer(this.layer, item);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapEditorPanel() {
	Panel.call(this, { title: 'map editor' });
	var t = this;

	this.mapList = null; // reference to the mapList panel

	this.mapId = 0;
	this.history = [];
	this.map = new PixelboxMap(16, 16);

	this._viewW = SPRITE_WIDTH  * 16;
	this._viewH = SPRITE_HEIGHT * 16;

	var toolbar = createDiv('panelToolbar', this.content);

	this._saved = false;

	this.btnSave = addTooltip(createDiv('panelToolButton', toolbar), 'Save this map');
	this.btnSave.style.backgroundImage = 'url("img/iconSave.png")';
	button(this.btnSave, function saveMap() { t.save(); });

	var btnFlagA = addTooltip(createDiv('panelToolButton', toolbar), 'Flag A');
	btnFlagA.style.backgroundImage = 'url("img/iconFlagA.png")';
	var btnFlagB = addTooltip(createDiv('panelToolButton', toolbar), 'Flag B');
	btnFlagB.style.backgroundImage = 'url("img/iconFlagB.png")';


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// MAP SETTINGS
	this.settings = createDiv('mapSettings', this.content);
	this.settings.style.display = 'none';
	this.settings.style.width  = this._viewW * PIXEL_SIZE + 1 + 'px';
	this.settings.style.height = this._viewH * PIXEL_SIZE + 1 + 'px';

	createDiv('mapSettingsTitle', this.settings).innerText = 'name';
	var nameInputs = createDiv(null, this.settings);
	this.inputName = createDom('input', 'mapInput', nameInputs);

	createDiv('mapSettingsTitle', this.settings).innerText = 'size';
	var sizeInputs = createDiv(null, this.settings);
	this.inputWidth  = createDom('input', 'mapSizeInput mapInput', sizeInputs);
	createDom('span', null, sizeInputs).innerText = 'x';
	this.inputHeight = createDom('input', 'mapSizeInput mapInput', sizeInputs);

	var okButton = createDiv('mapSettingsButton', this.settings);
	okButton.innerText = 'ok';
	button(okButton, function () {
		var w = ~~(t.inputWidth.value)  || 1;
		var h = ~~(t.inputHeight.value) || 1;
		var name = t.inputName.value;
		t.settings.style.display = 'none';
		if (w === t.map.width && h === t.map.height && t.map.name === name) return;
		t.map.name = name;
		t.resizeMap(w, h);
		t._updateInfos();
		t.save();
	});

	var btnSettings = addTooltip(createDiv('panelToolButton', toolbar), 'Settings');
	btnSettings.style.backgroundImage = 'url("img/iconMore.png")';
	
	button(btnSettings, function toggleSettingDisplay() {
		var style = t.settings.style;
		style.display = style.display === '' ? 'none' : '';
	});

	var btnClear = addTooltip(createDiv('panelToolButton', toolbar), 'Clear');
	btnClear.style.backgroundImage = 'url("img/iconClear.png")';
	button(btnClear, function clearMap() {
		t.addHistory();
		t.map.clear();
		t._saved = false;
		t._updateSaveButton();
	});

	var btnUndo = addTooltip(createDiv('panelToolButton', toolbar), 'Undo');
	btnUndo.style.backgroundImage = 'url("img/iconUndo.png")';
	button(btnUndo, function undo() { t.undo(); });


	this.info = createDiv('panelInfos', toolbar);


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// BACKGROUND & FOREGROUND DROP AREA

	var dropAreas = createDiv('mapDropAreas', this.content);
	dropAreas.style.display = 'none';

	dragManager.on('dragStart', function (id) {
		if (id !== 'imageFile' && id !== 'paletteColor' && id !== 'mapFile') return;
		dropAreas.style.display = '';
		dropAreas.style.width  = t._viewW * PIXEL_SIZE + 'px';
		dropAreas.style.height = t._viewH * PIXEL_SIZE + 'px';
	});

	dragManager.on('dragEnd',   function (id) {
		dropAreas.style.display = 'none';
	});

	new MapLayerDropArea(this, dropAreas, 'background');
	new MapLayerDropArea(this, dropAreas, 'foreground');


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// MAP RENDER AREA
	var clipSurface = this._clipSurface = createDiv('mapClipSurface', this.content);
	var canvasContainer = createDiv('mapCanvas', this._clipSurface);
	this.resizeViewport();

	var grid = createDiv('mapCanvas mapGrid', canvasContainer);
	grid.style.width  = this.map.width  * SPRITE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	grid.style.height = this.map.height * SPRITE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	grid.style.backgroundImage = gridImages.grid;

	this.background = new Texture();
	this.foreground = new Texture();
	var background = this.background.canvas;
	var foreground = this.foreground.canvas;
	var canvas = this.map.texture.canvas;

	foreground.className = background.className = canvas.className = 'mapCanvas';
	canvasContainer.appendChild(background);
	canvasContainer.appendChild(canvas);
	canvasContainer.appendChild(foreground);

	this._grid   = grid;
	this._canvas = canvas;
	this._canvasContainer = canvasContainer;

	var gridEnabled = true;
	keyboard.on('space', function (isPressed) {
		if (!isPressed) return;
		gridEnabled = !gridEnabled;
		grid.style.display = gridEnabled ? '' : 'none';
	});

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	this._posX = 0;
	this._posY = 0;

	function startDrag(e) {
		var startX = e.clientX - t._posX;
		var startY = e.clientY - t._posY;

		function dragMove(e) {
			e.preventDefault();
			t._posX = helper.clip(e.clientX - startX, -(t.map.width  * SPRITE_WIDTH  - t._viewW) * PIXEL_SIZE, 0);
			t._posY = helper.clip(e.clientY - startY, -(t.map.height * SPRITE_HEIGHT - t._viewH) * PIXEL_SIZE, 0);
			canvasContainer.style.left = t._posX + 'px';
			canvasContainer.style.top  = t._posY + 'px';
		}

		function dragEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup',   dragEnd);
			document.removeEventListener('mousemove', dragMove);
		}

		document.addEventListener('mousemove', dragMove, false);
		document.addEventListener('mouseup',   dragEnd,  false);
	}


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	function startDraw(e) {
		var prevX = null;
		var prevY = null;

		function mouseMove(e) {
			e.preventDefault();
			var x = ~~(e.layerX / SPRITE_WIDTH  / PIXEL_SIZE);
			var y = ~~(e.layerY / SPRITE_HEIGHT / PIXEL_SIZE);
			if (x === prevX && y === prevY) return;
			prevX = x;
			prevY = y;
			if (keyboard.shift) t.map.remove(x, y);
			else t.map.set(x, y, t.spritesheet.sprite, t.spritesheet.flipH, t.spritesheet.flipV, t.spritesheet.flipR);
		}

		function mouseEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', mouseMove);
		}

		document.addEventListener('mousemove', mouseMove, false);
		document.addEventListener('mouseup', mouseEnd, false);

		t.addHistory();

		mouseMove(e);
		if (t._saved) {
			t._saved = false;
			t._updateSaveButton();
		}
	}

	button(canvasContainer, function (e) {
		if (keyboard.alt) startDrag(e);
		else startDraw(e);
	});

	this.resizeMap(16, 16);

	// mouse cursor style
	keyboard.on('shift', function (isPressed) { isPressed ? clipSurface.classList.add('erase') : clipSurface.classList.remove('erase'); });
	keyboard.on('alt',   function (isPressed) { isPressed ? clipSurface.classList.add('move')  : clipSurface.classList.remove('move');  });

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	var resizeHandle = addTooltip(createDiv('mapResizeHandle', this.content), 'Resize');

	function startResize(e) {
		var startX = e.clientX;
		var startY = e.clientY;
		var viewW = t._viewW;
		var viewH = t._viewH;

		function resize(e) {
			e.preventDefault();
			t._viewW = viewW + ~~((e.clientX - startX) / PIXEL_SIZE);
			t._viewH = viewH + ~~((e.clientY - startY) / PIXEL_SIZE);
			t.resizeViewport();
		}

		function mouseEnd(e) {
			resize(e);
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', resize);
		}

		document.addEventListener('mousemove', resize, false);
		document.addEventListener('mouseup', mouseEnd, false);
	}

	button(resizeHandle, startResize);

}
inherits(MapEditorPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resizeViewport = function () {
	this._viewW = ~~Math.max(this._viewW, SPRITE_WIDTH * 16);
	this._viewH = ~~Math.max(this._viewH, SPRITE_WIDTH * 4);
	this._clipSurface.style.width  = this._viewW * PIXEL_SIZE + 1 + 'px';
	this._clipSurface.style.height = this._viewH * PIXEL_SIZE + 1 + 'px';
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resizeMap = function (w, h) {
	this.map.resize(w, h);
	this.background.resize(w * SPRITE_WIDTH, h * SPRITE_HEIGHT);
	this.foreground.resize(w * SPRITE_WIDTH, h * SPRITE_HEIGHT);

	this._posX = helper.clip(this._posX, -(w * SPRITE_WIDTH  - this._viewW) * PIXEL_SIZE, 0);
	this._posY = helper.clip(this._posY, -(h * SPRITE_HEIGHT - this._viewH) * PIXEL_SIZE, 0);
	this._grid.style.width  = w * SPRITE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	this._grid.style.height = h * SPRITE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	this._canvasContainer.style.left = this._posX + 'px';
	this._canvasContainer.style.top  = this._posY + 'px';

	var background = this.background.canvas.style;
	var tileground = this._canvas.style;
	var foreground = this.foreground.canvas.style;

	background.width  = foreground.width  = tileground.width  = w * SPRITE_WIDTH  * PIXEL_SIZE + 'px';
	background.height = foreground.height = tileground.height = h * SPRITE_HEIGHT * PIXEL_SIZE + 'px';

	// TODO redraw background and foreground if needed

	this.inputWidth.value  = w;
	this.inputHeight.value = h;
	this._saved = false;
	this._updateInfos();
	this._updateSaveButton();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.addLayer = function (id, item) {
	if (id !== 'background' && id !== 'foreground') return;
	if (typeof item === 'string') {
		this[id].ctx.fillStyle = item;
		this[id].cls();
	} else {
		this[id].draw(item);
		// TODO save img to redraw on resize
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype._updateInfos = function () {
	this.info.innerText = '#' + this.mapId + ' [' + this.map.width + 'x' + this.map.height + '] ' + this.map.name;
	this.inputName.value = this.map.name;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype._updateSaveButton = function () {
	this.btnSave.style.backgroundColor = this._saved ? '#FF2' : '#AAA';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.save = function () {
	if (this._saved) return;
	var t = this;
	var mapList = this.mapList;

	var data = this.map.save();
	var request = {
		request: 'saveMap',
		mapId: this.mapId,
		data: data
	};
	// send data to the server
	assetLoader.sendRequest(request, function (error) {
		if (error) return alert(error);
		// copy data in assets
		if (!assets.maps[t.mapId]) {
			assets.maps[t.mapId] = {};
			mapList.addMap(assets.maps[t.mapId]);
		}
		helper.copyObject(data, assets.maps[t.mapId]);

		t._saved = true;
		t._updateSaveButton();
		mapList.updateItem(t.mapId);
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.loadMap = function (data) {
	this.resizeMap(data.w, data.h);
	this.map.load(data);
	this._saved = true;
	this._updateSaveButton();
	this._updateInfos();
	this.history = [];

	// if map has a spritesheet, update spritesheet panel
	if (this.map._spritesheetPath) {
		this.spritesheet.updateSpritesheet(this.map.texture.spritesheet.canvas, true);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.addHistory = function () {
	this.history.push(this.map.copy());
	if (this.history.length > MAP_MAX_UNDO) this.history.shift();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.undo = function () {
	if (!this.history.length) return;
	this.map.paste(this.history.pop());
	this._saved = false;
	this._updateSaveButton();
};

module.exports = new MapEditorPanel();

},{"../../common/Map":2,"../../common/Texture":3,"../../common/assetLoader":4,"../../common/domUtils":5,"../../common/inherits":6,"./Panel.js":10,"./dragManager.js":12,"./grid.js":13,"./helper.js":14,"./keyboard.js":16,"./tooltip.js":17}],8:[function(require,module,exports){
var Panel        = require('./Panel.js');
var addTooltip   = require('./tooltip.js');
var dragManager  = require('./dragManager.js');
var helper       = require('./helper.js');
var assetLoader  = require('../../common/assetLoader');
var PixelboxMap  = require('../../common/Map');
var inherits     = require('../../common/inherits');
var domUtils     = require('../../common/domUtils');

var mapEditor    = require('./MapEditorPanel.js');
var mapList;

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;


//███████████████████████████████████████
//█▄▄░▄▄█████████████████████████████████
//███░███▄░▀▄▀▀▄▀█▀▄▄▄▄▀██▀▄▄▄▀░▄█▀▄▄▄▄▀█
//███░████░██░██░█▀▄▄▄▄░██░████░██░▄▄▄▄▄█
//█▀▀░▀▀█▀░▀█░▀█░█▄▀▀▀▄░▀█▄▀▀▀▄░██▄▀▀▀▀▀█
//█████████████████████████▀▀▀▀▄█████████

function ImageListItem(name, item, parent) {
	var t = this;

	this.item   = item;
	this.dom    = createDiv('fileListItem ImageListItem', parent);
	this.parent = parent;

	createDiv('mapFileItemIconImg', this.dom);
	createDiv('mapFileItemName',    this.dom).innerText = name;

	button(this.dom, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'ImageListItemDragDummy';
		createDiv('mapFileItemIconImg', dummy);
		createDiv('mapFileItemName', dummy).innerText = name;
		dragManager.startDrag(e, 'imageFile', t.item, dummy);
	});
}

//███████████████████████████████████████████
//█▄░▄▄▄░█████████▄░███████▄░████████████████
//██░▀░███▀▄▄▄▄▀███░███▀▄▄▄▀░██▀▄▄▄▄▀█▄░▀▄▄▄█
//██░█▄███░████░███░███░████░██░▄▄▄▄▄██░█████
//█▀░▀████▄▀▀▀▀▄█▀▀░▀▀█▄▀▀▀▄░▀█▄▀▀▀▀▀█▀░▀▀▀██
//███████████████████████████████████████████

function FolderListItem(name, item, parent) {
	var t = this;

	this.item     = item;
	this.parent   = parent;

	this.dom = createDiv('fileListItem', parent);
	var btn  = createDiv('fileListItemBtn', this.dom);
	createDom('span', 'mapFileItemName',  this.dom).innerText = name;

	this.content = createDiv('mapFileItemContent', this.dom);
	this.content.style.display = 'none';

	var isOpened = true;

	function fold() {
		isOpened = !isOpened;
		t.content.style.display = isOpened ? '' : 'none';
		btn.className = 'fileListItemBtn' + (isOpened ? ' fileListItemBtnOpen' : '');
		t.dom.style.height = isOpened ? '' : '20px'; // HACK
	}

	button(this.dom, fold);

	fold();
}


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapFolderItem(name, item, parent) {
	var t = this;

	this.item     = item;
	this.parent   = parent;
	this.children = {};

	this.dom = createDiv('fileListItem', parent);
	var btn  = createDiv('fileListItemBtn', this.dom);
	createDom('span', 'mapFileItemName',  this.dom).innerText = name;

	this.content = createDiv('mapFileItemContent', this.dom);
	this.content.style.display = 'none';

	var isOpened = true;

	function fold() {
		isOpened = !isOpened;
		t.content.style.display = isOpened ? '' : 'none';
		btn.className = 'fileListItemBtn' + (isOpened ? ' fileListItemBtnOpen' : '');
		t.dom.style.height = isOpened ? '' : '20px'; // HACK
	}

	button(this.dom, fold);

	fold();
}

MapFolderItem.prototype.getSubFolder = function (name) {
	if (this.children[name]) return this.children[name];
	var subFolder = new MapFolderItem(name, null, this.content);
	this.children[name] = subFolder;
	return subFolder;
};


MapFolderItem.prototype.onDragEnter = function (id, item) {
	// TODO
};

MapFolderItem.prototype.onDragLeave = function (id, item) {
	// TODO
};

MapFolderItem.prototype.onDragEnd = function (id, item) {
	// TODO
};

MapFolderItem.prototype.drop = function (id, item) {
	// TODO
};

//████████████████████████████████████████████████████████████
//█▄░░█░░▄███████████████████████▄▄░▄▄██▀█████████████████████
//██░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀██████████░███▄░▄▄▄██▀▄▄▄▄▀█▄░▀▄▀▀▄▀█
//██░█▄█░██▀▄▄▄▄░███░███░██████████░████░█████░▄▄▄▄▄██░██░██░█
//█▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄████████▀▀░▀▀██▄▀▀▀▄█▄▀▀▀▀▀█▀░▀█░▀█░█
//█████████████████▀░▀████████████████████████████████████████

var dragingMapIndex = 0;
// var mapFolders = {};

function getMapFolder(fullName, rootDom) {
	var path = fullName.split('/');
	var fileName = path.pop();
	if (path.length === 0) return rootDom;

	var folderName = path[path.length - 1];

	var folderDom = rootDom;
	for (var i = 0; i < path.length; i++) {
		var folderName = path[i];
		var folderDom = folderDom.getSubFolder(folderName);
	}

	return folderDom;
}

function MapListItem(index, map, rootDom) {
	var t = this;

	var parent = getMapFolder(map.name, rootDom);

	this.dom     = createDiv('mapListItem', parent.content);
	this.idxDom  = createDiv('mapListItemIndex', this.dom);
	this.nameDom = createDiv('mapListItemName',  this.dom);
	var delBtn   = createDiv('mapListItemCloseButton', this.dom);

	this.map    = map;
	this.index  = index;
	this.parent = parent;
	this.path   = ''; // where the map is displayed in the hierarchy
	this.name   = ''; // the name as it is displayed (map's name without path)

	
	addTooltip(delBtn, 'Delete this map');

	button(this.dom, function () {
		if (mapEditor.mapId === t.index) return;
		mapEditor.mapId = t.index;
		mapEditor.loadMap(t.map);
	});

	button(delBtn, function () {
		mapList.deleteItem(t);
	});

	button(this.idxDom, function (e) {
		dragingMapIndex = t.index;
		var dummy = document.createElement('div');
		dummy.className = 'ImageListItemDragDummy';
		createDiv('mapFileItemName', dummy).innerText = t.map.name || 'undefined';
		var map = new PixelboxMap().load(t.map);
		dragManager.startDrag(e, 'mapFile', map, dummy);
	});

	dragManager.setAsDroppable(this.dom, this);
	
	this.update();
}

MapListItem.prototype.onDragEnter = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '#F00';
};

MapListItem.prototype.onDragLeave = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '';
};

MapListItem.prototype.onDragEnd = function (id, item) {
	this.dom.style.backgroundColor = '';
};

MapListItem.prototype.drop = function (id, item) {
	if (id !== 'mapFile') return;

	var mapId = dragingMapIndex;
	dragingMapIndex = null;
	var to = this.index;
	to = helper.clip(to, 0, assets.maps.length - 1);

	if (mapId === to) return;

	assetLoader.sendRequest({ request: 'moveMap', mapId: mapId, to: to }, function (error) {
		if (error) return alert(error);
		assets.maps.splice(to, 0, assets.maps.splice(mapId, 1).pop());
		mapList.reIndex();
	});
};

MapListItem.prototype.setMap = function (index, map) {
	this.index = index;
	this.map = map;
	this.update();
};

MapListItem.prototype.update = function () {
	this.idxDom.innerText = this.index;

	var fullName = this.map.name.split('/');
	this.name = fullName.pop();
	this.path = fullName.join('/');

	this.nameDom.innerText       = this.name || 'undefined';
	this.nameDom.style.fontStyle = this.name ? '' : 'italic';
	this.nameDom.style.color     = this.name ? '' : '#AAA';
};

MapListItem.prototype.destroy = function () {
	removeDom(this.dom, this.parent);
};


//█████████████████████████████████████████████████████████
//██▄░░█░░▄█████████████████▄░▄████████▄█████████████▀█████
//███░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀███░███████▄▄░████▀▄▄▄▄░██▄░▄▄▄██
//███░█▄█░██▀▄▄▄▄░███░███░███░███▀█████░█████▄▄▄▄▀███░█████
//██▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄██▀░▀▀▀░███▀▀░▀▀██░▀▀▀▀▄███▄▀▀▀▄█
//██████████████████▀░▀████████████████████████████████████

function MapListPanel() {
	Panel.call(this, { title: 'assets' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);
	this.mapList = new MapFolderItem('maps', {}, this.list);
	

	var btnNew = addTooltip(createDiv('panelToolButton mapListNewMapBtn', this.mapList.content), 'Create a new map');
	btnNew.style.backgroundImage = 'url("img/iconNew.png")';
	button(btnNew, function () { t.createNew(); });

	this.elems = [];
}
inherits(MapListPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.addMap = function (map) {
	var index = this.elems.length;
	this.elems.push(new MapListItem(index, map, this.mapList));
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.addFileTo = function (name, obj, parent) {
	if (obj instanceof Image) {
		// TODO create item only on open
		var item = new ImageListItem(name, obj, parent);
	} else if (obj instanceof Object) {
		var container = new FolderListItem(name, obj, parent);
		for (var key in obj) {
			this.addFileTo(key, obj[key], container.content);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.setup = function (assets) {
	// maps
	maps = assets.maps;
	for (var i = 0; i < maps.length; i++) {
		this.addMap(maps[i]);
	}
	// files
	var root = this.list;
	for (var key in assets) {
		if (key === 'maps') continue;
		this.addFileTo(key, assets[key], root);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.createNew = function () {
	// TODO lock if saving
	var t = this;
	var map = new PixelboxMap(16, 16);
	var mapId = assets.maps.length;
	var data = map.save();
	var request = {
		request: 'saveMap',
		mapId: mapId,
		data: data
	};
	// send request to the server
	assetLoader.sendRequest(request, function (error) {
		if (error) return alert(error);
		assets.maps[mapId] = data;
		t.addMap(data);
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.updateItem = function (index) {
	this.elems[index].update();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.reIndex = function () {
	for (var i = 0; i < this.elems.length; i++) {
		this.elems[i].setMap(i, assets.maps[i]);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.deleteItem = function (item) {
	var t = this;
	var mapId = item.index;
	assetLoader.sendRequest({ request: 'deleteMap', mapId: mapId }, function (error) {
		if (error) return alert(error);
		item.destroy();
		assets.maps.splice(mapId, 1);
		t.elems.splice(mapId, 1);
		t.reIndex();
	});
};

module.exports = mapList = new MapListPanel();

},{"../../common/Map":2,"../../common/assetLoader":4,"../../common/domUtils":5,"../../common/inherits":6,"./MapEditorPanel.js":7,"./Panel.js":10,"./dragManager.js":12,"./helper.js":14,"./tooltip.js":17}],9:[function(require,module,exports){
var Panel        = require('./Panel.js');
var dragManager  = require('./dragManager.js');
var inherits     = require('../../common/inherits');
var domUtils     = require('../../common/domUtils');

var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function PalettePanel() {
	Panel.call(this, { title: 'palette' });

	this.canvas = createDiv('paletteCanvas', this.content);
	this.cells = [];
}
inherits(PalettePanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function createPaletteCell(parent, index, color) {
	var cell = createDiv('paletteCell', parent);
	cell.style.backgroundColor = color;
	createDiv('paletteCellNumber', cell).innerText = index;

	button(cell, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'paletteCell paletteCellDummy';
		dummy.style.backgroundColor = color;
		dragManager.startDrag(e, 'paletteColor', color, dummy);
	});

	return cell;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
PalettePanel.prototype.create = function (colors) {
	for (var i = 0; i < colors.length; i++) {
		createPaletteCell(this.canvas, i, colors[i]);
	}
};

module.exports = new PalettePanel();

},{"../../common/domUtils":5,"../../common/inherits":6,"./Panel.js":10,"./dragManager.js":12}],10:[function(require,module,exports){
// dom utilities
var domUtils  = require('../../common/domUtils');
var createDom = domUtils.createDom;
var createDiv = domUtils.createDiv;
var removeDom = domUtils.removeDom;
var button    = domUtils.makeButton;

// module globals
var panels = [];
window.zIndex = 0; // FIXME

function startDrag(panel, e) {
	var d = document;

	var startX = e.clientX - panel.x;
	var startY = e.clientY - panel.y;

	function dragMove(e) {
		e.preventDefault();
		panel.setPosition(e.clientX - startX, e.clientY - startY);
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	panel.dom.style.zIndex = ++zIndex;
	tooltip.style.zIndex = zIndex + 1; // FIXME
	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Panel(params) {
	params = params || {};
	var t = this;
	var d = t.dom = createDiv('panel', null);
	t.x = 0;
	t.y = 0;
	t._expanded = true;

	var handle   = this.handle = createDiv('panelHandle', d);
	var closeBtn = createDiv('panelCloseButton', handle);
	var title    = createDiv('panelTitle', handle);
	if (params.title) title.innerText = params.title;
	button(handle, function (e) {
		t._select();
		startDrag(t, e);
	});

	button(closeBtn, function (e) {
		t.toggleExpand();
	});

	t.content = createDiv('panelContent', d);
	panels.push(t);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// global attribute
Panel.currentSelectedPanel = null;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.setPosition = function (x, y) {
	this.x = x;
	this.y = y;
	this.dom.style.left = x + 'px';
	this.dom.style.top  = y + 'px';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.toggleExpand = function () {
	this._expanded = !this._expanded;
	this.content.style.display = this._expanded ? '' : 'none';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype._select = function () {
	Panel.currentSelectedPanel && Panel.currentSelectedPanel._deselect();
	this.handle.className = 'panelHandle panelHandleSelected';
	Panel.currentSelectedPanel = this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype._deselect = function () {
	this.handle.className = 'panelHandle';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.save = function () {
	// Virtual
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.undo = function () {
	// Virtual
};

module.exports = Panel;
},{"../../common/domUtils":5}],11:[function(require,module,exports){
var Panel        = require('./Panel.js');
var addTooltip   = require('./tooltip.js');
var gridImages   = require('./grid.js');
var dragManager  = require('./dragManager.js');
var Texture      = require('../../common/Texture');
var inherits     = require('../../common/inherits');
var domUtils     = require('../../common/domUtils');

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;

var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE    = settings.PIXEL_SIZE;
var SPRITES_PER_LINE = 16;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function SpriteSheetPanel() {
	Panel.call(this, { title: 'spritesheet' });
	var t = this;

	this.mapEditor = null;

	this.sprite = 0;
	this.flipH  = false;
	this.flipV  = false;
	this.flipR  = false;

	var toolbar = createDiv('panelToolbar', this.content);

	var btnFlipH = addTooltip(createDiv('panelToolButton', toolbar), 'Flip horizontally');
	var btnFlipV = addTooltip(createDiv('panelToolButton', toolbar), 'Flip vertically');
	var btnFlipR = addTooltip(createDiv('panelToolButton', toolbar), 'Rotate 90 degrees');

	btnFlipH.style.backgroundImage = 'url("img/iconFlipH.png")';
	btnFlipV.style.backgroundImage = 'url("img/iconFlipV.png")';
	btnFlipR.style.backgroundImage = 'url("img/iconFlipR.png")';

	button(btnFlipH, function () { t.flipH = !t.flipH; btnFlipH.style.backgroundColor = t.flipH ? '#FF2' : '#AAA'; t.updateSprite(); });
	button(btnFlipV, function () { t.flipV = !t.flipV; btnFlipV.style.backgroundColor = t.flipV ? '#FF2' : '#AAA'; t.updateSprite(); });
	button(btnFlipR, function () { t.flipR = !t.flipR; btnFlipR.style.backgroundColor = t.flipR ? '#FF2' : '#AAA'; t.updateSprite(); });

	this.info = createDiv('panelInfos', toolbar);

	var spritesheet = createDiv('spritesheet', this.content);
	var canvas      = createDom('canvas', 'spritesheetInner', spritesheet);
	var grid        = createDiv('spritesheetInner spritesheetGrid', spritesheet);
	var cursor      = createDiv('spritesheetCursor', spritesheet);

	this.ctx = canvas.getContext('2d');

	var CURSOR_WIDTH  = SPRITE_WIDTH  * PIXEL_SIZE;
	var CURSOR_HEIGHT = SPRITE_HEIGHT * PIXEL_SIZE;

	cursor.style.width  = CURSOR_WIDTH  + 10 + 'px';
	cursor.style.height = CURSOR_HEIGHT + 10 + 'px';
	cursor.style.backgroundImage = gridImages.cursor;

	spritesheet.style.width  = grid.style.width  = SPRITE_WIDTH  * PIXEL_SIZE * SPRITES_PER_LINE + 1 + 'px';
	spritesheet.style.height = grid.style.height = SPRITE_HEIGHT * PIXEL_SIZE * SPRITES_PER_LINE + 1 + 'px';
	grid.style.backgroundImage = gridImages.grid;

	this.cursorTexture = new Texture(SPRITE_WIDTH, SPRITE_HEIGHT);
	var cursorCanvas = this.cursorTexture.canvas;
	cursorCanvas.style.width  = CURSOR_WIDTH  + 'px';
	cursorCanvas.style.height = CURSOR_HEIGHT + 'px';
	cursorCanvas.style.top    = '5px';
	cursorCanvas.style.left   = '5px';
	cursorCanvas.style.position  = 'absolute';
	cursor.appendChild(cursorCanvas);

	canvas.width  = SPRITE_WIDTH  * SPRITES_PER_LINE;
	canvas.height = SPRITE_HEIGHT * SPRITES_PER_LINE;
	canvas.style.width  = canvas.width  * PIXEL_SIZE + 'px';
	canvas.style.height = canvas.height * PIXEL_SIZE + 'px';

	button(spritesheet, function (e) {
		if (e.target !== grid) return;
		var sx = ~~(e.layerX / CURSOR_WIDTH);
		var sy = ~~(e.layerY / CURSOR_HEIGHT);
		cursor.style.left = (sx * CURSOR_WIDTH  - 5) + 'px';
		cursor.style.top  = (sy * CURSOR_HEIGHT - 5) + 'px';
		t.updateInfos(sx, sy);
	});

	this.updateInfos(0, 0);

	dragManager.setAsDroppable(this.dom, this);
}
inherits(SpriteSheetPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragStart = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
	this.dom.style.marginTop  = '-5px';
	this.dom.style.marginLeft = '-5px';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragEnter = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #FF2';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragLeave = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragEnd = function (id, item) {
	this.dom.style.border = '';
	this.dom.style.marginTop  = '';
	this.dom.style.marginLeft = '';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.drop = function (id, item) {
	if (id === 'imageFile') this.updateSpritesheet(item);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSpritesheet = function (img, noMapUpdate) {
	Texture.prototype.setSpritesheet(img);
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.drawImage(img, 0, 0);
	this.updateSprite();
	// update map with new spritesheet
	if (noMapUpdate) return; // FIXME
	if (this.mapEditor) this.mapEditor.map.setSpritesheet(img);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateInfos = function (sx, sy) {
	var sprite = this.sprite = sy * SPRITES_PER_LINE + sx;
	var hexa = ('0' + sprite.toString(16).toLocaleUpperCase()).slice(-2);
	this.info.innerText = sprite + ' (0x' + hexa + ')';
	this.updateSprite();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSprite = function () {
	this.cursorTexture.clear().sprite(this.sprite, 0, 0, this.flipH, this.flipV, this.flipR);
};

module.exports = new SpriteSheetPanel();

},{"../../common/Texture":3,"../../common/domUtils":5,"../../common/inherits":6,"./Panel.js":10,"./dragManager.js":12,"./grid.js":13,"./tooltip.js":17}],12:[function(require,module,exports){
var EventEmitter = require('../../common/EventEmitter');
var inherits     = require('../../common/inherits');
var createDiv    = require('../../common/domUtils').createDiv;

function DragManager() {
	EventEmitter.call(this);
	this.dummy = createDiv('dragItem');
	this.dummy.style.display = 'none';
	this.droppables = [];
}
inherits(DragManager, EventEmitter);
module.exports = new DragManager();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.startDrag = function (e, id, item, dummyContent) {
	var t = this;
	var d = document;

	var dummy = t.dummy;
	dummy.style.zIndex = zIndex + 1; // FIXME
	dummy.style.display = '';
	dummy.style.left = e.clientX + 'px';
	dummy.style.top  = e.clientY + 'px';

	if (dummyContent) dummy.appendChild(dummyContent);

	var currentDrop = null;

	function onDragEnter() {
		this._dropHandle.onDragEnter && this._dropHandle.onDragEnter(id, item);
		currentDrop = this;
	}

	function onDragLeave() {
		this._dropHandle.onDragLeave && this._dropHandle.onDragLeave(id, item);
		if (currentDrop === this) currentDrop = null;
	}

	for (var i = 0; i < t.droppables.length; i++) {
		var droppable = t.droppables[i];
		droppable.addEventListener('mouseenter', onDragEnter);
		droppable.addEventListener('mouseleave', onDragLeave);
		droppable._dropHandle.onDragStart && droppable._dropHandle.onDragStart(id, item);
	}

	t.emit('dragStart', id, item);

	function dragMove(e) {
		e.preventDefault();
		var x = e.clientX;
		var y = e.clientY;
		dummy.style.left = x + 'px';
		dummy.style.top  = y + 'px';
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
		if (dummyContent) dummy.removeChild(dummyContent);
		dummy.style.display = 'none';
		for (var i = 0; i < t.droppables.length; i++) {
			var droppable = t.droppables[i];
			droppable.removeEventListener('mouseenter', onDragEnter);
			droppable.removeEventListener('mouseleave', onDragLeave);
			droppable._dropHandle.onDragEnd && droppable._dropHandle.onDragEnd(id, item);
		}
		t.emit('dragEnd', id, item);
		currentDrop && currentDrop._dropHandle.drop && currentDrop._dropHandle.drop(id, item);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.setAsDroppable = function (dom, handle) {
	this.droppables.push(dom);
	dom._dropHandle = handle;
};


},{"../../common/EventEmitter":1,"../../common/domUtils":5,"../../common/inherits":6}],13:[function(require,module,exports){
// grid and cursor images creation
var Texture = require('../../common/Texture');

var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE    = settings.PIXEL_SIZE;

var w = SPRITE_WIDTH  * PIXEL_SIZE;
var h = SPRITE_HEIGHT * PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var grid = new Texture(w, h);
var colors = ['#E8CD64', '#8D5604'];
var len = Math.max(w, h);
for (var i = 0; i < len; i++) {
	grid.ctx.fillStyle = colors[i % 2];
	grid.ctx.fillRect(i, 0, 1, 1);
	grid.ctx.fillRect(0, i, 1, 1);
}
exports.grid = 'url(' + grid.canvas.toDataURL("image/png") + ')';

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var cursor = new Texture(w + 10, h + 10);
colors = ['#F00', '#F00', '#000', '#000', '#FFF'];
for (var i = 0; i < colors.length; i++) {
	cursor.ctx.strokeStyle = colors[i];
	cursor.rect(i, i, w + 10 - i * 2, h + 10 - i * 2);
}

exports.cursor = 'url(' + cursor.canvas.toDataURL("image/png") + ')';

},{"../../common/Texture":3}],14:[function(require,module,exports){
// helper functions

exports.clip = function (value, min, max) {
	return Math.min(max, Math.max(min, value));
};

exports.copyObject = function (from, to) {
	for (var key in from) {
		to[key] = from[key];
	}
};
},{}],15:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE = 3;
var max = Math.max(SPRITE_WIDTH, SPRITE_HEIGHT);
if      (max >= 20) PIXEL_SIZE = 1;
else if (max >= 10) PIXEL_SIZE = 2;
settings.PIXEL_SIZE = PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// create panels
var assetLoader  = require('../../common/assetLoader');
var spritesheet  = require('./SpriteSheetPanel.js');
var palette      = require('./PalettePanel.js');
var mapEditor    = require('./MapEditorPanel.js');
var mapList      = require('./MapListPanel.js');

// set cross-references
spritesheet.mapEditor = mapEditor;
mapEditor.spritesheet = spritesheet;
mapEditor.mapList     = mapList;

// init panels positions
spritesheet.setPosition(566,   0);
palette.setPosition    (173, 440);
mapEditor.setPosition  (173,   0);
mapList.setPosition    (  0,   0);

// load assets and initialise panels
assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
	if (error) return console.error(error);
	window.assets = result;
	spritesheet.updateSpritesheet(assets.spritesheet);
	palette.create(settings.palette);
	mapList.setup(assets);
	if (assets.maps[0]) mapEditor.loadMap(assets.maps[0]);
});



},{"../../common/assetLoader":4,"./MapEditorPanel.js":7,"./MapListPanel.js":8,"./PalettePanel.js":9,"./SpriteSheetPanel.js":11}],16:[function(require,module,exports){
var EventEmitter = require('../../common/EventEmitter');
var Panel        = require('./Panel.js');

var buttons = new EventEmitter();
buttons.shift   = false;
buttons.control = false;
buttons.alt     = false;

var keyMap = {
	16: 'shift',
	17: 'control',
	18: 'alt'
};

function keyChange(e, isPressed) {
	var key = keyMap[e.keyCode];
	if (key) buttons[key] = isPressed;

	// keyboard shortcuts
	var ctrlKey = isPressed && navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;
	switch (e.keyCode) {
		case 83 : ctrlKey && Panel.currentSelectedPanel && Panel.currentSelectedPanel.save(); break; // S key : save
		case 90 : ctrlKey && Panel.currentSelectedPanel && Panel.currentSelectedPanel.undo(); break; // Z key : undo
		case 16 : buttons.emit('shift', isPressed); break;
		case 18 : buttons.emit('alt',   isPressed); break;
		case 32 : buttons.emit('space', isPressed); break;
		case 88 : buttons.emit('x',     isPressed); break;
		case 67 : buttons.emit('c',     isPressed); break;
		case 86 : buttons.emit('v',     isPressed); break;
	}
}

window.addEventListener('keydown', function onKeyPressed(e) { keyChange(e, true);  });
window.addEventListener('keyup',   function onKeyRelease(e) { keyChange(e, false); });

module.exports = buttons;
},{"../../common/EventEmitter":1,"./Panel.js":10}],17:[function(require,module,exports){
var createDiv = require('../../common/domUtils').createDiv;
var tooltip = createDiv('tooltip');

window.tooltip = tooltip; // FIXME

function addTooltip(dom, text) {
	dom.addEventListener('mouseenter', function(e) {
		tooltip.innerText = text;
		tooltip.style.display = 'block';
	});

	dom.addEventListener('mousemove', function(e) {
		tooltip.style.left = e.clientX + 10 + 'px';
		tooltip.style.top  = e.clientY + 10 + 'px';
	});

	dom.addEventListener('mouseleave', function() {
		tooltip.style.display = 'none';
	});

	return dom;
}

module.exports = addTooltip;
},{"../../common/domUtils":5}]},{},[15]);
