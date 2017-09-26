var fs   = require('fs-extra');
var path = require('path');
var cwd  = process.cwd();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Appends tools panel configuration in the project's tools/setting.json" file.
 *
 * @param {Object} params        - parameter object
 *        {string} [params.data] - configuration data (stringified JSON object)
 *
 * @param {function} cb - callback function
 */
exports.saveDisposition = function (params, cb) {
	if (!params.data) return cb('wrong data');
	var filePath = path.join(cwd, 'tools/settings.json');
	var settings;
	try {
		settings = JSON.parse(fs.readFileSync(filePath), 'utf8');
	} catch (error) {
		// tool settings file is missing. fall back to the init one
		settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../init/toolSettings.json')), 'utf8');
	}
	settings.disposition = params.data;
	fs.writeFile(filePath, JSON.stringify(settings, null, '\t'), cb);
};