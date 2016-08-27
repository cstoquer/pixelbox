/** Simple server with asset walker, socket.io, and request handler.
 *
 * @author Cedric Stoquer
 */
var EventEmitter = require('events');
var fs          = require('fs-extra');
var express     = require('express');
var minify      = require('uglify-js');
var http        = require('http');
var path        = require('path');
var browserify  = require('browserify');
var getAsset    = require('./getAsset');
var initProject = require('./initProject');


var pixelbox = new EventEmitter();
pixelbox.DEVELOPMENT_MODE = true;
pixelbox.DO_MINIFY = false;
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
var mapsData;

function getMapsData() {
	mapsData = fs.readFileSync(path.join(cwd, 'assets/maps.json'));
	return mapsData;
}
getMapsData();


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

				// minify js code
				if (pixelbox.DO_MINIFY) {
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
		var result = getAsset(assetDir);
		result = JSON.stringify(result);
		res.send(result);
		// save a version on disc
		fs.writeFileSync(path.join(cwd, 'build/data.json'), result);
	});
}

// tools

app.use('/tools',        express.static(path.join(__dirname, 'tools')));
app.use('/tools/common', express.static(path.join(__dirname, 'common')));
app.use('/tools/assets', express.static(path.join(cwd, 'assets')));

app.get('/tools/build/data.json', function (req, res) {
	var result = getAsset(assetDir);
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

function saveMapsFile(mapsData) {
	var str = JSON.stringify(mapsData, null, '\t');
	fs.writeFileSync(path.join(cwd, 'assets/maps.json'), str);
	pixelbox.emit('tools/saveMaps', str);
}

function saveMapRequest(body, cb) {
	getMapsData();
	var mapId = ~~(body.mapId);
	if (mapId > mapsData.length) return cb('incorrect mapIndex');
	var data = body.data;
	mapsData[mapId] = data;
	saveMapsFile(mapsData);
	return cb();
}

function moveMapRequest(body, cb) {
	getMapsData();
	var mapId = ~~(body.mapId);
	var to    = ~~(body.to);
	if (mapId >= mapsData.length || to >= mapsData.length) return cb('incorrect mapIndex');
	mapsData.splice(to, 0, mapsData.splice(mapId, 1).pop());
	saveMapsFile(mapsData)
	return cb();
}

function deleteMapRequest(body, cb) {
	getMapsData();
	var mapId = ~~(body.mapId);
	if (mapId >= mapsData.length) return cb('incorrect mapIndex');
	mapsData.splice(mapId, 1);
	saveMapsFile(mapsData);
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

