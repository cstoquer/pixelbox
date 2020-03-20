uniform   vec2 iResolution;
uniform   vec2 iChannel0Resolution;
attribute vec2 a_coordinates;
attribute vec2 a_uv;
attribute vec4 a_color;
varying   vec2 fragCoord;
varying   vec4 iColor;

void main(void) {
	gl_Position = vec4(
		a_coordinates.x *  2.0 / iResolution.x - 1.0,
		a_coordinates.y * -2.0 / iResolution.y + 1.0,
		0.0,
		1.0
	);
	fragCoord = vec2(a_uv.x / iChannel0Resolution.x, 1.0 - a_uv.y / iChannel0Resolution.y);
	iColor = vec4(a_color.rgb, 1.0);
}
