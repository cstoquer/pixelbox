precision mediump float;

uniform sampler2D iChannel0;
varying vec2 fragCoord;
varying vec4 iColor;

void main(void) {
	vec4 color = texture2D(iChannel0, fragCoord);
	if (color.a == 0.0) discard;
	gl_FragColor = iColor;
}
