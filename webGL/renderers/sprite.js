var context = require('../context');
var gl      = context.gl;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var INT16_SIZE   = 2; // byte
var VERTEX_SIZE  = 4; // 2 positions + 2 uv

var MAX_NB_BYTES_PER_BATCH = 65536; // WebGL specs
var VERTEX_INDEX_LIMIT = ~~(MAX_NB_BYTES_PER_BATCH / INT16_SIZE);
var FLUSH_TRIGGER = VERTEX_INDEX_LIMIT - 4 * VERTEX_SIZE; // size of a quad (4 vertex)

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function SpriteRenderer() {
	this.batcher = null;
	this.program = context.createProgram(
		'sprite',
		require('../shaders/sprite.vert'),
		require('../shaders/sprite.frag')
	);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * NOTA: all values must be integer.
 */
SpriteRenderer.prototype.pushSprite = function (x1, y1, w, h, u1, v1, flipH, flipV, flipR) {
	var x2, y2;
	var u2 = u1 + w;
	var v2 = v1 + h;

	//  A ┌──┐ B
	//    │1/│
	//    │/2│
	//  D └──┘ C

	var V = this.batcher.vertexBuffer.shortView;
	var i = this.batcher._batchIndex;

	// flip flags
	var t;

	if (flipR) {
		x2 = x1 + h;
		y2 = y1 + w;

		var uA = u1; var vA = v2;
		var uB = u1; var vB = v1;
		var uC = u2; var vC = v1;
		var uD = u2; var vD = v2;

		if (flipH) {
			t = vA; vA = vB; vB = t;
			t = vD; vD = vC; vC = t;
		}
		if (flipV) {
			t = uA; uA = uC; uC = t;
			t = uB; uB = uD; uD = t;
		}

		V[i++] = x1; V[i++] = y1; V[i++] = uA; V[i++] = vA; // A
		V[i++] = x2; V[i++] = y1; V[i++] = uB; V[i++] = vB; // B
		V[i++] = x2; V[i++] = y2; V[i++] = uC; V[i++] = vC; // C
		V[i++] = x1; V[i++] = y2; V[i++] = uD; V[i++] = vD; // D

	} else {
		x2 = x1 + w;
		y2 = y1 + h;

		if (flipH) { t = u1; u1 = u2; u2 = t; }
		if (flipV) { t = v1; v1 = v2; v2 = t; }

		V[i++] = x1; V[i++] = y1; V[i++] = u1; V[i++] = v1; // A
		V[i++] = x2; V[i++] = y1; V[i++] = u2; V[i++] = v1; // B
		V[i++] = x2; V[i++] = y2; V[i++] = u2; V[i++] = v2; // C
		V[i++] = x1; V[i++] = y2; V[i++] = u1; V[i++] = v2; // D
	}

	if (i < FLUSH_TRIGGER) {
		this.batcher._batchIndex = i;
	} else {
		this.batcher.flush();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SpriteRenderer.prototype.render = function (program) {
	// attributes:
	this.quadIndexBuffer.bindBuffer();
	this.vertexBuffer.uploadData();

	// ┌───────────────────────────────────┬───────────────────────────────────┐
	// │            a_coordinates          │               a_uv                │
	// ╔════════╤════════╤════════╤════════╦════════╤════════╤════════╤════════╗
	// ║ x               │ y               ║ u               │ v               ║
	// ╚════════╧════════╧════════╧════════╩════════╧════════╧════════╧════════╝
	// 0        1        2        3        4        5        6        7        8

	gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_coordinates'), 2, gl.SHORT, false, 8, 0);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_uv'),          2, gl.SHORT, false, 8, 4);

	// uniforms:
	gl.uniform2f(gl.getUniformLocation(program, 'iResolution'), this._renderTarget.width, this._renderTarget.height);
	gl.uniform2f(gl.getUniformLocation(program, 'iChannel0Resolution'), this._channel0.width, this._channel0.height);
	context.bindTexture(program, this._channel0, 'iChannel0', 0); // TODO: check if needed by the shader

	// draw:
	var count = this._batchIndex / VERTEX_SIZE / 4 * 6; // per quad: 4 vertex -> 6 indexes
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
};

module.exports = new SpriteRenderer();
