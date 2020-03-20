var Sprite = require('./Sprite');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getFilePath(path, id) {
	if (path) return path + '/' + id;
	return id;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function unpackSprite(root, path, data, spriteId, image, meta) {
	var sprite = new Sprite(
		image,
		path,
		data.x,
		data.y,
		data.w || meta.defaultWidth,
		data.h || meta.defaultHeight,
		data.p || meta.defaultPivotX,
		data.q || meta.defaultPivotY
	);
	root[spriteId] = sprite;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function unpackFolder(root, path, data, folderId, image, meta) {
	if (!root[folderId]) root[folderId] = {};
	var folder = root[folderId];

	for (var id in data) {
		if (id === '_folder') continue;
		var subData = data[id];
		var subPath = getFilePath(path, id);
		if (subData._folder) {
			unpackFolder(folder, subPath, subData, id, image, meta);
		} else {
			unpackSprite(folder, subPath, subData, id, image, meta);
		}
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function unpackGrid(root, path, data, image, meta) {
	var gridWidth  = image.width;
	var gridHeight = image.height;

	var w = data.spriteWidth;
	var h = data.spriteHeight;

	var list  = data.list;
	var index = 0;

	for (var y = 0; y < gridHeight; y += h) {
		for (var x = 0; x < gridWidth; x += w) {
			if (index >= list.length) return;
			var spriteId = list[index];
			var sprite = new Sprite(image, getFilePath(path, spriteId), x, y, w, h);
			root[spriteId] = sprite;
			index++;
		}
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @param {Object} root - subobject of the `assets` object in which the sprite should live (must exist)
 * @param {Object} data - spritesheet data
 * @param {Image}  image - spritesheet's image
 */
function unpackSpritesheetV1(root, path, data, image, meta) {
	for (var id in data) {
		if (id === '_type' || id === '_meta') continue;
		var subData = data[id];
		var subPath = getFilePath(path, id);
		if (subData._folder) {
			unpackFolder(root, subPath, subData, id, image, meta);
		} else {
			unpackSprite(root, subPath, subData, id, image, meta);
		}
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @param {Object} root - an object where to unpack the spritesheet data
 * @param {Object} data - the raw JSON spritesheet data
 * @param {Image}  image - spritesheet image
 */
function unpackSpritesheet(root, path, data, image) {
	var meta = data._meta;
	if (meta.grid) {
		unpackGrid(root, path, meta, image, meta);
		return;
	}
	unpackSpritesheetV1(root, path, data, image, meta);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function unpackSpritesheets() {
	// check there are spritesheets to unpack
	var dir = assets['.atlas'];
	if (!dir || !dir.data) return;

	var data = dir.data;

	var spritesheets = data.spritesheets;
	for (var id in spritesheets) {
		var spritesheet = spritesheets[id];
		var imageId = spritesheet._meta.image;
		var image = dir[imageId];

		var paths = id.split('/');
		var root = window.assets;
		while (paths.length) {
			var p = paths.shift();
			if (p === '') continue; // corner case if `assets` is set as spritesheet
			if (!root[p]) root[p] = {};
			root = root[p];
		}

		unpackSpritesheet(root, id, spritesheet, image);
	}
}

exports.unpackSpritesheets = unpackSpritesheets;
