//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */
var assetLoader = require('assetLoader');
var Texture     = require('Texture');

var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var MAP_MAX_UNDO  = 5;
var PIXEL_SIZE    = 3;
var SPRITES_PER_LINE = 16;

(function(){
	var max = Math.max(SPRITE_WIDTH, SPRITE_HEIGHT);
	if      (max > 20) PIXEL_SIZE = 1;
	else if (max > 10) PIXEL_SIZE = 2;
})();
	

var assets;
var spritesheet, palette, mapEditor, mapList;
var currentSelectedPanel;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// grid and cursor images creation
var gridImage, cursorImage;
(function(){
	var w = SPRITE_WIDTH * PIXEL_SIZE;
	var h = SPRITE_HEIGHT * PIXEL_SIZE;
	var grid = new Texture(w, h);
	var colors = ['#E8CD64', '#8D5604'];
	var len = Math.max(w, h);
	for (var i = 0; i < len; i++) {
		grid.ctx.fillStyle = colors[i % 2];
		grid.ctx.fillRect(i, 0, 1, 1);
		grid.ctx.fillRect(0, i, 1, 1);
	}
	gridImage = 'url(' + grid.canvas.toDataURL("image/png") + ')';

	var cursor = new Texture(w + 10, h + 10);
	colors = ['#F00', '#F00', '#000', '#000', '#FFF'];
	for (var i = 0; i < colors.length; i++) {
		cursor.ctx.strokeStyle = colors[i];
		cursor.rect(i, i, w + 10 - i * 2, h + 10 - i * 2);
	}
	cursorImage = 'url(' + cursor.canvas.toDataURL("image/png") + ')';
})();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// helper functions

