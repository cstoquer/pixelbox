var childProcess = require('child_process');
var path         = require('path');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** make OS explorer open a folder
 *
 * @param {Object} params          - parameter object
 *        {string} [params.folder] - folder path (default: "src")
 *
 * @param {function} cb - callback function
 */
exports.open = function (params, cb) {
	var folder = params.folder || 'src';
	var src = path.join(process.cwd(), folder);
	var cmd = 'start "" "' + src + '"';
	childProcess.exec(cmd);
	cb();
};
