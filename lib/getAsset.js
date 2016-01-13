'use strict';

var path = require('path');
var fs   = require('fs');

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

		// get images files
		var imageList = assetList.filter(function (fileName) {
			var isPng  = fileName.search(/\.png$/)  !== -1;
			var isJpg  = fileName.search(/\.jpg$/)  !== -1;
			var isJpeg = fileName.search(/\.jpeg$/) !== -1;
			return isPng || isJpg || isJpeg;
		});

		// get sound files
		var soundList = assetList.filter(function (fileName) {
			var isMp3  = fileName.search(/\.mp3$/)  !== -1;
			var isWav  = fileName.search(/\.wav$/)  !== -1;
			return isMp3 || isWav;
		});

		// get text files
		var textList = assetList.filter(function (fileName) {
			var isTxt  = fileName.search(/\.txt$/)  !== -1;
			return isTxt;
		});

		// get json files
		var jsonList = assetList.filter(function (fileName) {
			var isJson = fileName.search(/\.json$/) !== -1;
			return isJson;
		});

		// add images path
		for (var i = 0, len = imageList.length; i < len; i++) {
			var fileName = imageList[i];
			var id = path.join(subdir, fileName).replace(/\\/gi, '/');
			result.img.push(id);
			// add a place holder in data object
			var withoutExt = fileName.split('.');
			withoutExt.pop();
			withoutExt = withoutExt.join('.');
			currentDat[withoutExt] = null;
		}

		// add sound path
		for (var i = 0, len = soundList.length; i < len; i++) {
			var fileName = soundList[i];
			var id = path.join(subdir, fileName).replace(/\\/gi, '/');
			result.snd.push(id);
			// add a place holder in data object
			var withoutExt = fileName.split('.');
			withoutExt.pop();
			withoutExt = withoutExt.join('.');
			currentDat[withoutExt] = null;
		}

		// add text file content
		for (var i = 0, len = textList.length; i < len; i++) {
			var fileName = textList[i];
			var id = path.join(subdir, fileName).replace(/\\/gi, '/');
			// result.snd.push(id);
			var content = fs.readFileSync(path.join(rootDir, dir, fileName), { encoding: 'utf8' });
			// add a place holder in data object
			var withoutExt = fileName.split('.');
			withoutExt.pop();
			withoutExt = withoutExt.join('.');
			currentDat[withoutExt] = content;
		}

		// add json file content
		for (var i = 0, len = jsonList.length; i < len; i++) {
			var fileName = jsonList[i];
			var id = fileName.substring(0, fileName.length - 5);
			var content = fs.readFileSync(path.join(rootDir, dir, fileName), { encoding: 'utf8' });
			currentDat[id] = JSON.parse(content);
		}

		// recurse on subdirectories
		for (var i = 0, len = dirList.length; i < len; i++) {
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
