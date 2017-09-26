module.exports = {
	name: 'default brush',
	description: 'Draw the tile currently selected in tilesheet.\nright-clic to delete tile.',
	select:   null,
	deselect: null,
	start:    null,
	end:      null,
	draw: function (x, y, toolbox, isStart) {
		var tilesheet = toolbox.tilesheet;
		toolbox.mapEditor.map.set(x, y, tilesheet.tile, tilesheet.flipH, tilesheet.flipV, tilesheet.flipR);
	},
	erase: function (x, y, toolbox, isStart) {
		toolbox.mapEditor.map.remove(x, y);
	}
};