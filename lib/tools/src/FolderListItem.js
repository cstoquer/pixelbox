var domUtils       = require('../../components/domUtils');

var createDom   = domUtils.createDom;
var createDiv   = domUtils.createDiv;
var button      = domUtils.makeButton;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function FolderListItem(name, item, parent) {
	var t = this;

	this.item     = item;
	this.parent   = parent;
	this.children = {};

	this.dom = createDiv('fileListItem', parent);
	var btn  = createDiv('fileListItemBtn', this.dom);
	createDom('span', 'ListItemName',  this.dom).innerText = name;

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

module.exports = FolderListItem;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderListItem.prototype.getSubFolder = function (name) {
	if (this.children[name]) return this.children[name];
	var subFolder = new FolderListItem(name, null, this.content);
	this.children[name] = subFolder;
	return subFolder;
};