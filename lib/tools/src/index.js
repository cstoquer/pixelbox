//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */

var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE = 3;
var max = Math.max(SPRITE_WIDTH, SPRITE_HEIGHT);
if      (max >= 20) PIXEL_SIZE = 1;
else if (max >= 10) PIXEL_SIZE = 2;
settings.PIXEL_SIZE = PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var assetLoader = require('../../components/assetLoader');
var Map         = require('../../components/Map');
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
assetLoader.loadJson('toolSettings.json', function onToolSettingsLoaded(error, toolSettings) {
	if (error) return console.error(error);
	var disposition = toolSettings.disposition || {};
	setDisposition(disposition);

	assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
		if (error) return console.error(error);

		window.assets = result;

		// DEPRECATED: check if mapBank is in the old format
		assets.maps = Map._checkBankFormat(assets.maps);

		toolbox.spritesheet.updateSpritesheet(assets.spritesheet);
		toolbox.palette.create(settings.palette);
		toolbox.assetList.refreshAssetList(assets);

		// FIXME: correctly check for default map
		if (assets.maps.maps[0]) {
			toolbox.mapEditor.loadMap({
				file: 'maps',
				bank: assets.maps,
				index: 0,
				map: assets.maps.maps[0]
			});
		}
	});
});


window.onbeforeunload = function saveSettings() {
	assetLoader.sendRequest({
		command: 'ui.saveDisposition',
		data: getDisposition()
	});
}


function savePng(canvas, fileName, cb) {
	var request = {
		command: 'image.savePng',
		fileName: fileName,
		data: canvas.toDataURL("image/png")
	};

	assetLoader.sendRequest(request, function (error) {
		cb && cb(error);	
	});
}
