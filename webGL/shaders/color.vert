uniform   vec2 iResolution;
attribute vec2 a_coordinates;
attribute vec4 a_color;
varying   vec4 iColor;

void main(void) {
	gl_Position = vec4(
		a_coordinates.x *  2.0 / iResolution.x - 1.0,
		a_coordinates.y * -2.0 / iResolution.y + 1.0,
		0.0,
		1.0
	);
	iColor = a_color;
}
