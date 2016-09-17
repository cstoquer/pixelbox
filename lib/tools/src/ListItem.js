var dragManager = require('./dragManager');
var domUtils    = require('../../common/domUtils');
var createDiv   = domUtils.createDiv;
var button      = domUtils.makeButton;

function ListItem(item, parent, options) {
	options = options || {};
	var t = this;

	this.item   = item;
	this.dom    = createDiv('fileListItem ListItem', parent);
	this.parent = parent;

	var iconStyle = 'mapFileItemIcon';
	if (options.icon) iconStyle += ' ' + options.icon;

	createDiv(iconStyle, this.dom); // icon
	createDiv('mapFileItemName', this.dom).innerText = item.name;

	// drag and drop behavior
	if (!options.type) return;

	button(this.dom, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'ListItemDragDummy';
		createDiv(iconStyle, dummy);
		createDiv('mapFileItemName', dummy).innerText = item.name;
		dragManager.startDrag(e, options.type, t.item, dummy);
	});
}

module.exports = ListItem;
