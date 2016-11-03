var Panel        = require('./Panel.js');
var dragManager  = require('./dragManager.js');
var inherits     = require('../../components/inherits');
var domUtils     = require('../../components/domUtils');

var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
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

module.exports = new PalettePanel();
