
module.exports = {
	draw: function (x, y, isStart, toolbox) {
		var toolbox     = toolbox;
		var mapEditor   = toolbox.mapEditor;
		var spritesheet = toolbox.spritesheet;
		var keyboard    = toolbox.keyboard;

		if (keyboard.shift) {
			mapEditor.map.remove(x, y);
		} else {
			mapEditor.map.set(x, y, spritesheet.sprite, spritesheet.flipH, spritesheet.flipV, spritesheet.flipR);
		}
	}
};