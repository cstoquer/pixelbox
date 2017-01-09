var Panel    = require('./Panel');
var inherits = require('../../components/inherits');

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function FolderPanel(params) {
	Panel.call(this, params);
	this.children = {};
}
inherits(FolderPanel, Panel);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.getDisposition = function () {
	var disposition = Panel.prototype.getDisposition.call(this);
	disposition.foldConfig = this.saveFoldConfig(this);
	return disposition;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.setDisposition = function (params) {
	params = params || {};
	Panel.prototype.setDisposition.call(this, params);
	if (params.foldConfig) this.restoreFoldConfig(params.foldConfig);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.saveFoldConfig = function (folder) {
	var config = {};
	var children = folder.children;
	for (var keys = Object.keys(children), i = 0; i < keys.length; i++) {
		var key = keys[i];
		var child = children[key];
		if (!child.isOpened) continue;
		config[key] = this.saveFoldConfig(child);
	}
	return config;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
FolderPanel.prototype.restoreFoldConfig = function (config) {
	function walk(folder, config) {
		for (var keys = Object.keys(config), i = 0; i < keys.length; i++) {
			var key = keys[i];
			var child = folder.children[key];
			if (!child) continue;
			child.toggleFold(true);
			walk(child, config[key]);
		}
	}
	walk(this, config);
};

module.exports = FolderPanel;
