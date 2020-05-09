var Texture  = require('../Texture');
var pixelbox = require('..');

var TILE_WIDTH  = 8;
var TILE_HEIGHT = 8;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @class Tile
 *
 * @property {number} x - x position in tilemap
 * @property {number} y - y position in tilemap
 * @property {number} sprite - sprite index (number between 0 and 255)
 * @property {boolean} flipH - flip horizontal
 * @property {boolean} flipV - flip vertical
 * @property {boolean} flipR - flip rotation
 * @property {boolean} flagA - user purpose flag A
 * @property {boolean} flagB - user purpose flag B
 */
function Tile(x, y, sprite, flipH, flipV, flipR, flagA, flagB) {
	this.x      = ~~x;
	this.y      = ~~y;
	this.sprite = ~~sprite;
	this.flipH  = !!flipH;
	this.flipV  = !!flipV;
	this.flipR  = !!flipR;
	this.flagA  = !!flagA;
	this.flagB  = !!flagB;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @class TileMap
 *  @author Cedric Stoquer
 *  @classdesc
 * A tilemap is a 2 dimensional array of tiles (`Tile`).
 * This can be used to reder a level made of tiles, or just to store game data.
 *
 * A tilemap can be stored as an asset and is usually much smaller than a image because
 * the only data saved are tile ids (a number between 0 and 255) plus few flags
 * for how to render the tile (flipping horizontally, vertically, and 90 degree rotation).
 *
 * For its rendering, a tilemap use one tilesheet, which is an Image containing 256
 * tiles organized in a 16 x 16 grid (the size of the tilesheet depend of the tile
 * size you set for your game). The tilesheet can be changed, and the whole map will
 * be redrawn.
 *
 * You can create maps from your game code; But usually, you will be using Pixelbox's
 * tools to create and manage your maps as game assets. A map can then be retrived
 * by its name with Pixelbox's `getMap` function. The map can then be drawn on screen
 * (or in another Texture), modified, copied, pasted, resized, etc.
 *
 * When stored in assets, the map is compressed to Pixelbox format to reduce file size.
 *
 * @see Tile
 *
 * @property (string) name   - map name
 * @property {number} width  - map width (in tiles)
 * @property {number} height - map height (in tiles)
 * @property {Tile[][]} items - 2D array of map items
 * @property {Texture} texture - generated texture
 */
function TileMap(width, height) {
	this._name  = '';
	this.width  = 0;
	this.height = 0;
	this.items  = [];
	this.texture = null;
	this.tilesheet = null;
	this._tilesheetPath = '';

	if (width && height) this._init(width, height);
}
module.exports = TileMap;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// static properties and methods
TileMap.prototype._isTileMap = true;

var _mapById = {};
var _maps    = [];
TileMap.getMap = function (id) {
	if (typeof id === 'string') return _mapById[id];
	if (typeof id === 'number') return _maps[id];
	console.error('Map does not exist', id);
	return null;
};

TileMap._checkBankFormat = function (bank) {
	if (!bank) {
		return { _type: 'maps', maps: [] };
	}

	// DEPRECATED check for old maps format
	if (Array.isArray(bank)) {
		return { _type: 'maps', maps: bank };
	}

	if (bank._type !== 'maps') {
		console.warn('Map bank format incorrect');
		return { _type: 'maps', maps: [] };
	}

	return bank;
};

TileMap.loadBank = function (bank) {
	bank = TileMap._checkBankFormat(bank);

	// reset current data
	_mapById = {};
	_maps    = [];

	// load and construct all maps in bank
	var maps = bank.maps || [];
	for (var i = 0; i < maps.length; i++) {
		_maps.push(new TileMap().load(maps[i]));
	}
};

TileMap.setTileSize = function (width, height) {
	TILE_WIDTH  = ~~width;
	TILE_HEIGHT = ~~height;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Object.defineProperty(TileMap.prototype, 'name', {
	get: function () { return this._name; },
	set: function (name) {
		if (this._name && _mapById[this._name] && _mapById[this._name] === this) delete _mapById[this._name];
		this._name = name;
		if (name && !_mapById[name]) _mapById[name] = this;
	}
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileMap.prototype._init = function (width, height) {
	this.width  = width;
	this.height = height;
	this.items  = [];
	for (var x = 0; x < width; x++) {
		this.items.push([]);
		for (var y = 0; y < height; y++) {
			this.items[x][y] = null;
		}
	}
	if (this.texture) this.texture.resize(width * TILE_WIDTH, height * TILE_HEIGHT);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Resize map
 * @param {number} width - map width
 * @param {number} heigth - map heigth
 */
TileMap.prototype.resize = function (width, height) {
	var items = this.items;
	var w = Math.min(this.width,  width);
	var h = Math.min(this.height, height);
	this._init(width, height);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		this.items[x][y] = items[x][y];
	}}
	this.redraw();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set a tile in the map, the texture is automatically updated with the tile
 * @param {number} x - x coordinate of the tile to add
 * @param {number} y - y coordinate of the tile to add
 * @param {number} sprite - sprite id of the tile (integer between 0 and 255)
 * @param {boolean} [flipH] - flip horizontal flag value
 * @param {boolean} [flipV] - flip vertical flag value
 * @param {boolean} [flipR] - flip rotation flag value
 * @param {boolean} [flagA] - user pupose flag A value
 * @param {boolean} [flagB] - user pupose flag Bvalue
 */
TileMap.prototype.set = function (x, y, sprite, flipH, flipV, flipR, flagA, flagB) {
	if (sprite === null || sprite === undefined) return this.remove(x, y);
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	var item = this.items[x][y] = new Tile(x, y, sprite, flipH, flipV, flipR, flagA, flagB);
	if (this.texture) {
		this.texture.ctx.clearRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
		this.texture.sprite(item.sprite, item.x * TILE_WIDTH, item.y * TILE_HEIGHT, item.flipH, item.flipV, item.flipR);
	}
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Remove a tile from the map by setting the item at the specified coordinate to null.
 * The internal texture is automatically updated.
 * @param {number} x - x coordinate of the tile to remove
 * @param {number} y - y coordinate of the tile to remove
 * @returns {Map} the map itself
 */
TileMap.prototype.remove = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	this.items[x][y] = null;
	if (this.texture) this.texture.ctx.clearRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Retrieve the map item at the specified coordinate.
 * @param {number} x - x coordinate of the tile to remove
 * @param {number} y - y coordinate of the tile to remove
 * @returns {Tile | null} tile value at specified coordinates
 */
TileMap.prototype.get = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
	return this.items[x][y];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Redraw the texture.
 * @returns {Map} the map itself
 */
TileMap.prototype.redraw = function () {
	if (!this.texture) return this;
	this.texture.clear();
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		var i = this.items[x][y];
		if (i) this.texture.sprite(i.sprite, i.x * TILE_WIDTH, i.y * TILE_HEIGHT, i.flipH, i.flipV, i.flipR);
	}}
	return this;
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileMap.prototype._prepareTexture = function () {
	this.texture = new Texture(this.width * TILE_WIDTH, this.height * TILE_HEIGHT);
	this.texture.setTilesheet(this.tilesheet);
	this.redraw();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Release texture memory
 */
TileMap.prototype.release = function () {
	this.texture = null;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw map on screen at specified position.
 * Alternatively, a map can be drawn from `Texture.draw(map)`
 * @param {number} x - x coordinate in pixels
 * @param {number} y - y coordinate in pixels
 */
TileMap.prototype.draw = function (x, y) {
	if (!this.texture) this._prepareTexture();
	draw(this.texture, x, y);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set map tilesheet. The map is redrawn with the new tilesheet.
 * @param {Texture | Image | Sprite | null} tilesheet - the new tilesheet for the map.
 *                      If null, use the default tilesheet (assets/tilesheet).
 * @returns {Map} the map itself
 */
TileMap.prototype.setTilesheet = function (tilesheet) {
	this.tilesheet = tilesheet;
	this._tilesheetPath = tilesheet && tilesheet.path || '';
	if (!this.texture) return this;
	this.texture.setTilesheet(tilesheet);
	this.redraw();
	return this
};

TileMap.prototype._setTilesheetPath = function (path) {
	this._tilesheetPath = path || '';
	if (!path) return this.setTilesheet();
	var pathes = path.split('/');
	var node = pixelbox.assets || {};
	for (var i = 0; i < pathes.length; i++) {
		node = node[pathes[i]];
		if (!node) return console.warn('Could not find tilesheet', path);
	}
	this.setTilesheet(node);
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
		var str = '';
		var count = 0;
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
		var arr = [];
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
/** Serialize the Map to a JSON object.
 * @private
 * @returns {object} Pixelbox formated map data
 */
TileMap.prototype.save = function () {
	var w = this.width;
	var h = this.height;
	var arr = new Array(w * h);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var item = this.items[x][y];
		arr[x + y * w] = item
			? item.sprite
			  + (item.flipH << 8)
				+ (item.flipV << 9)
				+ (item.flipR << 10)
				+ (item.flagA << 11)
				+ (item.flagB << 12)
			: null;
	}}

	var obj = { w: w, h: h, name: this.name, sheet: this._tilesheetPath || '', data: encode(arr) };
	return obj;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Deserialize a JSON object and set the data to this map.
 * @private
 * @param {object} obj - Pixelbox formated map data
 * @returns {Map} the map itself
 */
TileMap.prototype.load = function (obj) {
	this.texture = null;
	var w = obj.w;
	var h = obj.h;
	this._init(w, h);
	this.name = obj.name || '';
	this._setTilesheetPath(obj.sheet);
	var arr = decode(obj.data);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var d = arr[x + y * w];
		if (d === null) continue;
		var tile   =  d & 255;
		var flipH  = (d >> 8 ) & 1;
		var flipV  = (d >> 9 ) & 1;
		var flipR  = (d >> 10) & 1;
		var flagA  = (d >> 11) & 1;
		var flagB  = (d >> 12) & 1;
		this.set(x, y, tile, flipH, flipV, flipR, flagA, flagB);
	}}

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Copy this map to a new map. Tile are duplicated.
 * @param {number} [x] - x offset for the copy
 * @param {number} [y] - y offset for the copy
 * @param {number} [w] - width cropping (width of the copy)
 * @param {number} [h] - height cropping (height of the copy)
 * @returns {Map} the map copy
 */
TileMap.prototype.copy = function (x, y, w, h) {
	x = x || 0;
	y = y || 0;
	if (w === undefined || w === null) w = this.width;
	if (h === undefined || h === null) h = this.height;
	var map = new TileMap(w, h);
	map.paste(this, -x, -y);
	return map;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Paste another map data in this map.
 * @param {Map} map - map to be pasted
 * @param {number} [x] - x offset of where to paste map
 * @param {number} [y] - y offset of where to paste map
 * @param {boolean} [merge] - if set, then null tiles will not overwrite current map tile.
 * @returns {Map} the map itself
 */
TileMap.prototype.paste = function (map, x, y, merge) {
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
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Clear the whole map content by setting all its items to null
 * @returns {Map} the map itself
 */
TileMap.prototype.clear = function () {
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] = null;
	}}
	if (this.texture) this.texture.clear();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Find specific tiles in the map
 * @param {number} [sprite] - sprite id of the tile to find.
 *                            Set this parameter to null to find empty tiles.
 * @param {boolean} [flagA] - filter with flag A value
 * @param {boolean} [flagB] - filter with flag B value
 */
TileMap.prototype.find = function (sprite, flagA, flagB) {
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

TileMap.prototype._findNull = function () {
	var result = [];
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		if (this.items[x][y] === null) result.push({ x: x, y: y });
	}}
	return result;
};
