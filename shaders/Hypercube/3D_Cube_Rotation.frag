#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define VERTICES 8
#define GLOW 0.006
#define PI 3.14
#define SPEED -0.3

//------------------------------PROJECTIONS----------------------------------------------

vec2 r3_to_r2(vec3 point3d, vec3 offset){
    vec2 point2d;
    point2d.x = ((point3d.x - offset.x) * offset.z) / (point3d.z + offset.z) + offset.x;
    point2d.y = ((point3d.y - offset.y) * offset.z) / (point3d.z + offset.z) + offset.y;
    return point2d;
}

//------------------------------ROTATIONS----------------------------------------------

vec3 rotationXY(vec3 point)
{
    vec3 newCoord = point;
    newCoord.x = (point.x * cos(u_time * PI * SPEED)) - (point.y * sin(u_time * PI * SPEED));
    newCoord.y = (point.x * sin(u_time * PI * SPEED)) + (point.y * cos(u_time * PI * SPEED));
    return newCoord;
}

vec3 rotationXZ(vec3 point){
    vec3 newCoord = point;
    newCoord.x = (point.x * cos(u_time * PI * SPEED)) + (point.z * sin(u_time * PI * SPEED));
    newCoord.z = (point.x * (-sin(u_time * PI * SPEED))) + (point.z * cos(u_time * PI * SPEED));
    return newCoord;
}

vec3 rotationYZ(vec3 point){
    vec3 newCoord = point;
    newCoord.y = (point.y * cos(u_time * PI * SPEED)) + (point.z * sin(u_time * PI * SPEED));
    newCoord.z = (point.y * (-sin(u_time * PI * SPEED))) + (point.z * cos(u_time * PI * SPEED));
    
    return newCoord;
}

//-------------------------------------------------------------------------------------------

vec4 drawVertex(vec2 p, vec4 color, vec2 uv, float r1, float r2){
    vec4 out_color = vec4(0.0);
    
    float d = length(uv - p);
    d = GLOW / d;
    out_color += vec4(color.r * d, color.g * d, color.b * d, 1.0);
    
    return out_color;
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b ){
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

vec3 drawLine(vec2 p, vec2 v1, vec2 v2, vec3 color){
    float d = GLOW / sdSegment(p, v1, v2);
    vec3 out_color = color;
    return out_color * d;
}

void main(){
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy)/u_resolution.y;
    
    //Background
    float d = length(uv);
    vec3 col = vec3(0.05, 0.05, 0.05);
    
    // 3D virtual vertices
    vec3 vertex[VERTICES];
    float x = 0.3;
    vertex[0] = vec3( x,  x,  x);
    vertex[1] = vec3( x,  x, -x);
    vertex[2] = vec3(-x,  x, -x);
    vertex[3] = vec3(-x,  x,  x);
    vertex[4] = vec3( x, -x,  x);
    vertex[5] = vec3( x, -x, -x);
    vertex[6] = vec3(-x, -x, -x);
    vertex[7] = vec3(-x, -x,  x);
    
    // Applying the transformation (Rotation X, Y and Z)
    for(int i = 0; i < VERTICES; i++){
        vertex[i] = rotationXY(vertex[i]);
        vertex[i] = rotationXZ(vertex[i]);
        vertex[i] = rotationYZ(vertex[i]);
    }
    
    // 2D Projections of vertices
    vec2 point[VERTICES];
    for(int i = 0; i < VERTICES; i++){
        point[i] = r3_to_r2(vertex[i], vec3(5.0, 5.0, 21.0));
    }

    vec4 color1 = vec4(1.0, 1.4, 0.0, 1.0);
    vec4 color3 = vec4(1.0, 0.0, 0.0, 1.0);
    vec3 color2 = vec3(0.0, 1.0, 0.0);
    
    //Drawing lines
    for(int i = 0; i<VERTICES; i += 4){
        for(int j = 0; j < 4; j++){     
            col += drawLine(uv, point[i + j], point[i + j + 1 - 4*(j/3)], color2);
            if(i == 4)
                col += drawLine(uv, point[j], point[j+i], color2);
        }
    }

    // Output
    gl_FragColor = vec4(col, 1.0);
}