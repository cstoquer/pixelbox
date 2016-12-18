/** Asset walker
 * @author Cedric Stoquer
 */

'use strict';

var path = require('path');
var fs   = require('fs-extra');


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
module.exports = function (assetDir) {
	var result = {
		img: [],
		snd: [],
		dat: {},
		root: assetDir + '/'
	};

	var rootDir = process.cwd();

	function getAssetList(dir, subdir, currentDat) {
		var assetList = fs.readdirSync(path.join(rootDir, dir));

		// get directories list
		var dirList = assetList.filter(function (fileName) {
			var stats = fs.statSync(path.join(rootDir, dir, fileName));
			return stats.isDirectory();
		});

		var imageList = assetList.filter(filterByExtension(['png', 'jpg', 'jpeg']));
		var soundList = assetList.filter(filterByExtension(['mp3', 'wav']));
		var textList  = assetList.filter(filterByExtension(['txt']));
		var jsonList  = assetList.filter(filterByExtension(['json']));

		function addToList(list, arr, params) {
			params = params || {};

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

		addToList(imageList, result.img);
		addToList(soundList, result.snd);
		addToList(textList,  null, { getContent: true });
		addToList(jsonList,  null, { getContent: true, parseContent: true });

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
