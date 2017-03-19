var Panel   = require('./Panel.js');
var TileMap = require('../../components/TileMap');

// create toolbox
var toolbox = {};
module.exports = toolbox;
window.toolbox = toolbox;

// set cross-references
Panel.prototype.toolbox = toolbox;

// create clipboard
toolbox.mapClipboard = new TileMap();

// create panels
toolbox.keyboard    = require('./keyboard.js');
toolbox.assetList   = require('./AssetListPanel.js');
toolbox.mapEditor   = require('./MapEditorPanel.js');
toolbox.tilesheet   = require('./TileSheetPanel.js');
toolbox.customTools = require('./CustomToolsPanel.js');
toolbox.palette     = require('./PalettePanel.js');
toolbox.menu        = require('./menuHeader.js');
