var TileMap = require('./index.js');

var FLAG_MAP = [
	/* 0 */ { H: false, V: false, R: false },
	/* 1 */ { H: true,  V: false, R: false },
	/* 2 */ { H: false, V: true,  R: false },
	/* 3 */ { H: true,  V: true,  R: false },
	/* 4 */ { H: false, V: false, R: true  },
	/* 5 */ { H: true,  V: false, R: true  },
	/* 6 */ { H: false, V: true,  R: true  },
	/* 7 */ { H: true,  V: true,  R: true  }
];

var TILE_TRANSFORM_MAP = [
	//       H  V  R  C
	/* 0 */ [1, 2, 4, 7],
	/* 1 */ [0, 3, 6, 5],
	/* 2 */ [3, 0, 5, 6],
	/* 3 */ [2, 1, 7, 4],
	/* 4 */ [5, 6, 3, 0],
	/* 5 */ [4, 7, 1, 2],
	/* 6 */ [7, 4, 2, 1],
	/* 7 */ [6, 5, 0, 3]
];

function tileFlipH(tile, w, h) {
	tile.x = w - 1 - tile.x;
	return tile;
}

function tileFlipV(tile, w, h) {
	tile.y = h - 1 - tile.y;
	return tile;
}

function tileFlipR(tile, w, h) {
	var x = tile.x;
	tile.x = h - 1 - tile.y;
	tile.y = x;
	return tile;
}

function tileFlipC(tile, w, h) {
	var x = tile.x;
	tile.x = tile.y;
	tile.y = w - 1 - x;
	return tile;
}


var TRANSFORM_POSITION = [
	/* 0 */ tileFlipH,
	/* 1 */ tileFlipV,
	/* 2 */ tileFlipR,
	/* 3 */ tileFlipC
];

function getTransformFlag(tile) {
	return ~~tile.flipH
		 + ~~tile.flipV * 2
		 + ~~tile.flipR * 4;
}

function applyTransformFlag(tile, flag) {
	var transform = FLAG_MAP[flag];
	tile.flipH = transform.H;
	tile.flipV = transform.V;
	tile.flipR = transform.R;
}

function transformTile(tile, w, h, transformCode) {
	var flag = getTransformFlag(tile);
	applyTransformFlag(tile, TILE_TRANSFORM_MAP[flag][transformCode]);
	return TRANSFORM_POSITION[transformCode](tile, w, h);
}


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileMap.prototype._transform = function (transformCode) {
	var tiles = this.items;
	var w = this.width;
	var h = this.height;

	if (transformCode > 1) {
		// it's a rotation
		this._init(h, w);
	} else {
		this._init(w, h);
	}

	for (var x = 0; x < w; x++) {
	for (var y = 0; y < h; y++) {
		var tile = tiles[x][y];
		if (!tile) continue;
		transformTile(tile, w, h, transformCode);
		this.items[tile.x][tile.y] = tile;
	}}

	this.redraw();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileMap.prototype.flipH = function () { this._transform(0); };
TileMap.prototype.flipV = function () { this._transform(1); };
TileMap.prototype.flipR = function () { this._transform(2); };
TileMap.prototype.flipC = function () { this._transform(3); };

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
TileMap.prototype.trim = function () {
	// init bounds as an "anti-box"
	var l = this.width;
	var r = 0;
	var t = this.height;
	var b = 0;

	// find bounds
	for (var x = 0; x < this.width; x++) {
		for (var y = 0; y < this.height; y++) {
			if (this.get(x, y) === null) continue;
			l = Math.min(x, l);
			r = Math.max(x, r);
			t = Math.min(y, t);
			b = Math.max(y, b);
		}
	}

	var w = r - l + 1;
	var h = b - t + 1;
	if (w <= 0 || h <= 0) return null;
	return this.copy(l, t, w, h);
};