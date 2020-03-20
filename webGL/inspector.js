var gl = require('./context').gl;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function addInspector() {
	var daCount = 0;
	var deCount = 0;

	var l = 0;

	gl._drawArrays   = gl.drawArrays;
	gl._drawElements = gl.drawElements;

	gl.drawArray = function (mode, first, count) {
		daCount += 1;
		gl._drawArrays(mode, first, count);
		if (++l % 100 === 0) console.log('drawArray', daCount);
	}

	gl.drawElements = function (mode, count, type, offset) {
		deCount += 1;
		gl._drawElements(mode, count, type, offset);
		if (++l % 100 === 0) console.log('drawElements', deCount);
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.addInspector = addInspector;
