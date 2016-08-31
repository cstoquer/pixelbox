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

var TOOLS = {
	brushes: { category: 'brush', default: require('./Brush') }
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function ToolItem(toolId, tool, parent) {
	var t = this;

	// this.tool   = tool;
	this.dom    = createDiv('fileListItem ImageListItem', parent);
	this.parent = parent;

	createDiv('mapFileItemIconImg', this.dom);
	createDiv('mapFileItemName',    this.dom).innerText = toolId;

	button(this.dom, function (e) {
		// TODO: toolbox.brush = tool
		console.log(toolId, tool)
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
		if (TOOLS[category]) {
			var item = new ToolItem('default', TOOLS[category].default, list.content);
			// TODO
		}

		// custom tools list
		var tools = CUSTOM_TOOLS[category];
		for (var toolId in tools) {
			var item = new ToolItem(toolId, tools[toolId], list.content);
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
