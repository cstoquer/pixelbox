var RGB_REGEXP = /rgba?\(\s*([.0-9]+)\s*,\s*([.0-9]+)\s*,\s*([.0-9]+)\s*,?\s*([.0-9]+)?\s*\)/;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Color() {
	// RGB values as int8 (0..255)
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = undefined;

	// CSS string
	this.string = '';
}
module.exports = Color;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Color.prototype._setRGB = function (r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Color.prototype.fromPixel = function (pixels, offset) {
	var r = pixels[offset + 0];
	var g = pixels[offset + 1];
	var b = pixels[offset + 2];

	this.string = 'rgb(' + r + ',' + g + ',' + b + ')';
	this._setRGB(r, g, b);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Color.prototype.fromString = function (str) {
	this.string = str;

	var r, g, b;

	// try to parse `rgb()` type string
	var match = str.match(RGB_REGEXP);

	if (match) {
		r = ~~match[1];
		g = ~~match[2];
		b = ~~match[3];
		this._setRGB(r, g, b);
	} else {
		// parse HEX color
		var a = '0x' + str.slice(1).replace(str.length < 5 && /./g, '$&$&');
		this._setRGB(a >> 16, a >> 8 & 255, a & 255);
	}

	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Color.prototype.fromRGB = function (r, g, b) {
	this._setRGB(r, g, b);
	this.string = 'rgb(' + r + ',' + g + ',' + b + ')';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Color.prototype.fromColor = function (color) {
	this.r = color.r;
	this.g = color.g;
	this.b = color.b;
	this.a = color.a;

	// CSS string
	this.string = color.string;
	return this;
};
