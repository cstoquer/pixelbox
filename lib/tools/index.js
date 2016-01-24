//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */
var assetLoader = require('assetLoader');

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

	var handle = createDiv('panelHandle', d);
	if (params.title) handle.innerText = params.title;
	button(handle, function (h, e) {
		startDrag(t, e);
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

Panel.prototype.expand = function () {
	this.content.style.display = '';
	return this;
};

Panel.prototype.collapse = function () {
	this.content.style.display = 'none';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// var testPanel1 = new Panel({ title: 'panel 1' }).collapse();
// var testPanel2 = new Panel({ title: 'panel 2' });

function SpriteSheetPanel(img) {
	Panel.call(this, { title: 'spritesheet' });
	var self = this;

	this.info = createDiv(null, this.content);
	this.sx = 0;
	this.sy = 0;
	this.sprite = 0;

	var spritesheet = createDiv('spritesheet', this.content);
	var canvas      = createDom('canvas', 'spritesheetInner', spritesheet);
	var ctx         = canvas.getContext('2d');
	var grid        = createDiv('spritesheetInner spritesheetGrid', spritesheet);
	var cursor      = createDiv('spritesheetCursor', spritesheet);

	var SIZE = 128 * 3;

	canvas.width  = 128;
	canvas.height = 128;
	canvas.style.width  = SIZE + 'px';
	canvas.style.height = SIZE + 'px';
	ctx.drawImage(img, 0, 0);

	button(spritesheet, function (d, e) {
		if (e.target !== grid) return;
		e.preventDefault();
		var sx = ~~(e.layerX / 24);
		var sy = ~~(e.layerY / 24);
		cursor.style.left = (sx * 24 - 4) + 'px';
		cursor.style.top  = (sy * 24 - 4) + 'px';
		self.updateSprite(sx, sy);
	});

	this.updateSprite(0, 0);
}
inherits(SpriteSheetPanel, Panel);


SpriteSheetPanel.prototype.updateSprite = function (sx, sy) {
	var sprite = this.sprite = sy * 16 + sx;
	var hexa = ('0' + sprite.toString(16).toLocaleUpperCase()).slice(-2);
	this.info.innerText = sprite + ' (0x' + hexa + ')';
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function onAssetsLoaded(error, assets) {
	if (error) return console.error(error);
	var spritesheet = new SpriteSheetPanel(assets.spritesheet);
}

assetLoader.preloadStaticAssets(onAssetsLoaded);

