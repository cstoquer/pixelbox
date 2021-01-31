var Texture      = require('./index.js');
var minitext     = require('./minitext');
var batcher      = require('../webGL/batcher');
var renderers    = batcher.renderers;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var CHAR_WIDTH    = 4;
var CHAR_HEIGHT   = 6;
var CHAR_PER_LINE = 16;
var OX            = 0;
var OY            = 0;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var DEFAULT_CHARSET = minitext();
var CHARSET = DEFAULT_CHARSET;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var _resize = Texture.prototype.resize;
Texture.prototype.resize = function (width, height) {
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
	var renderer = batcher.prepare(renderers.colorSprite, CHARSET, this);

	var color = this.palette[this._pen];
	var r = color.r;
	var g = color.g;
	var b = color.b;

	// print at cooordinate
	if (x !== undefined) {
		x = ~~Math.round(x - this.camera.x);
		y = ~~Math.round(y - this.camera.y);
		var originX = x;
		for (var i = 0; i < str.length; i++) {
			var chr = str.charCodeAt(i);
			if (chr === 10 || chr === 13) {
				y += CHAR_HEIGHT;
				x = originX;
				continue;
			}
			chr -= 32;
			if (chr < 0 || chr > 255) {
				x += CHAR_WIDTH;
				continue;
			}
			var sx = CHAR_WIDTH  *   (chr % CHAR_PER_LINE) + OX;
			var sy = CHAR_HEIGHT * ~~(chr / CHAR_PER_LINE) + OY;
			renderer.pushSprite(x, y, CHAR_WIDTH, CHAR_HEIGHT, sx, sy, r, g, b);
			x += CHAR_WIDTH;
		}
		return this;
	}

	// print at cursor
	var i = this._cursor.i;
	var j = this._cursor.j;

	for (var c = 0; c < str.length; c++) {
		if (this.width - i * CHAR_WIDTH < CHAR_WIDTH) {
			i = 0;
			j += 1;
		}
		if (this.height - j * CHAR_HEIGHT < CHAR_HEIGHT) {
			this.textScroll();
			j -= 1;
			// don't forget to switch back the renderer
			renderer = batcher.prepare(renderers.colorSprite, CHARSET, this);
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
	var i = this._cursor.i * CHAR_WIDTH;
	var j = this._cursor.j * CHAR_HEIGHT;

	CHARSET = img || DEFAULT_CHARSET;
	CHAR_WIDTH  = ~~(CHARSET.width / 16);
	CHAR_HEIGHT = ~~(CHARSET.height / 6);

	this._cursor.i = Math.ceil(i / CHAR_WIDTH);
	this._cursor.j = Math.ceil(j / CHAR_HEIGHT);

	OX = 0;
	OY = 0;

	// if charset is a sprite in an atlas
	if (CHARSET._isSprite) {
		OX = CHARSET.x;
		OY = CHARSET.y;
		CHARSET = CHARSET.img;
	}
};
