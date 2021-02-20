var Sprite = require('../spritesheet/Sprite');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function NineSlice(asset, w, h) {

	//   9-slice sprites
	//
	//              0   w        w+1  asset.width
	//            0 ┌───┬─────────┬───┐
	//              │ A │    B    | C │
	//            h ├───┼─────────┼───┤
	//              │   │         |   │
	//              │ D │    E    | F │
	//              │   │         |   │
	//          h+1 ├───┼─────────┼───┤
	//              │ G │    H    | I │
	// asset.height └───┴─────────┴───┘
	//
	//
	//   3-slices optimizations:
	//   ┌───┬───────┬───┐  ┌───┐
	//   │ J │   K   | L │  │ M │
	//   └───┴───────┴───┘  ├───┤
	//                      │ N │
	//                      ├───┤
	//                      │ O │
	//                      └───┘

	if (asset._isNineSlice) {
		asset = asset.asset;
	}

	this.asset = asset;
	var path = asset.path;
	var x = 0;
	var y = 0;

	if (asset._isTileMap) {
		throw new Error('TileMap cannot be used as NineSlice');
	}

	var width  = asset.width;
	var height = asset.height;

	if (asset._isSprite) {
		x = asset.x;
		y = asset.y;
		asset = asset.img;
	} else if (asset._isTexture) {
		asset = asset.canvas;
		path = '';
	}

	this.w0 = w;
	this.w1 = width - 1;
	this.w2 = width - w - 1;
	this.h0 = h;
	this.h1 = height - 1;
	this.h2 = height - h - 1;

	// 9-slices
	this._a = new Sprite(asset, path, x,         y,         w,       h);
	this._b = new Sprite(asset, path, x + w,     y,         1,       h);
	this._c = new Sprite(asset, path, x + w + 1, y,         this.w2, h);
	this._d = new Sprite(asset, path, x,         y + h,     w,       1);
	this._e = new Sprite(asset, path, x + w,     y + h,     1,       1);
	this._f = new Sprite(asset, path, x + w + 1, y + h,     this.w2, 1);
	this._g = new Sprite(asset, path, x,         y + h + 1, w,       this.h2);
	this._h = new Sprite(asset, path, x + w,     y + h + 1, 1,       this.h2);
	this._i = new Sprite(asset, path, x + w + 1, y + h + 1, this.w2, this.h2);

	// horizontal 3-slices
	this._j = new Sprite(asset, path, x,         y,         w,       height);
	this._k = new Sprite(asset, path, x + w,     y,         1,       height);
	this._l = new Sprite(asset, path, x + w + 1, y,         this.w2, height);

	// vertical 3-slices
	this._m = new Sprite(asset, path, x,         y,         width,   h);
	this._n = new Sprite(asset, path, x,         y + h,     width,   1);
	this._o = new Sprite(asset, path, x,         y + h + 1, width,   this.h2);
}
module.exports = NineSlice;
NineSlice.prototype._isNineSlice = true;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
NineSlice.prototype._draw = function (texture, x, y, w, h) {
	w = Math.round(w);
	h = Math.round(h);

	if (w < 0) { x += w; w = -w; }
	if (h < 0) { y += h; h = -h; }

	var mw = this.w1 + 1;
	var mh = this.h1 + 1;

	if (w <= mw && h <= mh) {
		texture.draw(this.asset, x, y);
		return;
	}

	var x1 = x + this.w0;
	var x2 = x + w - this.w2
	var y1 = y + this.h0;
	var y2 = y + h - this.h2;

	if (h <= mh) {
		texture.draw       (this._j, x,  y);
		texture.stretchDraw(this._k, x1, y, w - this.w1, mh);
		texture.draw       (this._l, x2, y);
		return;
	}

	if (w <= mw) {
		texture.draw       (this._m, x, y);
		texture.stretchDraw(this._n, x, y1, mw, h - this.h1);
		texture.draw       (this._o, x, y2);
		return;
	}

	texture.draw       (this._a, x,  y);
	texture.stretchDraw(this._b, x1, y,  w - this.w1, this.h0);
	texture.draw       (this._c, x2, y);
	texture.stretchDraw(this._d, x,  y1,     this.w0, h - this.h1);
	texture.stretchDraw(this._e, x1, y1, w - this.w1, h - this.h1);
	texture.stretchDraw(this._f, x2, y1,     this.w2, h - this.h1);
	texture.draw       (this._g, x,  y2);
	texture.stretchDraw(this._h, x1, y2, w - this.w1, this.h2);
	texture.draw       (this._i, x2, y2);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
NineSlice.prototype.draw = function (x, y, w, h) {
	this._draw($screen, x, y, w, h);
};
