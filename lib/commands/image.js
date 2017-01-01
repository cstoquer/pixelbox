var fs   = require('fs-extra');
var path = require('path');
var cwd  = process.cwd();

exports.savePng = function (body, cb) {
	if (!body.data || !body.fileName) return cb('wrong data');
	var filePath = path.normalize(path.join(cwd, 'assets', body.fileName));
	// TODO: check path
	var base64Data = body.data.replace(/^data:image\/png;base64,/, '');
	fs.writeFile(filePath, base64Data, 'base64', cb);
};