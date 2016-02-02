//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */
var assetLoader = require('assetLoader');
var Texture     = require('Texture');

var settings, assets;
var spritesheet, palette, mapEditor, mapList;

var MAP_MAX_UNDO = 5;

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
	button(handle, function (e) {
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

//█████████████████████████████████████████████████████████████████████████████████████████
//██▀▄▄▄▀░█████████████████████▄█████▀██████████████▀▄▄▄▀░██▄░███████████████████████▀█████
//██▄▀▀▀▀███▄░▀▄▄▀██▄░▀▄▄▄███▄▄░████▄░▄▄▄███▀▄▄▄▄▀██▄▀▀▀▀████░▀▄▄▀██▀▄▄▄▄▀██▀▄▄▄▄▀██▄░▄▄▄██
//███████░███░███░███░█████████░█████░██████░▄▄▄▄▄███████░███░███░██░▄▄▄▄▄██░▄▄▄▄▄███░█████
//██░▄▀▀▀▄███░▀▀▀▄██▀░▀▀▀████▀▀░▀▀███▄▀▀▀▄██▄▀▀▀▀▀██░▄▀▀▀▄██▀░▀█▀░▀█▄▀▀▀▀▀██▄▀▀▀▀▀███▄▀▀▀▄█
//██████████▀░▀████████████████████████████████████████████████████████████████████████████

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

	this.info = createDiv('panelInfos', toolbar);

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

	button(spritesheet, function (e) {
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

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSpritesheet = function (img) {
	Texture.prototype.setSpritesheet(img);
	this.ctx.drawImage(img, 0, 0);
	this.updateSprite();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateInfos = function (sx, sy) {
	var sprite = this.sprite = sy * 16 + sx;
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
	var self = this;

	this.mapId = 0;
	this.history = [];
	this.map = new Map(16, 16);

	this._viewW = 128;
	this._viewH = 128;

	var toolbar = createDiv('panelToolbar', this.content);

	this._saved = false;

	this.btnSave = createDiv('panelToolButton', toolbar);
	this.btnSave.style.backgroundImage = 'url("iconStore.png")';
	button(this.btnSave, function saveMap() { self.saveMap(); });


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	this.settings = createDiv('mapSettings', this.content);
	this.settings.style.display = 'none';

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
		var w = ~~(self.inputWidth.value)  || 1;
		var h = ~~(self.inputHeight.value) || 1;
		var name = self.inputName.value;
		self.settings.style.display = 'none';
		if (w === self.map.width && h === self.map.height && self.map.name === name) return;
		self.map.name = name;
		self.resize(w, h);
		self._updateInfos();
	});

	var btnSettings = createDiv('panelToolButton', toolbar);
	btnSettings.style.backgroundImage = 'url("iconMore.png")';
	
	button(btnSettings, function toggleSettingDisplay() {
		var style = self.settings.style;
		style.display = style.display === '' ? 'none' : '';
	});

	var btnClear = createDiv('panelToolButton', toolbar);
	btnClear.style.backgroundImage = 'url("iconClear.png")';
	button(btnClear, function clearMap() {
		self.addHistory();
		self.map.clear();
		self._saved = false;
		self._updateSaveButton();
	});

	var btnUndo = createDiv('panelToolButton', toolbar);
	btnUndo.style.backgroundImage = 'url("iconUndo.png")';
	button(btnUndo, function undo() { self.undo(); });


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

	this.info = createDiv('panelInfos', toolbar);

	var PIXEL_SIZE = this.pixelSize = 3;

	var clipSurface = createDiv('mapClipSurface', this.content);
	clipSurface.style.width  = this._viewW * PIXEL_SIZE + 1 + 'px';
	clipSurface.style.height = this._viewH * PIXEL_SIZE + 1 + 'px';

	var grid = createDiv('mapGrid', clipSurface);
	grid.style.width  = this.map.width  * 8 * PIXEL_SIZE + 1 + 'px';
	grid.style.height = this.map.height * 8 * PIXEL_SIZE + 1 + 'px';

	var canvas = this.map.texture.canvas;
	canvas.style.width  = this.map.width  * 8 * PIXEL_SIZE + 'px';
	canvas.style.height = this.map.height * 8 * PIXEL_SIZE + 'px';
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
		var startX = e.clientX - self._posX;
		var startY = e.clientY - self._posY;

		function setPosition(dom, x, y) {
			dom.style.left = x + 'px';
			dom.style.top  = y + 'px';
		};

		function dragMove(e) {
			e.preventDefault();
			self._posX = clip(e.clientX - startX, -(self.map.width  * 8 - self._viewW) * PIXEL_SIZE, 0);
			self._posY = clip(e.clientY - startY, -(self.map.height * 8 - self._viewH) * PIXEL_SIZE, 0);
			setPosition(grid,   self._posX, self._posY);
			setPosition(canvas, self._posX, self._posY);
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
			var x = ~~(e.layerX / 8 / PIXEL_SIZE);
			var y = ~~(e.layerY / 8 / PIXEL_SIZE);
			if (x === prevX && y === prevY) return;
			prevX = x;
			prevY = y;
			if (buttons.shift) self.map.remove(x, y);
			else self.map.set(x, y, spritesheet.sprite, spritesheet.flipH, spritesheet.flipV, spritesheet.flipR);
		}

		function mouseEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', mouseMove);
		}

		document.addEventListener('mousemove', mouseMove, false);
		document.addEventListener('mouseup', mouseEnd, false);

		self.addHistory();

		mouseMove(e);
		if (self._saved) {
			self._saved = false;
			self._updateSaveButton();
		}
	}

	button(grid, function (e) {
		if (buttons.control) startDrag(e);
		else startDraw(e);
	});

	this.resize(16, 16); // FIXME
}
inherits(MapEditorPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resize = function (w, h) {
	var PIXEL_SIZE = this.pixelSize;

	this.map.resize(w, h);

	this._posX = clip(this._posX, -(w * 8 - this._viewW) * PIXEL_SIZE, 0);
	this._posY = clip(this._posY, -(h * 8 - this._viewH) * PIXEL_SIZE, 0);

	this._grid.style.width    = w * 8 * PIXEL_SIZE + 1 + 'px';
	this._grid.style.height   = h * 8 * PIXEL_SIZE + 1 + 'px';
	this._grid.style.left = this._posX + 'px';
	this._grid.style.top  = this._posY + 'px';

	this._canvas.style.width  = w * 8 * PIXEL_SIZE + 'px';
	this._canvas.style.height = h * 8 * PIXEL_SIZE + 'px';
	this._canvas.style.left = this._posX + 'px';
	this._canvas.style.top  = this._posY + 'px';

	this.inputWidth.value = w;
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
MapEditorPanel.prototype.saveMap = function () {
	if (this._saved) return;
	var self = this;

	var data = this.map.save();
	var request = {
		request: 'saveMap',
		mapId: this.mapId,
		data: data
	};
	// send data to the server
	assetLoader.sendRequest(request, function (error) {
		if (error) {
			// TODO display in UI
			return console.error(error);
		}
		// copy data in assets
		if (!assets.maps[self.mapId]) {
			assets.maps[self.mapId] = {};
			mapList.addMap(assets.maps[self.mapId]);
		}
		copyObject(data, assets.maps[self.mapId]);

		self._saved = true;
		self._updateSaveButton();
		mapList.updateItem(self.mapId);
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
	var self = this;

	this.dom = createDiv('mapListItem', parent);
	this.map = map;
	this.index = index;

	this.idxDom = createDom('spawn', 'mapListItemIndex', this.dom);
	this.name = createDom('spawn', 'mapListItemName',  this.dom);

	button(this.dom, function () {
		if (mapEditor.mapId === self.index) return;
		mapEditor.mapId = self.index;
		mapEditor.loadMap(self.map);
	});

	this.update();
}

MapListItem.prototype.update = function () {
	this.idxDom.innerText = this.index;
	var name = this.map.name;
	this.name.innerText = name || 'undefined';
	this.name.style.fontStyle = name ? '' : 'italic';
	this.name.style.color = name ? '' : '#AAA';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapListPanel() {
	Panel.call(this, { title: 'maps' });
	var self = this;

	var toolbar = createDiv('panelToolbar', this.content);
	var btnNew = createDiv('panelToolButton', toolbar);
	btnNew.style.backgroundImage = 'url("iconNew.png")';
	button(btnNew, function () { self.createNew(); });

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
	var self = this;
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
		if (error) {
			// TODO display in UI
			return console.error(error);
		}
		assets.maps[mapId] = data;
		self.addMap(data);
	});
};

MapListPanel.prototype.updateItem = function (index) {
	this.elems[index].update();
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
assetLoader.loadJson('settings.json', function onSettingsLoaded(error, result) {
	if (error) return console.error(error);
	settings = result;
	assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
		if (error) return console.error(error);
		assets = result;
		spritesheet.updateSpritesheet(assets.spritesheet);
		palette.create(settings.palette);
		mapList.setup(assets.maps);
		if (assets.maps[0]) mapEditor.loadMap(assets.maps[0]);
	});
});


