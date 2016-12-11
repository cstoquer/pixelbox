module.exports = {
	name: 'default brush',
	description: 'Draw the tile currently selected in spritesheet.\nright-clic to delete tile.',
	select:   null,
	deselect: null,
	start:    null,
	end:      null,
	draw: function (x, y, toolbox, isStart) {
		var spritesheet = toolbox.spritesheet;
		toolbox.mapEditor.map.set(x, y, spritesheet.sprite, spritesheet.flipH, spritesheet.flipV, spritesheet.flipR);
	},
	erase: function (x, y, toolbox, isStart) {
		toolbox.mapEditor.map.remove(x, y);
	}
};