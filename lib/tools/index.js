//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */
var assetLoader  = require('assetLoader');
var Texture      = require('Texture');
var EventEmitter = require('EventEmitter');

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

var buttons = new EventEmitter();
buttons.shift   = false;
buttons.control = false;
buttons.alt     = false;

var keyMap = {
	16: 'shift',
	17: 'control',
	18: 'alt'
};

function keyChange(e, isPressed) {
	var key = keyMap[e.keyCode];
	if (key) buttons[key] = isPressed;

	// keyboard shortcuts
	var ctrlKey = isPressed && navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;
	switch (e.keyCode) {
		case 83 : ctrlKey && currentSelectedPanel && currentSelectedPanel.save(); break; // S key : save
		case 90 : ctrlKey && currentSelectedPanel && currentSelectedPanel.undo(); break; // Z key : undo
		case 16 : buttons.emit('shift', isPressed); break;
		case 18 : buttons.emit('alt',   isPressed); break;
		case 32 : buttons.emit('space', isPressed); break;
		case 88 : buttons.emit('x',     isPressed); break;
		case 67 : buttons.emit('c',     isPressed); break;
		case 86 : buttons.emit('v',     isPressed); break;
	}
}

window.addEventListener('keydown', function onKeyPressed(e) { keyChange(e, true);  });
window.addEventListener('keyup',   function onKeyRelease(e) { keyChange(e, false); });

//█████████████████████████████████████████████████████████████████████████████████
//█████▄░██████████████████████████████████▀▀▀████████████▄░███████████████████████
//█▀▄▄▄▀░██▄░▀▄▄▄█▀▄▄▄▄▀██▀▄▄▄▀░▄█████████░███████████▀▄▄▄▀░██▄░▀▄▄▄█▀▄▄▄▄▀█▄░▀▄▄▀█
//█░████░███░█████▀▄▄▄▄░██░████░█████████▀▄░█▀████████░████░███░█████░████░██░███░█
//█▄▀▀▀▄░▀█▀░▀▀▀██▄▀▀▀▄░▀█▄▀▀▀▄░█████████▄▀▀░▀████████▄▀▀▀▄░▀█▀░▀▀▀██▄▀▀▀▀▄██░▀▀▀▄█
//█████████████████████████▀▀▀▀▄████████████████████████████████████████████▀░▀████

