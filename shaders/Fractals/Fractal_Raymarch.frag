/* 
* Based on "An introduction to Raymarching" by kishimisu
* https://www.shadertoy.com/view/lcs3DH
* License: CC BY-NC-SA 3.0
* Modified by: Alessandro Kummerlin di Querciavalle, 2023
*/

precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

const int MAX_STEPS = 80;
const float MIN_DIST = 0.001;
const float MAX_DIST = 100.0;

//sdf
float sdOctahedron(vec3 p, float s){
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r ){
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}

//Intersection operands
float opSub(float d1, float d2){
    return max(-d1, d2);
}

//Transformations
mat2 rot2D(float angle){
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

vec3 palette (float t){
    vec3 a = vec3(.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1, 1, 1);
    vec3 d = vec3(0.3, 0.20, 0.20);
    
    return a + b*cos(6.28318*(c*t+d));
}

//Distance to the scene
float map(vec3 p){
    p.z += u_time * .4;

    //Space repetitionæ
    p.xy  = fract(p.xy) - .5;
    p.z = mod(p.z, .35 ) - .2;

    //Obj rotation
    p.xy *= rot2D(u_time);
    p.yz *= rot2D(u_time);

    float octahedron = sdOctahedron(p, .15);
    float sub1 = sdCapsule(p, vec3(1, 0 ,0), vec3(-1, 0 ,0), .04 + 0.03*sin(u_time));
    float sub2 = sdCapsule(p, vec3(0, 1 ,0), vec3(0, -1 ,0), .04 + 0.02*cos(u_time));
    float sub3 = sdCapsule(p, vec3(0, 0 ,1), vec3(0, 0 ,-1), .03 + 0.01*sin(u_time));

    float preRend = opSub(sub3, opSub(sub2, opSub(sub1, octahedron)));
    return preRend;
}

void main(){
    vec2  uv = (2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y;

    //Initialization
    vec3 ro = vec3(0, 0, -3); //Ray origin
    vec3 rd = normalize(vec3(uv, 1)); //Ray direction
    vec3 col = vec3(0, 0, 0);

    float t = 0.; //Total dist travelled

    vec2 m = vec2(cos(u_time*.15), sin(u_time*.15)) *.75;

    //Raymarching
    int j = 0;
    for(int i = 0; i < MAX_STEPS; i++){
        vec3 p = ro + rd * t;

        p.xy *= rot2D(t*.2 * m.x);
        p.y += sin(t) * .5*sin(u_time); //wiggle ray

        float d = map(p);
        t += d;
        j = i;
        if(d < MIN_DIST || d> MAX_DIST)
            break;
    }
    col = palette((t * .04 + float(j) * .005));

    gl_FragColor = vec4(col, 1.0);
}