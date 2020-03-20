var context = require('./context');
var gl      = context.gl;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function VertexBuffer(size) {
	this.arrayBuffer = new ArrayBuffer(size); // size in bytes

	// Creation of views on the vertex buffer
	this.floatView  = new Float32Array(this.arrayBuffer); // 4 bytes
	this.uLongView  = new Uint32Array(this.arrayBuffer);  // 4 bytes
	this.longView   = new Int32Array(this.arrayBuffer);   // 4 bytes
	this.uShortView = new Uint16Array(this.arrayBuffer);  // 2 bytes
	this.shortView  = new Int16Array(this.arrayBuffer);   // 2 bytes
	this.byteView   = new Uint8Array(this.arrayBuffer);   // 1 bytes
	this.uByteView  = new Int8Array(this.arrayBuffer);    // 1 bytes

	this.binder = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.binder);
	// gl.bufferData(gl.ARRAY_BUFFER, this.arrayBuffer, gl.DYNAMIC_DRAW);
}

module.exports = VertexBuffer;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
VertexBuffer.prototype.uploadData = function () {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.binder); // work on the vertexBuffer
	gl.bufferData(gl.ARRAY_BUFFER, this.arrayBuffer, gl.DYNAMIC_DRAW); // upload vertex data
};
