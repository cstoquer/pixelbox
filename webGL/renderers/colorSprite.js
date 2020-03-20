var context = require('../context');
var gl      = context.gl;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var INT16_SIZE   = 2; // byte
var VERTEX_SIZE  = 6; // 2 positions + 2 uv + 2 colors

var MAX_NB_BYTES_PER_BATCH = 65536; // WebGL specs
var VERTEX_INDEX_LIMIT = ~~(MAX_NB_BYTES_PER_BATCH / INT16_SIZE);
var FLUSH_TRIGGER = VERTEX_INDEX_LIMIT - 4 * VERTEX_SIZE; // size of a quad (4 vertex)

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function ColorSpriteRenderer() {
	this.batcher = null;
	this.program = context.createProgram(
		'colorSprite',
		require('../shaders/colorSprite.vert'),
		require('../shaders/colorSprite.frag')
	);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * NOTA: all values must be integer.
 */
ColorSpriteRenderer.prototype.pushSprite = function (x1, y1, w, h, u1, v1, r, g, b) {
	var x2 = x1 + w;
	var y2 = y1 + h;
	var u2 = u1 + w;
	var v2 = v1 + h;
	var rg = (g << 8) + r; // litte endian

	//  A ┌──┐ B
	//    │1/│
	//    │/2│
	//  D └──┘ C

	var V = this.batcher.vertexBuffer.shortView;
	var C = this.batcher.vertexBuffer.uShortView;
	var i = this.batcher._batchIndex;

	V[i++] = x1; V[i++] = y1; V[i++] = u1; V[i++] = v1; C[i++] = rg; C[i++] = b; // A
	V[i++] = x2; V[i++] = y1; V[i++] = u2; V[i++] = v1; C[i++] = rg; C[i++] = b; // B
	V[i++] = x2; V[i++] = y2; V[i++] = u2; V[i++] = v2; C[i++] = rg; C[i++] = b; // C
	V[i++] = x1; V[i++] = y2; V[i++] = u1; V[i++] = v2; C[i++] = rg; C[i++] = b; // D

	if (i < FLUSH_TRIGGER) {
		this.batcher._batchIndex = i;
	} else {
		this.batcher.flush();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ColorSpriteRenderer.prototype.render = function (program) {
	// attributes:
	this.quadIndexBuffer.bindBuffer();
	this.vertexBuffer.uploadData();

	// ┌───────────────────────────────────┬───────────────────────────────────┬───────────────────────────────────┐
	// │            a_coordinates          │               a_uv                │             a_color               │
	// ╔════════╤════════╤════════╤════════╦════════╤════════╤════════╤════════╦════════╤════════╤════════╤════════╗
	// ║ x               │ y               ║ u               │ v               ║ r      │ g      │ b      │ 0      ║
	// ╚════════╧════════╧════════╧════════╩════════╧════════╧════════╧════════╩════════╧════════╧════════╧════════╝
	// 0        1        2        3        4        5        6        7        8        9       10       11       12

	gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_coordinates'), 2, gl.SHORT,         false, 12, 0);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_uv'),          2, gl.SHORT,         false, 12, 4);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_color'),       4, gl.UNSIGNED_BYTE, true,  12, 8);

	// uniforms:
	gl.uniform2f(gl.getUniformLocation(program, 'iResolution'), this._renderTarget.width, this._renderTarget.height);
	gl.uniform2f(gl.getUniformLocation(program, 'iChannel0Resolution'), this._channel0.width, this._channel0.height);
	context.bindTexture(program, this._channel0, 'iChannel0', 0); // TODO: check if needed by the shader

	// draw:
	var count = this._batchIndex / VERTEX_SIZE / 4 * 6; // per quad: 4 vertex -> 6 indexes
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
};

module.exports = new ColorSpriteRenderer();
