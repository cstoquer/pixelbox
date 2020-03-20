var Texture      = require('./index.js');
var createCanvas = require('../domUtils/createCanvas');
var batcher      = require('../webGL/batcher');
var renderers    = batcher.renderers;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var CHAR_WIDTH    = 4;
var CHAR_HEIGHT   = 6;
var CHAR_PER_LINE = 16;
var OX            = 0;
var OY            = 0;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var MINITEXT = [
	// 219,   438,   511,   14016, 14043, 14326, 14335, 28032, 28123, 28086, 28159, 32704, 32731, 32758, 32767, 128,
	// 146,   384,   402,   9344,  9362,  9600,  9618,  192,   210,   448,   466,   9408,  9426,  9664,  9682,  32767,
	0,     8338,  45,    11962, 5588,  21157, 29354, 10,    17556, 5265,  21973, 1488,  5312,  448,   13824, 5268,
	31599, 29843, 29671, 31143, 18925, 31183, 31689, 18735, 31727, 18927, 1040,  5136,  17492, 3640,  5393,  8359,
	25450, 23530, 31467, 25166, 15211, 29391, 4815,  27470, 23533, 29847, 15142, 23277, 29257, 23421, 23403, 11114,
	4843,  26474, 23279, 14798, 9367,  27501, 12141, 24429, 23213, 14829, 29351, 25750, 17553, 13459, 9402,  28672,
	34,    23530, 31467, 25166, 15211, 29391, 4815,  27470, 23533, 29847, 15142, 23277, 29257, 23421, 23403, 11114,
	4843,  26474, 23279, 14798, 9367,  27501, 12141, 24429, 23213, 14829, 29351, 25686, 9362,  13587, 42,    21845
];

function createDefaultCharset() {
	var canvas = createCanvas(64, 36);
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, 64, 36);

	ctx.fillStyle = '#FFF';
	for (var c = 0; c < MINITEXT.length; c++) {
		var code = MINITEXT[c];

		var i = c % 16;
		var j = ~~(c / 16);

		for (var bit = 0; bit < 15; bit++) {
			var x = bit % 3;
			var y = ~~(bit / 3);
			var pixel = (code >> bit) & 1;
			if (pixel !== 1) continue;
			ctx.fillRect(i * CHAR_WIDTH + x, j * CHAR_HEIGHT + y, 1, 1);
		}
	}
	return canvas;
}

var DEFAULT_CHARSET = createDefaultCharset();
var CHARSET_IMG = DEFAULT_CHARSET;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var _resize = Texture.prototype.resize;
Texture.prototype.resize = function (width, height) {
	this._textColumn   = ~~(width  / CHAR_WIDTH);
	this._textLine     = ~~(height / CHAR_HEIGHT);
	this._textPadding  = height - this._textLine * CHAR_HEIGHT;

	this._cursor.i = 0;
	this._cursor.j = 0;

	_resize.call(this, width, height);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var _cls = Texture.prototype.cls;
Texture.prototype.cls = function () {
	_cls.call(this);
	this.locate(0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.locate = function (i, j) {
	this._cursor.i = ~~i;
	this._cursor.j = ~~j;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.print = function (str, x, y) {
	// string transformation
	if (typeof str === 'object') {
		try {
			str = JSON.stringify(str);
		} catch (error) {
			str = "[Object]";
		}
	} else if (typeof str !== 'string') {
		str = str.toString();
	}

	// prepare renderer
	var renderer = batcher.prepare(renderers.colorSprite, CHARSET_IMG, this);

	var color = this.palette[this._pen];
	var r = color.r;
	var g = color.g;
	var b = color.b;

	// print at cooordinate
	if (x !== undefined) {
		x = ~~Math.round(x - this.camera.x);
		y = ~~Math.round(y - this.camera.y);
		for (var i = 0; i < str.length; i++) {
			// TODO
			x += CHAR_WIDTH;
		}
		return this;
	}

	// print at cursor
	var i = this._cursor.i;
	var j = this._cursor.j;

	for (var c = 0; c < str.length; c++) {
		if (i > this._textColumn) {
			j += 1;
			i = 0;
		}

		if (j > this._textLine) {
			this.textScroll();
			j -= 1;
			// don't forget to switch back the renderer
			renderer = batcher.prepare(renderers.colorSprite, CHARSET_IMG, this);
		}

		var chr = str.charCodeAt(c);
		if (chr === 10 || chr === 13) {
			j += 1;
			i = 0;
			continue;
		}
		chr -= 32;
		if (chr < 0 || chr > 255) {
			i += 1;
			continue;
		}

		var sx = CHAR_WIDTH  *   (chr % CHAR_PER_LINE) + OX;
		var sy = CHAR_HEIGHT * ~~(chr / CHAR_PER_LINE) + OY;
		renderer.pushSprite(i * CHAR_WIDTH, j * CHAR_HEIGHT, CHAR_WIDTH, CHAR_HEIGHT, sx, sy, r, g, b);
		i += 1;
	}

	this._cursor.i = i;
	this._cursor.j = j;

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
	n *= CHAR_HEIGHT;

	// NOTE: for optimization purpose, this code is duplicated from `draw` method
	if (!this._copyTexture) {
		this._copyTexture = new Texture(this.width, this.height);
	}

	this._copyTexture.draw(this, 0, 0);

	this.cls();
	this.draw(this._copyTexture, 0, -n);

	return this;
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setCharset = function (img) {
	CHARSET_IMG = img || DEFAULT_CHARSET;
	CHAR_WIDTH  = ~~(CHARSET_IMG.width / 16);
	CHAR_HEIGHT = ~~(CHARSET_IMG.height / 6);

	OX = 0;
	OY = 0;

	// if charset is a sprite in an atlas
	if (CHARSET_IMG._isSprite) {
		OX = CHARSET_IMG.x;
		OY = CHARSET_IMG.y;
		CHARSET_IMG = CHARSET_IMG.img;
	}

	this._textColumn   = ~~(this.width  / CHAR_WIDTH)  - 1;
	this._textLine     = ~~(this.height / CHAR_HEIGHT) - 1;
	this._textPadding  = this.height - this._textLine * CHAR_HEIGHT;
};
