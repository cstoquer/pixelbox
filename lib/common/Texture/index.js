function createCanvas(w, h) {
	var canvas = document.createElement('canvas');
	canvas.width  = w;
	canvas.height = h;
	return canvas;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Texture(w, h) {
	this.canvas  = createCanvas(w, h);
	this.ctx     = this.canvas.getContext('2d');
	this._cursor = { i: 0, j: 0 };
	this._paper  = 0;
	this._pen    = 1;

	// TODO camera offset

	this.ctx.fillStyle   = this.palette[0];
	this.ctx.strokeStyle = this.palette[1];
}
module.exports = Texture;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype._isTexture = true;
Texture.prototype.palette = ['#000000', '#FFFFFF']; // default palette
Texture.prototype.currentSpritesheet = new Texture(128, 128);
Texture.prototype.textCharset = new Texture(128 * 3, 5 * Texture.prototype.palette.length);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setPalette = function (palette) {
	Texture.prototype.palette = palette;
	Texture.prototype.textCharset = new Texture(128 * 3, 5 * palette.length);
	this.generateTextCharset();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.setSpritesheet = function (spritesheet) {
	// TODO: clear and draw
	Texture.prototype.currentSpritesheet = spritesheet;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var PI2 = Math.PI / 2;

Texture.prototype.sprite = function (sprite, x, y, flipH, flipV, rot) {
	var sx = sprite % 16;
	var sy = ~~(sprite / 16);
	var ctx = this.ctx;
	if (!flipH && !flipV && !rot) {
		ctx.drawImage(this.currentSpritesheet, sx * 8, sy * 8, 8, 8, ~~x, ~~y, 8, 8);
		return this;
	}
	ctx.save();
	x = ~~x;
	y = ~~y;

	if (flipH) {
		ctx.scale(-1, 1);
		x *= -1;
		x -= 8;
	}

	if (flipV) {
		ctx.scale(1, -1);
		y *= -1
		y -= 8;
	}

	if (rot) {
		ctx.translate(x + 8, y);
		ctx.rotate(PI2);
	} else {
		ctx.translate(x, y);
	}

	ctx.drawImage(this.currentSpritesheet, sx * 8, sy * 8, 8, 8, 0, 0, 8, 8);
	ctx.restore();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.draw = function (img, x, y) {
	if (img._isMap) img = img.texture.canvas;
	if (img._isTexture) img = img.canvas;
	this.ctx.drawImage(img, ~~x, ~~y);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.clear = function () {
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.cls = function () {
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.locate(0, 0);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// colors

Texture.prototype.pen = function (p) {
	this._pen = p % this.palette.length;
	this.ctx.strokeStyle = this.palette[this._pen];
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.paper = function (p) {
	this._paper = p % this.palette.length;
	this.ctx.fillStyle = this.palette[this._paper];
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// shape

Texture.prototype.rect = function (x, y, w, h) {
	this.ctx.strokeRect(~~x + 0.5, ~~y + 0.5, w - 1, h - 1);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.rectfill = function (x, y, w, h) {
	this.ctx.fillRect(~~x, ~~y, w, h);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// text

Texture.prototype.locate = function (i, j) {
	this._cursor.i = ~~i;
	this._cursor.j = ~~j;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
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
		x = ~~x;
		y = ~~y;
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
		if (this._cursor.j > 20) {
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
			this._cursor.j * 6 + 1,
			3, 5
		);
		this._cursor.i += 1;
		if (this._cursor.i > 32) {
			this._cursor.i = 0;
			this._cursor.j += 1;
		}
	}
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
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
	this.ctx.fillRect(0, this.canvas.height - n, this.canvas.width, n + 2);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// text charset generation

function getTextCharcodes(t) {
	var canvas = t.canvas;
	var ctx = t.ctx;
	var charcodes = [];
	for (var chr = 0; chr < 128; chr++) {
		var imageData = ctx.getImageData(chr * 3, 0, 3, 5);
		var pixels = imageData.data;
		var code = 0;
		var bit = 0;
		for (var i = 0, len = pixels.length; i < len; i += 4) {
			var pixel = pixels[i]; // only the first pixel is enough
			if (pixel > 0) {
				code += 1 << bit;
			}
			bit += 1;
		}
		charcodes.push(code);
	}

	return charcodes;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Texture.prototype.generateTextCharset = function () {
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

	var ctx = Texture.prototype.textCharset.ctx;

	for (var pen = 0; pen < this.palette.length; pen++) {
		ctx.fillStyle = this.palette[pen];
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
	ctx.fillStyle = this.palette[0];
};

// generate text for the default palette
Texture.prototype.generateTextCharset();


