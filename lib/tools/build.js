(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function EventEmitter() {
	this._events = {};
};

module.exports = EventEmitter;

EventEmitter.listenerCount = function (emitter, evt) {
	var handlers = emitter._events[evt];
	return handlers ? handlers.length : 0;
};

EventEmitter.prototype.on = function (evt, fn) {
	if (typeof fn !== 'function') throw new TypeError('Tried to register non-function as event handler for event: ' + evt);

	// we emit first, because if evt is "newListener" it would go recursive
	this.emit('newListener', evt, fn);

	var allHandlers = this._events;
	var evtHandlers = allHandlers[evt];
	if (evtHandlers === undefined) {
		// first event handler for this event type
		allHandlers[evt] = [fn];
	} else {
		evtHandlers.push(fn);
	}

	return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function (evt, fn) {
	if (!fn.once) {
		fn.once = 1;
	} else {
		fn.once += 1;
	}

	return this.on(evt, fn);
};

EventEmitter.prototype.setMaxListeners = function () {
	console.warn('Method setMaxListeners not supported, there is no limit to the number of listeners');
};

EventEmitter.prototype.removeListener = function (evt, handler) {
	// like node.js, we only remove a single listener at a time, even if it occurs multiple times

	var handlers = this._events[evt];
	if (handlers !== undefined) {
		var index = handlers.indexOf(handler);
		if (index !== -1) {
			handlers.splice(index, 1);

			if (handlers.length === 0) delete this._events[evt];

			this.emit('removeListener', evt, handler);
		}
	}
	return this;
};

EventEmitter.prototype.removeAllListeners = function (evt) {
	if (evt) {
		delete this._events[evt];
	} else {
		this._events = {};
	}
	return this;
};

EventEmitter.prototype.hasListeners = function (evt) {
	return this._events[evt] !== undefined;
};

EventEmitter.prototype.listeners = function (evt) {
	var handlers = this._events[evt];
	if (handlers !== undefined) return handlers.slice();

	return [];
};

EventEmitter.prototype.emit = function (evt) {
	var handlers = this._events[evt];
	if (handlers === undefined) return false;

	// copy handlers into a new array, so that handler removal doesn't affect array length
	handlers = handlers.slice();

	var hadListener = false;

	// copy all arguments, but skip the first (the event name)
	var args = [];
	for (var i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	for (var i = 0, len = handlers.length; i < len; i++) {
		var handler = handlers[i];

		handler.apply(this, args);
		hadListener = true;

		if (handler.once) {
			if (handler.once > 1) {
				handler.once--;
			} else {
				delete handler.once;
			}

			this.removeListener(evt, handler);
		}
	}

	return hadListener;
};
},{}],2:[function(require,module,exports){
var Texture  = require('../Texture');

var TILE_WIDTH  = settings.tileSize[0];
var TILE_HEIGHT = settings.tileSize[1];

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @class Tile
 *
 * @property {number} x - x position in tilemap
 * @property {number} y - y position in tilemap
 * @property {number} tile - tile index (number between 0 and 255)
 * @property {boolean} flipH - flip horizontal
 * @property {boolean} flipV - flip vertical
 * @property {boolean} flipR - flip rotation
 * @property {boolean} flagA - user purpose flag A
 * @property {boolean} flagB - user purpose flag B
 */
function Tile(x, y, tile, flipH, flipV, flipR, flagA, flagB) {
	this.x      = ~~x;
	this.y      = ~~y;
	this.tile   = ~~tile;
	this.flipH  = !!flipH;
	this.flipV  = !!flipV;
	this.flipR  = !!flipR;
	this.flagA  = !!flagA;
	this.flagB  = !!flagB;
}

Tile.prototype.draw = function (texture) {
	texture.sprite(this.tile, this.x * TILE_WIDTH, this.y * TILE_HEIGHT, this.flipH, this.flipV, this.flipR);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @class Map
 *  @author Cedric Stoquer
 *  @classdesc
 * A map is a 2 dimensional array of tiles (`Tile`). 
 * This can be used to reder a level made of tiles, or just to store game data.
 *
 * A map can be stored as an asset and is usually much smaller than a image because 
 * the only data saved are tile ids (a number between 0 and 255) plus few flags 
 * for how to render the tile (flipping horizontally, vertically, and 90 degree rotation).
 *
 * For its rendering, a map use one tilesheet, which is an Image containing 256
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
function Map(width, height) {
	this._name  = '';
	this.width  = 0;
	this.height = 0;
	this.items  = [];
	this.texture = new Texture(width * TILE_WIDTH, height * TILE_HEIGHT);
	this._tilesheetPath = '';

	if (width && height) this._init(width, height);
}
module.exports = Map;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// static properties and methods
Map.prototype._isMap = true;

var _mapById = {};
var _maps    = [];
Map.getMap = function (id) {
	if (typeof id === 'string') return _mapById[id];
	if (typeof id === 'number') return _maps[id];
	console.error('Map does not exist', id);
	return null;
};

// DEPRECATED
Map._checkBankFormat = function (bank) {
	if (!bank) {
		console.error('No map bank');
		return { _type: 'maps', maps: [] };
	}

	// check for old maps format
	if (Array.isArray(bank)) {
		return { _type: 'maps', maps: bank };
	}

	if (bank._type !== 'maps') {
		console.error('Map bank format incorrect');
		return { _type: 'maps', maps: [] };
	}

	return bank;
};

Map.loadBank = function (bank) {
	bank = Map._checkBankFormat(bank);

	// reset current data
	var _mapById = {};
	var _maps    = [];

	// load and construct all maps in bank
	var maps = bank.maps || [];
	for (var i = 0; i < maps.length; i++) {
		_maps.push(new Map().load(maps[i]));
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Object.defineProperty(Map.prototype, 'name', {
	get: function () { return this._name; },
	set: function (name) {
		if (this._name && _mapById[this._name] && _mapById[this._name] === this) delete _mapById[this._name];
		this._name = name;
		if (name && !_mapById[name]) _mapById[name] = this;
	}
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Map.prototype._init = function (width, height) {
	this.texture.resize(width * TILE_WIDTH, height * TILE_HEIGHT);
	this.width  = width;
	this.height = height;
	this.items  = [];
	for (var x = 0; x < width; x++) {
		this.items.push([]);
		for (var y = 0; y < height; y++) {
			this.items[x][y] = null;
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Sesize map
 * @param {number} width - map width
 * @param {number} heigth - map heigth
 */
Map.prototype.resize = function (width, height) {
	var items = this.items;
	var w = Math.min(this.width,  width);
	var h = Math.min(this.height, height);
	this.texture.resize(width * TILE_WIDTH, height * TILE_HEIGHT);
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
 * @param {number} tile - tile index of the tile
 * @param {boolean} [flipH] - flip horizontal flag value
 * @param {boolean} [flipV] - flip vertical flag value
 * @param {boolean} [flipR] - flip rotation flag value
 * @param {boolean} [flagA] - user pupose flag A value
 * @param {boolean} [flagB] - user pupose flag Bvalue
 */
Map.prototype.set = function (x, y, tile, flipH, flipV, flipR, flagA, flagB) {
	if (tile === null || tile === undefined) return this.remove(x, y);
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	var item = this.items[x][y] = new Tile(x, y, tile, flipH, flipV, flipR, flagA, flagB);
	this.texture.ctx.clearRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
	item.draw(this.texture);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Remove a tile from the map by setting the item at the specified coordinate to null.
 * The internal texture is automatically updated.
 * @param {number} x - x coordinate of the tile to remove
 * @param {number} y - y coordinate of the tile to remove
 * @returns {Map} the map itself
 */
Map.prototype.remove = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	this.items[x][y] = null;
	this.texture.ctx.clearRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Retrieve the map item at the specified coordinate.
 * @param {number} x - x coordinate of the tile to remove
 * @param {number} y - y coordinate of the tile to remove
 * @returns {Tile | null} tile value at specified coordinates
 */
Map.prototype.get = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
	return this.items[x][y];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Redraw the texture.
 * @returns {Map} the map itself
 */
Map.prototype.redraw = function () {
	this.texture.clear();
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] && this.items[x][y].draw(this.texture);
	}}
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Draw map on screen at specified position.
 * Alternatively, a map can be drawn from `Texture.draw(map)`
 * @param {number} x - x coordinate in pixels
 * @param {number} y - y coordinate in pixels
 */
Map.prototype.draw = function (x, y) {
	draw(this.texture, x, y);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set map tilesheet. The map is redrawn with the new tilesheet.
 * @param {Texture | Image | null} tilesheet - the new tilesheet for the map. 
 *                      If null, use the default tilesheet (assets/tilesheet).
 * @returns {Map} the map itself
 */
Map.prototype.setTilesheet = function (tilesheet) {
	this._tilesheetPath = tilesheet && tilesheet.path || '';
	this.texture.setTilesheet(tilesheet);
	this.redraw();
	return this;
};

Map.prototype._setTilesheetPath = function (path) {
	this._tilesheetPath = path || '';
	if (!path) return this.setTilesheet();
	path = path.split('/');
	fileId = path.pop();
	var dir = assets;
	for (var i = 0; i < path.length; i++) {
		dir = dir[path[i]];
		if (!dir) return console.warn('Could not find tilesheet', path); // failed to find tilesheet.
	}
	var img = dir[fileId];
	if (img && img instanceof Image) this.setTilesheet(img);
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
		str = '';
		count = 0;
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
		arr = [];
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
Map.prototype.save = function () {
	var w = this.width;
	var h = this.height;
	var arr = new Array(w * h);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var item = this.items[x][y];
		arr[x + y * w] = item ? item.tile + (item.flipH << 8) + (item.flipV << 9) + (item.flipR << 10) + (item.flagA << 11)  + (item.flagB << 12) : null;
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
Map.prototype.load = function (obj) {
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

	this.redraw();
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
Map.prototype.copy = function (x, y, w, h) {
	x = x || 0;
	y = y || 0;
	if (w === undefined || w === null) w = this.width; 
	if (h === undefined || h === null) h = this.height;
	var map = new Map(w, h);
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
Map.prototype.paste = function (map, x, y, merge) {
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
			this.set(i + x, j + y, item.tile, item.flipH, item.flipV, item.flipR, item.flagA, item.flagB);
		}
	}
	this.redraw();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Clear the whole map content by setting all its items to null
 * @returns {Map} the map itself
 */
Map.prototype.clear = function () {
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] = null;
	}}
	this.texture.clear();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Find specific tiles in the map
 * @param {number} [tile] - tile id of the tile to find.
 *                            Set this parameter to null to find empty tiles.
 * @param {boolean} [flagA] - filter with flag A value
 * @param {boolean} [flagB] - filter with flag B value
 */
Map.prototype.find = function (tile, flagA, flagB) {
	if (tile === null) return this._findNull();
	if (flagA === undefined) flagA = null;
	if (flagB === undefined) flagB = null;
	var result = [];
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		var item = this.items[x][y];
		if (!item) continue;
		var isSameFlagA = flagA === null || item.flagA === flagA;
		var isSameFlagB = flagB === null || item.flagB === flagB;
		if (item.tile === tile && isSameFlagA && isSameFlagB) result.push(item);
	}}
	return result;
};

Map.prototype._findNull = function () {
	var result = [];
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		if (this.items[x][y] === null) result.push({ x: x, y: y });
	}}
	return result;
};

},{"../Texture":3}],3:[function(require,module,exports){
var TILE_WIDTH  = settings.tileSize[0];
var TILE_HEIGHT = settings.tileSize[1];
var TILES_PER_LINE = 16; // (in a tilesheet)
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
 * @property {Texture}  tilesheet - Texture's tilesheet
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
Texture.prototype.tilesheet = new Texture(TILE_WIDTH * TILES_PER_LINE, TILE_HEIGHT * TILES_PER_LINE);
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
/** Set default tilesheet for all Textures
 * @param {Image | Texture | Map} tilesheet - tilesheet to use
 */
Texture.prototype.setGlobalTilesheet = function (tilesheet) {
	Texture.prototype.tilesheet.clear().draw(tilesheet, 0, 0);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set tilesheet to be used to draw sprite in this Texture.
 * By default, it is set to null and fallback to default tilesheet which is `assets/tilesheet`
 * (the default tilesheet can also be changed with the global method `tilesheet`).
 * The tilesheet can be anything drawable in Pixelbox: an image, another Texture or a Map.
 * The texture makes an internal copy of the tilesheet.
 *
 * @param {Image | Texture | Map} tilesheet - tilesheet to use
 * @returns {Texture} the texture itself
 */
Texture.prototype.setTilesheet = function (tilesheet) {
	if (!tilesheet) {
		delete this.tilesheet;
		return;
	} 
	if (this.tilesheet === Texture.prototype.tilesheet) {
		this.tilesheet = new Texture(TILE_WIDTH * TILES_PER_LINE, TILE_HEIGHT * TILES_PER_LINE);
	}
	this.tilesheet.clear().draw(tilesheet, 0, 0);
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
/** Draw a tile in Texture using the current tilesheet.
 * @param {number} tile - tile index (number between 0 and 255)
 * @param {number} [x] - x position in pixels
 * @param {number} [y] - y position in pixels
 * @param {boolean} [flipH] - if set, the tile is horizontally flipped
 * @param {boolean} [flipV] - if set, the tile is vertically flipped
 * @param {boolean} [flipR] - if set, the tile rotated by 90 degree
 * @returns {Texture} the texture itself
 */
Texture.prototype.sprite = function (tile, x, y, flipH, flipV, flipR) {
	var sx = tile % TILES_PER_LINE;
	var sy = ~~(tile / TILES_PER_LINE);
	var ctx = this.ctx;

	// add camera and round to the pixel
	x = x || 0;
	y = y || 0;
	x = ~~Math.round(x - this.camera.x);
	y = ~~Math.round(y - this.camera.y);

	if (!flipH && !flipV && !flipR) {
		ctx.drawImage(this.tilesheet.canvas, sx * TILE_WIDTH, sy * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT, x, y, TILE_WIDTH, TILE_HEIGHT);
		return this;
	}
	ctx.save();

	if (flipH) {
		ctx.scale(-1, 1);
		x *= -1;
		x -= TILE_WIDTH;
	}

	if (flipV) {
		ctx.scale(1, -1);
		y *= -1
		y -= TILE_HEIGHT;
	}

	if (flipR) {
		ctx.translate(x + TILE_HEIGHT, y);
		ctx.rotate(PI2);
	} else {
		ctx.translate(x, y);
	}

	ctx.drawImage(this.tilesheet.canvas, sx * TILE_WIDTH, sy * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT, 0, 0, TILE_WIDTH, TILE_HEIGHT);
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


},{}],4:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @module assetLoader
 * @desc   Loading functions helpers
 *
 * @author Cedric Stoquer
 */


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.loadJson
 * @desc     load a json file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadJson(path, cb) {
	var xobj = new XMLHttpRequest();
	xobj.onreadystatechange = function () {
		if (~~xobj.readyState !== 4) return;
		if (~~xobj.status !== 200) return cb('xhr:' + xobj.status);
		return cb && cb(null, JSON.parse(xobj.response));
	};
	xobj.open('GET', path, true);
	xobj.send();
}
exports.loadJson = loadJson;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.sendRequest
 * @desc     send some data to server
 *
 * @param {Object}   data - data to send to the server
 * @param {Function} cb   - asynchronous callback function
 */
function sendRequest(data, cb) {
	var xobj = new XMLHttpRequest();
	xobj.open('POST', 'req', true);
	xobj.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	xobj.onreadystatechange = function () {
		if (~~xobj.readyState !== 4) return;
		if (~~xobj.status !== 200) return cb && cb('xhr:' + xobj.status);
		var res = JSON.parse(xobj.response);
		return cb && cb(res.error, res.result);
	};
	xobj.send(JSON.stringify(data));
}
exports.sendRequest = sendRequest;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function  module:loader.loadImage
 * @desc      load an image file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadImage(path, cb) {
	var img = new Image();
	// TODO: remove listeners when load / error
	img.onload  = function () {
		this.onload  = null;
		this.onerror = null;
		cb && cb(null, this);
	};
	img.onerror = function () {
		this.onload  = null;
		this.onerror = null;
		cb && cb('img:' + path);
	};
	img.src = path;
}
exports.loadImage = loadImage;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.loadSound
 * @desc     load an image file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadSound(path, cb) {
	var snd = new Audio();
	snd.preload = true;
	snd.loop = false;
	
	function onSoundLoad() {
		cb && cb(null, snd);
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	function onSoundError() {
		cb && cb('snd:load');
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	snd.addEventListener('canplaythrough', onSoundLoad);
	snd.addEventListener('error', onSoundError);
	snd.src = path;
	snd.load();
}
exports.loadSound = loadSound;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @function module:loader.preloadStaticAssets
 *
 * @desc   Preload all static assets of the game.
 *         The function first ask the server for the asset list.
 *         Server respond with an object containing the list of images
 *         to load and all data that are put in the www/asset folder.
 *         At this step, if request fail, function send an error.
 *         The function then proceed the loading of image assets. 
 *         If an image loading fail, the loading continue, and loading
 *         status is set to 1 (an image load fail).
 *         Images are load by 5 in parallel.
 *
 *         Function end and wil return an object that mix all data and 
 *         all assets so that it will have the same structure as the 
 *         'assets' folder.
 *
 *
 *         Assets list and data are automaticaly generated by server
 *         Just drop images and json files in the www/asset/ folder
 *         and the server will take care of it !
 *                 
 *
 * @param {Function} cb         - asynchronous callback function to 
 *                                call when all is preloaded
 *
 * @param {Function} onEachLoad - optional callback function called
 *                                every time one file is loaded
 *                                (for loading progress purpose)
 *                          
 */

function preloadStaticAssets(cb, onEachLoad) {
	loadJson('build/data.json', function onAssetListLoaded(error, assetList) {
		if (error) return cb(error);
		var data     = assetList.dat;
		var imgCount = assetList.img.length;
		var count    = imgCount + assetList.snd.length;
		var root     = assetList.root;
		var load     = 0;
		var done     = 0;
		function storeAsset(path, obj) {
			var splitted = path.split('/');
			var filename = splitted.pop();
			var id = filename.split('.');
			id.pop();
			id = id.join('.');
			var container = data;
			for (var i = 0, len = splitted.length; i < len; i++) {
				container = container[splitted[i]];
			}
			container[id] = obj;
			splitted.push(id);
			obj.name = id;
			obj.path = splitted.join('/');
		}
		function loadAssets() {
			var current = load + done;
			var percent = current / count;
			onEachLoad && onEachLoad(load, current, count, percent);
			var path;
			var loadFunc;
			if (current < imgCount) {
				path = assetList.img[current];
				loadFunc = loadImage;
			} else {
				path = assetList.snd[current - imgCount];
				loadFunc = loadSound;
			}
			done += 1;
			loadFunc(root + path, function onAssetLoaded(error, img) {
				if (!error) storeAsset(path, img);
				load += 1;
				done -= 1;
				if (load + done < count) loadAssets()
				else if (done === 0) cb(null, data);
			});
		}
		// loading assets in parallel, with a limit of 5 parallel downloads.
		if (count === 0) return cb(null, data);
		var parallel = Math.min(5, count - 1);
		for (var j = 0; j <= parallel; j++) loadAssets();
	});
}
exports.preloadStaticAssets = preloadStaticAssets;

},{}],5:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @module domUtils
 *  @desc dom utilities
 *  @author Cedric Stoquer
 */
var DOCUMENT_BODY = document.getElementsByTagName('body')[0];

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.createDom = function (type, className, parent) {
	parent = parent || DOCUMENT_BODY;
	var dom = document.createElement(type);
	parent.appendChild(dom);
	if (className) dom.className = className;
	return dom;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.createDiv = function (className, parent) {
	return exports.createDom('div', className, parent);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.removeDom = function (dom, parent) {
	parent = parent || DOCUMENT_BODY;
	parent.removeChild(dom);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.makeButton = function (dom, onClic) {
	dom.addEventListener('mousedown', function (e) {
		e.stopPropagation();
		e.preventDefault();
		onClic(e, dom);
	});
	return dom;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function startDrag(dom, e) {
	var d = document;

	rect = dom.getBoundingClientRect();

	var startX = e.clientX - rect.left;
	var startY = e.clientY - rect.top;

	function dragMove(e) {
		e.preventDefault();
		dom.style.left = (e.clientX - startX) + 'px';
		dom.style.top  = (e.clientY - startY) + 'px';
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.makeDragable = function (dom, target) {
	target = target || dom;
	dom.addEventListener('mousedown', function (e) {
		e.stopPropagation();
		e.preventDefault();
		startDrag(target, e);
	});
	return dom;
};

},{}],6:[function(require,module,exports){
module.exports = function inherits(Child, Parent) {
	Child.prototype = Object.create(Parent.prototype, {
		constructor: {
			value:        Child,
			enumerable:   false,
			writable:     true,
			configurable: true
		}
	});
};
},{}],7:[function(require,module,exports){
var FolderPanel    = require('./FolderPanel');
var addTooltip     = require('./tooltip');
var dragManager    = require('./dragManager');
var helper         = require('./helper');
var resizeHandle   = require('./resizeHandle');
var FolderListItem = require('./FolderListItem');
var ListItem       = require('./ListItem');
var assetLoader    = require('../../components/assetLoader');
var Map            = require('../../components/Map');
var inherits       = require('../../components/inherits');
var domUtils       = require('../../components/domUtils');
var toolbox        = require('./toolbox');

var createDom   = domUtils.createDom;
var createDiv   = domUtils.createDiv;
var removeDom   = domUtils.removeDom;
var button      = domUtils.makeButton;

var ITEM_IMAGE_OPTIONS = { type: 'imageFile', icon: 'iconImage' };

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

function getMapFolder(fullName, rootDom) {
	var path = fullName.split('/');
	var fileName = path.pop();
	if (path.length === 0) return rootDom;

	var folderName = path[path.length - 1];

	var folderDom = rootDom;
	for (var i = 0; i < path.length; i++) {
		var folderName = path[i];
		var folderDom = folderDom.getSubFolder(folderName);
	}

	return folderDom;
}


//████████████████████████████████████████████████████████████
//█▄░░█░░▄███████████████████████▄▄░▄▄██▀█████████████████████
//██░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀██████████░███▄░▄▄▄██▀▄▄▄▄▀█▄░▀▄▀▀▄▀█
//██░█▄█░██▀▄▄▄▄░███░███░██████████░████░█████░▄▄▄▄▄██░██░██░█
//█▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄████████▀▀░▀▀██▄▀▀▀▄█▄▀▀▀▀▀█▀░▀█░▀█░█
//█████████████████▀░▀████████████████████████████████████████

function MapListItem(file, index, map, rootDom) {
	var t = this;

	var parent  = getMapFolder(map.name, rootDom);
	this.file   = file;
	this.bank   = window.assets[file]; // TODO
	this.map    = map;
	this.index  = index;
	this.parent = parent;
	this.path   = ''; // where the map is displayed in the hierarchy
	this.name   = ''; // the name as it is displayed (map's name without path)

	// dom elements
	this.dom     = createDiv('mapListItem', parent.content);
	this.idxDom  = createDiv('mapListItemIndex', this.dom);
	this.nameDom = createDiv('mapListItemName',  this.dom);
	var delBtn   = createDiv('mapListItemCloseButton', this.dom);

	// load map button
	button(this.dom, function onLoadButtonTap() {
		var mapEditor = toolbox.mapEditor;
		if (mapEditor.file === t.file && mapEditor.mapId === t.index) return;
		mapEditor.loadMap(t);
	});

	// delete map button
	addTooltip(delBtn, 'Delete this map');
	button(delBtn, function onDelButtonTap() {
		t.panel.deleteMapItem(t);
	});

	// drag & drop handle
	button(this.idxDom, function onDragButtonTap(e) {
		var dummy = document.createElement('div');
		dummy.className = 'ListItemDragDummy';
		createDiv('ListItemName', dummy).innerText = t.map.name || 'undefined';
		var map = new Map().load(t.map);
		map._referent = t; // HACK
		dragManager.startDrag(e, 'mapFile', map, dummy);
	});

	dragManager.setAsDroppable(this.dom, this);
	
	this.update();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.onDragEnter = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '#F00';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.onDragLeave = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.onDragEnd = function (id, item) {
	this.dom.style.backgroundColor = '';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.drop = function (id, item) {
	if (id !== 'mapFile') return;
	item = item._referent; // HACK

	var sourceFile = item.file;
	var targetFile = this.file;

	var sourceIndex = item.index;
	var targetIndex = this.index;
	targetIndex = helper.clip(targetIndex, 0, window.assets[targetFile].maps.length - 1);

	if (sourceFile === targetFile && sourceIndex === targetIndex) return;
	
	var request = {
		command:     'map.move',
		sourceFile:  sourceFile,
		targetFile:  targetFile,
		sourceIndex: sourceIndex,
		targetIndex: targetIndex
	};

	var t = this;

	assetLoader.sendRequest(request, function onResponse(error) {
		if (error) return alert(error);
		var sourceMap = window.assets[sourceFile].maps;
		var targetMap = window.assets[targetFile].maps;
		targetMap.splice(targetIndex, 0, sourceMap.splice(sourceIndex, 1).pop());
		t.panel.refreshAssetList();
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.setMap = function (index, map) {
	this.index = index;
	this.map = map;
	this.update();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.update = function () {
	this.idxDom.innerText = this.index;

	var fullName = this.map.name.split('/');
	this.name = fullName.pop();
	this.path = fullName.join('/');

	this.nameDom.innerText       = this.name || 'undefined';
	this.nameDom.style.fontStyle = this.name ? '' : 'italic';
	this.nameDom.style.color     = this.name ? '' : '#AAA';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.destroy = function () {
	removeDom(this.dom, this.parent.content);
};


//█████████████████████████████████████████████████████████████████████████████████
//███████████████████████████████████▀██████████████▄░▄████████▄█████████████▀█████
//██▀▄▄▄▄▀██▀▄▄▄▄░██▀▄▄▄▄░██▀▄▄▄▄▀██▄░▄▄▄████████████░███████▄▄░████▀▄▄▄▄░██▄░▄▄▄██
//██▀▄▄▄▄░███▄▄▄▄▀███▄▄▄▄▀██░▄▄▄▄▄███░███████████████░███▀█████░█████▄▄▄▄▀███░█████
//██▄▀▀▀▄░▀█░▀▀▀▀▄██░▀▀▀▀▄██▄▀▀▀▀▀███▄▀▀▀▄██████████▀░▀▀▀░███▀▀░▀▀██░▀▀▀▀▄███▄▀▀▀▄█
//█████████████████████████████████████████████████████████████████████████████████

function AssetListPanel() {
	FolderPanel.call(this, { title: 'assets' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);
	this.mapBanks = {};
	this.children = {};

	// set MapListItem reference
	MapListItem.prototype.panel = this;

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	this.viewW = 165;
	this.viewH = 575;
	this.resizeViewport();

	resizeHandle(this, function onResizeMove(viewW, viewH, diffX, diffY) {
		t.viewW = viewW + diffX;
		t.viewH = viewH + diffY;
		t.resizeViewport();
	});
}
inherits(AssetListPanel, FolderPanel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.resizeViewport = function () {
	this.viewW = ~~Math.max(this.viewW, 165);
	this.viewH = ~~Math.max(this.viewH, 300);
	this.list.style.width  = this.viewW + 'px';
	this.list.style.height = this.viewH + 'px';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.addFileTo = function (fullPath, fileName, obj, parentDom, parent) {
	if (obj instanceof Image) {
		// TODO create item only on unflod
		var listItem = new ListItem(obj, parentDom, ITEM_IMAGE_OPTIONS);
	} else if (obj instanceof Object) {
		switch (obj._type) {
			case 'maps': this.addMapBank(fileName, obj); break;
			default: 
				// it's a folder or unknown json data
				var folder = new FolderListItem(fileName, obj, parentDom);
				parent.children[fileName] = folder;
				for (var key in obj) {
					this.addFileTo(fullPath + '/' + key, key, obj[key], folder.content, folder);
				}
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.addMap = function (fileName, map, index) {
	var mapListDom = this.children[fileName];
	var item = new MapListItem(fileName, index, map, mapListDom);
	this.mapBanks[fileName][index] = item;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** 
 * @param {string} file - full path (from 'asset' folder) to the maps json file 
 * @param {object[]} maps - an array of serialized pixelbox map data
 */
AssetListPanel.prototype.addMapBank = function (fileName, mapBank) {
	var t = this;
	// TODO: test if file exist in children
	var mapList = new FolderListItem(fileName, {}, this.list);
	this.mapBanks[fileName] = [];
	this.children[fileName] = mapList;

	mapList.dom.style.backgroundColor = 'rgb(229, 230, 204)';
	
	var btnNew = addTooltip(createDiv('panelToolButton mapListNewMapBtn', mapList.content), 'Create a new map');
	btnNew.style.backgroundImage = 'url("img/iconNew.png")';
	button(btnNew, function onNewMapButtonPress() { t.createNew(fileName); });

	for (var i = 0; i < mapBank.maps.length; i++) {
		this.addMap(fileName, mapBank.maps[i], i);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.refreshAssetList = function () {
	assets = window.assets;
	var foldConfig = this.saveFoldConfig(this);

	// remove all
	if (this.list) removeDom(this.list, this.content);
	this.list     = createDiv('mapListContent', this.content);
	this.children = {};
	this.mapBanks = {};

	for (var key in assets) {
		this.addFileTo('', key, assets[key], this.list, this);
	}

	// TODO: remove empty folders

	this.restoreFoldConfig(foldConfig);
	this.resizeViewport();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.createNew = function (file) {
	// TODO lock if saving
	var t = this;
	var map = new Map(16, 16);
	var mapId = window.assets[file].maps.length;
	var data = map.save();
	var request = {
		command: 'map.save',
		file:  file,
		mapId: mapId,
		data:  data
	};
	// send request to the server
	assetLoader.sendRequest(request, function onResponse(error) {
		if (error) return alert(error);
		window.assets[file].maps[mapId] = data;
		t.addMap(file, data, mapId);
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.deleteMapItem = function (item) {
	var t = this;
	var mapId = item.index;
	var file  = item.file;
	var request = { command: 'map.delete', file: file, mapId: mapId };
	assetLoader.sendRequest(request, function onResponse(error) {
		if (error) return alert(error);
		item.destroy();
		assets[file].maps.splice(mapId, 1); // TODO: get to file path
		t.mapBanks[file].splice(mapId, 1);
		t.refreshAssetList();
	});
};

module.exports = new AssetListPanel();

},{"../../components/Map":2,"../../components/assetLoader":4,"../../components/domUtils":5,"../../components/inherits":6,"./FolderListItem":10,"./FolderPanel":11,"./ListItem":12,"./dragManager":17,"./helper":19,"./resizeHandle":22,"./toolbox":23,"./tooltip":24}],8:[function(require,module,exports){
module.exports = {
	name: 'default brush',
	description: 'Draw the tile currently selected in tilesheet.\nright-clic to delete tile.',
	select:   null,
	deselect: null,
	start:    null,
	end:      null,
	draw: function (x, y, toolbox, isStart) {
		var tilesheet = toolbox.tilesheet;
		toolbox.mapEditor.map.set(x, y, tilesheet.tile, tilesheet.flipH, tilesheet.flipV, tilesheet.flipR);
	},
	erase: function (x, y, toolbox, isStart) {
		toolbox.mapEditor.map.remove(x, y);
	}
};
},{}],9:[function(require,module,exports){
var toolbox        = require('./toolbox');
var FolderPanel    = require('./FolderPanel');
var addTooltip     = require('./tooltip');
var helper         = require('./helper');
var FolderListItem = require('./FolderListItem');
var resizeHandle   = require('./resizeHandle');
var inherits       = require('../../components/inherits');
var domUtils       = require('../../components/domUtils');

var createDom = domUtils.createDom;
var createDiv = domUtils.createDiv;
var removeDom = domUtils.removeDom;
var button    = domUtils.makeButton;

var DEFAULT_TOOLS = {
	brush: require('./Brush')
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function ToolItem(item, parent, category) {
	var t = this;

	this.item     = item;
	this.category = category;
	this.dom      = createDiv('fileListItem ListItem', parent);
	this.parent   = parent;

	createDiv('ListItemIcon', this.dom);
	createDiv('ListItemName', this.dom).innerText = item.name;

	if (item.description) addTooltip(this.dom, item.description)

	button(this.dom, function (e) {
		t.select();
	});
}

ToolItem.prototype.select = function () {
	// deselect previous tool in the same category
	var selected = CUSTOM_TOOLS[this.category].__selected__;
	selected && selected.deselect && selected.deselect();

	// set list item as selected
	this.dom.style.backgroundColor = '#BBB';
	CUSTOM_TOOLS[this.category].__selected__ = this;

	// actually select the tool
	this.item.select && this.item.select(toolbox, this);
	toolbox[this.category] = this.item;
};

ToolItem.prototype.deselect = function () {
	this.item.deselect && this.item.deselect(toolbox, this);
	this.dom.style.backgroundColor = null;
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function CustomToolsPanel() {
	FolderPanel.call(this, { title: 'custom tools' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);

	for (var category in CUSTOM_TOOLS) {
		var list = new FolderListItem(category, {}, this.list);
		this.children[category] = list;

		var toolCategory = CUSTOM_TOOLS[category];

		// default tool in that category
		var defaultTool = DEFAULT_TOOLS[category];
		var defaultToolItem = null;
		if (defaultTool) {
			defaultToolItem = new ToolItem(defaultTool, list.content, category);
			// defaultToolItem.dom.style.color = '#666';
			defaultToolItem.dom.style.fontStyle = 'italic';
		}

		// custom tools list
		for (var toolId in toolCategory) {
			var item = toolCategory[toolId];
			item.name = item.name || toolId;

			new ToolItem(item, list.content, category);
		}

		defaultToolItem && defaultToolItem.select();
	}
	

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	this.viewW = 165;
	this.viewH = 100;
	this.resizeViewport();

	resizeHandle(this, function onResizeMove(viewW, viewH, diffX, diffY) {
		t.viewW = viewW + diffX;
		t.viewH = viewH + diffY;
		t.resizeViewport();
	});
}
inherits(CustomToolsPanel, FolderPanel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
CustomToolsPanel.prototype.resizeViewport = function () {
	this.viewW = ~~Math.max(this.viewW, 165);
	this.viewH = ~~Math.max(this.viewH, 100);
	this.list.style.width  = this.viewW + 'px';
	this.list.style.height = this.viewH + 'px';
};

module.exports = new CustomToolsPanel();

},{"../../components/domUtils":5,"../../components/inherits":6,"./Brush":8,"./FolderListItem":10,"./FolderPanel":11,"./helper":19,"./resizeHandle":22,"./toolbox":23,"./tooltip":24}],10:[function(require,module,exports){
var domUtils  = require('../../components/domUtils');

var createDom = domUtils.createDom;
var createDiv = domUtils.createDiv;
var button    = domUtils.makeButton;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function FolderListItem(name, item, parent) {
	var t = this;

	this.item     = item;
	this.parent   = parent;
	this.children = {};
	this.isOpened = true;

	this.dom = createDiv('fileListItem', parent);
	this._foldIcon = createDiv('fileListItemBtn', this.dom);
	createDom('span', 'ListItemName',  this.dom).innerText = name;

	this.content = createDiv('mapFileItemContent', this.dom);
	this.content.style.display = 'none';

	button(this.dom, function fold() {
		t.toggleFold();
	});

	this.toggleFold();
}

module.exports = FolderListItem;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderListItem.prototype.getSubFolder = function (name) {
	if (this.children[name]) return this.children[name];
	var subFolder = new FolderListItem(name, null, this.content);
	this.children[name] = subFolder;
	return subFolder;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderListItem.prototype.toggleFold = function (open) {
	if (open !== undefined) {
		this.isOpened = !!open;
	} else {
		this.isOpened = !this.isOpened;
	}
	this.content.style.display = this.isOpened ? '' : 'none';
	this._foldIcon.className = 'fileListItemBtn' + (this.isOpened ? ' fileListItemBtnOpen' : '');
	this.dom.style.height = this.isOpened ? '' : '20px'; // HACK
};

},{"../../components/domUtils":5}],11:[function(require,module,exports){
var Panel    = require('./Panel');
var inherits = require('../../components/inherits');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function FolderPanel(params) {
	Panel.call(this, params);
	this.children = {};
}
inherits(FolderPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.getDisposition = function () {
	var disposition = Panel.prototype.getDisposition.call(this);
	disposition.foldConfig = this.saveFoldConfig(this);
	return disposition;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.setDisposition = function (params) {
	params = params || {};
	Panel.prototype.setDisposition.call(this, params);
	if (params.foldConfig) this.restoreFoldConfig(params.foldConfig);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.saveFoldConfig = function (folder) {
	var config = {};
	var children = folder.children;
	for (var keys = Object.keys(children), i = 0; i < keys.length; i++) {
		var key = keys[i];
		var child = children[key];
		if (!child.isOpened) continue;
		config[key] = this.saveFoldConfig(child);
	}
	return config;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.restoreFoldConfig = function (config) {
	function walk(folder, config) {
		for (var keys = Object.keys(config), i = 0; i < keys.length; i++) {
			var key = keys[i];
			var child = folder.children[key];
			if (!child) continue;
			child.toggleFold(true);
			walk(child, config[key]);
		}
	}
	walk(this, config);
};

module.exports = FolderPanel;

},{"../../components/inherits":6,"./Panel":15}],12:[function(require,module,exports){
var dragManager = require('./dragManager');
var domUtils    = require('../../components/domUtils');
var createDiv   = domUtils.createDiv;
var button      = domUtils.makeButton;

function ListItem(item, parent, options) {
	options = options || {};
	var t = this;

	this.item   = item;
	this.dom    = createDiv('fileListItem ListItem', parent);
	this.parent = parent;

	var iconStyle = 'ListItemIcon';
	if (options.icon) iconStyle += ' ' + options.icon;

	createDiv(iconStyle, this.dom); // icon
	createDiv('ListItemName', this.dom).innerText = item.name;

	// drag and drop behavior
	if (!options.type) return;

	button(this.dom, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'ListItemDragDummy';
		createDiv(iconStyle, dummy);
		createDiv('ListItemName', dummy).innerText = item.name;
		dragManager.startDrag(e, options.type, t.item, dummy);
	});
}

module.exports = ListItem;

},{"../../components/domUtils":5,"./dragManager":17}],13:[function(require,module,exports){
var Panel        = require('./Panel');
var addTooltip   = require('./tooltip');
var gridImages   = require('./grid');
var dragManager  = require('./dragManager');
var keyboard     = require('./keyboard');
var helper       = require('./helper');
var assetLoader  = require('../../components/assetLoader');
var Texture      = require('../../components/Texture');
var PixelboxMap  = require('../../components/Map');
var inherits     = require('../../components/inherits');
var domUtils     = require('../../components/domUtils');
var resizeHandle = require('./resizeHandle');

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;

var TILE_WIDTH  = settings.tileSize[0];
var TILE_HEIGHT = settings.tileSize[1];
var PIXEL_SIZE    = settings.PIXEL_SIZE;
var MAP_MAX_UNDO  = 5;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

function MapLayerDropArea(editor, parent, layer) {
	this.dom = createDiv('mapLayerDropArea' + (layer === 'foreground' ? ' mapLayerDropAreaForeground' : ''), parent);
	this.editor = editor;
	this.layer  = layer;
	dragManager.setAsDroppable(this.dom, this);
}

MapLayerDropArea.prototype.onDragEnter = function (id, item) {
	// if (id === 'paletteColor' && this.layer === 'foreground') return;
	this.dom.style.borderColor = '#FF2';
};

MapLayerDropArea.prototype.onDragLeave = function (id, item) {
	this.dom.style.borderColor = '';
};

MapLayerDropArea.prototype.onDragEnd = function (id, item) {
	this.dom.style.borderColor = '';
};

MapLayerDropArea.prototype.drop = function (id, item) {
	if (id !== 'paletteColor' && id !== 'imageFile' && id != 'mapFile') return;
	if (id === 'paletteColor' && this.layer === 'foreground') return;
	this.editor.addLayer(this.layer, item);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapEditorPanel() {
	Panel.call(this, { title: 'map editor' });
	var t = this;

	this.bank  = null; // reference of the maap bank in the asset object
	this.file  = null; // name of the json file of the map bank
	this.mapId = 0;
	this.history = [];
	this.map = new PixelboxMap(16, 16);

	this.viewW = TILE_WIDTH  * 16;
	this.viewH = TILE_HEIGHT * 16;

	var toolbar = createDiv('panelToolbar', this.content);

	this._saved = false;

	this.btnSave = addTooltip(createDiv('panelToolButton', toolbar), 'Save this map');
	this.btnSave.style.backgroundImage = 'url("img/iconSave.png")';
	button(this.btnSave, function saveMap() { t.save(); });

	var btnFlagA = addTooltip(createDiv('panelToolButton', toolbar), 'Flag A');
	btnFlagA.style.backgroundImage = 'url("img/iconFlagA.png")';
	var btnFlagB = addTooltip(createDiv('panelToolButton', toolbar), 'Flag B');
	btnFlagB.style.backgroundImage = 'url("img/iconFlagB.png")';


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// MAP SETTINGS
	this.settings = createDiv('mapSettings', this.content);
	this.settings.style.display = 'none';
	this.settings.style.width  = this.viewW * PIXEL_SIZE + 1 + 'px';
	this.settings.style.height = this.viewH * PIXEL_SIZE + 1 + 'px';

	createDiv('mapSettingsTitle', this.settings).innerText = 'name';
	var nameInputs = createDiv(null, this.settings);
	this.inputName = createDom('input', 'mapInput', nameInputs);

	createDiv('mapSettingsTitle', this.settings).innerText = 'size';
	var sizeInputs = createDiv(null, this.settings);
	this.inputWidth  = createDom('input', 'mapSizeInput mapInput', sizeInputs);
	createDom('span', null, sizeInputs).innerText = 'x';
	this.inputHeight = createDom('input', 'mapSizeInput mapInput', sizeInputs);

	var okButton = createDiv('mapSettingsButton', this.settings);
	okButton.innerText = 'ok';
	button(okButton, function () {
		var w = ~~(t.inputWidth.value)  || 1;
		var h = ~~(t.inputHeight.value) || 1;
		var name = t.inputName.value;
		t.settings.style.display = 'none';
		if (w === t.map.width && h === t.map.height && t.map.name === name) return;
		t.map.name = name;
		t.resizeMap(w, h);
		t._updateInfos();
		t.save();
	});

	var btnSettings = addTooltip(createDiv('panelToolButton', toolbar), 'Settings');
	btnSettings.style.backgroundImage = 'url("img/iconMore.png")';
	
	button(btnSettings, function toggleSettingDisplay() {
		var style = t.settings.style;
		style.display = style.display === '' ? 'none' : '';
	});

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// clear button
	var btnClear = addTooltip(createDiv('panelToolButton', toolbar), 'Clear');
	btnClear.style.backgroundImage = 'url("img/iconClear.png")';
	button(btnClear, function clearMap() {
		t.addHistory();
		t.map.clear();
		t._saved = false;
		t._updateSaveButton();
	});

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// swap with clipboard
	var btnClear = addTooltip(createDiv('panelToolButton', toolbar), 'Swap with clipboard');
	// btnClear.style.backgroundImage = 'url("img/iconClear.png")';
	button(btnClear, function swapWithClipboard() {
		var mapClipboard = t.toolbox.mapClipboard;
		// TODO: this can be optimized
		var clipboardContent = mapClipboard.copy();
		mapClipboard.resize(t.map.width, t.map.height);
		mapClipboard.paste(t.map);

		t.resizeMap(clipboardContent.width, clipboardContent.height);
		t.map.paste(clipboardContent);

		t._saved = false;
		t._updateSaveButton();
	});

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// undo button
	var btnUndo = addTooltip(createDiv('panelToolButton', toolbar), 'Undo');
	btnUndo.style.backgroundImage = 'url("img/iconUndo.png")';
	button(btnUndo, function undo() { t.undo(); });

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// info text
	this.info = createDiv('panelInfos', toolbar);

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// BACKGROUND & FOREGROUND DROP AREA

	var dropAreas = createDiv('mapDropAreas', this.content);
	dropAreas.style.display = 'none';

	dragManager.on('dragStart', function (id) {
		if (id !== 'imageFile' && id !== 'paletteColor' && id !== 'mapFile') return;
		dropAreas.style.display = '';
		dropAreas.style.width  = t.viewW * PIXEL_SIZE + 'px';
		dropAreas.style.height = t.viewH * PIXEL_SIZE + 'px';
	});

	dragManager.on('dragEnd',   function (id) {
		dropAreas.style.display = 'none';
	});

	new MapLayerDropArea(this, dropAreas, 'background');
	new MapLayerDropArea(this, dropAreas, 'foreground');


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// MAP RENDER AREA
	var clipSurface = this._clipSurface = createDiv('mapClipSurface', this.content);
	var canvasContainer = createDiv('mapCanvas', this._clipSurface);
	this.resizeViewport();

	var grid = createDiv('mapCanvas mapGrid', canvasContainer);
	grid.style.width  = this.map.width  * TILE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	grid.style.height = this.map.height * TILE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	grid.style.backgroundImage = gridImages.grid;

	this.background = new Texture();
	this.foreground = new Texture();
	var background = this.background.canvas;
	var foreground = this.foreground.canvas;
	var canvas = this.map.texture.canvas;

	foreground.className = background.className = canvas.className = 'mapCanvas';
	canvasContainer.appendChild(background);
	canvasContainer.appendChild(canvas);
	canvasContainer.appendChild(foreground);

	this._grid   = grid;
	this._canvas = canvas;
	this._canvasContainer = canvasContainer;

	var gridEnabled = true;
	keyboard.on('space', function (isPressed) {
		if (!isPressed) return;
		gridEnabled = !gridEnabled;
		grid.style.display = gridEnabled ? '' : 'none';
	});

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	this._posX = 0;
	this._posY = 0;

	// scroll inside the map
	function startScroll(e) {
		// clipSurface.classList.add('move');

		var startX = e.clientX - t._posX;
		var startY = e.clientY - t._posY;

		function mouseMove(e) {
			e.preventDefault();
			t._posX = helper.clip(e.clientX - startX, -(t.map.width  * TILE_WIDTH  - t.viewW) * PIXEL_SIZE, 0);
			t._posY = helper.clip(e.clientY - startY, -(t.map.height * TILE_HEIGHT - t.viewH) * PIXEL_SIZE, 0);
			canvasContainer.style.left = t._posX + 'px';
			canvasContainer.style.top  = t._posY + 'px';
		}

		function mouseEnd(e) {
			e.preventDefault();
			// clipSurface.classList.remove('move');
			document.removeEventListener('mouseup',   mouseEnd);
			document.removeEventListener('mousemove', mouseMove);
		}

		document.addEventListener('mousemove', mouseMove, false);
		document.addEventListener('mouseup',   mouseEnd,  false);
	}


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// draw sprite in the map (using selected brush)
	function startDraw(e) {
		var which = e.which;
		var canvasPosition = canvasContainer.getBoundingClientRect();

		var prevX = null;
		var prevY = null;

		var brush = t.toolbox.brush;

		function mouseMove(e, isStart) {
			e.preventDefault();
			var x = ~~((e.clientX - canvasPosition.left) / TILE_WIDTH  / PIXEL_SIZE);
			var y = ~~((e.clientY - canvasPosition.top)  / TILE_HEIGHT / PIXEL_SIZE);
			if (x === prevX && y === prevY) return;
			prevX = x;
			prevY = y;
			isStart && brush.start && brush.start(x, y, t.toolbox, e);
			if (which === 3) {
				brush.erase && brush.erase(x, y, t.toolbox, isStart, e);
			} else {
				brush.draw && brush.draw(x, y, t.toolbox, isStart, e);
			}
		}

		function mouseEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', mouseMove);
			brush.end && brush.end(prevX, prevY, t.toolbox, e);
		}

		document.addEventListener('mousemove', mouseMove, false);
		document.addEventListener('mouseup', mouseEnd, false);

		t.addHistory();

		mouseMove(e, true);

		if (t._saved) {
			t._saved = false;
			t._updateSaveButton();
		}
	}

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	button(canvasContainer, function (e) {
		// if (keyboard.alt) startScroll(e);
		if (e.which === 2) startScroll(e);
		else startDraw(e);
	});

	// disable context menu
	canvasContainer.oncontextmenu = function () {
		return false;
	};

	this.resizeMap(16, 16);

	// mouse cursor style
	// keyboard.on('shift', function (isPressed) { isPressed ? clipSurface.classList.add('erase') : clipSurface.classList.remove('erase'); });
	// keyboard.on('alt', function (isPressed) { isPressed ? clipSurface.classList.add('move') : clipSurface.classList.remove('move'); });

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	function onResizeMove(viewW, viewH, diffX, diffY) {
		t.viewW = viewW + ~~(diffX / PIXEL_SIZE);
		t.viewH = viewH + ~~(diffY / PIXEL_SIZE);
		t.resizeViewport();
	}

	resizeHandle(this, onResizeMove);

}
inherits(MapEditorPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resizeViewport = function () {
	this.viewW = ~~Math.max(this.viewW, TILE_WIDTH * 16);
	this.viewH = ~~Math.max(this.viewH, TILE_WIDTH * 4);
	this._clipSurface.style.width  = this.viewW * PIXEL_SIZE + 1 + 'px';
	this._clipSurface.style.height = this.viewH * PIXEL_SIZE + 1 + 'px';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resizeMap = function (w, h) {
	this.map.resize(w, h);
	this.background.resize(w * TILE_WIDTH, h * TILE_HEIGHT);
	this.foreground.resize(w * TILE_WIDTH, h * TILE_HEIGHT);

	this._posX = helper.clip(this._posX, -(w * TILE_WIDTH  - this.viewW) * PIXEL_SIZE, 0);
	this._posY = helper.clip(this._posY, -(h * TILE_HEIGHT - this.viewH) * PIXEL_SIZE, 0);
	this._grid.style.width  = w * TILE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	this._grid.style.height = h * TILE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	this._canvasContainer.style.left = this._posX + 'px';
	this._canvasContainer.style.top  = this._posY + 'px';

	var background = this.background.canvas.style;
	var tileground = this._canvas.style;
	var foreground = this.foreground.canvas.style;

	background.width  = foreground.width  = tileground.width  = w * TILE_WIDTH  * PIXEL_SIZE + 'px';
	background.height = foreground.height = tileground.height = h * TILE_HEIGHT * PIXEL_SIZE + 'px';

	// TODO redraw background and foreground if needed

	this.inputWidth.value  = w;
	this.inputHeight.value = h;
	this._saved = false;
	this._updateInfos();
	this._updateSaveButton();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.addLayer = function (id, item) {
	if (id !== 'background' && id !== 'foreground') return;
	if (typeof item === 'string') {
		this[id].ctx.fillStyle = item;
		this[id].cls();
	} else {
		this[id].draw(item);
		// TODO save img to redraw on resize
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype._updateInfos = function () {
	this.info.innerText = '#' + this.mapId + ' [' + this.map.width + 'x' + this.map.height + '] ' + this.map.name;
	this.inputName.value = this.map.name;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype._updateSaveButton = function () {
	this.btnSave.style.backgroundColor = this._saved ? '#FF2' : '#AAA';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.save = function () {
	if (this._saved) return;
	var t = this;
	var assetList = this.toolbox.assetList;

	var data = this.map.save();
	var request = {
		command: 'map.save',
		file: this.file,
		mapId: this.mapId,
		data: data
	};
	// send data to the server
	assetLoader.sendRequest(request, function (error) {
		if (error) return alert(error);
		// copy data in maps bank
		// TODO refactor with nicer reference
		if (!t.bank.maps[t.mapId]) {
			t.bank.maps[t.mapId] = {};
			assetList.addMap('maps', t.bank.maps[t.mapId]);
		}
		helper.copyObject(data, t.bank.maps[t.mapId]);

		t._saved = true;
		t._updateSaveButton();
		assetList.refreshAssetList();
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @param {Object} params
 *        {string} params.file  - json file name of the bank
 *        {Object} params.bank  - reference to the map bank in the window.assets object
 *        {number} params.index - index of the map in the bank
 *        {Object} params.map   - map data
 */
MapEditorPanel.prototype.loadMap = function (params) {
	var map = params.map;
	this.file = params.file;
	this.bank = params.bank;
	this.mapId = params.index;
	this.resizeMap(map.w, map.h);
	this.map.load(map);
	this._saved = true;
	this._updateSaveButton();
	this._updateInfos();
	this.history = [];

	// if map has a tilesheet, update tilesheet panel
	if (this.map._tilesheetPath) {
		this.toolbox.tilesheet.updateTilesheet(this.map.texture.tilesheet.canvas, true);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.addHistory = function () {
	this.history.push(this.map.copy());
	if (this.history.length > MAP_MAX_UNDO) this.history.shift();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.undo = function () {
	if (!this.history.length) return;
	this.map.paste(this.history.pop());
	this._saved = false;
	this._updateSaveButton();
};

module.exports = new MapEditorPanel();

},{"../../components/Map":2,"../../components/Texture":3,"../../components/assetLoader":4,"../../components/domUtils":5,"../../components/inherits":6,"./Panel":15,"./dragManager":17,"./grid":18,"./helper":19,"./keyboard":21,"./resizeHandle":22,"./tooltip":24}],14:[function(require,module,exports){
var Panel        = require('./Panel.js');
var dragManager  = require('./dragManager.js');
var inherits     = require('../../components/inherits');
var domUtils     = require('../../components/domUtils');

var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function PalettePanel() {
	Panel.call(this, { title: 'palette' });

	this.canvas = createDiv('paletteCanvas', this.content);
	this.cells = [];
}
inherits(PalettePanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function createPaletteCell(parent, index, color) {
	var cell = createDiv('paletteCell', parent);
	cell.style.backgroundColor = color;
	createDiv('paletteCellNumber', cell).innerText = index;

	button(cell, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'paletteCell paletteCellDummy';
		dummy.style.backgroundColor = color;
		dragManager.startDrag(e, 'paletteColor', color, dummy);
	});

	return cell;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
PalettePanel.prototype.create = function (colors) {
	for (var i = 0; i < colors.length; i++) {
		createPaletteCell(this.canvas, i, colors[i]);
	}
};

module.exports = new PalettePanel();

},{"../../components/domUtils":5,"../../components/inherits":6,"./Panel.js":15,"./dragManager.js":17}],15:[function(require,module,exports){
var domUtils      = require('../../components/domUtils');
var zIndexManager = require('./zIndexManager');
var createDom = domUtils.createDom;
var createDiv = domUtils.createDiv;
var removeDom = domUtils.removeDom;
var button    = domUtils.makeButton;

// module globals
// var panels = [];

function startDrag(panel, e) {
	var d = document;

	var startX = e.clientX - panel.x;
	var startY = e.clientY - panel.y;

	function dragMove(e) {
		e.preventDefault();
		panel.setPosition(e.clientX - startX, e.clientY - startY);
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	zIndexManager.bringToFront(panel.dom);

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Panel(params) {
	params = params || {};
	var t = this;
	var d = t.dom = createDiv('panel', null);
	t.x = 0;
	t.y = 0;
	t.viewW = 0;
	t.viewH = 0;

	t._expanded = true;

	var handle    = this.handle = createDiv('panelHandle', d);
	var expandBtn = createDiv('panelExpandButton', handle);
	var title     = createDiv('panelTitle', handle);
	if (params.title) title.innerText = params.title;
	button(handle, function (e) {
		t._select();
		startDrag(t, e);
	});

	button(expandBtn, function (e) {
		t.toggleExpand(expandBtn);
	});
	expandBtn.innerText = '-';

	t.content = createDiv('panelContent', d);
	zIndexManager.addElement(d);
	// panels.push(t);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// global attribute
Panel.currentSelectedPanel = null; // FIXME: used in keyboard
Panel.prototype.toolbox = null;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.setPosition = function (x, y) {
	this.x = x || 0;
	this.y = y || 0;

	// constraint panel inside window
	var boundingRect = this.dom.getBoundingClientRect();
	var maxX = window.innerWidth  - boundingRect.width;
	var maxY = window.innerHeight - boundingRect.height;

	this.x = Math.max(0, Math.min(maxX, this.x));
	this.y = Math.max(0, Math.min(maxY, this.y));

	// set dom position
	this.dom.style.left = this.x + 'px';
	this.dom.style.top  = this.y + 'px';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.setDisposition = function (params) {
	params = params || {};
	this.setPosition(params.x || 0, params.y || 0);
	this.viewW = params.viewW || this.viewW || 0;
	this.viewH = params.viewH || this.viewH || 0;
	this.resizeViewport && this.resizeViewport();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.getDisposition = function () {
	return {
		x: this.x,
		y: this.y,
		viewW: this.viewW,
		viewH: this.viewH
	};
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.toggleExpand = function (button) {
	this._expanded = !this._expanded;
	this.content.style.display = this._expanded ? '' : 'none';
	button.innerText = this._expanded ? '-' : '+';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype._select = function () {
	Panel.currentSelectedPanel && Panel.currentSelectedPanel._deselect();
	this.handle.className = 'panelHandle panelHandleSelected';
	Panel.currentSelectedPanel = this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype._deselect = function () {
	this.handle.className = 'panelHandle';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.save = function () {
	// Virtual
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.undo = function () {
	// Virtual
};

module.exports = Panel;

},{"../../components/domUtils":5,"./zIndexManager":25}],16:[function(require,module,exports){
var Panel        = require('./Panel.js');
var addTooltip   = require('./tooltip.js');
var gridImages   = require('./grid.js');
var dragManager  = require('./dragManager.js');
var Texture      = require('../../components/Texture');
var inherits     = require('../../components/inherits');
var domUtils     = require('../../components/domUtils');

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;

var TILE_WIDTH  = settings.tileSize[0];
var TILE_HEIGHT = settings.tileSize[1];
var PIXEL_SIZE    = settings.PIXEL_SIZE;
var TILES_PER_LINE = 16; // (in a tilesheet)

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function TileSheetPanel() {
	Panel.call(this, { title: 'tilesheet' });
	var t = this;

	this.tile  = 0;
	this.flipH = false;
	this.flipV = false;
	this.flipR = false;

	var toolbar = createDiv('panelToolbar', this.content);

	var btnFlipH = addTooltip(createDiv('panelToolButton', toolbar), 'Flip horizontally');
	var btnFlipV = addTooltip(createDiv('panelToolButton', toolbar), 'Flip vertically');
	var btnFlipR = addTooltip(createDiv('panelToolButton', toolbar), 'Rotate 90 degrees');

	btnFlipH.style.backgroundImage = 'url("img/iconFlipH.png")';
	btnFlipV.style.backgroundImage = 'url("img/iconFlipV.png")';
	btnFlipR.style.backgroundImage = 'url("img/iconFlipR.png")';

	button(btnFlipH, function () { t.flipH = !t.flipH; btnFlipH.style.backgroundColor = t.flipH ? '#FF2' : '#AAA'; t.updateSprite(); });
	button(btnFlipV, function () { t.flipV = !t.flipV; btnFlipV.style.backgroundColor = t.flipV ? '#FF2' : '#AAA'; t.updateSprite(); });
	button(btnFlipR, function () { t.flipR = !t.flipR; btnFlipR.style.backgroundColor = t.flipR ? '#FF2' : '#AAA'; t.updateSprite(); });

	this.info = createDiv('panelInfos', toolbar);

	var spritesheet = createDiv('spritesheet', this.content);

	var canvasTexture   = new Texture(TILE_WIDTH * TILES_PER_LINE, TILE_HEIGHT * TILES_PER_LINE);
	var canvas          = canvasTexture.canvas;
	canvas.className    = 'spritesheetInner';
	canvas.style.width  = canvas.width  * PIXEL_SIZE + 'px';
	canvas.style.height = canvas.height * PIXEL_SIZE + 'px';
	this.canvasTexture  = canvasTexture;
	spritesheet.appendChild(canvas);

	var grid   = createDiv('spritesheetInner spritesheetGrid', spritesheet);
	var cursor = createDiv('spritesheetCursor', spritesheet);

	var CURSOR_WIDTH  = TILE_WIDTH  * PIXEL_SIZE;
	var CURSOR_HEIGHT = TILE_HEIGHT * PIXEL_SIZE;

	cursor.style.width  = CURSOR_WIDTH  + 10 + 'px';
	cursor.style.height = CURSOR_HEIGHT + 10 + 'px';
	cursor.style.backgroundImage = gridImages.cursor;

	spritesheet.style.width  = grid.style.width  = TILE_WIDTH  * PIXEL_SIZE * TILES_PER_LINE + 1 + 'px';
	spritesheet.style.height = grid.style.height = TILE_HEIGHT * PIXEL_SIZE * TILES_PER_LINE + 1 + 'px';
	grid.style.backgroundImage = gridImages.grid;

	this.cursorTexture = new Texture(TILE_WIDTH, TILE_HEIGHT);
	var cursorCanvas = this.cursorTexture.canvas;
	cursorCanvas.style.width  = CURSOR_WIDTH  + 'px';
	cursorCanvas.style.height = CURSOR_HEIGHT + 'px';
	cursorCanvas.style.top    = '5px';
	cursorCanvas.style.left   = '5px';
	cursorCanvas.style.position  = 'absolute';
	cursor.appendChild(cursorCanvas);

	button(spritesheet, function (e) {
		if (e.target !== grid) return;
		var sx = ~~(e.layerX / CURSOR_WIDTH);
		var sy = ~~(e.layerY / CURSOR_HEIGHT);
		cursor.style.left = (sx * CURSOR_WIDTH  - 5) + 'px';
		cursor.style.top  = (sy * CURSOR_HEIGHT - 5) + 'px';
		t.updateInfos(sx, sy);
	});

	this.updateInfos(0, 0);

	dragManager.setAsDroppable(this.dom, this);
}
inherits(TileSheetPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.onDragStart = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
	this.dom.style.marginTop  = '-5px';
	this.dom.style.marginLeft = '-5px';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.onDragEnter = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #FF2';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.onDragLeave = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.onDragEnd = function (id, item) {
	this.dom.style.border = '';
	this.dom.style.marginTop  = '';
	this.dom.style.marginLeft = '';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.drop = function (id, item) {
	if (id === 'imageFile') this.updateTilesheet(item);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.updateTilesheet = function (img, noMapUpdate) {
	Texture.prototype.setTilesheet(img);
	this.canvasTexture.clear();
	this.canvasTexture.draw(img, 0, 0);
	this.updateSprite();
	// update map with new tilesheet
	if (noMapUpdate) return; // FIXME
	if (this.toolbox.mapEditor) this.toolbox.mapEditor.map.setTilesheet(img);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.updateInfos = function (sx, sy) {
	var tile = this.tile = sy * TILES_PER_LINE + sx;
	var hexa = ('0' + tile.toString(16).toLocaleUpperCase()).slice(-2);
	this.info.innerText = tile + ' (0x' + hexa + ')';
	this.updateSprite();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileSheetPanel.prototype.updateSprite = function () {
	this.cursorTexture.clear().sprite(this.tile, 0, 0, this.flipH, this.flipV, this.flipR);
};

module.exports = new TileSheetPanel();

},{"../../components/Texture":3,"../../components/domUtils":5,"../../components/inherits":6,"./Panel.js":15,"./dragManager.js":17,"./grid.js":18,"./tooltip.js":24}],17:[function(require,module,exports){
var EventEmitter  = require('../../components/EventEmitter');
var inherits      = require('../../components/inherits');
var createDiv     = require('../../components/domUtils').createDiv;
var zIndexManager = require('./zIndexManager');

function DragManager() {
	EventEmitter.call(this);
	this.dummy = createDiv('dragItem');
	this.dummy.style.display = 'none';
	this.droppables = [];
}
inherits(DragManager, EventEmitter);
module.exports = new DragManager();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.startDrag = function (e, id, item, dummyContent) {
	var t = this;
	var d = document;

	var dummy = t.dummy;
	dummy.style.zIndex = zIndexManager.getTopZIndex();
	dummy.style.display = '';
	dummy.style.left = e.clientX + 'px';
	dummy.style.top  = e.clientY + 'px';

	if (dummyContent) dummy.appendChild(dummyContent);

	var currentDrop = null;

	function onDragEnter() {
		this._dropHandle.onDragEnter && this._dropHandle.onDragEnter(id, item);
		currentDrop = this;
	}

	function onDragLeave() {
		this._dropHandle.onDragLeave && this._dropHandle.onDragLeave(id, item);
		if (currentDrop === this) currentDrop = null;
	}

	for (var i = 0; i < t.droppables.length; i++) {
		var droppable = t.droppables[i];
		droppable.addEventListener('mouseenter', onDragEnter);
		droppable.addEventListener('mouseleave', onDragLeave);
		droppable._dropHandle.onDragStart && droppable._dropHandle.onDragStart(id, item);
	}

	t.emit('dragStart', id, item);

	function dragMove(e) {
		e.preventDefault();
		var x = e.clientX;
		var y = e.clientY;
		dummy.style.left = x + 'px';
		dummy.style.top  = y + 'px';
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
		if (dummyContent) dummy.removeChild(dummyContent);
		dummy.style.display = 'none';
		for (var i = 0; i < t.droppables.length; i++) {
			var droppable = t.droppables[i];
			droppable.removeEventListener('mouseenter', onDragEnter);
			droppable.removeEventListener('mouseleave', onDragLeave);
			droppable._dropHandle.onDragEnd && droppable._dropHandle.onDragEnd(id, item);
		}
		t.emit('dragEnd', id, item);
		currentDrop && currentDrop._dropHandle.drop && currentDrop._dropHandle.drop(id, item);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.setAsDroppable = function (dom, handle) {
	this.droppables.push(dom);
	dom._dropHandle = handle;
};


},{"../../components/EventEmitter":1,"../../components/domUtils":5,"../../components/inherits":6,"./zIndexManager":25}],18:[function(require,module,exports){
// grid and cursor images creation
var Texture = require('../../components/Texture');

var TILE_WIDTH  = settings.tileSize[0];
var TILE_HEIGHT = settings.tileSize[1];
var PIXEL_SIZE    = settings.PIXEL_SIZE;

var w = TILE_WIDTH  * PIXEL_SIZE;
var h = TILE_HEIGHT * PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var grid = new Texture(w, h);
var colors = ['#E8CD64', '#8D5604'];
var len = Math.max(w, h);
for (var i = 0; i < len; i++) {
	grid.ctx.fillStyle = colors[i % 2];
	grid.ctx.fillRect(i, 0, 1, 1);
	grid.ctx.fillRect(0, i, 1, 1);
}
exports.grid = 'url(' + grid.canvas.toDataURL("image/png") + ')';

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var cursor = new Texture(w + 10, h + 10);
colors = ['#F00', '#F00', '#000', '#000', '#FFF'];
for (var i = 0; i < colors.length; i++) {
	cursor.ctx.strokeStyle = colors[i];
	cursor.rect(i, i, w + 10 - i * 2, h + 10 - i * 2);
}

exports.cursor = 'url(' + cursor.canvas.toDataURL("image/png") + ')';

},{"../../components/Texture":3}],19:[function(require,module,exports){
// helper functions

exports.clip = function (value, min, max) {
	return Math.min(max, Math.max(min, value));
};

exports.copyObject = function (from, to) {
	for (var key in from) {
		to[key] = from[key];
	}
};
},{}],20:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */

var TILE_WIDTH  = settings.tileSize[0];
var TILE_HEIGHT = settings.tileSize[1];
var PIXEL_SIZE = 3;
var max = Math.max(TILE_WIDTH, TILE_HEIGHT);
if      (max >= 20) PIXEL_SIZE = 1;
else if (max >= 10) PIXEL_SIZE = 2;
settings.PIXEL_SIZE = PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var assetLoader = require('../../components/assetLoader');
var Map         = require('../../components/Map');
var Texture     = require('../../components/Texture');
var toolbox     = require('./toolbox');

function setDisposition(disposition) {
	for (var panelId in disposition) {
		var panel = toolbox[panelId];
		if (!panel || !panel.setDisposition) continue;
		panel.setDisposition(disposition[panelId]);
	}
}

function getDisposition() {
	var disposition = {};
	for (var panelId in toolbox) {
		var panel = toolbox[panelId];
		if (!panel || !panel.getDisposition) continue;
		disposition[panelId] = panel.getDisposition();
	}
	return disposition;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// load assets and initialise panels
assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
	if (error) return console.error(error);

	window.assets = result;

	// DEPRECATED: check if mapBank is in the old format
	assets.maps = Map._checkBankFormat(assets.maps);

	if (!assets.tilesheet) {
		// create a default tilesheet
		console.warn('Could not find default tilesheet. Creating a new tilesheet texture.');
		assets.tilesheet = new Texture(16 * TILE_WIDTH, 16 * TILE_HEIGHT);
	}
	toolbox.tilesheet.updateTilesheet(assets.tilesheet);
	toolbox.palette.create(settings.palette);
	toolbox.assetList.refreshAssetList();

	// FIXME: correctly check for default map
	if (assets.maps.maps[0]) {
		toolbox.mapEditor.loadMap({
			file: 'maps',
			bank: assets.maps,
			index: 0,
			map: assets.maps.maps[0]
		});
	}

	assetLoader.loadJson('project/tools/settings.json', function onToolSettingsLoaded(error, toolSettings) {
		if (error) return console.error(error);
		var disposition = toolSettings.disposition || {};
		setDisposition(disposition);
	});
});


window.onbeforeunload = function saveSettings() {
	assetLoader.sendRequest({
		command: 'ui.saveDisposition',
		data: getDisposition()
	});
}


function savePng(canvas, filename, cb) {
	var request = {
		command: 'image.savePng',
		filename: filename,
		data: canvas.toDataURL("image/png")
	};

	assetLoader.sendRequest(request, function (error) {
		cb && cb(error);	
	});
}

},{"../../components/Map":2,"../../components/Texture":3,"../../components/assetLoader":4,"./toolbox":23}],21:[function(require,module,exports){
var EventEmitter = require('../../components/EventEmitter');
var Panel        = require('./Panel.js');

var buttons = new EventEmitter();
buttons.shift   = false;
buttons.control = false;
buttons.alt     = false;

var keyMap = {
	16: 'shift',
	17: 'control',
	18: 'alt',
	32: 'space',
	37: 'left',
	38: 'up',
	39: 'right',
	40: 'down',
	65: 'a',
	66: 'b',
	67: 'c',
	68: 'd',
	69: 'e',
	70: 'f',
	71: 'g',
	72: 'h',
	73: 'i',
	74: 'j',
	86: 'v',
	88: 'x',
};

function keyChange(e, isPressed) {
	var key = keyMap[e.keyCode];
	if (key) buttons[key] = isPressed;

	// keyboard shortcuts
	var ctrlKey = isPressed && navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;
	switch (e.keyCode) {
		// case 83 : if (ctrlKey && Panel.currentSelectedPanel) { Panel.currentSelectedPanel.save(e); break; } // S key : save
		// case 90 : if (ctrlKey && Panel.currentSelectedPanel) { Panel.currentSelectedPanel.undo(e); break; } // Z key : undo
		case 32 : buttons.emit('space', isPressed); e.preventDefault(); break;
		case 16 : buttons.emit('shift', isPressed); break;
		case 18 : buttons.emit('alt',   isPressed); break;
		case 67 : buttons.emit('c',     isPressed); break;
		case 86 : buttons.emit('v',     isPressed); break;
		case 88 : buttons.emit('x',     isPressed); break;
	}
}

window.addEventListener('keydown', function onKeyPressed(e) { keyChange(e, true);  });
window.addEventListener('keyup',   function onKeyRelease(e) { keyChange(e, false); });

module.exports = buttons;
},{"../../components/EventEmitter":1,"./Panel.js":15}],22:[function(require,module,exports){
var addTooltip = require('./tooltip.js');
var domUtils   = require('../../components/domUtils');

var createDom  = domUtils.createDom;
var createDiv  = domUtils.createDiv;
var button     = domUtils.makeButton;

/**
 * @param {Panel} panel
 * @param {function} onResize
 */
function addResizeHandle(panel, onResize, onEnd) {
	var dom = panel.content;

	var resizeHandle = addTooltip(createDiv('mapResizeHandle', dom), 'Resize');

	function startResize(e) {
		var startX = e.clientX;
		var startY = e.clientY;

		var viewW = panel.viewW;
		var viewH = panel.viewH;

		function resize(e) {
			e.preventDefault();
			var diffX = e.clientX - startX;
			var diffY = e.clientY - startY;
			onResize && onResize(viewW, viewH, diffX, diffY);
		}

		function mouseEnd(e) {
			resize(e);
			onEnd && onEnd();
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', resize);
		}

		document.addEventListener('mousemove', resize, false);
		document.addEventListener('mouseup', mouseEnd, false);
	}

	button(resizeHandle, startResize);

	return resizeHandle;
}

module.exports = addResizeHandle;

},{"../../components/domUtils":5,"./tooltip.js":24}],23:[function(require,module,exports){
var Panel       = require('./Panel.js');
var PixelboxMap = require('../../components/Map');

// create toolbox
var toolbox = {};
module.exports = toolbox;
window.toolbox = toolbox; // TODO for testing purpose, to be removed

// set cross-references
Panel.prototype.toolbox = toolbox;

// create clipboard
toolbox.mapClipboard = new PixelboxMap();

// create panels
toolbox.keyboard    = require('./keyboard.js');
toolbox.tilesheet   = require('./TileSheetPanel.js');
toolbox.palette     = require('./PalettePanel.js');
toolbox.mapEditor   = require('./MapEditorPanel.js');
toolbox.assetList   = require('./AssetListPanel.js');
toolbox.customTools = require('./CustomToolsPanel.js');
// toolbox.brush       = require('./Brush.js');

},{"../../components/Map":2,"./AssetListPanel.js":7,"./CustomToolsPanel.js":9,"./MapEditorPanel.js":13,"./PalettePanel.js":14,"./Panel.js":15,"./TileSheetPanel.js":16,"./keyboard.js":21}],24:[function(require,module,exports){
var createDiv     = require('../../components/domUtils').createDiv;
var zIndexManager = require('./zIndexManager');

var tooltip = createDiv('tooltip');
zIndexManager.addElement(tooltip, { alwaysOnFront: true });

function addTooltip(dom, text) {
	dom.addEventListener('mouseenter', function(e) {
		tooltip.innerText = text;
		tooltip.style.display = 'block';
	});

	dom.addEventListener('mousemove', function(e) {
		tooltip.style.left = e.clientX + 10 + 'px';
		tooltip.style.top  = e.clientY + 10 + 'px';
	});

	dom.addEventListener('mouseleave', function() {
		tooltip.style.display = 'none';
	});

	return dom;
}

module.exports = addTooltip;
},{"../../components/domUtils":5,"./zIndexManager":25}],25:[function(require,module,exports){
var zIndex = 0;
var elements = [];
var alwaysOnFrontElements = []

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function reorder() {
	elements.sort(function (a, b) {
		return ~~(a.style.zIndex) - ~~(b.style.zIndex);
	});
	for (zIndex = 0; zIndex < elements.length; zIndex++) {
		elements[zIndex].style.zIndex = zIndex;
	}
	console.log('reorder', elements);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function addElement(dom, options) {
	options = options || {};
	elements.push(dom);
	if (options.alwaysOnFront) alwaysOnFrontElements.push(dom);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function removeElement(dom) {
	var index = elements.indexOf(dom);
	if (index === -1) return console.error('[zIndexManager] the element to remove does not exist');
	elements.splice(index, 1);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function bringToFront(dom) {
	dom.style.zIndex = ++zIndex;

	// elements always on front
	for (var i = 0; i < alwaysOnFrontElements.length; i++) {
		alwaysOnFrontElements[i].style.zIndex = ++zIndex;
	}

	// reindex everything if zIndex gets too big
	if (zIndex > elements.length * 10) reorder();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getTopZIndex() {
	return zIndex + 1;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.addElement    = addElement;
exports.removeElement = removeElement;
exports.bringToFront  = bringToFront;
exports.getTopZIndex  = getTopZIndex;

},{}]},{},[20]);
