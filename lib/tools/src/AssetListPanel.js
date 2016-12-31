var Panel          = require('./Panel');
var addTooltip     = require('./tooltip');
var dragManager    = require('./dragManager');
var helper         = require('./helper');
var resizeHandle   = require('./resizeHandle');
var FolderListItem = require('./FolderListItem');
var ListItem       = require('./ListItem');
var assetLoader    = require('../../components/assetLoader');
var Map            = require('../../components/Map');
var inherits       = require('../../components/inherits');
var domUtils       = require('../../components/domUtils');
var toolbox        = require('./toolbox');

var createDom   = domUtils.createDom;
var createDiv   = domUtils.createDiv;
var removeDom   = domUtils.removeDom;
var button      = domUtils.makeButton;

var ITEM_IMAGE_OPTIONS = { type: 'imageFile', icon: 'iconImage' };
var ITEM_TYPES = {
	map: null, // TODO: listItem for map
	maps: null // TODO: listItem for maps
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

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


//████████████████████████████████████████████████████████████
//█▄░░█░░▄███████████████████████▄▄░▄▄██▀█████████████████████
//██░▄▀▄░██▀▄▄▄▄▀██▄░▀▄▄▀██████████░███▄░▄▄▄██▀▄▄▄▄▀█▄░▀▄▀▀▄▀█
//██░█▄█░██▀▄▄▄▄░███░███░██████████░████░█████░▄▄▄▄▄██░██░██░█
//█▀░▀█▀░▀█▄▀▀▀▄░▀██░▀▀▀▄████████▀▀░▀▀██▄▀▀▀▄█▄▀▀▀▀▀█▀░▀█░▀█░█
//█████████████████▀░▀████████████████████████████████████████
// var dragingMapIndex = 0;

function MapListItem(file, index, map, rootDom) {
	var t = this;

	var parent  = getMapFolder(map.name, rootDom);
	this.file   = file;
	this.bank   = window.assets[file]; // TODO
	this.map    = map;
	this.index  = index;
	this.parent = parent;
	this.path   = ''; // where the map is displayed in the hierarchy
	this.name   = ''; // the name as it is displayed (map's name without path)

	// dom elements
	this.dom     = createDiv('mapListItem', parent.content);
	this.idxDom  = createDiv('mapListItemIndex', this.dom);
	this.nameDom = createDiv('mapListItemName',  this.dom);
	var delBtn   = createDiv('mapListItemCloseButton', this.dom);

	// load map button
	button(this.dom, function onLoadButtonTap() {
		var mapEditor = toolbox.mapEditor;
		if (mapEditor.file === t.file && mapEditor.mapId === t.index) return;
		mapEditor.loadMap(t);
	});

	// delete map button
	addTooltip(delBtn, 'Delete this map');
	button(delBtn, function onDelButtonTap() {
		t.panel.deleteMapItem(t);
	});

	// drag & drop handle
	button(this.idxDom, function onDragButtonTap(e) {
		// dragingMapIndex = t.index;
		var dummy = document.createElement('div');
		dummy.className = 'ListItemDragDummy';
		createDiv('ListItemName', dummy).innerText = t.map.name || 'undefined';
		var map = new Map().load(t.map);
		map._referent = t;
		dragManager.startDrag(e, 'mapFile', map, dummy);
	});

	dragManager.setAsDroppable(this.dom, this);
	
	this.update();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.onDragEnter = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '#F00';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.onDragLeave = function (id, item) {
	if (id !== 'mapFile') return;
	this.dom.style.backgroundColor = '';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.onDragEnd = function (id, item) {
	this.dom.style.backgroundColor = '';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.drop = function (id, item) {
	var t = this;
	var file = t.file;

	if (id !== 'mapFile') return;
	item = item._referent; // FIXME
	if (item.file !== this.file) return console.warn('Moving map to a different bank is not supported yet.');

	// var mapId = dragingMapIndex;
	var mapId = item.index;
	// dragingMapIndex = null;
	var to = this.index;
	to = helper.clip(to, 0, window.assets[file].maps.length - 1);

	if (mapId === to) return;
	
	var request = { command: 'moveMap', file: file, mapId: mapId, to: to };

	assetLoader.sendRequest(request, function onResponse(error) {
		if (error) return alert(error);
		var maps = window.assets[file].maps;
		maps.splice(to, 0, maps.splice(mapId, 1).pop());
		t.panel.reIndex(file);
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.setMap = function (index, map) {
	this.index = index;
	this.map = map;
	this.update();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.update = function () {
	this.idxDom.innerText = this.index;

	var fullName = this.map.name.split('/');
	this.name = fullName.pop();
	this.path = fullName.join('/');

	this.nameDom.innerText       = this.name || 'undefined';
	this.nameDom.style.fontStyle = this.name ? '' : 'italic';
	this.nameDom.style.color     = this.name ? '' : '#AAA';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
MapListItem.prototype.destroy = function () {
	removeDom(this.dom, this.parent.content);
};


//█████████████████████████████████████████████████████████████████████████████████
//███████████████████████████████████▀██████████████▄░▄████████▄█████████████▀█████
//██▀▄▄▄▄▀██▀▄▄▄▄░██▀▄▄▄▄░██▀▄▄▄▄▀██▄░▄▄▄████████████░███████▄▄░████▀▄▄▄▄░██▄░▄▄▄██
//██▀▄▄▄▄░███▄▄▄▄▀███▄▄▄▄▀██░▄▄▄▄▄███░███████████████░███▀█████░█████▄▄▄▄▀███░█████
//██▄▀▀▀▄░▀█░▀▀▀▀▄██░▀▀▀▀▄██▄▀▀▀▀▀███▄▀▀▀▄██████████▀░▀▀▀░███▀▀░▀▀██░▀▀▀▀▄███▄▀▀▀▄█
//█████████████████████████████████████████████████████████████████████████████████

function AssetListPanel() {
	Panel.call(this, { title: 'assets' });
	var t = this;

	this.list = createDiv('mapListContent', this.content);
	this.mapLists = {}; // map lists. key is file path
	// this.elems = [];

	// set MapListItem reference
	MapListItem.prototype.panel = this;

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	// VIEWPORT RESIZE HANDLE

	this.viewW = 165;
	this.viewH = 575;
	this.resizeViewport();

	resizeHandle(this, function onResizeMove(viewW, viewH, diffX, diffY) {
		t.viewW = viewW + diffX;
		t.viewH = viewH + diffY;
		t.resizeViewport();
	});
}
inherits(AssetListPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.resizeViewport = function () {
	this.viewW = ~~Math.max(this.viewW, 165);
	this.viewH = ~~Math.max(this.viewH, 300);
	this.list.style.width  = this.viewW + 'px';
	this.list.style.height = this.viewH + 'px';
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.addFileTo = function (fullPath, name, obj, parent) {
	if (obj instanceof Image) {
		// TODO create item only on unflod
		var listItem = new ListItem(obj, parent, ITEM_IMAGE_OPTIONS);
	} else if (obj instanceof Object) {
		// check if object as a recognized type (e.g. "map", "maps, "font", "palette", ...)
		var type = obj._type;
		if (type === 'maps') {
			this.addMapBank(name, obj);
		} else if (ITEM_TYPES[type]) {
			// TODO
		} else {
			// it's a folder or unknown json data
			var container = new FolderListItem(name, obj, parent);
			for (var key in obj) {
				var path = fullPath + '/' + key;
				this.addFileTo(path, key, obj[key], container.content);
			}
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.addMap = function (fileName, map, index) {
	var mapListDom = this.mapLists[fileName];
	var item = new MapListItem(fileName, index, map, mapListDom);
	this.elems[fileName][index] = item;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** 
 * @param {string} file - full path (from 'asset' folder) to the maps json file 
 * @param {object[]} maps - an array of serialized pixelbox map data
 */
AssetListPanel.prototype.addMapBank = function (fileName, mapBank) {
	var t = this;
	// TODO: test if file exist in mapLists
	var mapList = new FolderListItem(fileName, {}, this.list);
	this.mapLists[fileName] = mapList;
	this.elems[fileName] = [];

	mapList.dom.style.backgroundColor = 'rgb(229, 230, 204)';
	
	var btnNew = addTooltip(createDiv('panelToolButton mapListNewMapBtn', mapList.content), 'Create a new map');
	btnNew.style.backgroundImage = 'url("img/iconNew.png")';
	button(btnNew, function onNewMapButtonPress() { t.createNew(fileName); });

	for (var i = 0; i < mapBank.maps.length; i++) {
		this.addMap(fileName, mapBank.maps[i], i);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.refreshAssetList = function (assets) {
	assets = assets || window.assets;

	// remove all
	if (this.list) removeDom(this.list, this.content);
	this.list     = createDiv('mapListContent', this.content);
	this.mapLists = {}; // map lists. key is file path
	this.elems    = {};

	// maps
	maps = assets.maps;
	this.addMapBank('maps', maps);

	// files
	for (var key in assets) {
		if (key === 'maps') continue;
		this.addFileTo('', key, assets[key], this.list);
	}

	// TODO: remove empty folders
	// console.log(this.list)

	this.resizeViewport();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.createNew = function (file) {
	// TODO lock if saving
	var t = this;
	var map = new Map(16, 16);
	var mapId = window.assets[file].maps.length;
	var data = map.save();
	var request = {
		command: 'saveMap',
		file:  file,
		mapId: mapId,
		data:  data
	};
	// send request to the server
	assetLoader.sendRequest(request, function onResponse(error) {
		if (error) return alert(error);
		window.assets[file].maps[mapId] = data;
		t.addMap(file, data, mapId);
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.updateItem = function (file, index) {
	this.elems[file][index].update();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.reIndex = function (file) {
	var elems = this.elems[file];
	var maps  = window.assets[file].maps;
	for (var i = 0; i < maps.length; i++) {
		elems[i].setMap(i, maps[i]);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AssetListPanel.prototype.deleteMapItem = function (item) {
	var t = this;
	var mapId = item.index;
	var file  = item.file;
	var request = { command: 'deleteMap', file: file, mapId: mapId };
	assetLoader.sendRequest(request, function onResponse(error) {
		if (error) return alert(error);
		item.destroy();
		assets[file].maps.splice(mapId, 1); // TODO: get to file path
		t.elems[file].splice(mapId, 1);
		t.reIndex(file);
	});
};

module.exports = new AssetListPanel();
