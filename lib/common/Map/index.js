//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Map
 * @author Cedric Stoquer
 */

var Texture = require('Texture');


var _mapById = {};
window.getMap = function (name) {
	return _mapById[name];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapItem(x, y, sprite, flipH, flipV, flipR) {
	this.x      = ~~x;
	this.y      = ~~y;
	this.sprite = ~~sprite;
	this.flipH  = !!flipH;
	this.flipV  = !!flipV;
	this.flipR  = !!flipR;
	// TODO add flagMap (2 bits available)
}

MapItem.prototype.draw = function (texture) {
	texture.sprite(this.sprite, this.x * 8, this.y * 8, this.flipH, this.flipV, this.flipR);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Map(width, height) {
	this._name  = '';
	this.width  = 0;
	this.height = 0;
	this.items  = [];
	this.texture = new Texture(width * 8, height * 8);

	if (width && height) this._init(width, height);
}
module.exports = Map;

Map.prototype._isMap = true;

Object.defineProperty(Map.prototype, 'name', {
	get: function () { return this._name; },
	set: function (name) {
		if (this._name && _mapById[this._name] && _mapById[this._name] === this) delete _mapById[this._name];
		this._name = name;
		if (name && !_mapById[name]) _mapById[name] = this;
	}
});

Map.prototype._init = function (width, height) {
	this.texture.resize(width * 8, height * 8);
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

Map.prototype.resize = function (width, height) {
	var items = this.items;
	var w = Math.min(this.width,  width);
	var h = Math.min(this.height, height);
	this.texture.resize(width * 8, height * 8);
	this._init(width, height);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		this.items[x][y] = items[x][y];
	}}
	this._redraw();
	return this;
};

Map.prototype.set = function (x, y, sprite, flipH, flipV, flipR) {
	if (sprite === null) return this.remove(x, y);
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	var item = this.items[x][y] = new MapItem(x, y, sprite, flipH, flipV, flipR);
	this.texture.ctx.clearRect(x * 8, y * 8, 8, 8);
	item.draw(this.texture);
};

Map.prototype.remove = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
	this.items[x][y] = null;
	this.texture.ctx.clearRect(x * 8, y * 8, 8, 8);
};

Map.prototype.get = function (x, y) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
	return this.items[x][y];
};

Map.prototype._redraw = function () {
	this.texture.clear();
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] && this.items[x][y].draw(this.texture);
	}}
};

Map.prototype.draw = function (x, y) {
	draw(this.texture, x, y);
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
			value = INVERSE[be] * LENGTH + INVERSE[le];
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
Map.prototype.save = function () {
	var w = this.width;
	var h = this.height;
	var arr = new Array(w * h);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var item = this.items[x][y];
		arr[x + y * w] = item ? item.sprite + (item.flipH << 8) + (item.flipV << 9) + (item.flipR << 10) : null;
	}}

	var obj = { w: w, h: h, name: this.name, data: encode(arr) };
	return obj;
};

Map.prototype.load = function (obj) {
	var w = obj.w;
	var h = obj.h;
	this._init(w, h);
	this.name = obj.name || '';
	var arr = decode(obj.data);
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var d = arr[x + y * w];
		if (d === null) continue;
		var sprite =  d & 255;
		var flipH  = (d >> 8 ) & 1;
		var flipV  = (d >> 9 ) & 1;
		var flipR  = (d >> 10) & 1;
		this.set(x, y, sprite, flipH, flipV, flipR);
	}}

	this._redraw();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Map.prototype.copy = function (map) {
	this.width  = map.width;
	this.height = map.height;
	this.texture.resize(this.width * 8, this.height * 8);
	this.items = [];
	for (var x = 0; x < width; x++) {
		this.items.push([]);
		for (var y = 0; y < height; y++) {
			this.items[x][y] = map.items[x][y];
		}
	}
	return this;
};

Map.prototype.clone = function () {
	var map = new Map();
	map.copy(this);
	return map;
};