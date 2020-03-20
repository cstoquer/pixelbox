attribute vec2 a_coordinates;
attribute vec2 a_uv;
uniform   vec2 u_uvScale;
varying   vec2 fragCoord;

void main(void) {
	gl_Position = vec4(
		a_coordinates.x,
		a_coordinates.y,
		0.0,
		1.0
	);
	fragCoord = a_uv * u_uvScale;
}
