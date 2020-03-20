var vertexShader = require('./fullScreen.vert');
var Texture      = require('../Texture');
var webGL        = require('../webGL');
var context      = webGL.context;
var batcher      = webGL.batcher;
var gl           = context.gl;


// var INT16_SIZE   = 2; // byte
// var INT8_SIZE    = 1; // byte
var VERTEX_SIZE  = 4; // 2 positions + 2 uv
var START_TIME   = Date.now() / 1000;
var W = $screen.width;
var H = $screen.height;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// create vertex buffer for full screen quad

var arrayBuffer = new Int8Array([
	-1,  1, 0, 1, // A ╖                      A    B
	 1,  1, 1, 1, // B ╟─ triangle 1           ┌──┐
	-1, -1, 0, 0, // D ╜                       │1/│
	 1,  1, 1, 1, // B ╖                       │/2│
	 1, -1, 1, 0, // C ╟─ triangle 2           └──┘
	-1, -1, 0, 0  // D ╜                      D    C
]);

var vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // work on the vertexBuffer
gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.STATIC_DRAW); // upload vertex data

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function ShaderFilter(fragmentShader, uniformDef, channels) {
	this._program    = context.createProgram('', vertexShader, fragmentShader);
	this._target     = $screen;
	this._uniformDef = uniformDef || {};
	this._uniformIds = [];
	this.uniforms    = {};

	this._frame    = 0;
	this._lastTime = START_TIME;

	// Automatically adds texture channels found in the shader
	channels = channels || {};
	this.channel0 = this._checkChannel('iChannel0', channels.channel0);
	this.channel1 = this._checkChannel('iChannel1', channels.channel1);
	this.channel2 = this._checkChannel('iChannel2', channels.channel2);
	this.channel3 = this._checkChannel('iChannel3', channels.channel3);

	// Automatically adds common uniforms if found in the shader
	this._checkUniform('iResolution',  'vec2', [W, H]); // viewport resolution (in pixels) originaly vec3 in ShaderToy
	this._checkUniform('iTime',        'float', 0);     // shader playback time (in seconds)
	this._checkUniform('iTimeDelta',   'float', 0);     // render time (in seconds)
	this._checkUniform('iFrame',       'float', 0);     // shader playback frame

	// TODO: also add these like ShaderToy ?
	// uniform float     iChannelTime[4];       // channel playback time (in seconds)
	// uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
	// uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
	// uniform vec4      iDate;                 // (year, month, day, time in seconds)


	// User defined uniforms
	for (var uniformId in this._uniformDef) {
		var value;
		var def = this._uniformDef[uniformId]
		switch (def) {
			case 'float': value = 0;            break;
			case 'vec2':  value = [0, 0];       break;
			case 'vec3':  value = [0, 0, 0];    break;
			case 'vec4':  value = [0, 0, 0, 0]; break;
			default:
				console.error('Unsupported type', def);
				continue;
		}
		this._uniformIds.push(uniformId);
		if (this.uniforms[uniformId] === undefined) {
			this.uniforms[uniformId] = value;
		}
	}
}
module.exports = ShaderFilter;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ShaderFilter.prototype._checkUniform = function (uniformId, type, value) {
	try {
		gl.getUniformLocation(this._program, uniformId);
		this._uniformDef[uniformId] = type;
		this.uniforms[uniformId] = value;
	} catch (e) {}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ShaderFilter.prototype._checkChannel = function (uniformId, channel) {
	try {
		gl.getUniformLocation(this._program, uniformId);
		if (channel) return channel;
		return new Texture(W, H);
	} catch (e) {
		return null;
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ShaderFilter.prototype.renderTo = function (target) {
	this._target = target;
	if (this._uniformDef.iResolution) {
		this.uniforms.iResolution = [target.width, target.height];
	}
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function enableAttribute(program, variableName) {
	var location = gl.getAttribLocation(program, variableName);
	gl.enableVertexAttribArray(location);
	return location;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function bindChannel(program, channel, uniformId, index) {
	if (!channel) return;
	gl.activeTexture(gl.TEXTURE0 + index);
	gl.bindTexture(gl.TEXTURE_2D, channel.ctx);
	gl.uniform1i(gl.getUniformLocation(program, uniformId), index);
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ShaderFilter.prototype.render = function () {
	batcher.flush();

	var program = context.useProgram(this._program);
	var w = this._target.width;
	var h = this._target.height;

	// if (this._uniformDef.iResolution) { this.uniforms.iResolution  = [W, H]; } // Done only once at setup
	if (this._uniformDef.iTime)      { this.uniforms.iTime  = Date.now() / 1000 - START_TIME; }
	if (this._uniformDef.iFrame)     { this.uniforms.iFrame = this._frame++; }
	if (this._uniformDef.iTimeDelta) {
		var now = Date.now() / 1000;
		this.uniforms.iFrame = now - this._lastTime;
		this._lastTime = now;
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, this._target.framebuffer); // FIXME: allow to render in another Texture
	gl.viewport(0, 0, w, h);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	// uniforms for vertex shader
	gl.uniform2f(gl.getUniformLocation(program, 'u_uvScale'), w, h);

	// uniforms for fragment shader
	for (var i = 0; i < this._uniformIds.length; i++) {
		var uniformId = this._uniformIds[i];
		var v = this.uniforms[uniformId];
		var loc = gl.getUniformLocation(program, uniformId);
		switch (this._uniformDef[uniformId]) {
			case 'float': gl.uniform1f(loc, v);                      break;
			case 'vec2':  gl.uniform2f(loc, v[0], v[1]);             break;
			case 'vec3':  gl.uniform3f(loc, v[0], v[1], v[2]);       break;
			case 'vec4':  gl.uniform4f(loc, v[0], v[1], v[2], v[3]); break;
			// TODO: uniformMatrix2fv, uniformMatrix3fv, uniformMatrix4fv
		}
	}

	gl.vertexAttribPointer(enableAttribute(program, 'a_coordinates'), 2, gl.BYTE, false, /* INT8_SIZE * */ VERTEX_SIZE, 0);
	gl.vertexAttribPointer(enableAttribute(program, 'a_uv'),          2, gl.BYTE, false, /* INT8_SIZE * */ VERTEX_SIZE, /* INT8_SIZE * */ 2);

	bindChannel(program, this.channel0, 'iChannel0', 0);
	bindChannel(program, this.channel1, 'iChannel1', 1);
	bindChannel(program, this.channel2, 'iChannel2', 2);
	bindChannel(program, this.channel3, 'iChannel3', 3);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	return this;
};
