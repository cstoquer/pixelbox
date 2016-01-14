var fs    = require('fs');
var extra = require('fs.extra');
var path  = require('path');

var cwd = process.cwd();

function createFolder(folderName) {
	var folderPath = path.join(cwd, folderName);
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
}

function createFile(source, dest) {
	var destPath = path.join(cwd, dest);
	if (fs.existsSync(destPath)) return;
	var sourcePath = path.join(__dirname, 'init', source);
	fs.writeFileSync(destPath, fs.readFileSync(sourcePath));
}

function copyFolder(source, dest) {
	var destPath = path.join(cwd, dest);
	if (fs.existsSync(destPath)) return;
	var sourcePath = path.join(__dirname, 'init', source);
	extra.copyRecursive(sourcePath, destPath, function (error) {
		if (error) console.error(error);
	});
}

module.exports = function createProjectFiles() {
	// create pixelbox project folders
	createFolder('assets');
	createFolder('audio');
	createFolder('build');
	createFolder('src');
	createFolder('node_modules');

	// copy init files
	createFile('main.js',    'src/main.js');
	createFile('index.html', 'index.html');
	createFile('styles.css', 'build/styles.css');

	// copy modules in node_modules root for browserify to find them
	copyFolder('node_modules/audio-manager', 'audio-manager');
};

