//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */

var TILE_WIDTH  = settings.tileSize[0];
var TILE_HEIGHT = settings.tileSize[1];
var PIXEL_SIZE = 3;
var max = Math.max(TILE_WIDTH, TILE_HEIGHT);
if      (max >= 20) PIXEL_SIZE = 1;
else if (max >= 10) PIXEL_SIZE = 2;
settings.PIXEL_SIZE = PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var assetLoader = require('../../components/assetLoader');
var Map         = require('../../components/Map');
var Texture     = require('../../components/Texture');
var toolbox     = require('./toolbox');

function setDisposition(disposition) {
	for (var panelId in disposition) {
		var panel = toolbox[panelId];
		if (!panel || !panel.setDisposition) continue;
		panel.setDisposition(disposition[panelId]);
	}
}

function getDisposition() {
	var disposition = {};
	for (var panelId in toolbox) {
		var panel = toolbox[panelId];
		if (!panel || !panel.getDisposition) continue;
		disposition[panelId] = panel.getDisposition();
	}
	return disposition;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// load assets and initialise panels
assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
	if (error) return console.error(error);

	window.assets = result;

	// DEPRECATED: check if mapBank is in the old format
	assets.maps = Map._checkBankFormat(assets.maps);

	if (!assets.tilesheet) {
		// create a default tilesheet
		console.warn('Could not find default tilesheet. Creating a new tilesheet texture.');
		assets.tilesheet = new Texture(16 * TILE_WIDTH, 16 * TILE_HEIGHT);
	}
	toolbox.tilesheet.updateTilesheet(assets.tilesheet);
	toolbox.palette.create(settings.palette);
	toolbox.assetList.refreshAssetList();

	// FIXME: correctly check for default map
	if (assets.maps.maps[0]) {
		toolbox.mapEditor.loadMap({
			file: 'maps',
			bank: assets.maps,
			index: 0,
			map: assets.maps.maps[0]
		});
	}

	assetLoader.loadJson('project/tools/settings.json', function onToolSettingsLoaded(error, toolSettings) {
		if (error) return console.error(error);
		var disposition = toolSettings.disposition || {};
		setDisposition(disposition);
	});
});


window.onbeforeunload = function saveSettings() {
	assetLoader.sendRequest({
		command: 'ui.saveDisposition',
		data: getDisposition()
	});
}


function savePng(canvas, filename, cb) {
	var request = {
		command: 'image.savePng',
		filename: filename,
		data: canvas.toDataURL("image/png")
	};

	assetLoader.sendRequest(request, function (error) {
		cb && cb(error);	
	});
}