function clip(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function copyObject(from, to) {
	for (var key in from) {
		to[key] = from[key];
	}
}

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
		onClic(e, dom);
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// tooltip
var tooltip = createDiv('tooltip');

function addTooltip(dom, text) {
	dom.addEventListener('mouseenter', function(e) {
		tooltip.innerText = text;
		tooltip.style.display = 'block';
	});

	dom.addEventListener('mousemove', function(e) {
		tooltip.style.left = e.clientX + 10 + 'px';
		tooltip.style.top  = e.clientY + 10 + 'px';
	});

	dom.addEventListener('mouseleave', function() {
		tooltip.style.display = 'none';
	});

	return dom;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// keyboard

var buttons = {
	shift:   false,
	control: false,
	alt:     false
};

var keyMap = {
	16: 'shift',
	17: 'control',
	18: 'alt'
};

function keyChange(keyCode, isPressed) {
	var key = keyMap[keyCode];
	if (key) buttons[key] = isPressed;
}

window.addEventListener('keydown', function onKeyPressed(e) { keyChange(e.keyCode, true);  });
window.addEventListener('keyup',   function onKeyRelease(e) { keyChange(e.keyCode, false); });

// keyboard shortcuts
document.addEventListener('keydown', function (e) {
	if (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey) {
		e.preventDefault();
		switch (e.keyCode) {
			case 83 : currentSelectedPanel && currentSelectedPanel.save(); break; // S key : save
			case 90 : currentSelectedPanel && currentSelectedPanel.undo(); break; // Z key : undo
		}
	}
});


//█████████████████████████████████████████████████
//██▄░▄▄▄▀████████████████████████████▄░███████████
//███░███░██▀▄▄▄▄▀██▄░▀▄▄▀██▀▄▄▄▄▀█████░████▀▄▄▄▄░█
//███░▄▄▄███▀▄▄▄▄░███░███░██░▄▄▄▄▄█████░█████▄▄▄▄▀█
//██▀░▀█████▄▀▀▀▄░▀█▀░▀█▀░▀█▄▀▀▀▀▀███▀▀░▀▀██░▀▀▀▀▄█
//█████████████████████████████████████████████████

var panels = [];
var zIndex = 0;
function startDrag(panel, e) {
	var d = document;

	var startX = e.clientX - panel.x;
	var startY = e.clientY - panel.y;;

	function dragMove(e) {
		e.preventDefault();
		panel.setPosition(e.clientX - startX, e.clientY - startY);
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup', dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	panel.dom.style.zIndex = ++zIndex;
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

	var handle = this.handle = createDiv('panelHandle', d);
	var closeBtn = createDiv('panelCloseButton', handle);
	var title = createDiv('panelTitle', handle);
	if (params.title) title.innerText = params.title;
	button(handle, function (e) {
		t._select();
		startDrag(t, e);
	});

	button(closeBtn, function (e) {
		t.toggleExpand();
	});

	t.content = createDiv('panelContent', d);
	panels.push(t);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.setPosition = function (x, y) {
	this.x = x;
	this.y = y;
	this.dom.style.left = x + 'px';
	this.dom.style.top  = y + 'px';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.toggleExpand = function () {
	this._expanded = !this._expanded;
	this.content.style.display = this._expanded ? '' : 'none';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype._select = function () {
	currentSelectedPanel && currentSelectedPanel._deselect();
	this.handle.className = 'panelHandle panelHandleSelected';
	currentSelectedPanel = this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype._deselect = function () {
	this.handle.className = 'panelHandle';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.save = function () {
	// Virtual
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.undo = function () {
	// Virtual
};


//█████████████████████████████████████████████████████████████████████████████████████████
//██▀▄▄▄▀░█████████████████████▄█████▀██████████████▀▄▄▄▀░██▄░███████████████████████▀█████
//██▄▀▀▀▀███▄░▀▄▄▀██▄░▀▄▄▄███▄▄░████▄░▄▄▄███▀▄▄▄▄▀██▄▀▀▀▀████░▀▄▄▀██▀▄▄▄▄▀██▀▄▄▄▄▀██▄░▄▄▄██
//███████░███░███░███░█████████░█████░██████░▄▄▄▄▄███████░███░███░██░▄▄▄▄▄██░▄▄▄▄▄███░█████
//██░▄▀▀▀▄███░▀▀▀▄██▀░▀▀▀████▀▀░▀▀███▄▀▀▀▄██▄▀▀▀▀▀██░▄▀▀▀▄██▀░▀█▀░▀█▄▀▀▀▀▀██▄▀▀▀▀▀███▄▀▀▀▄█
//██████████▀░▀████████████████████████████████████████████████████████████████████████████

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

	btnFlipH.style.backgroundImage = 'url("iconFlipH.png")';
	btnFlipV.style.backgroundImage = 'url("iconFlipV.png")';
	btnFlipR.style.backgroundImage = 'url("iconFlipR.png")';

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
	cursor.style.backgroundImage = cursorImage;

	spritesheet.style.width  = grid.style.width  = SPRITE_WIDTH  * PIXEL_SIZE * SPRITES_PER_LINE + 1 + 'px';
	spritesheet.style.height = grid.style.height = SPRITE_HEIGHT * PIXEL_SIZE * SPRITES_PER_LINE + 1 + 'px';
	grid.style.backgroundImage = gridImage;

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
}
inherits(SpriteSheetPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSpritesheet = function (img) {
	Texture.prototype.setSpritesheet(img);
	this.ctx.drawImage(img, 0, 0);
	this.updateSprite();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateInfos = function (sx, sy) {
	var sprite = this.sprite = sy * SPRITES_PER_LINE + sx;
	var hexa = ('0' + sprite.toString(16).toLocaleUpperCase()).slice(-2);
	this.info.innerText = sprite + ' (0x' + hexa + ')';
	this.updateSprite();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSprite = function () {
	this.cursorTexture.clear().sprite(this.sprite, 0, 0, this.flipH, this.flipV, this.flipR);
};


//█████████████████████████████████████████████████████████
//██▄░▄▄▄▀████████████▄░█████████████▀███████▀█████████████
//███░███░██▀▄▄▄▄▀█████░████▀▄▄▄▄▀██▄░▄▄▄███▄░▄▄▄███▀▄▄▄▄▀█
//███░▄▄▄███▀▄▄▄▄░█████░████░▄▄▄▄▄███░███████░██████░▄▄▄▄▄█
//██▀░▀█████▄▀▀▀▄░▀██▀▀░▀▀██▄▀▀▀▀▀███▄▀▀▀▄███▄▀▀▀▄██▄▀▀▀▀▀█
//█████████████████████████████████████████████████████████

function PalettePanel() {
	Panel.call(this, { title: 'palette' });

	this.canvas = createDiv('paletteCanvas', this.content);
	this.cells = [];
}
inherits(PalettePanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
PalettePanel.prototype.create = function (colors) {
	for (var i = 0; i < colors.length; i++) {
		var cell = createDiv('paletteCell', this.canvas);
		cell.style.backgroundColor = colors[i];
		createDiv('paletteCellNumber', cell).innerText = i;
	}
};


//███████████████████████████████████████████████████████████████████████████████
//██▄░░█░░▄███████████████████████████████████▄░█████▄█████▀█████████████████████
//███░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀████████▀▄▄▄▄▀██▀▄▄▄▀░███▄▄░████▄░▄▄▄███▀▄▄▄▄▀██▄░▀▄▄▄█
//███░█▄█░██▀▄▄▄▄░███░███░████████░▄▄▄▄▄██░████░█████░█████░██████░████░███░█████
//██▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄████████▄▀▀▀▀▀██▄▀▀▀▄░▀██▀▀░▀▀███▄▀▀▀▄██▄▀▀▀▀▄██▀░▀▀▀██
//██████████████████▀░▀██████████████████████████████████████████████████████████

function MapEditorPanel() {
	Panel.call(this, { title: 'map editor' });
	var t = this;

	this.mapId = 0;
	this.history = [];
	this.map = new Map(16, 16);

	this._viewW = SPRITE_WIDTH  * 16;
	this._viewH = SPRITE_HEIGHT * 16;

	var toolbar = createDiv('panelToolbar', this.content);

	this._saved = false;

	this.btnSave = addTooltip(createDiv('panelToolButton', toolbar), 'Save');
	this.btnSave.style.backgroundImage = 'url("iconStore.png")';
	button(this.btnSave, function saveMap() { t.save(); });

	var btnFlagA = addTooltip(createDiv('panelToolButton', toolbar), 'Flag A');
	btnFlagA.style.backgroundImage = 'url("iconFlagA.png")';
	var btnFlagB = addTooltip(createDiv('panelToolButton', toolbar), 'Flag B');
	btnFlagB.style.backgroundImage = 'url("iconFlagB.png")';

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	this.settings = createDiv('mapSettings', this.content);
	this.settings.style.display = 'none';
	this.settings.style.width  = this._viewW * PIXEL_SIZE + 1 + 'px';
	this.settings.style.height = this._viewH * PIXEL_SIZE + 1 + 'px';

	createDiv('mapSettingsTitle', this.settings).innerText = 'name';
	var nameInputs = createDiv(null, this.settings);
	this.inputName = createDom('input', 'mapInput', nameInputs);

	createDiv('mapSettingsTitle', this.settings).innerText = 'size';
	var sizeInputs = createDiv(null, this.settings);
	this.inputWidth  = createDom('input', 'mapSizeInput mapInput', sizeInputs);
	createDom('spawn', null, sizeInputs).innerText = 'x';
	this.inputHeight = createDom('input', 'mapSizeInput mapInput', sizeInputs);

	var okButton = createDiv('mapSettingsButton', this.settings);
	okButton.innerText = 'ok';
	button(okButton, function () {
		var w = ~~(t.inputWidth.value)  || 1;
		var h = ~~(t.inputHeight.value) || 1;
		var name = t.inputName.value;
		t.settings.style.display = 'none';
		if (w === t.map.width && h === t.map.height && t.map.name === name) return;
		t.map.name = name;
		t.resize(w, h);
		t._updateInfos();
		t.save();
	});

	var btnSettings = addTooltip(createDiv('panelToolButton', toolbar), 'Settings');
	btnSettings.style.backgroundImage = 'url("iconMore.png")';
	
	button(btnSettings, function toggleSettingDisplay() {
		var style = t.settings.style;
		style.display = style.display === '' ? 'none' : '';
	});

	var btnClear = addTooltip(createDiv('panelToolButton', toolbar), 'Clear');
	btnClear.style.backgroundImage = 'url("iconClear.png")';
	button(btnClear, function clearMap() {
		t.addHistory();
		t.map.clear();
		t._saved = false;
		t._updateSaveButton();
	});

	var btnUndo = addTooltip(createDiv('panelToolButton', toolbar), 'Undo');
	btnUndo.style.backgroundImage = 'url("iconUndo.png")';
	button(btnUndo, function undo() { t.undo(); });


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

	this.info = createDiv('panelInfos', toolbar);

	var clipSurface = createDiv('mapClipSurface', this.content);
	clipSurface.style.width  = this._viewW * PIXEL_SIZE + 1 + 'px';
	clipSurface.style.height = this._viewH * PIXEL_SIZE + 1 + 'px';

	var grid = createDiv('mapGrid', clipSurface);
	grid.style.width  = this.map.width  * SPRITE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	grid.style.height = this.map.height * SPRITE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	grid.style.backgroundImage = gridImage;

	var canvas = this.map.texture.canvas;
	canvas.style.width  = this.map.width  * SPRITE_WIDTH  * PIXEL_SIZE + 'px';
	canvas.style.height = this.map.height * SPRITE_HEIGHT * PIXEL_SIZE + 'px';
	canvas.style.top    = '0px';
	canvas.style.left   = '0px';
	canvas.style.position  = 'absolute';
	clipSurface.appendChild(canvas);

	this._grid = grid;
	this._canvas = canvas;

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	this._posX = 0;
	this._posY = 0;

	function startDrag(e) {
		var startX = e.clientX - t._posX;
		var startY = e.clientY - t._posY;

		function setPosition(dom, x, y) {
			dom.style.left = x + 'px';
			dom.style.top  = y + 'px';
		};

		function dragMove(e) {
			e.preventDefault();
			t._posX = clip(e.clientX - startX, -(t.map.width  * SPRITE_WIDTH  - t._viewW) * PIXEL_SIZE, 0);
			t._posY = clip(e.clientY - startY, -(t.map.height * SPRITE_HEIGHT - t._viewH) * PIXEL_SIZE, 0);
			setPosition(grid,   t._posX, t._posY);
			setPosition(canvas, t._posX, t._posY);
		}

		function dragEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup', dragEnd);
			document.removeEventListener('mousemove', dragMove);
		}

		document.addEventListener('mousemove', dragMove, false);
		document.addEventListener('mouseup', dragEnd, false);
	}


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	function startDraw(e) {
		var prevX = null;
		var prevY = null;

		function mouseMove(e) {
			e.preventDefault();
			var x = ~~(e.layerX / SPRITE_WIDTH  / PIXEL_SIZE);
			var y = ~~(e.layerY / SPRITE_HEIGHT / PIXEL_SIZE);
			if (x === prevX && y === prevY) return;
			prevX = x;
			prevY = y;
			if (buttons.shift) t.map.remove(x, y);
			else t.map.set(x, y, spritesheet.sprite, spritesheet.flipH, spritesheet.flipV, spritesheet.flipR);
		}

		function mouseEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', mouseMove);
		}

		document.addEventListener('mousemove', mouseMove, false);
		document.addEventListener('mouseup', mouseEnd, false);

		t.addHistory();

		mouseMove(e);
		if (t._saved) {
			t._saved = false;
			t._updateSaveButton();
		}
	}

	// mouse cursor style
	document.addEventListener('keydown', function(e) {
		switch (e.keyCode) {
			case 16:  // shift
				clipSurface.classList.add('erase');
				break;
			case 18:  // alt
				clipSurface.classList.add('move');
				break;
		}
	});

	document.addEventListener('keyup', function(e) {
		switch (e.keyCode) {
			case 16:  // shift
				clipSurface.classList.remove('erase');
				break;
			case 18:  // alt
				clipSurface.classList.remove('move');
				break;
		}
	});

	button(grid, function (e) {
		if (buttons.alt) startDrag(e);
		else startDraw(e);
	});

	this.resize(16, 16); // FIXME
}
inherits(MapEditorPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resize = function (w, h) {

	this.map.resize(w, h);

	this._posX = clip(this._posX, -(w * SPRITE_WIDTH  - this._viewW) * PIXEL_SIZE, 0);
	this._posY = clip(this._posY, -(h * SPRITE_HEIGHT - this._viewH) * PIXEL_SIZE, 0);

	this._grid.style.width  = w * SPRITE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	this._grid.style.height = h * SPRITE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	this._grid.style.left = this._posX + 'px';
	this._grid.style.top  = this._posY + 'px';

	this._canvas.style.width  = w * SPRITE_WIDTH  * PIXEL_SIZE + 'px';
	this._canvas.style.height = h * SPRITE_HEIGHT * PIXEL_SIZE + 'px';
	this._canvas.style.left = this._posX + 'px';
	this._canvas.style.top  = this._posY + 'px';

	this.inputWidth.value  = w;
	this.inputHeight.value = h;
	this._saved = false;
	this._updateInfos();
	this._updateSaveButton();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype._updateInfos = function () {
	this.info.innerText = '#' + this.mapId + ' [' + this.map.width + 'x' + this.map.height + '] ' + this.map.name;
	this.inputName.value = this.map.name;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype._updateSaveButton = function () {
	this.btnSave.style.backgroundColor = this._saved ? '#FF2' : '#AAA';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.save = function () {
	if (this._saved) return;
	var t = this;

	var data = this.map.save();
	var request = {
		request: 'saveMap',
		mapId: this.mapId,
		data: data
	};
	// send data to the server
	assetLoader.sendRequest(request, function (error) {
		if (error) return alert(error);
		// copy data in assets
		if (!assets.maps[t.mapId]) {
			assets.maps[t.mapId] = {};
			mapList.addMap(assets.maps[t.mapId]);
		}
		copyObject(data, assets.maps[t.mapId]);

		t._saved = true;
		t._updateSaveButton();
		mapList.updateItem(t.mapId);
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.loadMap = function (data) {
	this.resize(data.w, data.h);
	this.map.load(data);
	this._saved = true;
	this._updateSaveButton();
	this._updateInfos();
	this.history = [];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.addHistory = function () {
	this.history.push(this.map.clone());
	if (this.history.length > MAP_MAX_UNDO) this.history.shift();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.undo = function () {
	if (!this.history.length) return;
	this.map.copy(this.history.pop());
	this._saved = false;
	this._updateSaveButton();
};

//█████████████████████████████████████████████████████████
//██▄░░█░░▄█████████████████▄░▄████████▄█████████████▀█████
//███░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀███░███████▄▄░████▀▄▄▄▄░██▄░▄▄▄██
//███░█▄█░██▀▄▄▄▄░███░███░███░███▀█████░█████▄▄▄▄▀███░█████
//██▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄██▀░▀▀▀░███▀▀░▀▀██░▀▀▀▀▄███▄▀▀▀▄█
//██████████████████▀░▀████████████████████████████████████

function MapListItem(index, map, parent) {
	var t = this;

	this.dom = createDiv('mapListItem', parent);
	this.map = map;
	this.index = index;
	this.parent = parent;

	this.idxDom = createDom('spawn', 'mapListItemIndex', this.dom);
	this.name = createDom('spawn', 'mapListItemName',  this.dom);
	var delBtn = createDiv('mapListItemCloseButton', this.dom);

	button(this.dom, function () {
		if (mapEditor.mapId === t.index) return;
		mapEditor.mapId = t.index;
		mapEditor.loadMap(t.map);
	});

	button(this.idxDom, function (e) {
		mapList.startDrag(t, e);
	});

	button(delBtn, function () {
		mapList.deleteItem(t);
	});

	this.update();
}

MapListItem.prototype.setMap = function (index, map) {
	this.index = index;
	this.map = map;
	this.update();
};

MapListItem.prototype.update = function () {
	this.idxDom.innerText = this.index;
	var name = this.map.name;
	this.name.innerText = name || 'undefined';
	this.name.style.fontStyle = name ? '' : 'italic';
	this.name.style.color = name ? '' : '#AAA';
};

MapListItem.prototype.destroy = function () {
	removeDom(this.dom, this.parent);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapListPanel() {
	Panel.call(this, { title: 'maps' });
	var t = this;

	var toolbar = createDiv('panelToolbar', this.content);
	var btnNew = addTooltip(createDiv('panelToolButton', toolbar), 'New map');
	btnNew.style.backgroundImage = 'url("iconNew.png")';
	button(btnNew, function () { t.createNew(); });

	this.list = createDiv('mapListContent', this.content);
	this.elems = [];
}
inherits(MapListPanel, Panel);

MapListPanel.prototype.addMap = function (map) {
	var index = this.elems.length;
	this.elems.push(new MapListItem(index, map, this.list));
};

MapListPanel.prototype.setup = function (maps) {
	for (var i = 0; i < maps.length; i++) {
		this.addMap(maps[i]);
	}
};

MapListPanel.prototype.createNew = function () {
	// TODO lock if saving
	var t = this;
	var map = new Map(16, 16);
	var mapId = assets.maps.length;
	var data = map.save();
	var request = {
		request: 'saveMap',
		mapId: mapId,
		data: data
	};
	// send request to the server
	assetLoader.sendRequest(request, function (error) {
		if (error) return alert(error);
		assets.maps[mapId] = data;
		t.addMap(data);
	});
};

MapListPanel.prototype.updateItem = function (index) {
	this.elems[index].update();
};

MapListPanel.prototype.reIndex = function () {
	for (var i = 0; i < this.elems.length; i++) {
		this.elems[i].setMap(i, assets.maps[i]);
	}
};

MapListPanel.prototype.deleteItem = function (item) {
	var t = this;
	var mapId = item.index;
	assetLoader.sendRequest({ request: 'deleteMap', mapId: mapId }, function (error) {
		if (error) return alert(error);
		item.destroy();
		assets.maps.splice(mapId, 1);
		t.elems.splice(mapId, 1);
		t.reIndex();
	});
};

MapListPanel.prototype.startDrag = function (item, e) {
	var d = document;
	var t = this;

	var mapId = item.index;

	// TODO create dragable object in MapListPanel's constructor
	var dummy = createDiv('mapListItem mapListItemDrag');
	createDom('spawn', 'mapListItemIndex', dummy).innerText = item.index;
	createDom('spawn', 'mapListItemName',  dummy).innerText = item.map.name || 'undefined';
	dummy.style.zIndex = ++zIndex;

	function setDummyPosition(e) {
		e.preventDefault();
		dummy.style.left = e.clientX + 'px';
		dummy.style.top  = e.clientY + 'px';
	}

	setDummyPosition(e);

	function dragMove(e) {
		setDummyPosition(e);
		// TODO css animations
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup', dragEnd);
		d.removeEventListener('mousemove', dragMove);

		// TODO: get scroll
		var to = ~~((e.clientY - t.y) / 20 - 2);
		to = clip(to, 0, assets.maps.length - 1);

		item.dom.style.display = '';
		removeDom(dummy);

		assetLoader.sendRequest({ request: 'moveMap', mapId: mapId, to: to }, function (error) {
			if (error) return alert(error);
			assets.maps.splice(to, 0, assets.maps.splice(mapId, 1).pop());
			t.reIndex();
		});
	}

	item.dom.style.display = 'none';
	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup', dragEnd, false);
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// create panels and set initial positions

spritesheet = new SpriteSheetPanel();
palette     = new PalettePanel();
mapEditor   = new MapEditorPanel();
mapList     = new MapListPanel();

spritesheet.setPosition(566,   0);
palette.setPosition    (173, 440);
mapEditor.setPosition  (173,   0);
mapList.setPosition    (  0,   0);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
	if (error) return console.error(error);
	assets = result;
	spritesheet.updateSpritesheet(assets.spritesheet);
	palette.create(settings.palette);
	mapList.setup(assets.maps);
	if (assets.maps[0]) mapEditor.loadMap(assets.maps[0]);
});


