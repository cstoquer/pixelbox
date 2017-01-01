var fs       = require('fs-extra');
var path     = require('path');
var pixelbox = require('../index.js');
var cwd      = process.cwd();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getMapsData(file) {
	file = file || 'maps';
	var mapsData = JSON.parse(fs.readFileSync(path.join(cwd, 'assets', file + '.json'), 'utf8'));
	// convert old map format to the new format if needed
	if (Array.isArray(mapsData)) {
		mapsData = {
			_type: "maps",
			maps: mapsData
		};
	}

	return mapsData;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function saveMapsFile(file, mapsData) {
	var str = JSON.stringify(mapsData, null, '\t');
	fs.writeFileSync(path.join(cwd, 'assets', file + '.json'), str);
	pixelbox.emit('tools/saveMaps', str);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.save = function (body, cb) {
	var file = body.file || 'maps';
	var mapsData = getMapsData(file);
	var mapId = ~~(body.mapId);
	if (mapId > mapsData.maps.length) return cb('incorrect mapIndex');
	var data = body.data;
	mapsData.maps[mapId] = data;
	saveMapsFile(file, mapsData);
	return cb();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.move = function (body, cb) {
	var file = body.file || 'maps';
	var mapsData = getMapsData(file);
	var mapId = ~~(body.mapId);
	var to    = ~~(body.to);
	if (mapId >= mapsData.maps.length || to >= mapsData.maps.length) return cb('incorrect mapIndex');
	mapsData.maps.splice(to, 0, mapsData.maps.splice(mapId, 1).pop());
	saveMapsFile(file, mapsData)
	return cb();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.delete = function (body, cb) {
	var file = body.file || 'maps';
	var mapsData = getMapsData(file);
	var mapId = ~~(body.mapId);
	if (mapId >= mapsData.maps.length) return cb('incorrect mapIndex');
	mapsData.maps.splice(mapId, 1);
	saveMapsFile(file, mapsData);
	return cb();
};
