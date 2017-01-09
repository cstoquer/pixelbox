var fs   = require('fs-extra');
var path = require('path');
var cwd  = process.cwd();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Save a png file on disc
 *
 * @param {Object} params          - parameter object
 *        {string} params.filename - file path
 *        {string} params.data     - base64 encoded png data
 *
 * @param {function} cb - callback function
 */
exports.savePng = function (params, cb) {
	if (!params.data || !params.filename) return cb('wrong data');
	var filePath = path.normalize(path.join(cwd, 'assets', params.filename));
	// TODO: check path
	var base64Data = params.data.replace(/^data:image\/png;base64,/, '');
	fs.writeFile(filePath, base64Data, 'base64', cb);
};