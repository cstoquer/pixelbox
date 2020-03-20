precision mediump float;

varying vec4 iColor;

void main() {
	vec4 color = iColor;
	color.a = 1.0;
	gl_FragColor = color;
}
