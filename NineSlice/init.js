var NineSlice = require('.');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function printPathError(path) {
	console.error('Could not find asset "' + path + '"');
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function convertAsset(path, w, h) {
	var pathes = path.split('/');
	var parent = window.assets;
	var assetName = pathes.pop();

	while (pathes.length > 0) {
		parent = parent[pathes.shift()];
		if (!parent) {
			printPathError(path);
			return;
		}
	}

	if (!parent[assetName]) {
		printPathError(path);
		return;
	}

	parent[assetName] = new NineSlice(parent[assetName], w, h);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
module.exports = function (data) {
	if (data._type !== 'Nine slices config') return;
	var slicesData = data.sprites;
	for (var path in slicesData) {
		var sliceData = slicesData[path];
		convertAsset(path, sliceData.w, sliceData.h);
	}
};
