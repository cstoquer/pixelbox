var Texture  = require('./index.js');
var minitext = require('./minitext');


var CHAR_PER_LINE = 16;
var CHAR_WIDTH    = 4;
var CHAR_HEIGHT   = 6;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Charset(template) {
	if (!template._isTexture) {
		var texture = new Texture(template.width, template.height);
		texture.draw(template, 0, 0);
		template = texture;
	}

	this.template = template;
	this.colors = {};
}

Charset.prototype.getColor = function (colorString) {
	if (this.colors[colorString]) return this.colors[colorString];
	var w = this.template.width;
	var h = this.template.height;
	var texture = new Texture(w, h);

	// copy image and change color
	texture.clear();
	texture.ctx.fillStyle = colorString;
	texture.ctx.fillRect(0, 0, w, h);
	texture.ctx.globalCompositeOperation = 'destination-in';
	texture.ctx.drawImage(this.template.canvas, 0, 0);

	var canvas = texture.canvas;
	this.colors[colorString] = canvas;
	return canvas;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var _resize = Texture.prototype.resize;

Texture.prototype.resize = function (width, height) {
	this._cursor.i = 0;
	this._cursor.j = 0;
	_resize.call(this, width, height);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.cls = function () {
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.locate(0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// default text charset generation
var DEFAULT_CHARSET = new Charset(minitext());
var CHARSET = DEFAULT_CHARSET;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set cursor position for the text.
 * @param {number} i - cursor x position in character size (4 pixels)
 * @param {number} j - cursor y position in character size (6 pixels)
 *
 * @returns {Texture} the texture itself
 */
Texture.prototype.locate = function (i, j) {
	this._cursor.i = ~~i;
	this._cursor.j = ~~j;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Print text. A position in pixel can be specified. If you do so, the text
 * will be drawn at specified position plus camera offset. If not, the text is
 * printed at current cursor position and wil wrap and make screen scroll down
 * when cursor reach the texture bottom.
 *
 * @param (string) str - text to be printed
 * @param (number) [x] - text x position in pixel
 * @param (number) [y] - text y position in pixel
 *
 * @returns {Texture} the texture itself
 */
Texture.prototype.print = function (str, x, y) {
	// string transformation
	if (typeof str === 'object') {
		try {
			str = JSON.stringify(str);
		} catch (error) {
			str = '[Object]';
		}
	} else if (typeof str !== 'string') {
		str = str.toString();
	}

	var color = this.palette[this._pen].string;
	var charset = CHARSET.getColor(color);

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
			var sx = CHAR_WIDTH  *   (chr % CHAR_PER_LINE);
			var sy = CHAR_HEIGHT * ~~(chr / CHAR_PER_LINE);
			this.ctx.drawImage(
				charset,
				sx,
				sy,
				CHAR_WIDTH, CHAR_HEIGHT,
				x, y,
				CHAR_WIDTH, CHAR_HEIGHT
			);
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
		}
		var chr = str.charCodeAt(c);
		if (chr === 10 || chr === 13) {
			i = 0;
			j += 1;
			continue;
		}
		chr -= 32;
		if (chr < 0 || chr > 255) {
			i += 1;
			continue;
		}
		var sx = CHAR_WIDTH  *   (chr % CHAR_PER_LINE);
		var sy = CHAR_HEIGHT * ~~(chr / CHAR_PER_LINE);
		this.ctx.drawImage(
			charset,
			sx,
			sy,
			CHAR_WIDTH, CHAR_HEIGHT,
			i * CHAR_WIDTH,
			j * CHAR_HEIGHT,
			CHAR_WIDTH, CHAR_HEIGHT
		);
		i += 1;
	}

	this._cursor.i = i;
	this._cursor.j = j;

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Same as print and add a go to the next line.
 * @param (string) str - text to be printed
 *
 * @returns {Texture} the texture itself
 */
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
	this.ctx.drawImage(this.canvas, 0, -n);
	this.ctx.fillRect(0, this.canvas.height - n, this.canvas.width, n);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var CHARSETS_MAP = new WeakMap();

Texture.prototype.setCharset = function (img) {
	var i = this._cursor.i * CHAR_WIDTH;
	var j = this._cursor.j * CHAR_HEIGHT;

	if (!img) {
		CHARSET     = DEFAULT_CHARSET;
		CHAR_WIDTH  = 4;
		CHAR_HEIGHT = 6;
	} else {
		CHAR_WIDTH  = ~~(img.width / 16);
		CHAR_HEIGHT = ~~(img.height / 6);

		if (CHARSETS_MAP.has(img)) {
			CHARSET = CHARSETS_MAP.get(img);
		} else {
			CHARSET = new Charset(img);
			CHARSETS_MAP.set(img, CHARSET);
		}
	}

	this._cursor.i = Math.ceil(i / CHAR_WIDTH);
	this._cursor.j = Math.ceil(j / CHAR_HEIGHT);
};
