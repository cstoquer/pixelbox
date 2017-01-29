/** Simple server with asset walker, socket.io, and request handler.
 *
 * @author Cedric Stoquer
 */
var EventEmitter   = require('events');
var stream         = require('stream');
var fs             = require('fs-extra');
var express        = require('express');
var bodyParser     = require('body-parser');
var logger         = require('morgan');
var methodOverride = require('method-override');
var uglify         = require('uglify-js');
var http           = require('http');
var path           = require('path');
var browserify     = require('browserify');
var stringify      = require('stringify');
var getAsset       = require('./getAsset');
var getCustomTools = require('./getCustomTools');
var initProject    = require('./initProject');

var cwd = process.cwd();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var pixelbox = new EventEmitter();
module.exports = pixelbox;

initProject();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function mergeObjects(obj, template) {
	for (var id in template) {
		if (obj[id] !== undefined) continue;
		ogj[id] = template[id];
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getSettings() {
	var settings = JSON.parse(fs.readFileSync(path.join(cwd, 'settings.json'), 'utf8'));
	var template = JSON.parse(fs.readFileSync(path.join(__dirname, 'init/settings.json'), 'utf8'));
	settings.components = settings.components || {};
	mergeObjects(settings.components, template.components);
	return settings;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getStaticAssetList() {
	var staticAssetList = getAsset('assets', [
		{ ext: ['png', 'jpg', 'jpeg'], id: 'img' },
		{ ext: ['mp3', 'wav'],         id: 'snd' },
		{ ext: ['txt']                           },
		{ ext: ['json'], parser: JSON.parse      }
	]);
	return JSON.stringify(staticAssetList);
}

//█████████████████████████████████████████████
//█████████████████████████████████████████████
//█▀▄▄▄▄ █▀▄▄▄▄▀█▄ ▀▄▄▄█▄ ▄██▄ ▄█▀▄▄▄▄▀█▄ ▀▄▄▄█
//██▄▄▄▄▀█ ▄▄▄▄▄██ ███████ ██ ███ ▄▄▄▄▄██ █████
//█ ▀▀▀▀▄█▄▀▀▀▀▀█▀ ▀▀▀█████  ████▄▀▀▀▀▀█▀ ▀▀▀██
//█████████████████████████████████████████████

var router = express.Router();
var app    = express();

// all environments
app.set('port',  process.env.PORT || 3000);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
  
app.use('/', router);
app.use('/', express.static(cwd + '/'));

var server = http.createServer(app);
server.listen(app.get('port'), function () {
	console.log('Pixelbox server listening on port ' + app.get('port'));
});


function browserifyErrorDisplayer(error) {
	return "var dom = document.createElement('div');"
		+  "document.getElementsByTagName('body')[0].appendChild(dom);"
		+  'dom.innerText = "' + error.toString() + '"';
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// build and serve javascript index file
router.get('/build/index.js', function (req, res) {

	// get settings for build
	var settings = getSettings();
	

	// first pass minify on pixelbox's index only to strip out disabled dependencies
	var index = fs.readFileSync(path.join(cwd, 'node_modules/index.js'), 'utf8');
	index = uglify.minify(index, {
		fromString: true,
		mangle: false,
		compress: {
			global_defs: {
				__USE_CORE__:  settings.components.pixelboxCore,
				__KEYBOARD__:  settings.components.keyboard,
				__USE_AUDIO__: settings.components.AudioManager,
				__USE_TINA__:  settings.components.TINA
			}
		}
	}).code;

	// builder
	try {
		var s = new stream.Readable();
		s._read = function noop() {}; // redundant?
		s.push(index);
		s.push(null);

		var b = browserify(s, { basedir: './node_modules' });
		b.transform(stringify, { appliesTo: { includeExtensions: ['.txt', '.css'] } });

		b.bundle(function (error, build) {
			if (error) {
				res.send(browserifyErrorDisplayer(error));
				return;
			}

			// send result
			res.send(build);

			// minify js code
			var minifiedBuild = uglify.minify(build.toString(), {
				fromString: true,
				mangle: true,
				compress: {
					global_defs: {
						DEBUG: false
					}
				}
			});

			build = minifiedBuild.code;

			// save a version on disc
			fs.writeFileSync(path.join(cwd, 'build/index.js'), build, 'utf8');
		});
	} catch (error) {
		console.error(error);
		res.send(browserifyErrorDisplayer(error));
	}
});

// build and serve assets & data file
router.get('/build/data.json', function (req, res) {
	var staticAssetList = getStaticAssetList();
	res.send(staticAssetList);
	// save a version on disc
	fs.writeFileSync(path.join(cwd, 'build/data.json'), staticAssetList);
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// tools

// serve tools source files from pixelbox folder
app.use('/tools',          express.static(path.join(__dirname, 'tools')));
app.use('/tools/common',   express.static(path.join(__dirname, 'common')));

// serve project files from process cwd
app.use('/tools/assets',   express.static(path.join(cwd, 'assets')));
app.use('/tools/project',  express.static(cwd));

// asset list needs to be rebuild every time it is requeted
router.get('/tools/build/data.json', function (req, res) {
	res.send(getStaticAssetList());
});

// project settings, rebuilt every time it is requested
router.get('/tools/__settings.js', function (req, res) {
	res.send('var settings = ' + JSON.stringify(getSettings()));
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// custom tools
router.get('/tools/customTools.js', function (req, res) {
	getCustomTools(function (customTools) {
		try {
			var s = new stream.Readable();
			s._read = function noop() {}; // redundant?
			s.push(customTools);
			s.push(null);

			var b = browserify(s, { basedir: './tools' });

			b.bundle(function (error, build) {
				if (error) {
					console.error('custom tools bundle error: ' + error);
					res.send('');
					return;
				}

				// send result
				res.send(build);
			});
		} catch (error) {
			console.error('custom tools build error: ' + error);
			res.send('');
		}
	});
});


//████████████████████████████████████████████████████████████████
//█████████████████████████████████████████████████████▄░█████████
//█▀▄▄▄▀░█▀▄▄▄▄▀█▄░▀▄▀▀▄▀█▄░▀▄▀▀▄▀█▀▄▄▄▄▀██▄░▀▄▄▀██▀▄▄▄▀░██▀▄▄▄▄░█
//█░██████░████░██░██░██░██░██░██░█▀▄▄▄▄░███░███░██░████░███▄▄▄▄▀█
//█▄▀▀▀▀▄█▄▀▀▀▀▄█▀░▀█░▀█░█▀░▀█░▀█░█▄▀▀▀▄░▀█▀░▀█▀░▀█▄▀▀▀▄░▀█░▀▀▀▀▄█
//████████████████████████████████████████████████████████████████

var commands = {};

function addCommandModule(moduleName, modulePath) {
	var module = require(modulePath);
	commands[moduleName] = {};
	for (var keys = Object.keys(module), i = 0; i < keys.length; i++) {
		var commandName = keys[i];
		var command = module[commandName];
		if (typeof command !== 'function') continue;
		commands[moduleName][commandName] = command;
	}
}

function getCommandModules(dir) {
	var fileList = fs.readdirSync(dir);

	for (var i = 0; i < fileList.length; i++) {
		var fileName = fileList[i];
		var moduleName = path.parse(fileName).name;
		var modulePath = path.join(dir, fileName);
		addCommandModule(moduleName, modulePath);
	}
}

getCommandModules(path.join(__dirname, 'commands')); // pixelbox's tools commands
getCommandModules(path.join(cwd, 'tools/commands')); // project's custom commands

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function commandRequest(req, res) {
	var body = req.body;

	function sendResponse(error, result) {
		res.send({ error: error || null, result: result || null });
	}

	if (!body.command) return sendResponse('Empty command');
	var command = body.command.split('.');
	if (command.length !== 2) return sendResponse('Incorrect command format');

	var moduleId  = command[0];
	var commandId = command[1];

	if (!commands[moduleId] || !commands[moduleId][commandId]) return sendResponse('Unknown command');

	console.log('\033[101mCOMMAND\033[0m ' + moduleId + '.' + commandId);
	commands[moduleId][commandId](body, sendResponse);
}

app.post('/tools/req', commandRequest);
app.post('/req',       commandRequest);
