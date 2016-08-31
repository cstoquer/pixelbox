//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Pixelbox tool module
 * 
 * @author Cedric Stoquer
 */

var assetLoader  = require('../../common/assetLoader');
var Panel        = require('./Panel.js');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var SPRITE_WIDTH  = settings.spriteSize[0];
var SPRITE_HEIGHT = settings.spriteSize[1];
var PIXEL_SIZE = 3;
var max = Math.max(SPRITE_WIDTH, SPRITE_HEIGHT);
if      (max >= 20) PIXEL_SIZE = 1;
else if (max >= 10) PIXEL_SIZE = 2;
settings.PIXEL_SIZE = PIXEL_SIZE;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// create toolbox
var toolbox = {};
window.toolbox = toolbox; // TODO for testing purpose, to be removed

// set cross-references
Panel.prototype.toolbox = toolbox;

// create panels
toolbox.keyboard    = require('./keyboard.js');
toolbox.spritesheet = require('./SpriteSheetPanel.js');
toolbox.palette     = require('./PalettePanel.js');
toolbox.mapEditor   = require('./MapEditorPanel.js');
toolbox.mapList     = require('./MapListPanel.js');
toolbox.customTools = require('./CustomToolsPanel.js');
toolbox.brush       = require('./Brush.js');

// init panels positions
toolbox.spritesheet.setPosition(566,   0);
toolbox.palette    .setPosition(173, 440);
toolbox.mapEditor  .setPosition(173,   0);
toolbox.mapList    .setPosition(  0,   0);
toolbox.customTools.setPosition(340, 440);

// load assets and initialise panels
assetLoader.preloadStaticAssets(function onAssetsLoaded(error, result) {
	if (error) return console.error(error);
	window.assets = result;
	toolbox.spritesheet.updateSpritesheet(assets.spritesheet);
	toolbox.palette.create(settings.palette);
	toolbox.mapList.setup(assets);
	if (assets.maps[0]) toolbox.mapEditor.loadMap(assets.maps[0]);
});


