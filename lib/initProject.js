var fs   = require('fs-extra')
var path = require('path');

var cwd = process.cwd();

function createFolder(folderName) {
	var folderPath = path.join(cwd, folderName);
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
}

function copyFile(source, dest) {
	var destPath = path.join(cwd, dest);
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
	copyFile('init/index.js', 'node_modules/index.js');
	copyFile('init/main.js', 'src/main.js');
	copyFile('init/index.html', 'index.html');
	copyFile('init/styles.css', 'build/styles.css');
	copyFile('init/spritesheet.png', 'assets/spritesheet.png');
	copyFile('init/.gitignore', '.gitignore');

	// copy modules in node_modules root for browserify to find them
	copyFile('../node_modules/audio-manager', 'node_modules/audio-manager');
	copyFile('init/assetLoader', 'node_modules/assetLoader');
	copyFile('init/EventEmitter', 'node_modules/EventEmitter');
};

