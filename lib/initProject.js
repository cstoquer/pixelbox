var fs   = require('fs-extra')
var path = require('path');

var cwd = process.cwd();
var projectName = path.basename(cwd);

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

function copyFileAndReplaceName(source, dest) {
	var destPath = path.join(cwd, dest);
	if (fs.existsSync(destPath)) return;
	var sourcePath = path.join(__dirname, source);
	var content = fs.readFileSync(sourcePath, 'utf8');
	content = content.replace('###', projectName);
	fs.writeFileSync(destPath, content);
}

module.exports = function createProjectFiles() {
	// create pixelbox project folders
	createFolder('assets');
	createFolder('audio');
	createFolder('build');
	createFolder('src');
	createFolder('node_modules');
	createFolder('tools');
	createFolder('tools/brush');
	createFolder('tools/commands');

	// copy init files
	copyFile('init/index.js',          'node_modules/index.js');
	copyFile('init/main.js',           'src/main.js');
	copyFile('init/styles.css',        'build/styles.css');
	copyFile('init/tilesheet.png',     'assets/tilesheet.png');
	copyFile('init/maps.json',         'assets/maps.json');
	copyFile('init/gitignore',         '.gitignore');
	copyFile('init/toolSettings.json', 'tools/settings.json');

	copyFileAndReplaceName('init/index.html',    'index.html');
	copyFileAndReplaceName('init/settings.json', 'settings.json');

	// copy included modules
	copyFile('components/assetLoader',   'node_modules/assetLoader');
	copyFile('components/domUtils',      'node_modules/domUtils');
	copyFile('components/EventEmitter',  'node_modules/EventEmitter');
	copyFile('components/gamepad',       'node_modules/gamepad');
	copyFile('components/TileMap',       'node_modules/TileMap');
	copyFile('components/Texture',       'node_modules/Texture');
	copyFile('components/pointer',       'node_modules/pointer');

	// copy modules in node_modules root for browserify to find them
	copyFile('../node_modules/audio-manager', 'node_modules/audio-manager');
	copyFile('../node_modules/tina',          'node_modules/tina');
};

