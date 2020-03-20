//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Sprite(img, path, x, y, width, height, pivotX, pivotY) {
	this.img    = img; // direct reference to the image (or canvas) object
	this.path   = path;
	this.x      = x;
	this.y      = y;
	this.width  = width;
	this.height = height;
	this.pivotX = pivotX || 0;
	this.pivotY = pivotY || 0;
}
Sprite.prototype._isSprite = true;

module.exports = Sprite;