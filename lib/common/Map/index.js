var Texture = require('Texture');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapItem(x, y, sprite, flipH, flipV, rot) {
	this.x      = ~~x;
	this.y      = ~~y;
	this.sprite = ~~sprite;
	this.flipH  = !!flipH;
	this.flipV  = !!flipV;
	this.rot    = !!rot;
}

MapItem.prototype.draw = function (texture) {
	texture.sprite(this.sprite, this.x * 8, this.y * 8, this.flipH, this.flipV, this.rot);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Map(w, h) {
	this.width  = 0;
	this.height = 0;
	this.items  = [];
	// TODO add flagMap
	this.texture = new Texture(w * 8, h * 8);

	this._init(w, h);
}
module.exports = Map;

Map.prototype.isMap = true;

Map.prototype._init = function (width, height) {
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
	this.texture = new Texture(width * 8, height * 8);
	this._init();
	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		this.items[x][y] = items[x][y];
	}}
	this._redraw();
};

Map.prototype.addItem = function (x, y, sprite, flipH, flipV, rot) {
	var item = this.items[x][y] = new MapItem(x, y, sprite, flipH, flipV, rot);
	this.texture.ctx.clearRect(x * 8, y * 8, 8, 8);
	item.draw(this.texture);
};

Map.prototype.removeItem = function (x, y) {
	this.items[x][y] = null;
	this.texture.ctx.clearRect(x * 8, y * 8, 8, 8);
};

Map.prototype.getItem = function (x, y) {
	if (x >= this.width)  return null;
	if (y >= this.height) return null;
	return this.items[x][y];
};

Map.prototype._redraw = function () {
	this.texture.clear();
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] && this.items[x][y].draw(this.texture);
	}}
};

Map.prototype.draw = function () {
	draw(this.texture);
};

