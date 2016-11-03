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
var toolbox     = require('./toolbox');

// load assets and initialise panels
assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
	if (error) return console.error(error);
	window.assets = result;
	toolbox.spritesheet.updateSpritesheet(assets.spritesheet);
	toolbox.palette.create(settings.palette);
	toolbox.assetList.setup(assets);
	if (assets.maps[0]) toolbox.mapEditor.loadMap(assets.maps[0]);
});

function savePng(canvas, fileName, cb) {
	var request = {
		command: 'savePng',
		fileName: fileName,
		data: canvas.toDataURL("image/png")
	};

	assetLoader.sendRequest(request, function (error) {
		cb && cb(error);	
	});
}
