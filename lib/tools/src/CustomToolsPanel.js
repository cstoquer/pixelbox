function CustomToolsPanel() {
	Panel.call(this, { title: 'custom tools' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);
	this.mapList = new FolderListItem('maps', {}, this.list);
	this.mapList.dom.style.backgroundColor = 'rgb(229, 230, 204)';
	
	var btnNew = addTooltip(createDiv('panelToolButton mapListNewMapBtn', this.mapList.content), 'Create a new map');
	btnNew.style.backgroundImage = 'url("img/iconNew.png")';
	button(btnNew, function () { t.createNew(); });

	this.elems = [];

	// set MapListItem reference
	MapListItem.prototype.panel = this;

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	this.viewW = 165;
	this.viewH = 200;
	this.resize();

	resizeHandle(this, function onResizeMove(viewW, viewH, diffX, diffY) {
		t.viewW = viewW + diffX;
		t.viewH = viewH + diffY;
		t.resize();
	});
}
inherits(CustomToolsPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.resize = function () {
	this.viewW = ~~Math.max(this.viewW, 165);
	this.viewH = ~~Math.max(this.viewH, 200);
	this.list.style.width  = this.viewW + 'px';
	this.list.style.height = this.viewH + 'px';
};