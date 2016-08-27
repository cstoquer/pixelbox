var Panel        = require('./Panel.js');
var addTooltip   = require('./tooltip.js');
var dragManager  = require('./dragManager.js');
var helper       = require('./helper.js');
var assetLoader  = require('../../common/assetLoader');
var PixelboxMap  = require('../../common/Map');
var inherits     = require('../../common/inherits');
var domUtils     = require('../../common/domUtils');

var mapEditor    = require('./MapEditorPanel.js');
var mapList;

var createDom    = domUtils.createDom;
var createDiv    = domUtils.createDiv;
var button       = domUtils.makeButton;


//███████████████████████████████████████
//█▄▄░▄▄█████████████████████████████████
//███░███▄░▀▄▀▀▄▀█▀▄▄▄▄▀██▀▄▄▄▀░▄█▀▄▄▄▄▀█
//███░████░██░██░█▀▄▄▄▄░██░████░██░▄▄▄▄▄█
//█▀▀░▀▀█▀░▀█░▀█░█▄▀▀▀▄░▀█▄▀▀▀▄░██▄▀▀▀▀▀█
//█████████████████████████▀▀▀▀▄█████████

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

//███████████████████████████████████████████
//█▄░▄▄▄░█████████▄░███████▄░████████████████
//██░▀░███▀▄▄▄▄▀███░███▀▄▄▄▀░██▀▄▄▄▄▀█▄░▀▄▄▄█
//██░█▄███░████░███░███░████░██░▄▄▄▄▄██░█████
//█▀░▀████▄▀▀▀▀▄█▀▀░▀▀█▄▀▀▀▄░▀█▄▀▀▀▀▀█▀░▀▀▀██
//███████████████████████████████████████████

function FolderListItem(name, item, parent) {
	var t = this;

	this.item     = item;
	this.parent   = parent;

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


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function MapFolderItem(name, item, parent) {
	var t = this;

	this.item     = item;
	this.parent   = parent;
	this.children = {};

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

MapFolderItem.prototype.getSubFolder = function (name) {
	if (this.children[name]) return this.children[name];
	var subFolder = new MapFolderItem(name, null, this.content);
	this.children[name] = subFolder;
	return subFolder;
};


MapFolderItem.prototype.onDragEnter = function (id, item) {
	// TODO
};

MapFolderItem.prototype.onDragLeave = function (id, item) {
	// TODO
};

MapFolderItem.prototype.onDragEnd = function (id, item) {
	// TODO
};

MapFolderItem.prototype.drop = function (id, item) {
	// TODO
};

//████████████████████████████████████████████████████████████
//█▄░░█░░▄███████████████████████▄▄░▄▄██▀█████████████████████
//██░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀██████████░███▄░▄▄▄██▀▄▄▄▄▀█▄░▀▄▀▀▄▀█
//██░█▄█░██▀▄▄▄▄░███░███░██████████░████░█████░▄▄▄▄▄██░██░██░█
//█▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄████████▀▀░▀▀██▄▀▀▀▄█▄▀▀▀▀▀█▀░▀█░▀█░█
//█████████████████▀░▀████████████████████████████████████████

var dragingMapIndex = 0;
// var mapFolders = {};

function getMapFolder(fullName, rootDom) {
	var path = fullName.split('/');
	var fileName = path.pop();
	if (path.length === 0) return rootDom;

	var folderName = path[path.length - 1];

	var folderDom = rootDom;
	for (var i = 0; i < path.length; i++) {
		var folderName = path[i];
		var folderDom = folderDom.getSubFolder(folderName);
	}

	return folderDom;
}

function MapListItem(index, map, rootDom) {
	var t = this;

	var parent = getMapFolder(map.name, rootDom);

	this.dom     = createDiv('mapListItem', parent.content);
	this.idxDom  = createDiv('mapListItemIndex', this.dom);
	this.nameDom = createDiv('mapListItemName',  this.dom);
	var delBtn   = createDiv('mapListItemCloseButton', this.dom);

	this.map    = map;
	this.index  = index;
	this.parent = parent;
	this.path   = ''; // where the map is displayed in the hierarchy
	this.name   = ''; // the name as it is displayed (map's name without path)

	
	addTooltip(delBtn, 'Delete this map');

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

	var fullName = this.map.name.split('/');
	this.name = fullName.pop();
	this.path = fullName.join('/');

	this.nameDom.innerText       = this.name || 'undefined';
	this.nameDom.style.fontStyle = this.name ? '' : 'italic';
	this.nameDom.style.color     = this.name ? '' : '#AAA';
};

MapListItem.prototype.destroy = function () {
	removeDom(this.dom, this.parent);
};


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
	this.mapList = new MapFolderItem('maps', {}, this.list);
	

	var btnNew = addTooltip(createDiv('panelToolButton mapListNewMapBtn', this.mapList.content), 'Create a new map');
	btnNew.style.backgroundImage = 'url("img/iconNew.png")';
	button(btnNew, function () { t.createNew(); });

	this.elems = [];
}
inherits(MapListPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListPanel.prototype.addMap = function (map) {
	var index = this.elems.length;
	this.elems.push(new MapListItem(index, map, this.mapList));
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
