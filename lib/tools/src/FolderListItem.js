var domUtils  = require('../../components/domUtils');

var createDom = domUtils.createDom;
var createDiv = domUtils.createDiv;
var button    = domUtils.makeButton;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function FolderListItem(name, item, parent) {
	var t = this;

	this.item     = item;
	this.parent   = parent;
	this.children = {};
	this.isOpened = true;

	this.dom = createDiv('fileListItem', parent);
	this._foldIcon = createDiv('fileListItemBtn', this.dom);
	createDom('span', 'ListItemName',  this.dom).innerText = name;

	this.content = createDiv('mapFileItemContent', this.dom);
	this.content.style.display = 'none';

	button(this.dom, function fold() {
		t.toggleFold();
	});

	this.toggleFold();
}

module.exports = FolderListItem;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderListItem.prototype.getSubFolder = function (name) {
	if (this.children[name]) return this.children[name];
	var subFolder = new FolderListItem(name, null, this.content);
	this.children[name] = subFolder;
	return subFolder;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderListItem.prototype.toggleFold = function (open) {
	if (open !== undefined) {
		this.isOpened = !!open;
	} else {
		this.isOpened = !this.isOpened;
	}
	this.content.style.display = this.isOpened ? '' : 'none';
	this._foldIcon.className = 'fileListItemBtn' + (this.isOpened ? ' fileListItemBtnOpen' : '');
	this.dom.style.height = this.isOpened ? '' : '20px'; // HACK
};
