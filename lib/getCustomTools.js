/** get custom tools
 * @author Cedric Stoquer
 */
var walk = require('walk');
var path = require('path');


function stringifyToolObject(obj) {
	if (typeof obj === 'string') return 'require("' + obj + '")';
	str = '{';
	for (var keys = Object.keys(obj), i = 0, len = keys.length - 1; i <= len; i++) {
		var key = keys[i];
		str += key + ':';
		str += stringifyToolObject(obj[key]);
		if (i < len) str += ',';
	}
	str += '}';
	return str;
}

module.exports = function getCustomTools(cb) {
	var customTools = {
		brush: {}
	};

	var walker = walk.walk('./tools', { followLinks: false });

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	walker.on('file', function (root, fileStats, cb) {
		var filename = fileStats.name;

		// only consider javascript files
		if (path.extname(filename) !== '.js') return cb();

		var relativePath = path.relative('./tools', root);
		var moduleName = path.basename(filename, '.js');

		if (!customTools[relativePath]) return cb(); // TODO handle subfolders
		customTools[relativePath][moduleName] = './' + relativePath + '/' + filename;

		return cb();
	});

	//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
	walker.on('end', function () {
		// construct the main js file
		var str = 'window.CUSTOM_TOOLS = ';
		str += stringifyToolObject(customTools) + ';';
		cb && cb(str);
	});
};