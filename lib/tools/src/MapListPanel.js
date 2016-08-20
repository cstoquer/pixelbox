var Panel        = require('./Panel.js');
var addTooltip   = require('./tooltip.js');
var dragManager  = require('./dragManager.js');
var helper       = require('./helper.js');
var assetLoader  = require('../../common/assetLoader');
var PixelboxMap  = require('../../common/Map');
var inherits     = require('../../common/inherits');
var domUtils     = require('../../common/domUtils');

var mapEditor   = require('./MapEditorPanel.js');
var mapList;

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;

var dragingMapIndex = 0;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapListItem(index, map, parent) {
	var t = this;

	this.map    = map;
	this.index  = index;
	this.parent = parent;

	this.dom    = createDiv('mapListItem', parent);
	this.idxDom = createDiv('mapListItemIndex', this.dom);
	this.name   = createDiv('mapListItemName',  this.dom);
	var delBtn  = createDiv('mapListItemCloseButton', this.dom);
	
	addTooltip(delBtn, 'Delete map');

	button(this.dom, function () {
		if (mapEditor.mapId === t.index) return;
		mapEditor.mapId = t.index;
		mapEditor.loadMap(t.map);
	});

	button(delBtn, function () {
		mapList.deleteItem(t);
	});

	button(this.idxDom, function (e) {
		dragingMapIndex = t.index;
		var dummy = document.createElement('div');
		dummy.className = 'ImageListItemDragDummy';
		createDiv('mapFileItemName', dummy).innerText = t.map.name || 'undefined';
		var map = new PixelboxMap().load(t.map);
		dragManager.startDrag(e, 'mapFile', map, dummy);
	});

	dragManager.setAsDroppable(this.dom, this);
	
	this.update();
}

MapListItem.prototype.onDragEnter = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '#F00';
};

MapListItem.prototype.onDragLeave = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '';
};

MapListItem.prototype.onDragEnd = function (id, item) {
	this.dom.style.backgroundColor = '';
};

MapListItem.prototype.drop = function (id, item) {
	if (id !== 'mapFile') return;

	var mapId = dragingMapIndex;
	dragingMapIndex = null;
	var to = this.index;
	to = helper.clip(to, 0, assets.maps.length - 1);

	if (mapId === to) return;

	assetLoader.sendRequest({ request: 'moveMap', mapId: mapId, to: to }, function (error) {
		if (error) return alert(error);
		assets.maps.splice(to, 0, assets.maps.splice(mapId, 1).pop());
		mapList.reIndex();
	});
};

MapListItem.prototype.setMap = function (index, map) {
	this.index = index;
	this.map = map;
	this.update();
};

MapListItem.prototype.update = function () {
	this.idxDom.innerText = this.index;
	var name = this.map.name;
	this.name.innerText = name || 'undefined';
	this.name.style.fontStyle = name ? '' : 'italic';
	this.name.style.color = name ? '' : '#AAA';
};

MapListItem.prototype.destroy = function () {
	removeDom(this.dom, this.parent);
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function ImageListItem(name, item, parent) {
	var t = this;

	this.item   = item;
	this.dom    = createDiv('fileListItem ImageListItem', parent);
	this.parent = parent;

	createDiv('mapFileItemIconImg', this.dom);
	createDiv('mapFileItemName',    this.dom).innerText = name;

	button(this.dom, function (e) {
		var dummy = document.createElement('div');
		dummy.className = 'ImageListItemDragDummy';
		createDiv('mapFileItemIconImg', dummy);
		createDiv('mapFileItemName', dummy).innerText = name;
		dragManager.startDrag(e, 'imageFile', t.item, dummy);
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function FolderListItem(name, item, parent) {
	var t = this;

	this.item   = item;
	this.parent = parent;

	this.dom = createDiv('fileListItem', parent);
	var btn  = createDiv('fileListItemBtn', this.dom);
	createDom('span', 'mapFileItemName',  this.dom).innerText = name;

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

//█████████████████████████████████████████████████████████
//██▄░░█░░▄█████████████████▄░▄████████▄█████████████▀█████
//███░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀███░███████▄▄░████▀▄▄▄▄░██▄░▄▄▄██
//███░█▄█░██▀▄▄▄▄░███░███░███░███▀█████░█████▄▄▄▄▀███░█████
//██▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄██▀░▀▀▀░███▀▀░▀▀██░▀▀▀▀▄███▄▀▀▀▄█
//██████████████████▀░▀████████████████████████████████████

function MapListPanel() {
	Panel.call(this, { title: 'assets' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);
	this.mapList = new FolderListItem('maps', {}, this.list);
	this.mapList.dom.style.background = 'rgb(204, 199, 64)';
	this.mapList.dom.style.marginTop  = '5px';
	this.mapList.dom.style.paddingTop = '0px';

	var btnNew = addTooltip(createDiv('panelToolButton mapListNewMapBtn', this.mapList.content), 'New map');
	btnNew.style.backgroundImage = 'url("img/iconNew.png")';
	button(btnNew, function () { t.createNew(); });

	this.elems = [];
}
inherits(MapListPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.addMap = function (map) {
	var index = this.elems.length;
	this.elems.push(new MapListItem(index, map, this.mapList.content));
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.addFileTo = function (name, obj, parent) {
	if (obj instanceof Image) {
		// TODO create item only on open
		var item = new ImageListItem(name, obj, parent);
	} else if (obj instanceof Object) {
		var container = new FolderListItem(name, obj, parent);
		for (var key in obj) {
			this.addFileTo(key, obj[key], container.content);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.setup = function (assets) {
	// maps
	maps = assets.maps;
	for (var i = 0; i < maps.length; i++) {
		this.addMap(maps[i]);
	}
	// files
	var root = this.list;
	for (var key in assets) {
		if (key === 'maps') continue;
		this.addFileTo(key, assets[key], root);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.createNew = function () {
	// TODO lock if saving
	var t = this;
	var map = new PixelboxMap(16, 16);
	var mapId = assets.maps.length;
	var data = map.save();
	var request = {
		request: 'saveMap',
		mapId: mapId,
		data: data
	};
	// send request to the server
	assetLoader.sendRequest(request, function (error) {
		if (error) return alert(error);
		assets.maps[mapId] = data;
		t.addMap(data);
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.updateItem = function (index) {
	this.elems[index].update();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.reIndex = function () {
	for (var i = 0; i < this.elems.length; i++) {
		this.elems[i].setMap(i, assets.maps[i]);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.deleteItem = function (item) {
	var t = this;
	var mapId = item.index;
	assetLoader.sendRequest({ request: 'deleteMap', mapId: mapId }, function (error) {
		if (error) return alert(error);
		item.destroy();
		assets.maps.splice(mapId, 1);
		t.elems.splice(mapId, 1);
		t.reIndex();
	});
};

module.exports = mapList = new MapListPanel();
