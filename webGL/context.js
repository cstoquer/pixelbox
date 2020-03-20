var domUtils     = require('../domUtils');
var createCanvas = require('../domUtils/createCanvas');

var SCREEN_WIDTH  = settings.screen.width;
var SCREEN_HEIGHT = settings.screen.height;
var PIXEL_WIDTH   = settings.screen.pixelSize.width;
var PIXEL_HEIGHT  = settings.screen.pixelSize.height;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// replace default Pixelbox 2d canvas for a WebGL canvas

var canvas = createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
canvas.style.width  = SCREEN_WIDTH  * PIXEL_WIDTH  + 'px';
canvas.style.height = SCREEN_HEIGHT * PIXEL_HEIGHT + 'px';

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// init webGL

var gl = canvas.getContext('webgl', {
	antialias:                    false,      // that indicates whether or not to perform anti-aliasing.
	alpha:                        false,      // that indicates if the canvas contains an alpha buffer.
	depth:                        false,      // that indicates that the drawing buffer has a depth buffer of at least 16 bits.
	failIfMajorPerformanceCaveat: false,      // that indicates if a context will be created if the system performance is low.
	powerPreference:              'default',  // A hint to the user agent indicating what configuration of GPU is suitable for the WebGL context. Possible values are:
	premultipliedAlpha:           false,      // that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
	preserveDrawingBuffer:        false,      // If the value is true the buffers will not be cleared and will preserve their values until cleared or overwritten by the author.
	stencil:                      false,      // that indicates that the drawing buffer has a stencil buffer of at least 8 bits.
});

gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.BLEND);
gl.disable(gl.DEPTH_TEST); // depth testing
gl.depthMask(false);
// gl.depthFunc(gl.LEQUAL); // Near things obscure far things

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var DUMMY_PROGRAM = null; // TODO

var programs = {};
var _currentProgram = DUMMY_PROGRAM;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function _createShader(str, type) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, str);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(gl.getShaderInfoLog(shader));
	}
	return shader;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function createProgram(id, vert, frag) {
	if (id && programs[id]) return programs[id];

	var vertShader = _createShader(vert, gl.VERTEX_SHADER);
	var fragShader = _createShader(frag, gl.FRAGMENT_SHADER);

	var program = gl.createProgram();
	gl.attachShader(program, vertShader);
	gl.attachShader(program, fragShader);

	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		throw new Error(gl.getProgramInfoLog(program));
	}

	// register program in pool
	if (id) programs[id] = program;

	// TODO: see TREY: we use the program and construct Uniforms and Attributes
	// (so we don't have to do gl.getAttribLocation every time)

	return program;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function useProgram(program) {
	// don't call if it same program as previous draw call
	if (_currentProgram === program) return program;

	if (_currentProgram !== null) {
		// switch attributes

		// Gets the number of attributes in the current and new programs
		var currentAttributes = gl.getProgramParameter(_currentProgram, gl.ACTIVE_ATTRIBUTES);
		var newAttributes     = gl.getProgramParameter(program,         gl.ACTIVE_ATTRIBUTES);

		// Fortunately, in OpenGL, attribute index values are always assigned in the
		// range [0, ..., NUMBER_OF_VERTEX_ATTRIBUTES - 1], so we can use that to
		// enable or disable attributes
		if (newAttributes > currentAttributes) {
			// We need to enable the missing attributes
			for (var i = currentAttributes; i < newAttributes; i++) {
				gl.enableVertexAttribArray(i);
			}
		} else if (newAttributes < currentAttributes) {
			// We need to disable the extra attributes
			for (var i = newAttributes; i < currentAttributes; i++) {
				gl.disableVertexAttribArray(i);
			}
		}
	}

	// switch program
	_currentProgram = program;
	gl.useProgram(program);

	return program;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// function enableAttribute(program, variableName) {
// 	var location = gl.getAttribLocation(program, variableName);
// 	// gl.enableVertexAttribArray(location); // TODO: already done in `context.useProgram`
// 	return location;
// }


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var _textureMap = new WeakMap();

function _getTextureFromImage(image) {
	// var texture = image._glTexture;
	var texture = _textureMap.get(image);
	if (texture) return texture;

	if (DEBUG) console.log('Create texture for image', image)

	texture = gl.createTexture();

	// same as bindBuffer, once a texture is bind, all textures operations are done on this one.
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	// upload the texture to the GPU
	gl.texImage2D(
		gl.TEXTURE_2D,    // binding point (target) of the active texture
		0,                // level of detail. Level 0 is the base image level and level n is the nth mipmap reduction level
		gl.RGBA,          // internalformat specifying the color components in the texture
		gl.RGBA,          // format of the texel data. In WebGL 1, this must be the same as internalformat
		gl.UNSIGNED_BYTE, // data type of the texel data
		image             // pixels
	);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // NEAREST, LINEAR, LINEAR_MIPMAP_LINEAR, NEAREST_MIPMAP_NEAREST, NEAREST_MIPMAP_LINEAR, LINEAR_MIPMAP_NEAREST
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // CLAMP_TO_EDGE, REPEAT, MIRRORED_REPEAT
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	// image._glTexture = texture;
	_textureMap.set(image, texture);

	return texture;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function bindTexture(program, channel, uniformId, index) {
	var texture;

	if (channel._isGlTexture) {
		// texture is a frameBuffer
		texture = channel.ctx;
	} else {
		// We assume normal image
		texture = _getTextureFromImage(channel);
	}

	gl.activeTexture(gl.TEXTURE0 + index);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(gl.getUniformLocation(program, uniformId), index);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.canvas        = canvas;
exports.gl            = gl;
exports.programs      = programs;
exports.createProgram = createProgram;
exports.useProgram    = useProgram;
exports.bindTexture   = bindTexture;
