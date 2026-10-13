/*
* Shader inspired by kishimisu's work
*/

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define PI 3.14159265359

vec3 palette (float t){
    vec3 a = vec3(0.0863, 0.1373, 0.9882);
    vec3 b = vec3(0.435, 0.507, 0.375);
    vec3 c = vec3(1.048, 1.141, 0.938);
    vec3 d = vec3(1.042, 6.188, 0.866);
    
    return a + b*cos(6.28318*(c*t+d));
}

float polygonDist(vec2 p, float n, float rot){
    float a = atan(p.x, p.y) + PI + rot;
    float r = 1.0 * PI / n;
    return cos(floor(0.5 + a / r) * r - a) * length(p); 
}

void main(){
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    vec3 finalColor = vec3(0.0);
    vec2 uv0 = uv;
    
    //Iterations
    for(float i = 0.0; i < 4.0; i++)
    {
        uv = fract(uv * 1.5) -0.5;

        float d = polygonDist(uv, 3.0, 0.0) * exp(-length(uv0));
        vec3 col = palette(length(uv0) + i*.4 + u_time*.4);

        //Shape
        d = sin(d * 8. + u_time) / 8.;
        d = abs(d);
        d = pow(0.01 / d, 1.3);

        finalColor += col * d;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}