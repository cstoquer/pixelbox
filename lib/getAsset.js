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
/** Walk in a given directory and make a structured list of its content.
 *  A filter description object is used to choose which file extentions
 *  are included in the list and how they are handled.
 *  Some file content can be included directly in the list as is or parsed
 *  by a provided parser function.
 *
 *  A filter definition object have the following format:
 *
 *  var STATIC_ASSET_FILTERS = [
 *     { ext: ['png', 'jpg', 'jpeg'], id: 'img' },
 *     { ext: ['mp3', 'wav'],         id: 'snd' },
 *     { ext: ['txt']                           },
 *     { ext: ['json'], parser: JSON.parse      }
 *  ];
 *
 *
 * @param {string} assetDir - path to the asset folder to walk from process.cwd
 * @param {Object[]} assetFilters - filters and parsers definition.
 *        {string[]} assetFilters[].ext - a list of file extentions this filter handle
 *        {string}   assetFilters[].id  - optional asset type. if provided the content
 *                                        is NOT included, and a list of path is created
 *                                        so the loader can load and populate the list.
 *        {function} assetFilters[].parser - if the file content is included, you can 
 *                                           provide a parsing function to transform the
 *                                           content as you need before beeing included
 *                                           in the list
 *
 * @return {Object} result
 *         {string} root - path to the root folder of the assets
 *         {Object} dat  - the structured list of the folder content
 *         {string[]} *  - an array of file path per filter id provided
 *                         in the previous example, it would be "img" and "snd"
 */
module.exports = function (assetDir, assetFilters) {
	var result = { dat: {}, root: assetDir + '/' };

	for (var i = 0; i < assetFilters.length; i++) {
		var id = assetFilters[i].id;
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

				var value = null;

				if (arr) {
					arr.push(id);
				} else {
					value = fs.readFileSync(path.join(rootDir, dir, fileName), { encoding: 'utf8' });
					if (params.parser) value = params.parser(value);
				}

				var withoutExt = fileName.split('.');
				withoutExt.pop();
				withoutExt = withoutExt.join('.');

				currentDat[withoutExt] = value;
			}
		}

		for (var i = 0; i < assetFilters.length; i++) {
			var type = assetFilters[i];
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
