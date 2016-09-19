var Panel       = require('./Panel.js');
var PixelboxMap = require('../../common/Map');

// create toolbox
var toolbox = {};
module.exports = toolbox;
window.toolbox = toolbox; // TODO for testing purpose, to be removed

// set cross-references
Panel.prototype.toolbox = toolbox;

// create clipboard
toolbox.mapClipboard = new PixelboxMap();

// create panels
toolbox.keyboard    = require('./keyboard.js');
toolbox.spritesheet = require('./SpriteSheetPanel.js');
toolbox.palette     = require('./PalettePanel.js');
toolbox.mapEditor   = require('./MapEditorPanel.js');
toolbox.assetList   = require('./AssetListPanel.js');
toolbox.customTools = require('./CustomToolsPanel.js');
// toolbox.brush       = require('./Brush.js');

// init panels positions
toolbox.spritesheet.setPosition(566,   0);
toolbox.palette    .setPosition(173, 440);
toolbox.mapEditor  .setPosition(173,   0);
toolbox.assetList  .setPosition(  0,   0);
toolbox.customTools.setPosition(340, 440);

