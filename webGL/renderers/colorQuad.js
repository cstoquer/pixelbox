var context = require('../context');
var gl      = context.gl;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var INT16_SIZE   = 2; // byte
var VERTEX_SIZE  = 4; // 2 positions + 2 uv

var MAX_NB_BYTES_PER_BATCH = 65536; // WebGL specs
var VERTEX_INDEX_LIMIT = ~~(MAX_NB_BYTES_PER_BATCH / INT16_SIZE);
var FLUSH_TRIGGER = VERTEX_INDEX_LIMIT - 4 * VERTEX_SIZE; // size of a quad (4 vertex)

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function ColoredQuadRenderer() {
	this.batcher = null;
	this.program = context.createProgram(
		'color',
		require('../shaders/color.vert'),
		require('../shaders/color.frag')
	);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * NOTA: all values must be integer.
 */
ColoredQuadRenderer.prototype.pushRect = function (x1, y1, w, h, r, g, b) {
	var x2 = x1 + w;
	var y2 = y1 + h;
	var rg = (g << 8) + r; // litte endian

	//  A ┌──┐ B
	//    │1/│
	//    │/2│
	//  D └──┘ C

	var V = this.batcher.vertexBuffer.shortView;
	var C = this.batcher.vertexBuffer.uShortView;
	var i = this.batcher._batchIndex;

	V[i++] = x1; V[i++] = y1; C[i++] = rg; C[i++] = b; // A
	V[i++] = x2; V[i++] = y1; C[i++] = rg; C[i++] = b; // B
	V[i++] = x2; V[i++] = y2; C[i++] = rg; C[i++] = b; // C
	V[i++] = x1; V[i++] = y2; C[i++] = rg; C[i++] = b; // D

	if (i < FLUSH_TRIGGER) {
		this.batcher._batchIndex = i;
	} else {
		this.batcher.flush();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ColoredQuadRenderer.prototype.render = function (program) {
	// attributes:
	this.quadIndexBuffer.bindBuffer();
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
	var count = this._batchIndex / VERTEX_SIZE / 4 * 6; // per quad: 4 vertex -> 6 indexes
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
};

module.exports = new ColoredQuadRenderer();
