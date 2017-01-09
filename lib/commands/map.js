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
/** Appends map data in a MapBank file
 *
 * @param {Object} params - parameter object
 *        {string} [params.file] - file path (default: "maps")
 *        {number} params.mapId  - index of the map in the file
 *        {Object} params.data   - map data
 *
 * @param {function} cb - callback function
 */
exports.save = function (params, cb) {
	var file = params.file || 'maps';
	var mapsData = getMapsData(file);
	var mapId = ~~(params.mapId);
	if (mapId > mapsData.maps.length) return cb('Incorrect map index');
	var data = params.data;
	mapsData.maps[mapId] = data;
	saveMapsFile(file, mapsData);
	return cb();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Move a map from a slot to another. MapBank file can be different
 *
 * @param {Object} params - parameter object
 *        {string} [params.sourceFile]  - source file path (default: "maps")
 *        {string} [params.targetFile]  - target file path (default: same as source file)
 *        {number} [params.sourceIndex] - index of source map in source file (default: 0)
 *        {number} [params.targetIndex] - index of target map in target file (default: 0)
 *
 * @param {function} cb - callback function
 */
exports.move = function (params, cb) {
	var sourceFile = params.sourceFile || 'maps';
	var targetFile = params.targetFile || sourceFile;
	var isDifferentFile = sourceFile !== targetFile;

	var sourceIndex = ~~(params.sourceIndex);
	var targetIndex = ~~(params.targetIndex);
	var sourceData  = getMapsData(sourceFile);
	var targetData  = sourceData;
	if (isDifferentFile) targetData = getMapsData(targetFile);

	if (sourceIndex >= sourceData.maps.length) return cb('Incorrect source index');
	if (targetIndex >= targetData.maps.length) return cb('Incorrect target index');

	var sourceMap = sourceData.maps.splice(sourceIndex, 1).pop();
	targetData.maps.splice(targetIndex, 0, sourceMap);

	saveMapsFile(sourceFile, sourceData);
	if (isDifferentFile) saveMapsFile(targetFile, targetData);
	return cb();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Remove a map from a MapBank file
 *
 * @param {Object} params - parameter object
 *        {string} [params.file]  - file path (default: "maps")
 *        {number} [params.mapId] - index of the map in the file (default: 0)
 *
 * @param {function} cb - callback function
 */
exports.delete = function (params, cb) {
	var file = params.file || 'maps';
	var mapsData = getMapsData(file);
	var mapId = ~~(params.mapId);
	if (mapId >= mapsData.maps.length) return cb('Incorrect map index');
	mapsData.maps.splice(mapId, 1);
	saveMapsFile(file, mapsData);
	return cb();
};
