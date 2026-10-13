/*
* Made by Alessandro Kummerlin di Querciavalle, 2023
*
* Sign distance functions are implemented from Inigo Quilez blogpost: 
* https://iquilezles.org/articles/distfunctions/
*/

precision highp float;
 
uniform vec2 u_resolution;
uniform float u_time;
 
// Constants
#define PI 3.1415925359
#define MAX_STEPS 180
#define MAX_DIST 180.
#define SURF_DIST.01
 
const vec4 OctahedronColor = vec4(1,0,0,1);
const vec4 LinkColor = vec4(0,1,0,1);
const vec4 BoxColor = vec4(0,0,1,1);
 
mat2 Rotate(float a) {
    float s=sin(a); 
    float c=cos(a);
    return mat2(c,-s,s,c);
}
 
// ------------ Primitives ----------------
// Round Box
float roundBoxSDF(vec3 p,vec3 b,float r) {
    vec3 q=abs(p)-b;
    return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;
}
 
// Plane
float planeSDF(vec3 p,vec4 n) {
    // n must be normalized
    return dot(p,n.xyz)+n.w;
}
 
// Link
float linkSDF(vec3 p,float le,float r1,float r2) {
    vec3 q=vec3(p.x,max(abs(p.y)-le,0.),p.z);
    return length(vec2(length(q.xy)-r1,q.z))-r2;
}
 
// Octahedron
float octahedronSDF(vec3 p,float s) {
    p=abs(p);
    float m=p.x+p.y+p.z-s;
    vec3 q;
    if(3.*p.x<m)q=p.xyz;
    else if(3.*p.y<m)q=p.yzx;
    else if(3.*p.z<m)q=p.zxy;
    else return m*.57735027;
 
    float k=clamp(.5*(q.z-q.y+s),0.,s);
    return length(vec3(q.x,q.y-s+k,q.z-k));
}
 
// ---------- Boolean Operators ----------------
vec4 intersectSDF(vec4 a, vec4 b) {
    return a.w > b.w ? a : b;
}
  
vec4 unionSDF(vec4 a, vec4 b) {
    return a.w < b.w? a : b;
}
 
vec4 differenceSDF(vec4 a, vec4 b) {
    return a.w > -b.w? a : vec4(b.rgb,-b.w);
}

// --------- Raymarching functions ----------
vec4 sdScene(vec3 p){
    // Octahedron
    vec3 o0p = vec3(-3,1,7); // Position
    o0p = p - o0p;
    o0p.xy *= Rotate(-u_time); // Rotate on one axis
    o0p.xz *= Rotate(-u_time);
    vec4 o0 = vec4(OctahedronColor.rgb,octahedronSDF(o0p,1.));
 
    // Link
    vec3 l0p = vec3(0,1,6);
    l0p = p-l0p;
    l0p.xz *= Rotate(-u_time);
    l0p.xy *= Rotate(-u_time);
    vec4 l0 = vec4(LinkColor.rgb,linkSDF(l0p,.2,.5,.2));
 
    // Box
    vec3 b0p = vec3(3,1,7);
    b0p = p - b0p;
    b0p.xy *= Rotate(u_time);
    b0p.xz *= Rotate(u_time);
    vec4 b0 = vec4(BoxColor.rgb,roundBoxSDF(b0p,vec3(.5,.5,.5),.1));
 
    // Plane
    vec3 groundColor = vec3(0.6 + 0.7*mod(floor(p.x) + floor(p.z), 2.0));
    vec4 p0 = vec4(groundColor.rgb,planeSDF(p,vec4(0,1,0,0)));
 
    // Scene
    vec4 scene = vec4(0);
    scene = unionSDF(l0,o0);
    scene = unionSDF(scene,b0);
    scene = unionSDF(scene,p0);
 
    return scene;
}
                             
float rayMarch(vec3 ro,vec3 rd, inout vec3 dColor){
    float dO=0.;//Distane Origin
    for(int i=0;i<MAX_STEPS;i++){
        if(dO>MAX_DIST)
            break;
 
        vec3 p=ro+rd*dO;
        vec4 ds=sdScene(p);// ds is Distance Scene
 
        if(ds.w<SURF_DIST){
            dColor = ds.rgb;
            break;
        }
        dO+=ds.w;
         
    }
    return dO;
}
                             
vec3 getNormal(vec3 p)
{
    float d=sdScene(p).w;
    vec2 e=vec2(.01,0);
     
    vec3 n=d-vec3(
        sdScene(p-e.xyy).w,
        sdScene(p-e.yxy).w,
        sdScene(p-e.yyx).w);
         
    return normalize(n);
}

float calcSoftshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax, in float w, int technique ){
	float res = 1.0;
    float t = mint;
    float ph = 1e10;
    
    for( int i=0; i<32; i++ ){
		vec4 h = sdScene( ro + rd*t );

        // traditional technique
        if( technique==0 ){
        	res = min( res, h.w/(w*t) );
        }
        // improved technique
        else{
            float y = h.w*h.w/(2.0*ph);
            float d = sqrt(h.w*h.w-y*y);
            res = min( res, d/(w*max(0.0,t-y)));
            ph = h.w;
        }
        
        t += h.w;
        
        if( res<0.0001 || t>tmax ) break;
        
    }
    res = clamp( res, 0.0, 1.0 );
    return res*res*(3.0-2.0*res);
}

vec3 getLight(vec3 p, vec3 c, float colorIntensity)
{
    // Diffuse Color
    vec3 color = c.rgb * colorIntensity;
 
    // Directional light
    vec3 lightPos = vec3(3., 4., 1.);// Light Position
 
    vec3 l = normalize(lightPos - p);// Light Vector
    vec3 n = getNormal(p);// Normal Vector
     
    float dif = dot(n, l);// Diffuse light
    dif = clamp(dif, 0., 1.);// Clamp so it doesnt go below 0
     
    // Shadows
    float d = rayMarch(p + n * SURF_DIST * 2., l, c);
    if(d < length(lightPos - p)) dif *= .1;
     
    return color * dif;
}

void main(){
    vec2  uv = (2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y;
     
    float colorIntensity = 1.;
    vec3 difColor = vec3(1.0, 1, 1.0); // Diffuse Color

    vec3 ro = vec3(0., 2.+ 0.5*cos(u_time), 1. + sin(u_time));// Ray Origin/Camera
    vec3 rd = normalize(vec3(uv, 1));// Ray Direction
     
    float d = rayMarch(ro, rd, difColor);// Distance
    
    vec3 color;

    if(d > MAX_DIST){
        color = vec3(0.835, 1, 1);
    }
    else{
        vec3 p = ro + rd * d;
        color = getLight(p, difColor, colorIntensity);// Diffuse lighting
    }
     
    // Set the output color
    gl_FragColor = vec4(color, 1.);
}