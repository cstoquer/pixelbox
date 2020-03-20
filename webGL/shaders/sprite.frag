precision mediump float;

uniform sampler2D iChannel0;
varying vec2 fragCoord;

void main(void) {
	vec4 color = texture2D(iChannel0, fragCoord);
	if (color.a == 0.0) discard;
	gl_FragColor = color;
}
