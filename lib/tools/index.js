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
	delete this.content.style.display;
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

	this.info = createDiv(null, this.content);

	var spritesheet = createDiv('spritesheet', this.content);

	this.canvas = createDom('canvas', 'spritesheetInner', spritesheet);

	var SIZE = 128 * 3;

	this.canvas.width  = 128;
	this.canvas.height = 128;
	this.canvas.style.width  = SIZE + 'px';
	this.canvas.style.height = SIZE + 'px';
	this.ctx = this.canvas.getContext('2d');
	this.ctx.drawImage(img, 0, 0);

	var grid  = createDiv('spritesheetInner spritesheetGrid', spritesheet);
}
inherits(SpriteSheetPanel, Panel);



//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function onAssetsLoaded(error, assets) {
	if (error) return console.error(error);
	var spritesheet = new SpriteSheetPanel(assets.spritesheet);

}

assetLoader.preloadStaticAssets(onAssetsLoaded);

