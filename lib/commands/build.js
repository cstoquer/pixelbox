var fs       = require('fs-extra');
var path     = require('path');
var archiver = require('archiver');
var cwd      = process.cwd();

exports.createArchive = function (body, cb) {
	// create a file to stream archive data to.
	var filename = body.filename || 'build';
	var output  = fs.createWriteStream(path.join(cwd, filename + '.zip'));
	var archive = archiver('zip', {
		store: true // Sets the compression method to STORE. 
	});

	// listen for all archive data to be written 
	output.on('close', cb);
	archive.on('error', cb);

	// pipe archive data to the file 
	archive.pipe(output);

	// append files
	archive.file('index.html', { name: 'index.html' });
	archive.directory(path.join(cwd, 'assets/'), 'assets');
	archive.directory(path.join(cwd, 'audio/'),  'audio');
	archive.directory(path.join(cwd, 'build/'),  'build');

	// finalize the archive (ie we are done appending files but streams have to finish yet) 
	archive.finalize();
};
