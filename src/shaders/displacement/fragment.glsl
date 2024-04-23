
uniform sampler2D tDiffuse;
uniform float uTime;


varying vec2 vUv;

void main()
{
    vec2 newUv = vec2(
    vUv.x + sin(vUv.y * 1.0 * uTime)* 0.01,
    vUv.y + sin(vUv.x * 1.2 * uTime)* 0.01

    );
    
    vec4 color = texture2D(tDiffuse, newUv);


    gl_FragColor = color;
}