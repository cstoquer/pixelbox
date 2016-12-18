/** Asset walker
 * @author Cedric Stoquer
 */

'use strict';

var path = require('path');
var fs   = require('fs-extra');


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var ASSET_TYPES = [
	{ id: 'img', ext: ['png', 'jpg', 'jpeg'], getContent: false, parseContent: false },
	{ id: 'snd', ext: ['mp3', 'wav'],         getContent: false, parseContent: false },
	{ id: null,  ext: ['txt'],                getContent: true,  parseContent: false },
	{ id: null,  ext: ['json'],               getContent: true,  parseContent: true  }
];

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function filterByExtension(extList) {
	var regExps = [];
	for (var i = 0; i < extList.length; i++) {
		regExps.push(new RegExp('\.' + extList[i] + '$'));
	}
	return function (fileName) {
		for (var i = 0; i < regExps.length; i++) {
			if (fileName.search(regExps[i]) !== -1) return true;
		}
		return false;
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
module.exports = function (assetDir, filters) {
	var result = { dat: {}, root: assetDir + '/' };

	for (var i = 0; i < ASSET_TYPES.length; i++) {
		var id = ASSET_TYPES[i].id;
		if (id) result[id] = [];
	}

	var rootDir = process.cwd();

	function getAssetList(dir, subdir, currentDat) {
		var assetList = fs.readdirSync(path.join(rootDir, dir));

		// get directories list
		var dirList = assetList.filter(function (fileName) {
			var stats = fs.statSync(path.join(rootDir, dir, fileName));
			return stats.isDirectory();
		});

		function addToList(list, arr, params) {
			for (var i = 0; i < list.length; i++) {
				var fileName = list[i];
				var id = path.join(subdir, fileName).replace(/\\/gi, '/');

				arr && arr.push(id);
				
				var withoutExt = fileName.split('.');
				withoutExt.pop();
				withoutExt = withoutExt.join('.');

				var value = null;

				if (params.getContent) {
					value = fs.readFileSync(path.join(rootDir, dir, fileName), { encoding: 'utf8' });
				}

				if (params.parseContent) {
					value = JSON.parse(value);
				}

				currentDat[withoutExt] = value;
			}
		}

		for (var i = 0; i < ASSET_TYPES.length; i++) {
			var type = ASSET_TYPES[i];
			var arr = type.id ? result[type.id] : null;
			addToList(assetList.filter(filterByExtension(type.ext)), arr, type);
		}

		// recurse on subdirectories
		for (var i = 0; i < dirList.length; i++) {
			var id = dirList[i];
			if (!currentDat[id]) currentDat[id] = {};
			getAssetList(path.join(dir, id), path.join(subdir, id), currentDat[id]);
			// remove empty json container
			if (Object.keys(currentDat[id]).length === 0) delete currentDat[id];
		}
	}

	getAssetList(assetDir, '', result.dat);
	return result;
};
