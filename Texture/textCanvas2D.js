var Texture = require('./index.js');

var CHAR_WIDTH  = 3;
var CHAR_HEIGHT = 5;
var TEXT_WIDTH  = 4;
var TEXT_HEIGHT = 6;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var _setPalette = Texture.prototype.setPalette;

Texture.prototype.setPalette = function (palette) {
	_setPalette.call(this, palette);
	Texture.prototype.textCharset = new Texture(128 * CHAR_WIDTH, CHAR_HEIGHT * palette.length);
	generateTextCharset(Texture.prototype.textCharset.ctx, palette);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var _resize = Texture.prototype.resize;

Texture.prototype.resize = function (width, height) {
	this._textOffset   = 1; // FIXME
	this._textColumn   = ~~(width  / TEXT_WIDTH);
	this._textLine     = ~~(height / TEXT_HEIGHT);
	this._textPadding  = height - this._textLine * TEXT_HEIGHT - this._textOffset;

	this._cursor.i = 0;
	this._cursor.j = 0;

	_resize.call(this, width, height);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// var _cls = Texture.prototype.cls;

Texture.prototype.cls = function () {
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.locate(0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// default text charset generation

Texture.prototype.textCharset = new Texture(128 * CHAR_WIDTH, CHAR_HEIGHT * Texture.prototype.palette.length);

function getTextCharcodes(texture) {
	// Non exposed function to generate a compressed charset (an array on integer)
	// from a texture. The characters in the textures are 3x5 pixels
	// and arranged in one line.

	var ctx = texture.ctx;
	var charcodes = [];
	for (var chr = 0; chr < 128; chr++) {
		var imageData = ctx.getImageData(chr * CHAR_WIDTH, 0, CHAR_WIDTH, CHAR_HEIGHT);
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

// generate the default set of 3 x 5 characters for all colors in palette
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
		ctx.fillStyle = palette[pen].string;
		for (var i = 0; i < codes.length; i++) {
			var code = codes[i];
			for (var bit = 0; bit < 15; bit++) {
				var x = bit % CHAR_WIDTH;
				var y = ~~(bit / CHAR_WIDTH);
				var pixel = (code >> bit) & 1;
				if (pixel !== 1) continue;
				ctx.fillRect(i * CHAR_WIDTH + x, pen * CHAR_HEIGHT + y, 1, 1);
			}
		}
	}
	ctx.fillStyle = palette[0].string;
};

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
			str = "[Object]";
		}
	} else if (typeof str !== 'string') {
		str = str.toString();
	}

	// print at cooordinate
	if (x !== undefined) {
		x = ~~Math.round(x - this.camera.x);
		y = ~~Math.round(y - this.camera.y);
		for (var i = 0; i < str.length; i++) {
			this.ctx.drawImage(
				this.textCharset.canvas,
				CHAR_WIDTH * str.charCodeAt(i),
				CHAR_HEIGHT * this._pen,
				CHAR_WIDTH, CHAR_HEIGHT,
				x, y,
				CHAR_WIDTH, CHAR_HEIGHT
			);
			x += TEXT_WIDTH;
		}
		return this;
	}

	// print at cursor
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
			CHAR_WIDTH * chr,
			CHAR_HEIGHT * this._pen,
			CHAR_WIDTH, CHAR_HEIGHT,
			this._cursor.i * TEXT_WIDTH,
			this._cursor.j * TEXT_HEIGHT + this._textOffset,
			CHAR_WIDTH, CHAR_HEIGHT
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
	n *= TEXT_HEIGHT;
	this.ctx.drawImage(this.canvas, 0, -n);
	this.ctx.fillRect(0, this.canvas.height - n - this._textPadding, this.canvas.width, n + this._textPadding);
	return this;
};
