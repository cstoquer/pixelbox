var fs    = require('fs');
var extra = require('fs.extra');

function createFolder(folderName) {
	var folderPath = path.join(cwd, folderName);
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
}

function createFile(dest, source) {
	var destPath = path.join(cwd, dest);
	if (fs.existsSync(destPath)) return;
	var sourcePath = path.join(__dirname, 'init', source);
	fs.writeFileSync(destPath, fs.readFileSync(sourcePath));
}

module.exports = function createProjectFiles() {
	createFolder('assets');
	createFolder('audio');
	createFolder('build');
	createFolder('src');

	createFile('src/main.js', 'main.js');
	createFile('index.html', 'index.html');
	createFile('build/styles.css', 'styles.css');
}

