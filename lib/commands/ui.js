var fs   = require('fs-extra');
var path = require('path');
var cwd  = process.cwd();

exports.saveDisposition = function (body, cb) {
	if (!body.data) return cb('wrong data');
	var filePath = path.join(cwd, 'tools/settings.json');
	var settings = JSON.parse(fs.readFileSync(filePath), 'utf8');
	settings.disposition = body.data;
	fs.writeFileSync(filePath, JSON.stringify(settings, null, '\t'));
};