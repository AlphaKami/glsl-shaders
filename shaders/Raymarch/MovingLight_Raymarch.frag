/*
* Made by Alessandro Kummerlin di Querciavalle, 2023
*
* Sign distance functions are implemented from Inigo Quilez blogpost: 
* https://iquilezles.org/articles/distfunctions/
*/

precision mediump float;

#define MAX_STEPS 100
#define SURFACE_DIST .01
#define MAX_DIST 100.

uniform float u_time;
uniform vec2 u_resolution;

//Objects signed distance functions
float sdSphere( vec3 p, float s ){
    return length(p)-s;
}

float sdPlane( vec3 p, vec3 n, float h ){
    // n must be normalized
    return dot(p,n) + h;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r ){
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdTorus( vec3 p, vec2 t ){
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
}

float sdBoxFrame( vec3 p, vec3 b, float e ){
    p = abs(p  )-b;
    vec3 q = abs(p+e)-e;
    return min(min(
    length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
    length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
    length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

//Raymarching stuff
float getDist(vec3 point){
    //objects
    vec4 sphere = vec4(-4, 1, 6, 1);
    vec3 capsule[2];
        capsule[0] = vec3(-1,2,7);
        capsule[1] = vec3(-1,3,7);
    float capsuleRadius = .3;
    vec3 torus = vec3(-1, .5, 5.5);
    vec2 torusRadius = vec2(1.5, .3);

    //Distance from objects
    float distSphere = sdSphere(point-sphere.xyz, sphere.w);
    float distPlane = sdPlane(point, vec3(0, 1, 0), 0.);
    float distCapsule = sdCapsule(point, capsule[0], capsule[1], capsuleRadius);
    float distTorus = sdTorus(point-torus, torusRadius);
    float distFrameBox = sdBoxFrame(point-vec3(2, 2, 6), vec3(1, 1, 1), 0.1);

    //Blend objects
    float dist = min(distSphere, distPlane);
    dist = min(dist, distCapsule);
    dist = min(dist, distTorus);
    dist = min(dist, distFrameBox);
    return dist;
}

vec3 getNormal(vec3 point){
    vec2 e = vec2(.01, 0);
    float d = getDist(point);
    vec3 n = d - vec3(getDist(point-e.xyy), getDist(point-e.yxy), getDist(point-e.yyx));
    return normalize(n);
}

float rayMarch(vec3 cameraPos, vec3 rayDirection){
    float distFromCamera = 0.;
    for(int i = 0; i < MAX_STEPS; i++){
        vec3 pointStep = cameraPos + distFromCamera*rayDirection;
        float distStep = getDist(pointStep);
        distFromCamera += distStep;
        if(distStep < SURFACE_DIST || distFromCamera > MAX_DIST)
            break;
    }
    return distFromCamera;
}

float getLight(vec3 point){
    vec3 lightPos = vec3(0, 5, 3);
    lightPos.xz += vec2(sin(u_time*0.5), cos(u_time*0.5)) * 4.;
    vec3 lightDir = normalize(lightPos - point);
    vec3 normal = getNormal(point);

    float dif = clamp(dot(normal, lightDir), 0., 1.);
    float shadow = rayMarch(point+normal*SURFACE_DIST*2., lightDir);
    if(shadow<length(lightPos-point))
        dif *= .1;
    return dif;
}

void main(){
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0, 0.0, 0.0);

    vec3 cameraPos = vec3(-0.5, 2, 0); //ro
    vec3 rayDirection = normalize(vec3(uv.x, uv.y-0.2, 1)); //rd

    float d = rayMarch(cameraPos, rayDirection);
    if(d< MAX_DIST){
        vec3 p = cameraPos + rayDirection * d;
        float dif = getLight(p);
        col = vec3(dif);
    }

    gl_FragColor = vec4(col, 1.0);
}