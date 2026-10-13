// Made by Alessandro Kummerlin di Querciavalle, 2023

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define VERTICES 16
#define GLOW 0.004
#define PI 3.14
#define SPEED 0.2

#define NUM_STAGES 3.0
#define TAU 6.28318530718

//------------------------------PROJECTIONS----------------------------------------------

vec3 r4_to_r3(vec4 point4d, float fov4){
    return (point4d.xyz * fov4) / (point4d.w + fov4);
}

vec2 r3_to_r2(vec3 point3d, vec3 offset){
    return ((point3d.xy - offset.xy) * offset.z) / (point3d.z + offset.z) + offset.xy;
}

//------------------------------ROTATIONS----------------------------------------------
vec4 rotationXY(vec4 point, float a){
    float c = cos(a), s = sin(a);
    vec4 newCoord = point;
    newCoord.x = point.x * c + point.y * s;
    newCoord.y = -point.x * s + point.y * c;
    return newCoord;
}

vec4 rotationXZ(vec4 point, float a){
    float c = cos(a), s = sin(a);
    vec4 newCoord = point;
    newCoord.x = point.x * c + point.z * s;
    newCoord.z = -point.x * s + point.z * c;
    return newCoord;
}

vec4 rotationYZ(vec4 point, float a){
    float c = cos(a), s = sin(a);
    vec4 newCoord = point;
    newCoord.y = point.y * c + point.z * s;
    newCoord.z = -point.y * s + point.z * c;
    return newCoord;
}

vec4 rotationXW(vec4 point, float a){
    float c = cos(a);
    float s = sin(a);
    vec4 newCoord = point;
    newCoord.x = point.x * c + point.w * s;
    newCoord.w = -point.x * s + point.w * c;
    return newCoord;
}

vec4 rotationYW(vec4 point, float a){
    float c = cos(a);
    float s = sin(a);
    vec4 newCoord = point;
    newCoord.y = point.y * c + point.w * s;
    newCoord.w = -point.y * s + point.w * c;
    return newCoord;
}

vec4 rotationZW(vec4 point, float a){
    float c = cos(a);
    float s = sin(a);
    vec4 newCoord = point;
    newCoord.z = point.z * c + point.w * s;
    newCoord.w = -point.z * s + point.w * c;
    return newCoord;
}
//-------------------------------------------------------------------------------------------

vec3 drawLine(vec2 p, vec2 a, vec2 b, vec3 color, float f, float t)
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), f, t );
    float d = GLOW / length( pa - ba*h );
    return color * d;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy)/u_resolution.y;
    vec3 color = vec3(0.1, 0.1, 0.1);

    // Defines vertices
    vec4 vertex[VERTICES];
    float x = 0.32;
    for (int i = 0; i < VERTICES; i++){
        float fi = float(i);
        float j = mod(fi, 4.0);
        float sx = 1.0 - 2.0 * floor(j / 2.0);
        float sy = 1.0 - 2.0 * mod(floor(fi / 4.0), 2.0);
        float sz = 1.0 - 2.0 * floor(mod(j + 1.0, 4.0) / 2.0);
        float sw = 1.0 - 2.0 * floor(fi / 8.0);

        vertex[i] = x * vec4(sx, sy, sz, sw);
    }
    
    float speed  = 0.5;
    float period = TAU / speed;
    float stage = mod(floor(u_time / period), NUM_STAGES);
    float a = mod(u_time, period) * speed;
    
    // Applying the transformation
    for(int i = 0; i < VERTICES; i++){
        if(stage < 0.5){
            vertex[i] = rotationYZ(vertex[i], a);
            vertex[i] = rotationXW(vertex[i], a);
        }
        else if(stage < 1.5){
            vertex[i] = rotationXZ(vertex[i], a);
            vertex[i] = rotationYW(vertex[i], a);
        }
        else{
            vertex[i] = rotationXW(vertex[i], a);
            vertex[i] = rotationZW(vertex[i], a);
        }
    }
    
    // 2D Projections of vertices
    vec2 point[VERTICES];
    float fov4 = 1.0;
    vec3 fov3 = vec3(5.0, 5.0, 20.0);
    for(int i = 0; i < VERTICES; i++)
        point[i] = r3_to_r2(r4_to_r3(vertex[i], fov4), fov3);
    
    //Drawing lines
    vec3 color1 = vec3(1.0*sin(u_time), 0.0, 0.5*cos(u_time));
    vec3 color2 = vec3(1.0*sin(u_time), 0.4, 0.3*cos(u_time));
    for(int i = 0; i<VERTICES; i += 4){
        for(int j = 0; j < 4; j++){
            color += drawLine(uv, point[i + j], point[i + j + 1 - 4*(j/3)], color2, 0.0, 1.0);
            if(i == 4 )
                color += drawLine(uv, point[j], point[j+i], color2, 0.0, 1.0);
            else if (i == 8){
                color += drawLine(uv, point[j], point[j+i], color2, 0.0, 1.0);
                color += drawLine(uv, point[j+i], point[j+i + 4], color2, 0.0, 1.0);   
            }
            else if (i == 12 )
                color += drawLine(uv, point[i+j], point[j + 4], color2, 0.0, 1.0);
        }
    }

    gl_FragColor = vec4(color, 1.0);
}