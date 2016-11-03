var addTooltip = require('./tooltip.js');
var domUtils   = require('../../components/domUtils');

var createDom  = domUtils.createDom;
var createDiv  = domUtils.createDiv;
var button     = domUtils.makeButton;

/**
 * @param {Panel} panel
 * @param {function} onResize
 */
function addResizeHandle(panel, onResize, onEnd) {
	var dom = panel.content;

	var resizeHandle = addTooltip(createDiv('mapResizeHandle', dom), 'Resize');

	function startResize(e) {
		var startX = e.clientX;
		var startY = e.clientY;

		var viewW = panel.viewW;
		var viewH = panel.viewH;

		function resize(e) {
			e.preventDefault();
			var diffX = e.clientX - startX;
			var diffY = e.clientY - startY;
			onResize && onResize(viewW, viewH, diffX, diffY);
		}

		function mouseEnd(e) {
			resize(e);
			onEnd && onEnd();
			document.removeEventListener('mouseup', mouseEnd);
			document.removeEventListener('mousemove', resize);
		}

		document.addEventListener('mousemove', resize, false);
		document.addEventListener('mouseup', mouseEnd, false);
	}

	button(resizeHandle, startResize);

	return resizeHandle;
}

module.exports = addResizeHandle;
