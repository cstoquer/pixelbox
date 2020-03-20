var context  = require('./context');
var batcher  = require('./batcher');

var gl = context.gl;
var INT16_SIZE   = 2; // byte
var VERTEX_SIZE  = 4; // 2 positions + 2 uv


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// create a vertex buffer with one quad that covers the full screen

var W = ~~settings.screen.width;
var H = ~~settings.screen.height;

var arrayBuffer = new Int16Array([
	0, H, 0, H, // A ╖                       A    B
	W, H, W, H, // B ╟─ triangle 1            ┌──┐
	0, 0, 0, 0, // D ╜                        │1/│
	W, H, W, H, // B ╖                        │/2│
	W, 0, W, 0, // C ╟─ triangle 2            └──┘
	0, 0, 0, 0  // D ╜                       D    C
]);

var vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // work on the vertexBuffer
gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.STATIC_DRAW); // upload vertex data

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function enableAttribute(program, variableName) {
	var location = gl.getAttribLocation(program, variableName);
	gl.enableVertexAttribArray(location);
	return location;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function bindChannel(program, channel, uniformId, index) {
	gl.activeTexture(gl.TEXTURE0 + index);
	gl.bindTexture(gl.TEXTURE_2D, channel.ctx);
	gl.uniform1i(gl.getUniformLocation(program, uniformId), index);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Flush all current rendering and draw $screen Texture on main canvas
 */
function commit() {
	batcher.flush();

	var program = context.useProgram(context.programs.sprite);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // render to the main canvas
	gl.viewport(0, 0, W, H);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.uniform2f(gl.getUniformLocation(program, 'iChannel0Resolution'), W, H); // size of the $screen Texture
	gl.uniform2f(gl.getUniformLocation(program, 'iResolution'), W, H); // TODO: should be size of the main canvas (if upscaling)
	gl.vertexAttribPointer(enableAttribute(program, 'a_coordinates'), 2, gl.SHORT, false, INT16_SIZE * VERTEX_SIZE, 0);
	gl.vertexAttribPointer(enableAttribute(program, 'a_uv'),          2, gl.SHORT, false, INT16_SIZE * VERTEX_SIZE, INT16_SIZE * 2);
	bindChannel(program, $screen, 'iChannel0', 0);

	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.shaders = context.programs; // collection of shaders
exports.context = context;          // webGL helpers
exports.canvas  = context.canvas;   // main canvas dom element
exports.gl      = gl;               // GL context
exports.batcher = batcher;          // sprite batcher (also polygons, lines, etc.)
exports.commit  = commit;           // call at the end of each frame (done in CORE)
