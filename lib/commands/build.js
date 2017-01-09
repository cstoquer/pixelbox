var fs       = require('fs-extra');
var path     = require('path');
var archiver = require('archiver');
var cwd      = process.cwd();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create a zip archive containing the build of the project.
 *  The archive contain only the necessary files, 
 *  and can pushed used "as it" on platforms like Itch.io
 *
 * @param {Object} params            - parameter object
 *        {string} [params.filename] - name of the archive (default: 'build')
 *
 * @param {function} cb - callback function
 */
exports.createArchive = function (params, cb) {
	// create a file to stream archive data to.
	var filename = params.filename || 'build';
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
