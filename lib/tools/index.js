//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */
var assetLoader = require('assetLoader');
var Texture     = require('Texture');



//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// dom utilities
var DOCUMENT_BODY = document.getElementsByTagName('body')[0];
function createDom(type, className, parent) {
	parent = parent || DOCUMENT_BODY;
	var dom = document.createElement(type);
	parent.appendChild(dom);
	if (className) dom.className = className;
	return dom;
}

function createDiv(className, parent) {
	return createDom('div', className, parent);
}

function removeDom(dom, parent) {
	parent = parent || DOCUMENT_BODY;
	parent.removeChild(dom);
}

function button(dom, onClic) {
	dom.addEventListener('mousedown', function (e) {
		e.stopPropagation();
		e.preventDefault();
		onClic(dom, e);
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var panels = [];
var zIndex = 0;
function startDrag(panel, e) {
	var d = document;

	var startX = e.clientX - panel.x;
	var startY = e.clientY - panel.y;;

	function dragMove(e) {
		e.preventDefault();
		panel.dom.style.zIndex = ++zIndex;
		panel.setPosition(e.clientX - startX, e.clientY - startY);
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup', dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup', dragEnd, false);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Panel(params) {
	params = params || {};
	var t = this;
	var d = t.dom = createDiv('panel', null);
	t.x = 0;
	t.y = 0;
	t._expanded = true;

	var handle = createDiv('panelHandle', d);
	var closeBtn = createDiv('panelCloseButton', handle);
	var title = createDiv('panelTitle', handle);
	if (params.title) title.innerText = params.title;
	button(handle, function (h, e) {
		startDrag(t, e);
	});

	button(closeBtn, function (b, e) {
		t.toggleExpand();
	});

	t.content = createDiv('panelContent', d);
	panels.push(t);
}

Panel.prototype.setPosition = function (x, y) {
	this.x = x;
	this.y = y;
	this.dom.style.left = x + 'px';
	this.dom.style.top  = y + 'px';
	return this;
};

Panel.prototype.toggleExpand = function () {
	this._expanded = !this._expanded;
	this.content.style.display = this._expanded ? '' : 'none';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function SpriteSheetPanel() {
	Panel.call(this, { title: 'spritesheet' });

	this.sprite = 0;
	this.flipH  = false;
	this.flipV  = false;
	this.flipR  = false;

	var self = this;

	var toolbar = createDiv('panelToolbar', this.content);

	var btnFlipH = createDiv('panelToolButton', toolbar);
	var btnFlipV = createDiv('panelToolButton', toolbar);
	var btnFlipR = createDiv('panelToolButton', toolbar);

	btnFlipH.style.backgroundImage = 'url("iconFlipH.png")';
	btnFlipV.style.backgroundImage = 'url("iconFlipV.png")';
	btnFlipR.style.backgroundImage = 'url("iconFlipR.png")';

	button(btnFlipH, function () { self.flipH = !self.flipH; btnFlipH.style.backgroundColor = self.flipH ? '#FF2' : '#AAA'; self.updateSprite(); });
	button(btnFlipV, function () { self.flipV = !self.flipV; btnFlipV.style.backgroundColor = self.flipV ? '#FF2' : '#AAA'; self.updateSprite(); });
	button(btnFlipR, function () { self.flipR = !self.flipR; btnFlipR.style.backgroundColor = self.flipR ? '#FF2' : '#AAA'; self.updateSprite(); });

	this.info = createDiv('spritesheetInfos', toolbar);

	var spritesheet = createDiv('spritesheet', this.content);
	var canvas      = createDom('canvas', 'spritesheetInner', spritesheet);
	var grid        = createDiv('spritesheetInner spritesheetGrid', spritesheet);
	var cursor      = createDiv('spritesheetCursor', spritesheet);

	this.ctx = canvas.getContext('2d');

	this.cursorTexture = new Texture(8, 8);
	var cursorCanvas = this.cursorTexture.canvas;
	cursorCanvas.style.width  = '24px';
	cursorCanvas.style.height = '24px';
	cursorCanvas.style.top    = '5px';
	cursorCanvas.style.left   = '5px';
	cursorCanvas.style.position  = 'absolute';
	cursor.appendChild(cursorCanvas);

	var SIZE = 128 * 3;

	canvas.width  = 128;
	canvas.height = 128;
	canvas.style.width  = SIZE + 'px';
	canvas.style.height = SIZE + 'px';

	button(spritesheet, function (d, e) {
		if (e.target !== grid) return;
		var sx = ~~(e.layerX / 24);
		var sy = ~~(e.layerY / 24);
		cursor.style.left = (sx * 24 - 5) + 'px';
		cursor.style.top  = (sy * 24 - 5) + 'px';
		self.updateInfos(sx, sy);
	});

	this.updateInfos(0, 0);
}
inherits(SpriteSheetPanel, Panel);

SpriteSheetPanel.prototype.updateSpritesheet = function (img) {
	Texture.prototype.setSpritesheet(img);
	this.ctx.drawImage(img, 0, 0);
};

SpriteSheetPanel.prototype.updateInfos = function (sx, sy) {
	var sprite = this.sprite = sy * 16 + sx;
	var hexa = ('0' + sprite.toString(16).toLocaleUpperCase()).slice(-2);
	this.info.innerText = sprite + ' (0x' + hexa + ')';
	this.updateSprite();
};

SpriteSheetPanel.prototype.updateSprite = function () {
	this.cursorTexture.clear().sprite(this.sprite, 0, 0, this.flipH, this.flipV, this.flipR);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function PalettePanel() {
	Panel.call(this, { title: 'palette' });

	this.canvas = createDiv('paletteCanvas', this.content);
	this.cells = [];
}
inherits(PalettePanel, Panel);

PalettePanel.prototype.create = function (colors) {
	for (var i = 0; i < colors.length; i++) {
		var cell = createDiv('paletteCell', this.canvas);
		cell.style.backgroundColor = colors[i];
		createDiv('paletteCellNumber', cell).innerText = i;
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapPanel() {
	Panel.call(this, { title: 'palette' });

}
inherits(MapPanel, Panel);


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var spritesheet = new SpriteSheetPanel();
var palette = new PalettePanel();


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
assetLoader.loadJson('settings.json', function onSettingsLoaded(error, settings) {
	if (error) return console.error(error);
	assetLoader.preloadStaticAssets(function onAssetsLoaded(error, assets) {
		if (error) return console.error(error);
		spritesheet.updateSpritesheet(assets.spritesheet);
		palette.create(settings.palette);
	});
});


