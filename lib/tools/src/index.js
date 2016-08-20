//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE = 3;
var max = Math.max(SPRITE_WIDTH, SPRITE_HEIGHT);
if      (max >= 20) PIXEL_SIZE = 1;
else if (max >= 10) PIXEL_SIZE = 2;
settings.PIXEL_SIZE = PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// create panels
var assetLoader  = require('../../common/assetLoader');
var spritesheet  = require('./SpriteSheetPanel.js');
var palette      = require('./PalettePanel.js');
var mapEditor    = require('./MapEditorPanel.js');
var mapList      = require('./MapListPanel.js');

// set cross-references
spritesheet.mapEditor = mapEditor;
mapEditor.spritesheet = spritesheet;
mapEditor.mapList     = mapList;

// init panels positions
spritesheet.setPosition(566,   0);
palette.setPosition    (173, 440);
mapEditor.setPosition  (173,   0);
mapList.setPosition    (  0,   0);

// load assets and initialise panels
assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
	if (error) return console.error(error);
	window.assets = result;
	spritesheet.updateSpritesheet(assets.spritesheet);
	palette.create(settings.palette);
	mapList.setup(assets);
	if (assets.maps[0]) mapEditor.loadMap(assets.maps[0]);
});


