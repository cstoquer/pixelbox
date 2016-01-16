var fs   = require('fs-extra')
var path = require('path');

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
	fs.copySync(sourcePath, destPath);
}

function copyModule(source, dest) {
	var destPath = path.join(cwd, 'node_modules', dest);
	if (fs.existsSync(destPath)) return;
	var sourcePath = path.join(__dirname, source);
	fs.copySync(sourcePath, destPath);
}

module.exports = function createProjectFiles() {
	// create pixelbox project folders
	createFolder('assets');
	createFolder('audio');
	createFolder('build');
	createFolder('src');
	createFolder('node_modules');

	// copy init files
	createFile('index.js',   'node_modules/index.js');
	createFile('main.js',    'src/main.js');
	createFile('index.html', 'index.html');
	createFile('styles.css', 'build/styles.css');

	// copy modules in node_modules root for browserify to find them
	copyModule('../node_modules/audio-manager', 'audio-manager');
	copyModule('init/assetLoader', 'assetLoader');
	copyModule('init/EventEmitter', 'EventEmitter');
};

