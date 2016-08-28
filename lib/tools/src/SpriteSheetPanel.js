var Panel        = require('./Panel.js');
var addTooltip   = require('./tooltip.js');
var gridImages   = require('./grid.js');
var dragManager  = require('./dragManager.js');
var Texture      = require('../../common/Texture');
var inherits     = require('../../common/inherits');
var domUtils     = require('../../common/domUtils');

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;

var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE    = settings.PIXEL_SIZE;
var SPRITES_PER_LINE = 16;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function SpriteSheetPanel() {
	Panel.call(this, { title: 'spritesheet' });
	var t = this;

	this.sprite = 0;
	this.flipH  = false;
	this.flipV  = false;
	this.flipR  = false;

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
	var canvas      = createDom('canvas', 'spritesheetInner', spritesheet);
	var grid        = createDiv('spritesheetInner spritesheetGrid', spritesheet);
	var cursor      = createDiv('spritesheetCursor', spritesheet);

	this.ctx = canvas.getContext('2d');

	var CURSOR_WIDTH  = SPRITE_WIDTH  * PIXEL_SIZE;
	var CURSOR_HEIGHT = SPRITE_HEIGHT * PIXEL_SIZE;

	cursor.style.width  = CURSOR_WIDTH  + 10 + 'px';
	cursor.style.height = CURSOR_HEIGHT + 10 + 'px';
	cursor.style.backgroundImage = gridImages.cursor;

	spritesheet.style.width  = grid.style.width  = SPRITE_WIDTH  * PIXEL_SIZE * SPRITES_PER_LINE + 1 + 'px';
	spritesheet.style.height = grid.style.height = SPRITE_HEIGHT * PIXEL_SIZE * SPRITES_PER_LINE + 1 + 'px';
	grid.style.backgroundImage = gridImages.grid;

	this.cursorTexture = new Texture(SPRITE_WIDTH, SPRITE_HEIGHT);
	var cursorCanvas = this.cursorTexture.canvas;
	cursorCanvas.style.width  = CURSOR_WIDTH  + 'px';
	cursorCanvas.style.height = CURSOR_HEIGHT + 'px';
	cursorCanvas.style.top    = '5px';
	cursorCanvas.style.left   = '5px';
	cursorCanvas.style.position  = 'absolute';
	cursor.appendChild(cursorCanvas);

	canvas.width  = SPRITE_WIDTH  * SPRITES_PER_LINE;
	canvas.height = SPRITE_HEIGHT * SPRITES_PER_LINE;
	canvas.style.width  = canvas.width  * PIXEL_SIZE + 'px';
	canvas.style.height = canvas.height * PIXEL_SIZE + 'px';

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
inherits(SpriteSheetPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragStart = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
	this.dom.style.marginTop  = '-5px';
	this.dom.style.marginLeft = '-5px';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragEnter = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #FF2';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragLeave = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragEnd = function (id, item) {
	this.dom.style.border = '';
	this.dom.style.marginTop  = '';
	this.dom.style.marginLeft = '';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.drop = function (id, item) {
	if (id === 'imageFile') this.updateSpritesheet(item);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSpritesheet = function (img, noMapUpdate) {
	Texture.prototype.setSpritesheet(img);
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.drawImage(img, 0, 0);
	this.updateSprite();
	// update map with new spritesheet
	if (noMapUpdate) return; // FIXME
	if (this.toolbox.mapEditor) this.toolbox.mapEditor.map.setSpritesheet(img);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateInfos = function (sx, sy) {
	var sprite = this.sprite = sy * SPRITES_PER_LINE + sx;
	var hexa = ('0' + sprite.toString(16).toLocaleUpperCase()).slice(-2);
	this.info.innerText = sprite + ' (0x' + hexa + ')';
	this.updateSprite();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSprite = function () {
	this.cursorTexture.clear().sprite(this.sprite, 0, 0, this.flipH, this.flipV, this.flipR);
};

module.exports = new SpriteSheetPanel();
