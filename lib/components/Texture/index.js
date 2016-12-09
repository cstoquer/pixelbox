var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var SPRITES_PER_LINE = 16;
var PI2 = Math.PI / 2;

function createCanvas(width, height) {
	var canvas = document.createElement('canvas');
	canvas.width  = width;
	canvas.height = height;
	return canvas;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @class Texture
 *  @author Cedric Stoquer
 *  @classdesc
 * Wrap a canvas with functionalities for Pixelbox rendering.
 *
 * Main screen (`$screen`) is an instance of that class and most of its methods
 * are accessible from the global scope.
 *
 * @param {number} width  - Texture width in pixel
 * @param {number} height - Texture height in pixel
 *
 * @property {Canvas} canvas - HTML canvas element
 * @property {Canvas2DContext} ctx - canvas's context 2D
 * @property {string[]} palette - Texture's color palette
 * @property {Texture}  spritesheet - Texture's spritesheet
 */
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
/** Resize texture. The texture is cleared.
 * @param {number} width - texture new width in pixels
 * @param {number} height - texture new height in pixels
 * @returns {Texture} the texture itself
 */
Texture.prototype.resize = function (width, height) {
	this.canvas.width  = width;
	this.canvas.height = height;
	this._textColumn = ~~(width  / 4);
	this._textLine   = ~~(height / 6);
	this._textOffset = 1; // TODO
	this._cursor.i = 0;
	this._cursor.j = 0;
	this.clear();
	return this;
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
/** Set texture palette. The charset sheet is recreated when this method is called.
 * @param {string[]} palette - palette definition. This is an array of hex formated colors.
 *                    At initialisation it is `['#000000', '#FFFFFF']` and is it is redifined by
 *                    the default palette in the settings file.
 */
Texture.prototype.setPalette = function (palette) {
	Texture.prototype.palette = palette;
	Texture.prototype.textCharset = new Texture(128 * 3, 5 * palette.length);
	generateTextCharset(Texture.prototype.textCharset.ctx, palette);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set default spritesheet for all Textures
 * @param {Image | Texture | Map} spritesheet - spritesheet to use
 */
Texture.prototype.setGlobalSpritesheet = function (spritesheet) {
	Texture.prototype.spritesheet.clear().draw(spritesheet, 0, 0);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set spritesheet to be used to draw sprite in this Texture.
 * By default, it is set to null and fallback to default spritesheet which is `assets/spritesheet`
 * (the default spritesheet can also be changed with the global method `spritesheet`).
 * The spritesheet can be anything drawable in Pixelbox: an image, another Texture or a Map.
 * The texture makes an internal copy of the spritesheet.
 *
 * @param {Image | Texture | Map} spritesheet - spritesheet to use
 * @returns {Texture} the texture itself
 */
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
/** Set camera position
 * @param {number} [x] - camera x position in pixels, default is 0
 * @param {number} [y] - camera y position in pixels, default is 0
 * @returns {Texture} the texture itself
 */
Texture.prototype.setCamera = function (x, y) {
	this.camera.x = x || 0;
	this.camera.y = y || 0;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw a sprite in Texture using the current spritesheet.
 * @param {number} sprite - sprite index (number between 0 and 255)
 * @param {number} [x] - x position in pixels
 * @param {number} [y] - y position in pixels
 * @param {boolean} [flipH] - if set, the sprite is horizontally flipped
 * @param {boolean} [flipV] - if set, the sprite is vertically flipped
 * @param {boolean} [flipR] - if set, the sprite rotated by 90 degree
 * @returns {Texture} the texture itself
 */
Texture.prototype.sprite = function (sprite, x, y, flipH, flipV, flipR) {
	var sx = sprite % SPRITES_PER_LINE;
	var sy = ~~(sprite / SPRITES_PER_LINE);
	var ctx = this.ctx;

	// add camera and round to the pixel
	x = x || 0;
	y = y || 0;
	x = ~~Math.round(x - this.camera.x);
	y = ~~Math.round(y - this.camera.y);

	if (!flipH && !flipV && !flipR) {
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

	if (flipR) {
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
/** Draw an Image (or anything drawable in Pixelbox) in the texture
 *
 * @param {Image | Texture | Map} img - thing to draw in the texture
 * @param {number} [x] - x coordinate of where to draw the image. The value is offseted by Texture's camera position
 * @param {number} [y] - y coordinate of where to draw the image. The value is offseted by Texture's camera position
 * @param {boolean} [flipH] - if set, the image is horizontally flipped
 * @param {boolean} [flipV] - if set, the image is vertically flipped
 * @param {boolean} [flipR] - if set, the image rotated by 90 degree
 * @returns {Texture} the texture itself
 */
Texture.prototype.draw = function (img, x, y, flipH, flipV, flipR) {
	if (img._isMap) img = img.texture.canvas;
	if (img._isTexture) img = img.canvas;
	var px = ~~Math.round((x || 0) - this.camera.x);
	var py = ~~Math.round((y || 0) - this.camera.y);
	if (!flipH && !flipV && !flipR) {
		// fast version
		this.ctx.drawImage(img, px, py);
		return this;
	}
	var ctx = this.ctx;
	ctx.save();
	if (flipH) { ctx.scale(-1, 1); px *= -1; px -= img.width;  }
	if (flipV) { ctx.scale(1, -1); py *= -1; py -= img.height; }

	if (flipR) {
		ctx.translate(px + img.height, py);
		ctx.rotate(PI2);
	} else {
		ctx.translate(px, py);
	}

	ctx.drawImage(img, 0, 0);
	ctx.restore();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Clear the whole texture (make it transparent)
 * @returns {Texture} the texture itself
 */
Texture.prototype.clear = function () {
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Clear texture with current paper color (CLear Screen)
 * @returns {Texture} the texture itself
 */
Texture.prototype.cls = function () {
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.locate(0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set PEN color index. This color is used when printing text in the texture, 
 * and for outline when drawing shapes.
 * @param {number} p - pen color index in the palette
 * @returns {Texture} the texture itself
 */
Texture.prototype.pen = function (p) {
	this._pen = p % this.palette.length;
	this.ctx.strokeStyle = this.palette[this._pen];
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set PAPER color index. This color is used for fill when drawing shapes
 * or when clearing the texture (cls)
 * @param {number} p - pen color index in the palette
 * @returns {Texture} the texture itself
 */
Texture.prototype.paper = function (p) {
	this._paper = p % this.palette.length;
	this.ctx.fillStyle = this.palette[this._paper];
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw an outlined rectangle, using current PEN color.
 * Drawing is offset by Texture's camera.
 * @param {number} x - x coordinate of rectangle upper left corner
 * @param {number} y - y coordinate of rectangle upper left corner
 * @param {number} w - rectangle width
 * @param {number} h - rectangle height
 * @returns {Texture} the texture itself
 */
Texture.prototype.rect = function (x, y, w, h) {
	this.ctx.strokeRect(~~(x - this.camera.x) + 0.5, ~~(y - this.camera.y) + 0.5, ~~(w - 1), ~~(h - 1));
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw a filled rectangle, using current PAPER color.
 * Drawing is offset by Texture's camera.
 * @param {number} x - x coordinate of rectangle upper left corner
 * @param {number} y - y coordinate of rectangle upper left corner
 * @param {number} w - rectangle width
 * @param {number} h - rectangle height
 * @returns {Texture} the texture itself
 */
Texture.prototype.rectfill = function (x, y, w, h) {
	this.ctx.fillRect(~~(x - this.camera.x), ~~(y - this.camera.y), ~~w, ~~h);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set cursor position for the text.
 * @param {number} i - cursor x position in character size (4 pixels)
 * @param {number} j - cursor y position in character size (6 pixels)
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
 * @returns {Texture} the texture itself
 */
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
/** Same as print and add a go to the next line.
 * @param (string) str - text to be printed
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
	n *= 6;
	this.ctx.drawImage(this.canvas, 0, -n);
	this.ctx.fillRect(0, this.canvas.height - n - this._textPadding, this.canvas.width, n + this._textPadding);
	return this;
};

