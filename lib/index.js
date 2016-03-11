/** Simple server with asset walker, socket.io, and request handler.
 *
 * @author Cedric Stoquer
 */
var fs          = require('fs-extra')
var express     = require('express');
var minify      = require('uglify-js');
var http        = require('http');
var path        = require('path');
var io          = require('socket.io');
var browserify  = require('browserify');
var getAsset    = require('./getAsset');
var initProject = require('./initProject');

var DEVELOPMENT_MODE = true;
var DO_MINIFY = false;

var app = express();
var cwd = process.cwd();
var assetDir  = 'assets';

// all environments
app.set('port',  process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

initProject();

var settings = require(path.join(cwd, 'settings.json'));
var mapsData = require(path.join(cwd, 'assets/maps.json'));


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

if (DEVELOPMENT_MODE) {
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

				// minify js code
				if (DO_MINIFY) {
					build = build.toString();
					var ast = minify.parser.parse(build);
					ast = minify.uglify.ast_mangle(ast);
					ast = minify.uglify.ast_squeeze(ast);
					build = minify.uglify.gen_code(ast);
				}

				// send result
				res.send(build);

				// save a version on disc
				fs.writeFileSync(path.join(cwd, 'build/index.js'), build);
			});
		} catch (error) {
			res.send(browserifyErrorDisplayer(error));
		}
	});

	// build and serve assets & data file
	app.get('/build/data.json', function (req, res) {
		var result = getAsset('/' + assetDir);
		result = JSON.stringify(result);
		res.send(result);
		// save a version on disc
		fs.writeFileSync(path.join(cwd, 'build/data.json'), result);
	});
}

// tools

app.use('/tools',              express.static(path.join(__dirname, 'tools')));
app.use('/tools/common',       express.static(path.join(__dirname, 'common')));
app.use('/tools/assets',       express.static(path.join(cwd, 'assets')));

app.get('/tools/build/data.json', function (req, res) {
	var result = getAsset('/' + assetDir);
	res.send(JSON.stringify(result));
});

app.get('/tools/settings.json', function (req, res) {
	res.send(JSON.stringify(settings));
});

app.get('/tools/__settings.js', function (req, res) {
	res.send('var settings = ' + JSON.stringify(settings));
});


//████████████████████████████████████████████████████
//██████████████████████████████████████████████▀█████
//█▄ ▀▄▄▄█▀▄▄▄▄▀█▀▄▄▄▀ ▄█▄ ██▄ ██▀▄▄▄▄▀█▀▄▄▄▄ █▄ ▄▄▄██
//██ █████ ▄▄▄▄▄█ ████ ███ ███ ██ ▄▄▄▄▄██▄▄▄▄▀██ █████
//█▀ ▀▀▀██▄▀▀▀▀▀█▄▀▀▀▄ ███▄▀▀▄ ▀█▄▀▀▀▀▀█ ▀▀▀▀▄██▄▀▀▀▄█
//███████████████████▀ ▀██████████████████████████████

function saveMapRequest(body, cb) {
	var mapId = ~~(body.mapId);
	if (mapId > mapsData.length) return cb('incorrect mapIndex');
	var data = body.data;
	mapsData[mapId] = data;
	fs.writeFileSync(path.join(cwd, 'assets/maps.json'), JSON.stringify(mapsData));
	return cb();
}

function moveMapRequest(body, cb) {
	var mapId = ~~(body.mapId);
	var to    = ~~(body.to);
	if (mapId >= mapsData.length || to >= mapsData.length) return cb('incorrect mapIndex');
	mapsData.splice(to, 0, mapsData.splice(mapId, 1).pop());
	fs.writeFileSync(path.join(cwd, 'assets/maps.json'), JSON.stringify(mapsData));
	return cb();
}

function deleteMapRequest(body, cb) {
	var mapId = ~~(body.mapId);
	if (mapId >= mapsData.length) return cb('incorrect mapIndex');
	mapsData.splice(mapId, 1);
	fs.writeFileSync(path.join(cwd, 'assets/maps.json'), JSON.stringify(mapsData));
	return cb();
}


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
app.post('/tools/req', function (req, res) {
	var body = req.body;

	function sendResponse(error, result) {
		res.send({ error: error || null, result: result || null });
	}

	switch (body.request) {
		case 'saveMap':   return saveMapRequest(body, sendResponse);
		case 'moveMap':   return moveMapRequest(body, sendResponse);
		case 'deleteMap': return deleteMapRequest(body, sendResponse);
	}

	sendResponse('badRequest');
});


//████████████████████████████████████████████████████
//████████████████████▄░████████████▀████████▄████████
//██▀▄▄▄░█▀▄▄▄▀█▀▄▄▀░██░█▄░▄█▀▄▄▄▀█▄░▄▄█████▄░██▀▄▄▄▀█
//███▄▄▄▀█░███░█░██████░▄░███░▄▄▄▄██░████████░██░███░█
//██░▀▀▀▄█▄▀▀▀▄█▄▀▀▀▄█▀░██░▀█▄▀▀▀▀██▄▀▀▄█░░█▀░▀█▄▀▀▀▄█
//████████████████████████████████████████████████████
var sockets = {};

var sock = io.listen(server);
sock.set('log level', 1);

sock.sockets.on('connection', function (socket) {
	// adding socket in pool
	var clientId = socket.id;
	sockets[clientId] = socket;

	// broadcast
	socket.on('broadcast', function (data) {
		// TODO: we can use broadcast function available in socket.io
		data = data || {};
		if (!data.from) data.from = clientId;
		for (var id in sockets) {
			sockets[id].emit('message', data);
		}
	});

	// simple message
	socket.on('message', function (data) {
		data = data || {};
		destination = sockets[data.to];
		if (!destination) return console.log('No client with socket id ' + data.to);
		if (!data.from) data.from = clientId;
		destination.emit('message', data);
	});

	// TODO: disconnection
	socket.on('disconnect', function () {
		delete sockets[clientId];
		for (var id in sockets) {
			sockets[id].emit('disconnection', { from: clientId });
		}
	});
});
