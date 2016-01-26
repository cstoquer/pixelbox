//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapItem(x, y, sprite, flipH, flipV, rot) {
	this.x      = x;
	this.y      = y;
	this.sprite = sprite;
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
	this._texture = new Texture(w * 8, h * 8);

	this._init(w, h);
}

Map.prototype._init = function (w, h) {
	this.width  = w;
	this.height = h;
	this.items  = [];

	for (var x = 0; x < w; x++) {
		this.items.push([]);
		for (var y = 0; y < h; y++) {
			this.items[x][y] = null;
		}
	}
	return this;
};

Map.prototype.addItem = function (x, y, item) {
	this.items[x][y] = item;
	item.draw(this._texture);
};

Map.prototype.removeItem = function (x, y) {
	this.items[x][y] = null;
	this._texture.ctx.clearRect(x * 8, y * 8, 8, 8);
};

Map.prototype.getItem = function (x, y) {
	if (x >= this.width)  return null;
	if (y >= this.height) return null;
	return this.items[x][y];
};

Map.prototype._redraw = function () {
	this._texture.clear();
	for (var x = 0; x < this.width;  x++) {
	for (var y = 0; y < this.height; y++) {
		this.items[x][y] && this.items[x][y].draw(this._texture);
	}}
};

Map.prototype.draw = function () {
	draw(this._texture); // TODO don't need $screen in next pixelbox version
};

