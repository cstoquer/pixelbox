//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */
var assetLoader = require('assetLoader');
var Texture     = require('Texture');

var settings, assets;

function clip(value, min, max) {
	return Math.max(min, Math.min(max, value));
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

var spritesheet = new SpriteSheetPanel();

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

var palette = new PalettePanel();


//███████████████████████████████████████████████████████████████████████████████
//██▄░░█░░▄███████████████████████████████████▄░█████▄█████▀█████████████████████
//███░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀████████▀▄▄▄▄▀██▀▄▄▄▀░███▄▄░████▄░▄▄▄███▀▄▄▄▄▀██▄░▀▄▄▄█
//███░█▄█░██▀▄▄▄▄░███░███░████████░▄▄▄▄▄██░████░█████░█████░██████░████░███░█████
//██▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄████████▄▀▀▀▀▀██▄▀▀▀▄░▀██▀▀░▀▀███▄▀▀▀▄██▄▀▀▀▀▄██▀░▀▀▀██
//██████████████████▀░▀██████████████████████████████████████████████████████████

function MapPanel() {
	Panel.call(this, { title: 'map editor' });
	var self = this;

	var toolbar = createDiv('panelToolbar', this.content);

	var btnSave = createDiv('panelToolButton', toolbar);

	button(btnSave, function () { self.saveMap() })

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	this._viewW = 128;
	this._viewH = 128;

	this.mapId = 0;
	// this.map = new Map(128, 32);
	this.map = new Map(16, 16);

	var PIXEL_SIZE = 3;

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
	var posX = 0;
	var posY = 0;

	function startDrag(e) {
		var startX = e.clientX - posX;
		var startY = e.clientY - posY;

		function setPosition(dom, x, y) {
			dom.style.left = x + 'px';
			dom.style.top  = y + 'px';
		};

		function dragMove(e) {
			e.preventDefault();
			posX = clip(e.clientX - startX, -(self.map.width  * 8 - self._viewW) * PIXEL_SIZE, 0);
			posY = clip(e.clientY - startY, -(self.map.height * 8 - self._viewH) * PIXEL_SIZE, 0);
			setPosition(grid, posX, posY);
			setPosition(canvas, posX, posY);
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
			if (buttons.shift) self.map.removeItem(x, y);
			else self.map.addItem(x, y, spritesheet.sprite, spritesheet.flipH, spritesheet.flipV, spritesheet.flipR);
		}

		function mouseEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', mouseMove);
		}

		document.addEventListener('mousemove', mouseMove, false);
		document.addEventListener('mouseup', mouseEnd, false);

		mouseMove(e);
	}

	button(grid, function (e) {
		if (buttons.control) startDrag(e);
		else startDraw(e);

	});
}
inherits(MapPanel, Panel);
var mapEditor = new MapPanel();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapPanel.prototype.resize = function (w, h) {
	this.map.resize(w, h);
	this._grid.style.width    = w * 8 * PIXEL_SIZE + 1 + 'px';
	this._grid.style.height   = h * 8 * PIXEL_SIZE + 1 + 'px';
	this._canvas.style.width  = w * 8 * PIXEL_SIZE + 'px';
	this._canvas.style.height = h * 8 * PIXEL_SIZE + 'px';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapPanel.prototype.saveMap = function () {
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
		// TODO display in UI
		console.log('SAVED')
		assets.maps[this.mapId] = data;
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapPanel.prototype.loadMap = function () {
	//self.map.load(self.map.save()); // TODO
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
assetLoader.loadJson('settings.json', function onSettingsLoaded(error, result) {
	if (error) return console.error(error);
	settings = result;
	assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
		if (error) return console.error(error);
		assets = result;
		spritesheet.updateSpritesheet(assets.spritesheet);
		palette.create(settings.palette);
	});
});


