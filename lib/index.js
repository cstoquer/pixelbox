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

var pixelbox = new EventEmitter();
pixelbox.DEVELOPMENT_MODE = true;
pixelbox.DO_MINIFY = true;
module.exports = pixelbox;

var app = express();
var cwd = process.cwd();
var assetDir = 'assets';

// all environments
app.set('port',  process.env.PORT || 3000);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

initProject();

var settings = require(path.join(cwd, 'settings.json'));



var STATIC_ASSET_FILTERS = [
	{ ext: ['png', 'jpg', 'jpeg'], id: 'img' },
	{ ext: ['mp3', 'wav'],         id: 'snd' },
	{ ext: ['txt']                           },
	{ ext: ['json'], parser: JSON.parse      }
];


//█████████████████████████████████████████████
//█████████████████████████████████████████████
//█▀▄▄▄▄ █▀▄▄▄▄▀█▄ ▀▄▄▄█▄ ▄██▄ ▄█▀▄▄▄▄▀█▄ ▀▄▄▄█
//██▄▄▄▄▀█ ▄▄▄▄▄██ ███████ ██ ███ ▄▄▄▄▄██ █████
//█ ▀▀▀▀▄█▄▀▀▀▀▀█▀ ▀▀▀█████  ████▄▀▀▀▀▀█▀ ▀▀▀██
//█████████████████████████████████████████████

app.use('/', express.static(cwd + '/'));

var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});


function browserifyErrorDisplayer(error) {
	return "var dom = document.createElement('div');"
		+  "document.getElementsByTagName('body')[0].appendChild(dom);"
		+  'dom.innerText = "' + error.toString() + '"';
}

if (pixelbox.DEVELOPMENT_MODE) {
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
				if (pixelbox.DO_MINIFY) {
					var minifiedBuild = uglify.minify(build.toString(), {
						fromString: true,
						mangle: true,
						compress: {
							global_defs: { DEBUG: false }
						}
					});

					build = minifiedBuild.code
				}

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
		var result = getAsset(assetDir, STATIC_ASSET_FILTERS);
		result = JSON.stringify(result);
		res.send(result);
		// save a version on disc
		fs.writeFileSync(path.join(cwd, 'build/data.json'), result);
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// tools

app.use('/tools',          express.static(path.join(__dirname, 'tools')));
app.use('/tools/common',   express.static(path.join(__dirname, 'common')));
app.use('/tools/assets',   express.static(path.join(cwd, 'assets')));

app.get('/tools/build/data.json', function (req, res) {
	var result = getAsset(assetDir, STATIC_ASSET_FILTERS);
	res.send(JSON.stringify(result));
});

// app.use('/tools/toolSettings.json', express.static(path.join(cwd, 'tools/settings.json')));
app.get('/tools/toolSettings.json', function (req, res) {
	res.send(fs.readFileSync(path.join(cwd, 'tools/settings.json')));
});
// app.get('/tools/settings.json', function (req, res) {
// 	res.send(JSON.stringify(settings));
// });

app.get('/tools/__settings.js', function (req, res) {
	res.send('var settings = ' + JSON.stringify(settings));
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
