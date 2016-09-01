var toolbox        = require('./toolbox');
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

	this.toolId   = toolId;
	this.tool     = tool;
	this.category = category;
	this.dom      = createDiv('fileListItem ImageListItem', parent);
	this.parent   = parent;

	createDiv('mapFileItemIconImg', this.dom);
	createDiv('mapFileItemName',    this.dom).innerText = toolId;

	button(this.dom, function (e) {
		t.select();
	});
}

ToolItem.prototype.select = function () {
	// deselect previous tool in the same category
	var selected = CUSTOM_TOOLS[this.category].__selected__;
	selected && selected.deselect && selected.deselect();

	// set list item as selected
	this.dom.style.backgroundColor = '#FF6';
	CUSTOM_TOOLS[this.category].__selected__ = this;

	// actually select the tool
	this.tool.select && this.tool.select(toolbox, this);
	toolbox[this.category] = this.tool;
};

ToolItem.prototype.deselect = function () {
	this.tool.deselect && this.tool.deselect(toolbox, this);
	this.dom.style.backgroundColor = null;
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function CustomToolsPanel() {
	Panel.call(this, { title: 'custom tools' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);

	for (var category in CUSTOM_TOOLS) {
		var list = new FolderListItem(category, {}, this.list);

		var toolCategory = CUSTOM_TOOLS[category];

		// default tool in that category
		var defaultTool = DEFAULT_TOOLS[category];
		var defaultToolItem = null;
		if (defaultTool) {
			defaultToolItem = new ToolItem(category, 'default', defaultTool, list.content);
			defaultToolItem.dom.style.color = '#666';
			defaultToolItem.dom.style.fontStyle = 'italic';
		}

		// custom tools list
		for (var toolId in toolCategory) {
			new ToolItem(category, toolId, toolCategory[toolId], list.content);
		}

		defaultToolItem && defaultToolItem.select();
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
