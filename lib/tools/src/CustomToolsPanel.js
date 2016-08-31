var Panel          = require('./Panel');
var addTooltip     = require('./tooltip');
var helper         = require('./helper');
var FolderListItem = require('./FolderListItem');
var resizeHandle   = require('./resizeHandle');
var inherits       = require('../../common/inherits');
var domUtils       = require('../../common/domUtils');

var createDom = domUtils.createDom;
var createDiv = domUtils.createDiv;
var removeDom = domUtils.removeDom;
var button    = domUtils.makeButton;

var DEFAULT_TOOLS = {
	brush: require('./Brush')
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function ToolItem(category, toolId, tool, parent) {
	var t = this;

	this.dom    = createDiv('fileListItem ImageListItem', parent);
	this.parent = parent;

	createDiv('mapFileItemIconImg', this.dom);
	createDiv('mapFileItemName',    this.dom).innerText = toolId;

	button(this.dom, function (e) {
		toolbox[category] = tool;
		// TODO: display dom as selected
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function CustomToolsPanel() {
	Panel.call(this, { title: 'custom tools' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);

	for (var category in CUSTOM_TOOLS) {
		var list = new FolderListItem(category, {}, this.list);

		// default tool in that category
		if (DEFAULT_TOOLS[category]) {
			var item = new ToolItem(category, 'default', DEFAULT_TOOLS[category], list.content);
			item.dom.style.color = '#666';
		}

		// custom tools list
		var tools = CUSTOM_TOOLS[category];
		for (var toolId in tools) {
			var item = new ToolItem(category, toolId, tools[toolId], list.content);
			// TODO
		}
	}
	

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	this.viewW = 165;
	this.viewH = 100;
	this.resize();

	resizeHandle(this, function onResizeMove(viewW, viewH, diffX, diffY) {
		t.viewW = viewW + diffX;
		t.viewH = viewH + diffY;
		t.resize();
	});
}
inherits(CustomToolsPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
CustomToolsPanel.prototype.resize = function () {
	this.viewW = ~~Math.max(this.viewW, 165);
	this.viewH = ~~Math.max(this.viewH, 100);
	this.list.style.width  = this.viewW + 'px';
	this.list.style.height = this.viewH + 'px';
};

module.exports = new CustomToolsPanel();
