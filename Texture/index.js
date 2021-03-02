
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @class Texture
 *  @author Cedric Stoquer
 *  @classdesc
 * Wrap a canvas with functionalities for Pixelbox rendering.
 *
 * Main screen (accessible on `$screen`) is an instance of that class and most of its methods
 * are also accessible from the global scope.
 *
 * @param {number} width  - Texture width in pixel
 * @param {number} height - Texture height in pixel
 *
 * @property {Canvas} canvas - HTML canvas element
 * @property {Canvas2DContext} ctx - canvas's context 2D
 * @property {string[]} palette - Texture's color palette
 * @property {Texture}  tilesheet - Texture's tilesheet
 */
function Texture(width, height) {
	this.width   = width;
	this.height  = height;
	this.camera  = { x: 0, y: 0 }; // camera offset
	this._cursor = { i: 0, j: 0 }; // text cursor
	this._paper  = 0; // paper color index
	this._pen    = 1; // pen color index

	this._init();
}
module.exports = Texture;
Texture.prototype._isTexture = true;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// FIXME better have all these private

// default palette
Texture.prototype.palette = [
	{ string: '#000000', r: 0, g: 0, b: 0 }, // TODO: use ColorRGBB component
	{ string: '#FFFFFF', r: 1, g: 1, b: 1 }
];

// if tilesheet is a sprite, these stores the sprite offset:
Texture.prototype.ox = 0;
Texture.prototype.oy = 0;

Texture.setTileSize = function () { /* virtual */ }

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set texture palette. The charset sheet is recreated when this method is called.
 * @param {string[]} palette - palette definition. This is an array of css formated colors.
 *                    At initialisation it is `['#000000', '#FFFFFF']` and is it is redifined by
 *                    the default palette in the settings file.
 */
Texture.prototype.setPalette = function (palette) {
	Texture.prototype.palette = palette;
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
		if (!tilesheet.texture) tilesheet._prepareTexture();
		target.tilesheet = tilesheet.texture.canvas;

	} else if (tilesheet._isTexture) {
		// Texture
		target.tilesheet = tilesheet.canvas;

	} else if (tilesheet instanceof Image) {
		// Image
		target.tilesheet = tilesheet;

	} else if (tilesheet instanceof HTMLCanvasElement) {
		// Canvas
		target.tilesheet = tilesheet;

	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set default tilesheet for all Textures
 * @param {Image | Texture | Map} tilesheet - tilesheet to use
 */
Texture.prototype.setGlobalTilesheet = function (tilesheet) {
	setTilesheet(Texture.prototype, tilesheet);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set tilesheet to be used to draw tile in this Texture.
 * By default, it is set to null and fallback to default tilesheet which is `assets/tilesheet`
 * (the default tilesheet can also be changed with the global method `tilesheet`).
 * The tilesheet can be anything drawable in Pixelbox: an image, canvas, another Texture or a Map.
 * The texture use a direct reference to the tilesheet root element.
 *
 * @param {Image | Texture} tilesheet - tilesheet to use
 *
 * @returns {Texture} the texture itself
 */
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
