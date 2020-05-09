var TileMap  = require('./index.js');
var Texture  = require('../Texture');       // webGL Texture
var batcher  = require('../webGL/batcher');
var pixelbox = require('..');
var settings = pixelbox.settings;

var TILE_WIDTH      = settings.tileSize.width;
var TILE_HEIGHT     = settings.tileSize.height;
var SCREEN_WIDTH    = settings.screen.width;
var SCREEN_HEIGHT   = settings.screen.height;
var SPRITE_RENDERER = batcher.renderers.sprite;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var ROT_MAP = {
	false: { false: { false: { flipH: false, flipV: false, flipR: true  },
										true:  { flipH: true,  flipV: true,  flipR: false } },
					 true:  { false: { flipH: true,  flipV: false, flipR: true  },
										true:  { flipH: false, flipV: true,  flipR: false } } },
	true: {  false: { false: { flipH: false, flipV: true,  flipR: true  },
										true:  { flipH: true,  flipV: false, flipR: false } },
					 true:  { false: { flipH: true,  flipV: true,  flipR: true  },
										true:  { flipH: false, flipV: false, flipR: false } } }
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileMap.prototype._prepareTexture = function () { /* NOP */ };
TileMap.prototype.release = function () { /* NOP */ };
TileMap.prototype.redraw = function () { /* NOP */ };

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * NOTE: By overwriting draw, we prevent TileMap to create a Texture instance
 */
TileMap.prototype.draw = function (px, py, flipH, flipV, flipR) {
	this._draw(px, py, flipH, flipV, flipR, pixelbox.$screen);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileMap.prototype._draw = function (px, py, flipH, flipV, flipR, renderTarget) {
	var image = this.tilesheet || Texture.prototype.tilesheet;
	var renderer = batcher.prepare(SPRITE_RENDERER, image, renderTarget);

	var camera = pixelbox.$screen.camera;
	px = Math.round((px || 0) - camera.x);
	py = Math.round((py || 0) - camera.y);

	// TODO: could probably avoid recalculation if nothing changed (camera, x, y)

	var tilesheet = this.tilesheet || assets.tilesheet; // TODO: get default tilesheet
	var ox = 0;
	var oy = 0;

	if (tilesheet._isSprite) {
		// Sprite
		ox = tilesheet.x;
		oy = tilesheet.y;
	}

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// Render with a flip flags set (special case, normally rarely used)
	if (flipH || flipV || flipR) {
		var width, height;

		if (flipR) {
			width  = this.height;
			height = this.width;
		} else {
			width  = this.width;
			height = this.height;
		}

		var startX = Math.max(0, ~~(-px / TILE_WIDTH));
		var startY = Math.max(0, ~~(-py / TILE_HEIGHT));
		var endX   = Math.min(width,  ~~(1 + (SCREEN_WIDTH  - px) / TILE_WIDTH));
		var endY   = Math.min(height, ~~(1 + (SCREEN_HEIGHT - py) / TILE_HEIGHT));

		for (var y = startY; y < endY; y++) {
		for (var x = startX; x < endX; x++) {
			var sourceX, sourceY;

			// source tile
			if (flipR) {
				sourceX = y;
				sourceY = this.height - 1 - x;
			} else {
				sourceX = x;
				sourceY = y;
			}
			if (flipH) sourceX = this.width  - 1 - sourceX;
			if (flipV) sourceY = this.height - 1 - sourceY;

			var tile = this.get(sourceX, sourceY);
			if (!tile) continue;

			var sprite = tile.sprite;

			// uv coordinates from sprite index
			var u1 =   (sprite % 16) * TILE_WIDTH  + ox;
			var v1 = ~~(sprite / 16) * TILE_HEIGHT + oy;

			// vertex positions
			var x1 = px + x * TILE_WIDTH;
			var y1 = py + y * TILE_HEIGHT;

			// transform tile flags
			var dh, dv, dr;
			if (flipR) {
				var f = ROT_MAP[tile.flipH][tile.flipV][tile.flipR];
				dh = f.flipH;
				dv = f.flipV;
				dr = f.flipR;
				if (flipH) dv = !dv;
				if (flipV) dh = !dh;
			} else {
				dh = tile.flipH;
				dv = tile.flipV;
				dr = tile.flipR;
				if (flipH) dh = !dh;
				if (flipV) dv = !dv;
			}

			renderer.pushSprite(x1, y1, TILE_WIDTH, TILE_HEIGHT, u1, v1, dh, dv, dr);
		}}

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// Map is drawn without any flip flag (this should covers 95% of use cases)
	} else {
		var startX = Math.max(0, ~~(-px / TILE_WIDTH));
		var startY = Math.max(0, ~~(-py / TILE_HEIGHT));
		var endX   = Math.min(this.width,  ~~(1 + (SCREEN_WIDTH  - px) / TILE_WIDTH));
		var endY   = Math.min(this.height, ~~(1 + (SCREEN_HEIGHT - py) / TILE_HEIGHT));

		for (var y = startY; y < endY; y++) {
		for (var x = startX; x < endX; x++) {
			var tile = this.get(x, y);
			if (!tile) continue;

			var sprite = tile.sprite;

			// uv coordinates from sprite index
			var u1 =   (sprite % 16) * TILE_WIDTH  + ox;
			var v1 = ~~(sprite / 16) * TILE_HEIGHT + oy;

			// vertex positions
			var x1 = px + x * TILE_WIDTH;
			var y1 = py + y * TILE_HEIGHT;

			renderer.pushSprite(x1, y1, TILE_WIDTH, TILE_HEIGHT, u1, v1, tile.flipH, tile.flipV, tile.flipR);

			// TODO: cache uv in the tiles ?
			// TODO: use index buffer to reduce vertex buffer size
			// TODO: save buffer index infos in the tile
		}}
	}
};

module.exports = TileMap;
