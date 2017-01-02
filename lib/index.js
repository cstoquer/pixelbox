/** Simple server with asset walker, socket.io, and request handler.
 *
 * @author Cedric Stoquer
 */
var EventEmitter   = require('events');
var stream         = require('stream');
var fs             = require('fs-extra');
var express        = require('express');
var uglify         = require('uglify-js');
var http           = require('http');
var path           = require('path');
var browserify     = require('browserify');
var getAsset       = require('./getAsset');
var getCustomTools = require('./getCustomTools');
var initProject    = require('./initProject');

var cwd = process.cwd();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var pixelbox = new EventEmitter();
module.exports = pixelbox;

initProject();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getSettings() {
	return JSON.parse(fs.readFileSync(path.join(cwd, 'settings.json'), 'utf8'));
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

var app = express();

// all environments
app.set('port',  process.env.PORT || 3000);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

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
app.get('/build/index.js', function (req, res) {
	try {
		var b = browserify();
		b.add('./node_modules/index.js');
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
					global_defs: { DEBUG: false }
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
app.get('/build/data.json', function (req, res) {
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
app.get('/tools/build/data.json', function (req, res) {
	res.send(getStaticAssetList());
});

// project settings, rebuilt every time it is requested
app.get('/tools/__settings.js', function (req, res) {
	res.send('var settings = ' + JSON.stringify(getSettings()));
});

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// custom tools
app.get('/tools/customTools.js', function (req, res) {
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


//████████████████████████████████████████████████████
//██████████████████████████████████████████████▀█████
//█▄ ▀▄▄▄█▀▄▄▄▄▀█▀▄▄▄▀ ▄█▄ ██▄ ██▀▄▄▄▄▀█▀▄▄▄▄ █▄ ▄▄▄██
//██ █████ ▄▄▄▄▄█ ████ ███ ███ ██ ▄▄▄▄▄██▄▄▄▄▀██ █████
//█▀ ▀▀▀██▄▀▀▀▀▀█▄▀▀▀▄ ███▄▀▀▄ ▀█▄▀▀▀▀▀█ ▀▀▀▀▄██▄▀▀▀▄█
//███████████████████▀ ▀██████████████████████████████

var commands = {};

function addCommandModule(moduleName) {
	var module = require('./commands/' + moduleName);
	commands[moduleName] = {};
	for (var keys = Object.keys(module), i = 0; i < keys.length; i++) {
		var commandName = keys[i];
		var command = module[commandName];
		if (typeof command !== 'function') continue;
		commands[moduleName][commandName] = command;
	}
}

addCommandModule('map');
addCommandModule('image');
addCommandModule('ui');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
app.post('/tools/req', function (req, res) {
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

	commands[moduleId][commandId](body, sendResponse);
});
