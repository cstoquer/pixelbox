/** Simple server with asset walker, socket.io, and request handler.
 *
 * @author Cedric Stoquer
 */

var fs               = require('fs');
var express          = require('express');
var minify           = require('uglify-js');
var http             = require('http');
var path             = require('path');
var io               = require('socket.io');
var getAsset         = require('./getAsset');
var getComponentList = require('./getComponentList');
var handle_INCLUDE   = require('./handle_INCLUDE');
var handle_REPLACE   = require('./handle_REPLACE');

var DEVELOPMENT_MODE = false;
var app = express();
var cwd = process.cwd();
var assetFolder = 'assetStatic';
var scriptDir   = 'src';
var rootDir = cwd;

// all environments
app.set('port',  process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
// app.use(express.static(path.join(__dirname, 'www')));

// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

app.use('/', express.static(cwd + '/'));


//█████████████████████████████████████████████
//█████████████████████████████████████████████
//█▀▄▄▄▄ █▀▄▄▄▄▀█▄ ▀▄▄▄█▄ ▄██▄ ▄█▀▄▄▄▄▀█▄ ▀▄▄▄█
//██▄▄▄▄▀█ ▄▄▄▄▄██ ███████ ██ ███ ▄▄▄▄▄██ █████
//█ ▀▀▀▀▄█▄▀▀▀▀▀█▀ ▀▀▀█████  ████▄▀▀▀▀▀█▀ ▀▀▀██
//█████████████████████████████████████████████

var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

//██████████████████████████████████████████████████████████████████████
//███████████████████████████████▀█████████████▄ █████▄███████████▀█████
//█▀▄▄▄▄▀██▀▄▄▄▄ █▀▄▄▄▄ █▀▄▄▄▄▀█▄ ▄▄▄███████████ ███▄▄ ███▀▄▄▄▄ █▄ ▄▄▄██
//█▀▄▄▄▄ ███▄▄▄▄▀██▄▄▄▄▀█ ▄▄▄▄▄██ ██████████████ █████ ████▄▄▄▄▀██ █████
//█▄▀▀▀▄ ▀█ ▀▀▀▀▄█ ▀▀▀▀▄█▄▀▀▀▀▀██▄▀▀▀▄████████▀▀ ▀▀█▀▀ ▀▀█ ▀▀▀▀▄██▄▀▀▀▄█
//██████████████████████████████████████████████████████████████████████

app.get('/asset.json', function (req, res) {
	var result = getAsset('/' + assetFolder);
	result = JSON.stringify(result);
	res.send(result);
	// save a version on disc
	fs.writeFileSync(path.join(cwd, 'asset.json'), result);
});


//████████████████████████████████████████████████████
//██████████████████████████████████████████████▀█████
//█▄ ▀▄▄▄█▀▄▄▄▄▀█▀▄▄▄▀ ▄█▄ ██▄ ██▀▄▄▄▄▀█▀▄▄▄▄ █▄ ▄▄▄██
//██ █████ ▄▄▄▄▄█ ████ ███ ███ ██ ▄▄▄▄▄██▄▄▄▄▀██ █████
//█▀ ▀▀▀██▄▀▀▀▀▀█▄▀▀▀▄ ███▄▀▀▄ ▀█▄▀▀▀▀▀█ ▀▀▀▀▄██▄▀▀▀▄█
//███████████████████▀ ▀██████████████████████████████

function saveAssetDataRequest(body, cb) {
	var filePath = body.path;
	var data     = body.data;

	if (!data)     return cb('noData');
	if (!filePath) return cb('noPath');

	pathCheck = filePath.split('/');
	pathCheck.pop();
	pathCheck = pathCheck.join('/');

	// TODO: async version
	if (!fs.existsSync(path.join(cwd, pathCheck))) {
		return cb('folderExist');
	}

	fs.writeFileSync(path.join(cwd, filePath), JSON.stringify(data));
	
	return cb();
}


app.post('/req', function (req, res) {
	var body   = req.body;

	function sendResponse(error, result) {
		res.send({ error: error || null, result: result || null });
	}

	switch (body.request) {
		case 'saveAssetData': return saveAssetDataRequest(body, sendResponse);
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
