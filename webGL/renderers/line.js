var context = require('../context');
var gl      = context.gl;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var INT16_SIZE   = 2; // byte
var VERTEX_SIZE  = 4; // 2 positions + 2 uv

var MAX_NB_BYTES_PER_BATCH = 65536; // WebGL specs
var VERTEX_INDEX_LIMIT = ~~(MAX_NB_BYTES_PER_BATCH / INT16_SIZE);
var FLUSH_TRIGGER = VERTEX_INDEX_LIMIT - 4 * VERTEX_SIZE; // size of a quad (4 vertex)

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function LineRenderer() {
	this.batcher = null;
	this.program = context.createProgram(
		'line',
		require('../shaders/color.vert'),
		require('../shaders/color.frag')
	);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
LineRenderer.prototype.pushLines = function (lines, r, g, b) {
	// TODO
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
LineRenderer.prototype.pushRect = function (x1, y1, w, h, r, g, b) {
	// HACK: coordinates needs to be tweaked a bit to get the rectangle correct
	var x2 = x1 + w;
	var y2 = y1 + h - 1;
	x1 += 1;

	var rg = (g << 8) + r; // litte endian

	//  A ┌─────┐ B
	//    │     │
	//  D └─────┘ C

	// NOTA: there is a bug in webGL where one pixel is missing at vertex D
	// https://www.gamedev.net/forums/topic/673088-missing-pixels-when-rendering-lines-with-webgl/
	// http://factor-language.blogspot.com/2008/11/some-recent-ui-rendering-fixes.html

	// vertex
	var vertexBuffer = this.batcher.vertexBuffer;
	var V = vertexBuffer.shortView; // 2 bytes
	var C = vertexBuffer.uShortView; // 2 bytes
	var i = this.batcher._batchIndex;
	V[i++] = x1; V[i++] = y1; C[i++] = rg; C[i++] = b; // A
	V[i++] = x2; V[i++] = y1; C[i++] = rg; C[i++] = b; // B
	V[i++] = x2; V[i++] = y2; C[i++] = rg; C[i++] = b; // C
	V[i++] = x1; V[i++] = y2; C[i++] = rg; C[i++] = b; // D
	this.batcher._batchIndex = i;

	// indices
	var indexBuffer = this.batcher.indexBuffer;
	var I = indexBuffer.uShortView;
	var i = indexBuffer.length;
	var a = indexBuffer.vertexIndice;
	I[i++] = a + 0; I[i++] = a + 1; // segment 1
	I[i++] = a + 1; I[i++] = a + 2; // segment 2
	I[i++] = a + 2; I[i++] = a + 3; // segment 2
	I[i++] = a + 3; I[i++] = a + 0; // segment 2
	indexBuffer.length = i;
	indexBuffer.vertexIndice += 4;

	if (i >= FLUSH_TRIGGER) this.batcher.flush();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
LineRenderer.prototype.render = function (program) {
	// attributes:
	this.indexBuffer.uploadData();
	this.vertexBuffer.uploadData();

	// ┌───────────────────────────────────┬───────────────────────────────────┐
	// │            a_coordinates          │             a_color               │
	// ╔════════╤════════╤════════╤════════╦════════╤════════╤════════╤════════╗
	// ║ x               │ y               ║ r      │ g      │ b      │ a      ║
	// ╚════════╧════════╧════════╧════════╩════════╧════════╧════════╧════════╝
	// 0        1        2        3        4        5        6        7        8

	gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_coordinates'), 2, gl.SHORT,         false, 8, 0);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_color'),       4, gl.UNSIGNED_BYTE, true,  8, 4);

	// uniforms:
	gl.uniform2f(gl.getUniformLocation(program, 'iResolution'), this._renderTarget.width, this._renderTarget.height);

	// draw:
	gl.drawElements(gl.LINES, this.indexBuffer.length, gl.UNSIGNED_SHORT, 0);

	this.indexBuffer.reset();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
module.exports = new LineRenderer();
