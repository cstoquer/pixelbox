var context             = require('./context');
var VertexBuffer        = require('./VertexBuffer');
var IndexBuffer         = require('./IndexBuffer');
var spriteRenderer      = require('./renderers/sprite');
var lineRenderer        = require('./renderers/line');
var colorRenderer       = require('./renderers/colorQuad');
var colorSpriteRenderer = require('./renderers/colorSprite');
var gl                  = context.gl;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var FLOAT32_SIZE = 4; // byte
var INT16_SIZE   = 2; // byte
var VERTEX_SIZE  = 4; // 2 positions + 2 uv

var MAX_NB_BYTES_PER_BATCH = 65536; // WebGL specs
var VERTEX_INDEX_LIMIT = ~~(MAX_NB_BYTES_PER_BATCH / INT16_SIZE);
var FLUSH_TRIGGER = VERTEX_INDEX_LIMIT - 4 * VERTEX_SIZE; // size of a quad (4 vertex)

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function Batcher() {
	this._renderer     = spriteRenderer; // current renderer in use
	this._program      = null; // current program in use
	this._renderTarget = null; // current render target
	this._channel0     = null; // TODO: allow more channels (up to 4)
	this._batchIndex   = 0;    // in bytes

	// TODO:
	// this._blending     = null;

	this.vertexBuffer    = new VertexBuffer(MAX_NB_BYTES_PER_BATCH);
	this.indexBuffer     = new IndexBuffer(MAX_NB_BYTES_PER_BATCH / 2);
	this.quadIndexBuffer = new IndexBuffer(VERTEX_INDEX_LIMIT * 6 / 4);

	this._initQuadIndexBuffer();

	this.renderers = {
		sprite:      spriteRenderer,
		line:        lineRenderer,
		color:       colorRenderer,
		colorSprite: colorSpriteRenderer,
	};
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Batcher.prototype._initQuadIndexBuffer = function () {
	var buff = this.quadIndexBuffer.uShortView;
	var i = 0;

	for (var j = 0; j < VERTEX_INDEX_LIMIT; j += 4) {
		buff[i]     = j;
		buff[i + 1] = j + 1;
		buff[i + 2] = j + 2;
		buff[i + 3] = j;
		buff[i + 4] = j + 2;
		buff[i + 5] = j + 3;
		i += 6;
	}

	this.quadIndexBuffer.uploadData();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Prepare the batch. If passed and current attributes are different current
 * batch is rendered and batch reset to empty.
 *
 * @param {string}  renderer - renderer
 * @param {Image}   channel - Image or Pixelbox's Texture (frameBuffer)
 * @param {texture} renderTarget - Pixelbox's Texture
 */
Batcher.prototype.prepare = function (renderer, channel, renderTarget) {
	// TODO: also add uniforms and flush if uniforms changes

	if (channel && channel._isSprite) channel = channel.img;
	// var program = renderer.program; // TODO: keep reference to the renderer

	var needFlush = false;

	// if (program      !== this._program     ) needFlush = true;
	if (channel      !== this._channel0    ) needFlush = true;
	if (renderTarget !== this._renderTarget) needFlush = true;
	if (renderer     !== this._renderer    ) needFlush = true;

	if (needFlush) this.flush();

	this._renderer.batcher = null;
	renderer.batcher = this;

	this._renderer     = renderer;
	this._program      = renderer.program;
	this._renderTarget = renderTarget;
	this._channel0     = channel;

	return this._renderer;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Batcher.prototype.flush = function () {
	if (this._batchIndex === 0) return;

	// TODO: optimize: only do this if framebuffer changed
	var renderTarget = this._renderTarget;
	gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.framebuffer);
	gl.viewport(0, 0, renderTarget.width, renderTarget.height);

	var program = context.useProgram(this._renderer.program);

	this._renderer.render.call(this, program);

	this._batchIndex = 0;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
module.exports = new Batcher();