function DragManager() {
	EventEmitter.call(this);
	this.dummy = createDiv('dragItem');
	this.dummy.style.display = 'none';
	this.droppables = [];
}
inherits(DragManager, EventEmitter);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.startDrag = function (e, id, item, dummyContent) {
	var t = this;
	var d = document;

	var dummy = t.dummy;
	dummy.style.zIndex = zIndex + 1; // FIXME
	dummy.style.display = '';
	dummy.style.left = e.clientX + 'px';
	dummy.style.top  = e.clientY + 'px';

	if (dummyContent) dummy.appendChild(dummyContent);

	var currentDrop = null;

	function onDragEnter() {
		this._dropHandle.onDragEnter && this._dropHandle.onDragEnter(id, item);
		currentDrop = this;
	}

	function onDragLeave() {
		this._dropHandle.onDragLeave && this._dropHandle.onDragLeave(id, item);
		if (currentDrop === this) currentDrop = null;
	}

	for (var i = 0; i < t.droppables.length; i++) {
		var droppable = t.droppables[i];
		droppable.addEventListener('mouseenter', onDragEnter);
		droppable.addEventListener('mouseleave', onDragLeave);
		droppable._dropHandle.onDragStart && droppable._dropHandle.onDragStart(id, item);
	}

	t.emit('dragStart', id, item);

	function dragMove(e) {
		e.preventDefault();
		var x = e.clientX;
		var y = e.clientY;
		dummy.style.left = x + 'px';
		dummy.style.top  = y + 'px';
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
		if (dummyContent) dummy.removeChild(dummyContent);
		dummy.style.display = 'none';
		for (var i = 0; i < t.droppables.length; i++) {
			var droppable = t.droppables[i];
			droppable.removeEventListener('mouseenter', onDragEnter);
			droppable.removeEventListener('mouseleave', onDragLeave);
			droppable._dropHandle.onDragEnd && droppable._dropHandle.onDragEnd(id, item);
		}
		t.emit('dragEnd', id, item);
		currentDrop && currentDrop._dropHandle.drop && currentDrop._dropHandle.drop(id, item);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.setAsDroppable = function (dom, handle) {
	this.droppables.push(dom);
	dom._dropHandle = handle;
};

var dragManager = new DragManager();

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
	var startY = e.clientY - panel.y;

	function dragMove(e) {
		e.preventDefault();
		panel.setPosition(e.clientX - startX, e.clientY - startY);
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	panel.dom.style.zIndex = ++zIndex;
	tooltip.style.zIndex = zIndex + 1; // FIXME
	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Panel(params) {
	params = params || {};
	var t = this;
	var d = t.dom = createDiv('panel', null);
	t.x = 0;
	t.y = 0;
	t._expanded = true;

	var handle   = this.handle = createDiv('panelHandle', d);
	var closeBtn = createDiv('panelCloseButton', handle);
	var title    = createDiv('panelTitle', handle);
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

	dragManager.setAsDroppable(this.dom, this);
}
inherits(SpriteSheetPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.onDragStart = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
	this.dom.style.marginTop  = '-5px';
	this.dom.style.marginLeft = '-5px';
};

SpriteSheetPanel.prototype.onDragEnter = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #FF2';
};

SpriteSheetPanel.prototype.onDragLeave = function (id, item) {
	if (id !== 'imageFile') return;
	this.dom.style.border = 'solid 5px #F00';
};

SpriteSheetPanel.prototype.onDragEnd = function (id, item) {
	this.dom.style.border = '';
	this.dom.style.marginTop  = '';
	this.dom.style.marginLeft = '';
};

SpriteSheetPanel.prototype.drop = function (id, item) {
	if (id === 'imageFile') this.updateSpritesheet(item);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteSheetPanel.prototype.updateSpritesheet = function (img) {
	Texture.prototype.setSpritesheet(img);
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.drawImage(img, 0, 0);
	this.updateSprite();
	// update map with new spritesheet
	mapEditor.map._redraw();
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
function createPaletteCell(parent, index, color) {
	var cell = createDiv('paletteCell', parent);
	cell.style.backgroundColor = color;
	createDiv('paletteCellNumber', cell).innerText = index;

	button(cell, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'paletteCell paletteCellDummy';
		dummy.style.backgroundColor = color;
		dragManager.startDrag(e, 'paletteColor', color, dummy);
	});

	return cell;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
PalettePanel.prototype.create = function (colors) {
	for (var i = 0; i < colors.length; i++) {
		createPaletteCell(this.canvas, i, colors[i]);
	}
};


//███████████████████████████████████████████████████████████████████████████████
//██▄░░█░░▄███████████████████████████████████▄░█████▄█████▀█████████████████████
//███░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀████████▀▄▄▄▄▀██▀▄▄▄▀░███▄▄░████▄░▄▄▄███▀▄▄▄▄▀██▄░▀▄▄▄█
//███░█▄█░██▀▄▄▄▄░███░███░████████░▄▄▄▄▄██░████░█████░█████░██████░████░███░█████
//██▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄████████▄▀▀▀▀▀██▄▀▀▀▄░▀██▀▀░▀▀███▄▀▀▀▄██▄▀▀▀▀▄██▀░▀▀▀██
//██████████████████▀░▀██████████████████████████████████████████████████████████

function MapLayerDropArea(parent, layer) {
	this.dom = createDiv('mapLayerDropArea' + (layer === 'foreground' ? ' mapLayerDropAreaForeground' : ''), parent);
	this.layer = layer;
	dragManager.setAsDroppable(this.dom, this);
}

MapLayerDropArea.prototype.onDragEnter = function (id, item) {
	// if (id === 'paletteColor' && this.layer === 'foreground') return;
	this.dom.style.borderColor = '#FF2';
};

MapLayerDropArea.prototype.onDragLeave = function (id, item) {
	this.dom.style.borderColor = '';
};

MapLayerDropArea.prototype.onDragEnd = function (id, item) {
	this.dom.style.borderColor = '';
};

MapLayerDropArea.prototype.drop = function (id, item) {
	if (id !== 'paletteColor' && id !== 'imageFile' && id != 'mapFile') return;
	if (id === 'paletteColor' && this.layer === 'foreground') return;
	mapEditor.addLayer(this.layer, item);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
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
	this.btnSave.style.backgroundImage = 'url("iconSave.png")';
	button(this.btnSave, function saveMap() { t.save(); });

	var btnFlagA = addTooltip(createDiv('panelToolButton', toolbar), 'Flag A');
	btnFlagA.style.backgroundImage = 'url("iconFlagA.png")';
	var btnFlagB = addTooltip(createDiv('panelToolButton', toolbar), 'Flag B');
	btnFlagB.style.backgroundImage = 'url("iconFlagB.png")';


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// MAP SETTINGS
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
	createDom('span', null, sizeInputs).innerText = 'x';
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
		t.resizeMap(w, h);
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


	this.info = createDiv('panelInfos', toolbar);


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// BACKGROUND & FOREGROUND DROP AREA

	var dropAreas = createDiv('mapDropAreas', this.content);
	dropAreas.style.display = 'none';

	dragManager.on('dragStart', function (id) {
		if (id !== 'imageFile' && id !== 'paletteColor' && id !== 'mapFile') return;
		dropAreas.style.display = '';
		dropAreas.style.width  = t._viewW * PIXEL_SIZE + 'px';
		dropAreas.style.height = t._viewH * PIXEL_SIZE + 'px';
	});

	dragManager.on('dragEnd',   function (id) {
		dropAreas.style.display = 'none';
	});

	new MapLayerDropArea(dropAreas, 'background');
	new MapLayerDropArea(dropAreas, 'foreground');


	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// MAP RENDER AREA
	var clipSurface = this._clipSurface = createDiv('mapClipSurface', this.content);
	var canvasContainer = createDiv('mapCanvas', this._clipSurface);
	this.resizeViewport();

	var grid = createDiv('mapCanvas mapGrid', canvasContainer);
	grid.style.width  = this.map.width  * SPRITE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	grid.style.height = this.map.height * SPRITE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	grid.style.backgroundImage = gridImage;

	this.background = new Texture();
	this.foreground = new Texture();
	var background = this.background.canvas;
	var foreground = this.foreground.canvas;
	var canvas = this.map.texture.canvas;

	foreground.className = background.className = canvas.className = 'mapCanvas';
	canvasContainer.appendChild(background);
	canvasContainer.appendChild(canvas);
	canvasContainer.appendChild(foreground);

	this._grid   = grid;
	this._canvas = canvas;
	this._canvasContainer = canvasContainer;

	var gridEnabled = true;
	buttons.on('space', function (isPressed) {
		if (!isPressed) return;
		gridEnabled = !gridEnabled;
		grid.style.display = gridEnabled ? '' : 'none';
	});

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	this._posX = 0;
	this._posY = 0;

	function startDrag(e) {
		var startX = e.clientX - t._posX;
		var startY = e.clientY - t._posY;

		function dragMove(e) {
			e.preventDefault();
			t._posX = clip(e.clientX - startX, -(t.map.width  * SPRITE_WIDTH  - t._viewW) * PIXEL_SIZE, 0);
			t._posY = clip(e.clientY - startY, -(t.map.height * SPRITE_HEIGHT - t._viewH) * PIXEL_SIZE, 0);
			canvasContainer.style.left = t._posX + 'px';
			canvasContainer.style.top  = t._posY + 'px';
		}

		function dragEnd(e) {
			e.preventDefault();
			document.removeEventListener('mouseup',   dragEnd);
			document.removeEventListener('mousemove', dragMove);
		}

		document.addEventListener('mousemove', dragMove, false);
		document.addEventListener('mouseup',   dragEnd,  false);
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

	button(canvasContainer, function (e) {
		if (buttons.alt) startDrag(e);
		else startDraw(e);
	});

	this.resizeMap(16, 16);

	// mouse cursor style
	buttons.on('shift', function (isPressed) { isPressed ? clipSurface.classList.add('erase') : clipSurface.classList.remove('erase'); });
	buttons.on('alt',   function (isPressed) { isPressed ? clipSurface.classList.add('move')  : clipSurface.classList.remove('move');  });

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	var resizeHandle = addTooltip(createDiv('mapResizeHandle', this.content), 'Resize');

	function startResize(e) {
		var startX = e.clientX;
		var startY = e.clientY;
		var viewW = t._viewW;
		var viewH = t._viewH;

		function resize(e) {
			e.preventDefault();
			t._viewW = viewW + ~~((e.clientX - startX) / PIXEL_SIZE);
			t._viewH = viewH + ~~((e.clientY - startY) / PIXEL_SIZE);
			t.resizeViewport();
		}

		function mouseEnd(e) {
			resize(e);
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', resize);
		}

		document.addEventListener('mousemove', resize, false);
		document.addEventListener('mouseup', mouseEnd, false);
	}

	button(resizeHandle, startResize);

}
inherits(MapEditorPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resizeViewport = function () {
	this._viewW = ~~Math.max(this._viewW, SPRITE_WIDTH * 16);
	this._viewH = ~~Math.max(this._viewH, SPRITE_WIDTH * 4);
	this._clipSurface.style.width  = this._viewW * PIXEL_SIZE + 1 + 'px';
	this._clipSurface.style.height = this._viewH * PIXEL_SIZE + 1 + 'px';
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.resizeMap = function (w, h) {
	this.map.resize(w, h);
	this.background.resize(w * SPRITE_WIDTH, h * SPRITE_HEIGHT);
	this.foreground.resize(w * SPRITE_WIDTH, h * SPRITE_HEIGHT);

	this._posX = clip(this._posX, -(w * SPRITE_WIDTH  - this._viewW) * PIXEL_SIZE, 0);
	this._posY = clip(this._posY, -(h * SPRITE_HEIGHT - this._viewH) * PIXEL_SIZE, 0);
	this._grid.style.width  = w * SPRITE_WIDTH  * PIXEL_SIZE + 1 + 'px';
	this._grid.style.height = h * SPRITE_HEIGHT * PIXEL_SIZE + 1 + 'px';
	this._canvasContainer.style.left = this._posX + 'px';
	this._canvasContainer.style.top  = this._posY + 'px';

	var background = this.background.canvas.style;
	var tileground = this._canvas.style;
	var foreground = this.foreground.canvas.style;

	background.width  = foreground.width  = tileground.width  = w * SPRITE_WIDTH  * PIXEL_SIZE + 'px';
	background.height = foreground.height = tileground.height = h * SPRITE_HEIGHT * PIXEL_SIZE + 'px';

	// TODO redraw background and foreground if needed

	this.inputWidth.value  = w;
	this.inputHeight.value = h;
	this._saved = false;
	this._updateInfos();
	this._updateSaveButton();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.addLayer = function (id, item) {
	if (id !== 'background' && id !== 'foreground') return;
	if (typeof item === 'string') {
		this[id].ctx.fillStyle = item;
		this[id].cls();
	} else {
		this[id].draw(item);
		// TODO save img to redraw on resize
	}
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
	this.resizeMap(data.w, data.h);
	this.map.load(data);
	this._saved = true;
	this._updateSaveButton();
	this._updateInfos();
	this.history = [];

	// if map has a spritesheet, update spritesheet panel
	if (this.map._spritesheetPath) {
		spritesheet.updateSpritesheet(this.map.texture.spritesheet.canvas);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.addHistory = function () {
	this.history.push(this.map.copy());
	if (this.history.length > MAP_MAX_UNDO) this.history.shift();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapEditorPanel.prototype.undo = function () {
	if (!this.history.length) return;
	this.map.paste(this.history.pop());
	this._saved = false;
	this._updateSaveButton();
};

//█████████████████████████████████████████████████████████
//██▄░░█░░▄█████████████████▄░▄████████▄█████████████▀█████
//███░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀███░███████▄▄░████▀▄▄▄▄░██▄░▄▄▄██
//███░█▄█░██▀▄▄▄▄░███░███░███░███▀█████░█████▄▄▄▄▀███░█████
//██▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄██▀░▀▀▀░███▀▀░▀▀██░▀▀▀▀▄███▄▀▀▀▄█
//██████████████████▀░▀████████████████████████████████████

var dragingMapIndex = 0;

function MapListItem(index, map, parent) {
	var t = this;

	this.map    = map;
	this.index  = index;
	this.parent = parent;

	this.dom    = createDiv('mapListItem', parent);
	this.idxDom = createDiv('mapListItemIndex', this.dom);
	this.name   = createDiv('mapListItemName',  this.dom);
	var delBtn  = createDiv('mapListItemCloseButton', this.dom);
	
	addTooltip(delBtn, 'Delete map');

	button(this.dom, function () {
		if (mapEditor.mapId === t.index) return;
		mapEditor.mapId = t.index;
		mapEditor.loadMap(t.map);
	});

	button(delBtn, function () {
		mapList.deleteItem(t);
	});

	button(this.idxDom, function (e) {
		dragingMapIndex = t.index;
		var dummy = document.createElement('div');
		dummy.className = 'ImageListItemDragDummy';
		createDiv('mapFileItemName', dummy).innerText = t.map.name || 'undefined';
		var map = new Map().load(t.map);
		dragManager.startDrag(e, 'mapFile', map, dummy);
	});

	dragManager.setAsDroppable(this.dom, this);
	
	this.update();
}

MapListItem.prototype.onDragEnter = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '#F00';
};

MapListItem.prototype.onDragLeave = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '';
};

MapListItem.prototype.onDragEnd = function (id, item) {
	this.dom.style.backgroundColor = '';
};

MapListItem.prototype.drop = function (id, item) {
	if (id !== 'mapFile') return;

	var mapId = dragingMapIndex;
	dragingMapIndex = null;
	var to = this.index;
	to = clip(to, 0, assets.maps.length - 1);

	if (mapId === to) return;

	assetLoader.sendRequest({ request: 'moveMap', mapId: mapId, to: to }, function (error) {
		if (error) return alert(error);
		assets.maps.splice(to, 0, assets.maps.splice(mapId, 1).pop());
		mapList.reIndex();
	});
};

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
function ImageListItem(name, item, parent) {
	var t = this;

	this.item   = item;
	this.dom    = createDiv('fileListItem ImageListItem', parent);
	this.parent = parent;

	createDiv('mapFileItemIconImg', this.dom);
	createDiv('mapFileItemName',    this.dom).innerText = name;

	button(this.dom, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'ImageListItemDragDummy';
		createDiv('mapFileItemIconImg', dummy);
		createDiv('mapFileItemName', dummy).innerText = name;
		dragManager.startDrag(e, 'imageFile', t.item, dummy);
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function FolderListItem(name, item, parent) {
	var t = this;

	this.item   = item;
	this.parent = parent;

	this.dom = createDiv('fileListItem', parent);
	var btn  = createDiv('fileListItemBtn', this.dom);
	createDom('span', 'mapFileItemName',  this.dom).innerText = name;

	this.content = createDiv('mapFileItemContent', this.dom);
	this.content.style.display = 'none';

	var isOpened = true;

	function fold() {
		isOpened = !isOpened;
		t.content.style.display = isOpened ? '' : 'none';
		btn.className = 'fileListItemBtn' + (isOpened ? ' fileListItemBtnOpen' : '');
		t.dom.style.height = isOpened ? '' : '20px'; // HACK
	}

	button(this.dom, fold);

	fold();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapListPanel() {
	Panel.call(this, { title: 'assets' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);
	this.mapList = new FolderListItem('maps', {}, this.list);
	this.mapList.dom.style.background = 'rgb(204, 199, 64)';
	this.mapList.dom.style.marginTop  = '5px';
	this.mapList.dom.style.paddingTop = '0px';

	var btnNew = addTooltip(createDiv('panelToolButton mapListNewMapBtn', this.mapList.content), 'New map');
	btnNew.style.backgroundImage = 'url("iconNew.png")';
	button(btnNew, function () { t.createNew(); });

	this.elems = [];
}
inherits(MapListPanel, Panel);

MapListPanel.prototype.addMap = function (map) {
	var index = this.elems.length;
	this.elems.push(new MapListItem(index, map, this.mapList.content));
};

MapListPanel.prototype.addFileTo = function (name, obj, parent) {
	if (obj instanceof Image) {
		// TODO create item only on open
		var item = new ImageListItem(name, obj, parent);
	} else if (obj instanceof Object) {
		var container = new FolderListItem(name, obj, parent);
		for (var key in obj) {
			this.addFileTo(key, obj[key], container.content);
		}
	}
};

MapListPanel.prototype.setup = function (assets) {
	// maps
	maps = assets.maps;
	for (var i = 0; i < maps.length; i++) {
		this.addMap(maps[i]);
	}
	// files
	var root = this.list;
	for (var key in assets) {
		if (key === 'maps') continue;
		this.addFileTo(key, assets[key], root);
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
	mapList.setup(assets);
	if (assets.maps[0]) mapEditor.loadMap(assets.maps[0]);
});


