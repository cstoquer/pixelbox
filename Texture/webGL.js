var Texture   = require('./index.js');
var context   = require('../webGL/context');
var batcher   = require('../webGL/batcher');
var gl        = context.gl;
var renderers = batcher.renderers;
var pixelbox  = require('..');
var settings  = pixelbox.settings;

var TILE_WIDTH     = ~~settings.tileSize.width;
var TILE_HEIGHT    = ~~settings.tileSize.height;
var TILES_PER_LINE = 16;                         // (in a tilesheet)

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype._init = function () {
	if (this.width === 0 || this.height === 0) {
		this.ctx         = null; // gl.Texture2D
		this.framebuffer = null; // gl.framebuffer
		return;
	}

	this.ctx = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.ctx);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	// set the filtering so we don't need mips
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	// Create and bind the framebuffer
	this.framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.ctx, 0);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setCamera = function (x, y) {
	this.camera.x = x || 0;
	this.camera.y = y || 0;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.sprite = function (tile, x, y, flipH, flipV, flipR) {

	// add camera and round to the pixel
	x = Math.round((x || 0) - this.camera.x);
	y = Math.round((y || 0) - this.camera.y);

	// optimize out if render outside viewport
	if ( x >= this.width
		|| y >= this.height
		|| x <= -TILE_WIDTH
		|| y <= -TILE_HEIGHT
	) return this;

	var sx = TILE_WIDTH  *   (tile % TILES_PER_LINE) + this.ox;
	var sy = TILE_HEIGHT * ~~(tile / TILES_PER_LINE) + this.oy;

	batcher
		.prepare(renderers.sprite, this.tilesheet, this)
		.pushSprite(x, y, TILE_WIDTH, TILE_HEIGHT, sx, sy, flipH, flipV, flipR);

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.draw = function (img, x, y, flipH, flipV, flipR) {
	if (!img) {
		console.error('Invalid asset');
		return this;
	}

	if (img._isNineSlice) {
		img._draw(this, x, y, flipH, flipV);
		return this;
	}

	if (img === this) {
		// webGL cannot draw a texture in itslef.
		if (!this._copyTexture) {
			this._copyTexture = new Texture(this.width, this.height);
		}

		this._copyTexture.draw(this, 0, 0);
		img = this._copyTexture;
	}

	if (img._isTileMap) {
		img._draw(x, y, flipH, flipV, flipR, this);
		return this;
	}

	x = Math.round((x || 0) - this.camera.x);
	y = Math.round((y || 0) - this.camera.y);

	// optimize out off-screen sprite
	if (x >= this.width || y >= this.height) return this;

	if (img._isSprite) {
		var sprite = img;
		img = sprite.img;
		var sx = sprite.x;
		var sy = sprite.y;
		var sw = sprite.width;
		var sh = sprite.height;

		// optimize out off-screen sprite
		if (x <= -sw || y <= -sh) return this;

		batcher
			.prepare(renderers.sprite, img, this)
			.pushSprite(x, y, sw, sh, sx, sy, flipH, flipV, flipR);

	// } else if (img._isTexture) {
	// 	if (x <= -img.width || y <= -img.height) return this;
	// 	batcher
	// 		.prepare(renderers.sprite, img.canvas, this)
	// 		.pushSprite(x, y, img.width, img.height, 0, 0, flipH, flipV, flipR);

	} else {
		// assuming this is a GlTexture or a regular Image instance
		if (x <= -img.width || y <= -img.height) return this;
		batcher
			.prepare(renderers.sprite, img, this)
			.pushSprite(x, y, img.width, img.height, 0, 0, flipH, flipV, flipR);
	}

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.stretchDraw = function (asset, x, y, w, h) {
	// Sprite
	if (asset._isSprite) {
		var sprite = asset;
		asset = sprite.img;
		var sx = sprite.x;
		var sy = sprite.y;
		var sw = sprite.width;
		var sh = sprite.height;


		var px = ~~Math.round((x || 0) - this.camera.x);
		var py = ~~Math.round((y || 0) - this.camera.y);

		batcher
			.prepare(renderers.sprite, asset, this)
			.pushStretchSprite(px, py, w, h, sx, sy, sw, sh);

		return this;
	}

	// Image or Texture
	if (asset._isTexture) asset = asset.canvas;

	var px = ~~Math.round((x || 0) - this.camera.x);
	var py = ~~Math.round((y || 0) - this.camera.y);

	batcher
		.prepare(renderers.sprite, asset, this)
		.pushStretchSprite(px, py, w, h, 0, 0, img.width, img.height);

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.clear = function () {
	batcher.flush();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.viewport(0, 0, this.width, this.height);
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.cls = function () {
	var color = this.palette[this._paper];
	batcher.flush();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.viewport(0, 0, this.width, this.height);
	gl.clearColor(color.r / 255, color.g / 255, color.b / 255, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.paper = function (paper) {
	this._paper = paper % this.palette.length;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.pen = function (pen) {
	this._pen = pen % this.palette.length;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function setTilesheet(target, tilesheet) {
	target.ox = 0;
	target.oy = 0;

	if (tilesheet._isImageWrapper) {
		// Image Wrapper (for tool)
		tilesheet = tilesheet.asset;
	}

	if (tilesheet._isSprite) {
		// Sprite
		target.ox = tilesheet.x;
		target.oy = tilesheet.y;
		target.tilesheet = tilesheet.img;

	} else if (tilesheet._isMap) {
		// Tilemap
		// force redraw if map's texture is not set yet
		// if (!tilesheet.texture) tilesheet._prepareTexture();
		// target.tilesheet = tilesheet.texture.canvas;

		throw new Error('TileMap cannot be used as tilesheet if using webGL');

	} else if (tilesheet._isTexture) {
		// Texture
		target.tilesheet = tilesheet.canvas;

	} else if (tilesheet._isGlTexture) {
		// Texture
		target.tilesheet = tilesheet;

	} else if (tilesheet instanceof Image) {
		// Image
		target.tilesheet = tilesheet;

	} else if (tilesheet instanceof HTMLCanvasElement) {
		// Canvas
		target.tilesheet = tilesheet;

	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setTilesheet = function (tilesheet) {
	// TODO: this solution is not well optimized as we add and remove attributes on an instance
	if (!tilesheet) {
		// remove local spritesheet so it naturally fallback to the prototype one
		delete this.tilesheet;
		return;
	}
	setTilesheet(this, tilesheet);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setGlobalTilesheet = function (tilesheet) {
	setTilesheet(Texture.prototype, tilesheet);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
window.tilesheet = function(img) {
	return Texture.prototype.setGlobalTilesheet(img);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
window.texture = function (img) {
	var texture = new Texture(img.width, img.height);
	texture.clear().draw(img, 0, 0);
	return texture;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.rect = function (x, y, w, h) {
	var color = this.palette[this._pen];

	// FIXME: there is a bug within webbGL that make one pixel missing
	// batcher
	// 	.prepare(renderers.line, null, this)
	// 	.pushRect(x, y, w, h, color.r, color.g, color.b);

	// HACK: Use rectf to render lines. It's less efficient, but working properly.
	var renderer = batcher.prepare(renderers.color, null, this);

	if (w <= 2 || h <= 2) {
		renderer.pushRect(x, y, w, h, color.r, color.g, color.b);
		return this;
	}

	renderer.pushRect(x,         y,         w, 1, color.r, color.g, color.b);
	renderer.pushRect(x,         y + h - 1, w, 1, color.r, color.g, color.b);
	renderer.pushRect(x,         y,         1, h, color.r, color.g, color.b);
	renderer.pushRect(x + w - 1, y,         1, h, color.r, color.g, color.b);

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.rectf = function (x, y, w, h) {
	var color = this.palette[this._paper];

	batcher
		.prepare(renderers.color, null, this)
		.pushRect(x, y, w, h, color.r, color.g, color.b);

	return this;
};

Texture.prototype.rectfill = Texture.prototype.rectf;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.resize = function (width, height) {
	if (this.width === width && this.height === height) return this;
	this.width  = width;
	this.height = height;
	this._init();

	if (this._copyTexture) {
		this._copyTexture = null;
	}

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype._isTexture = true;
Texture.prototype._isGlTexture = true;

// FIXME better have all these private
// Texture.prototype.tilesheet = assets.tilesheet || new Texture(TILE_WIDTH * TILES_PER_LINE, TILE_HEIGHT * TILES_PER_LINE);

