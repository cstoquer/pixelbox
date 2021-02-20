var Texture      = require('./index');
var createCanvas = require('../domUtils/createCanvas');

var TILE_WIDTH  = 8;
var TILE_HEIGHT = 8;
var TILES_PER_LINE = 16; // (in a tilesheet)
var PI2 = Math.PI / 2;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// NOTA: this is used by Tool
Texture.setTileSize = function (width, height) {
	TILE_WIDTH  = ~~width;
	TILE_HEIGHT = ~~height;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype._init = function () {
	this.canvas  = createCanvas(this.width, this.height);
	this.ctx     = this.canvas.getContext('2d');
	this.ctx.fillStyle   = this.palette[0].string;
	this.ctx.strokeStyle = this.palette[1].string;

	this.resize(this.width, this.height);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Resize texture. The texture is cleared.
 * @param {number} width - texture new width in pixels
 * @param {number} height - texture new height in pixels
 * @returns {Texture} the texture itself
 */
Texture.prototype.resize = function (width, height) {
	this.canvas.width  = this.width  = width;
	this.canvas.height = this.height = height;
	this.clear();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw a tile in Texture using the current tilesheet.
 * @param {number} tile - tile index (number between 0 and 255)
 * @param {number} [x] - x position in pixels
 * @param {number} [y] - y position in pixels
 * @param {boolean} [flipH] - if set, the tile is horizontally flipped
 * @param {boolean} [flipV] - if set, the tile is vertically flipped
 * @param {boolean} [flipR] - if set, the tile rotated by 90 degree
 *
 * @returns {Texture} the texture itself
 */
Texture.prototype.sprite = function (tile, x, y, flipH, flipV, flipR) {
	var sx = TILE_WIDTH  *   (tile % TILES_PER_LINE);
	var sy = TILE_HEIGHT * ~~(tile / TILES_PER_LINE);
	var ctx = this.ctx;

	// add camera and round to the pixel
	x = x || 0;
	y = y || 0;
	x = ~~Math.round(x - this.camera.x);
	y = ~~Math.round(y - this.camera.y);

	if (!flipH && !flipV && !flipR) {
		ctx.drawImage(this.tilesheet, this.ox + sx, this.oy + sy, TILE_WIDTH, TILE_HEIGHT, x, y, TILE_WIDTH, TILE_HEIGHT);
		return this;
	}
	ctx.save();

	if (flipH) {
		ctx.scale(-1, 1);
		x = -x - TILE_WIDTH;
	}

	if (flipV) {
		ctx.scale(1, -1);
		y = -y - TILE_HEIGHT;
	}

	if (flipR) {
		ctx.translate(x + TILE_HEIGHT, y);
		ctx.rotate(PI2);
	} else {
		ctx.translate(x, y);
	}

	ctx.drawImage(this.tilesheet, this.ox + sx, this.oy + sy, TILE_WIDTH, TILE_HEIGHT, 0, 0, TILE_WIDTH, TILE_HEIGHT);
	ctx.restore();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw an Image (or anything drawable) in the texture
 *
 * @param {Image | Canvas | Texture | Map} element - thing to draw in the texture
 * @param {number} [x] - x coordinate of where to draw the image. The value is offseted by Texture's camera position
 * @param {number} [y] - y coordinate of where to draw the image. The value is offseted by Texture's camera position
 * @param {boolean} [flipH] - if set, the image is horizontally flipped
 * @param {boolean} [flipV] - if set, the image is vertically flipped
 * @param {boolean} [flipR] - if set, the image rotated by 90 degree
 *
 * @returns {Texture} the texture itself
 */
Texture.prototype.draw = function (img, x, y, flipH, flipV, flipR) {
	if (!img) {
		console.error('Invalid asset');
		return this;
	}

	if (img._isNineSlice) {
		img._draw(this, x, y, flipH, flipV);
		return this;
	}

	var hasFlip = flipH || flipV || flipR;

	// spritesheet element
	if (img._isSprite) {
		var sprite = img;
		img = sprite.img;
		var sx = sprite.x;
		var sy = sprite.y;
		var sw = sprite.width;
		var sh = sprite.height;

		// TODO: pivot point

		var px = ~~Math.round((x || 0) - this.camera.x);
		var py = ~~Math.round((y || 0) - this.camera.y);

		if (!hasFlip) {
			// fast version
			this.ctx.drawImage(img, sx, sy, sw, sh, px, py, sw, sh);
			return this;
		}

		var ctx = this.ctx;
		ctx.save();

		if (flipR) {
			if (flipH) { ctx.scale(-1, 1); px *= -1; px -= sh; }
			if (flipV) { ctx.scale(1, -1); py *= -1; py -= sw; }
			ctx.translate(px + sh, py);
			ctx.rotate(PI2);
		} else {
			if (flipH) { ctx.scale(-1, 1); px *= -1; px -= sw; }
			if (flipV) { ctx.scale(1, -1); py *= -1; py -= sh; }
			ctx.translate(px, py);
		}

		ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
		ctx.restore();
		return this;
	}

	// Image, Texture or TileMap
	if (img._isTileMap) {
		if (!img.texture) img._prepareTexture();
		img = img.texture.canvas;
	}
	if (img._isTexture) img = img.canvas;
	var px = ~~Math.round((x || 0) - this.camera.x);
	var py = ~~Math.round((y || 0) - this.camera.y);

	if (!hasFlip) {
		// fast version
		this.ctx.drawImage(img, px, py);
		return this;
	}

	var ctx = this.ctx;
	ctx.save();

	if (flipR) {
		if (flipH) { ctx.scale(-1, 1); px *= -1; px -= img.height;  }
		if (flipV) { ctx.scale(1, -1); py *= -1; py -= img.width; }
		ctx.translate(px + img.height, py);
		ctx.rotate(PI2);
	} else {
		if (flipH) { ctx.scale(-1, 1); px *= -1; px -= img.width;  }
		if (flipV) { ctx.scale(1, -1); py *= -1; py -= img.height; }
		ctx.translate(px, py);
	}

	ctx.drawImage(img, 0, 0);
	ctx.restore();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.stretchDraw = function (asset, x, y, w, h) {
	// spritesheet element
	if (asset._isSprite) {
		var sprite = asset;
		asset = sprite.img;
		var sx = sprite.x;
		var sy = sprite.y;
		var sw = sprite.width;
		var sh = sprite.height;


		var px = ~~Math.round((x || 0) - this.camera.x);
		var py = ~~Math.round((y || 0) - this.camera.y);

		this.ctx.drawImage(asset, sx, sy, sw, sh, px, py, w, h);
		return this;
	}

	// Image or Texture
	if (asset._isTexture) asset = asset.canvas;

	var px = ~~Math.round((x || 0) - this.camera.x);
	var py = ~~Math.round((y || 0) - this.camera.y);

	this.ctx.drawImage(asset, 0, 0, asset.width, asset.height, px, py, w, h);
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
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set PEN color index. This color is used when printing text in the texture,
 * and for outline when drawing shapes.
 * @param {number} p - pen color index in the palette
 *
 * @returns {Texture} the texture itself
 */
Texture.prototype.pen = function (p) {
	this._pen = p % this.palette.length;
	this.ctx.strokeStyle = this.palette[this._pen].string;
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
	this.ctx.fillStyle = this.palette[this._paper].string;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw an outlined rectangle, using current PEN color.
 * Drawing is offset by Texture's camera.
 * @param {number} x - x coordinate of rectangle upper left corner
 * @param {number} y - y coordinate of rectangle upper left corner
 * @param {number} w - rectangle width
 * @param {number} h - rectangle height
 *
 * @returns {Texture} the texture itself
 */
Texture.prototype.rect = function (x, y, w, h) {
	if (w <= 1 || h <= 1) {
		var fill = this.ctx.fillStyle;
		this.ctx.fillStyle = this.ctx.strokeStyle;
		this.ctx.fillRect(~~(x - this.camera.x), ~~(y - this.camera.y), ~~w, ~~h);
		this.ctx.fillStyle = fill;
		return this;
	}
	this.ctx.strokeRect(~~(x - this.camera.x) + 0.5, ~~(y - this.camera.y) + 0.5, ~~(w - 1), ~~(h - 1));
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw a filled rectangle, using current PAPER color.
 * Drawing is offset by Texture's camera.
 *
 * The minimum size of a filled rectangle is 2.
 * If `w` or `h` is smaller than 2, nothing is drawn.
 *
 * @param {number} x - x coordinate of rectangle upper left corner
 * @param {number} y - y coordinate of rectangle upper left corner
 * @param {number} w - rectangle width
 * @param {number} h - rectangle height
 *
 * @returns {Texture} the texture itself
 */
Texture.prototype.rectf = function (x, y, w, h) {
	this.ctx.fillRect(~~(x - this.camera.x), ~~(y - this.camera.y), ~~w, ~~h);
	return this;
};

// legacy
Texture.prototype.rectfill = Texture.prototype.rectf;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype._isTexture = true;

// TODO: do we need the default tilesheet to have full dimensions?
Texture.prototype.tilesheet = createCanvas(TILE_WIDTH * TILES_PER_LINE, TILE_HEIGHT * TILES_PER_LINE);
