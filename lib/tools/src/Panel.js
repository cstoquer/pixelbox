var domUtils      = require('../../components/domUtils');
var zIndexManager = require('./zIndexManager');
var createDom = domUtils.createDom;
var createDiv = domUtils.createDiv;
var removeDom = domUtils.removeDom;
var button    = domUtils.makeButton;

// module globals
// var panels = [];

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

	zIndexManager.bringToFront(panel.dom);

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
	t.viewW = 0;
	t.viewH = 0;

	t._expanded = true;

	var handle    = this.handle = createDiv('panelHandle', d);
	var expandBtn = createDiv('panelExpandButton', handle);
	var title     = createDiv('panelTitle', handle);
	if (params.title) title.innerText = params.title;
	button(handle, function (e) {
		t._select();
		startDrag(t, e);
	});

	button(expandBtn, function (e) {
		t.toggleExpand(expandBtn);
	});
	expandBtn.innerText = '-';

	t.content = createDiv('panelContent', d);
	zIndexManager.addElement(d);
	// panels.push(t);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// global attribute
Panel.currentSelectedPanel = null; // FIXME: used in keyboard
Panel.prototype.toolbox = null;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.setPosition = function (x, y) {
	this.x = x || 0;
	this.y = y || 0;

	// constraint panel inside window
	var boundingRect = this.dom.getBoundingClientRect();
	var maxX = window.innerWidth  - boundingRect.width;
	var maxY = window.innerHeight - boundingRect.height;

	this.x = Math.max(0, Math.min(maxX, this.x));
	this.y = Math.max(0, Math.min(maxY, this.y));

	// set dom position
	this.dom.style.left = this.x + 'px';
	this.dom.style.top  = this.y + 'px';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.setDisposition = function (params) {
	params = params || {};
	this.setPosition(params.x || 0, params.y || 0);
	this.viewW = params.viewW || this.viewW || 0;
	this.viewH = params.viewH || this.viewH || 0;
	this.resizeViewport && this.resizeViewport();
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.getDisposition = function () {
	return {
		x: this.x,
		y: this.y,
		viewW: this.viewW,
		viewH: this.viewH
	};
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype.toggleExpand = function (button) {
	this._expanded = !this._expanded;
	this.content.style.display = this._expanded ? '' : 'none';
	button.innerText = this._expanded ? '-' : '+';
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Panel.prototype._select = function () {
	Panel.currentSelectedPanel && Panel.currentSelectedPanel._deselect();
	this.handle.className = 'panelHandle panelHandleSelected';
	Panel.currentSelectedPanel = this;
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

module.exports = Panel;
