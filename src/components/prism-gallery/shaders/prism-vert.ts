import { hash, timeline } from "./common";

const prismVert = /* glsl */ `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec3 i_position;
in vec3 i_velocity;
in vec4 i_cell;
in float i_width;

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform float u_gap;
uniform float u_depth;
uniform float u_stretch;
uniform float u_shrink;
uniform vec4 u_origin;
uniform vec2 u_elementSize;

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_pos;
flat out vec2 v_cellUv;
flat out float v_face;
flat out float v_fly;
flat out float v_k;

const float PI = 3.14159265359;

${hash}
${timeline}

vec4 axisAngle(vec3 axis, float a) { return vec4(axis * sin(a * .5), cos(a * .5)); }

vec3 rotate(vec4 q, vec3 v) { return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

vec4 quatFromBasis(mat3 m) {
  float tr = m[0][0] + m[1][1] + m[2][2];
  vec4 q;
  if (tr > 0.) {
    float s = sqrt(tr + 1.) * 2.;
    q = vec4((m[1][2] - m[2][1]) / s, (m[2][0] - m[0][2]) / s, (m[0][1] - m[1][0]) / s, .25 * s);
  } else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
    float s = sqrt(1. + m[0][0] - m[1][1] - m[2][2]) * 2.;
    q = vec4(.25 * s, (m[1][0] + m[0][1]) / s, (m[2][0] + m[0][2]) / s, (m[1][2] - m[2][1]) / s);
  } else if (m[1][1] > m[2][2]) {
    float s = sqrt(1. + m[1][1] - m[0][0] - m[2][2]) * 2.;
    q = vec4((m[1][0] + m[0][1]) / s, .25 * s, (m[2][1] + m[1][2]) / s, (m[2][0] - m[0][2]) / s);
  } else {
    float s = sqrt(1. + m[2][2] - m[0][0] - m[1][1]) * 2.;
    q = vec4((m[2][0] + m[0][2]) / s, (m[2][1] + m[1][2]) / s, .25 * s, (m[0][1] - m[1][0]) / s);
  }
  return normalize(q);
}

vec4 nlerp(vec4 a, vec4 b, float t) {
  return normalize(mix(a, dot(a, b) < 0. ? -b : b, t));
}

void main() {
  vec4 r = hash44(i_cell * 9.7 + 1.3);
  float k = progressOf(i_cell, u_clock);
  float fly = smoothstep(0., .1, k) * (1. - smoothstep(.45, .9, k));
  float settle = smoothstep(.4, 1., k);
  settle = settle * settle * (3. - 2. * settle);

  vec3 home = homeOf(i_cell);
  vec3 p = k <= 0. || k >= 1. ? home : mix(i_position, home, settle);

  vec4 qHome = axisAngle(vec3(0., 1., 0.), -u_direction * PI * smoothstep(.3, .95, k));

  float speed = length(i_velocity);
  vec3 f = speed > 1e-4 ? i_velocity / speed : vec3(1., 0., 0.);
  vec3 up0 = abs(f.y) > .98 ? vec3(1., 0., 0.) : vec3(0., 1., 0.);
  vec3 side = normalize(cross(f, up0));
  vec3 up = cross(side, f);
  float roll = (r.z - .5) * 2.;
  vec3 up2 = up * cos(roll) + side * sin(roll);
  vec3 side2 = side * cos(roll) - up * sin(roll);
  vec4 qFlow = quatFromBasis(mat3(f, up2, side2));

  vec4 q = nlerp(qHome, qFlow, fly);

  vec2 cell = u_view / u_grid;
  float gap = mix(-.004, u_gap, fly);
  vec2 span = vec2(i_width, 1.) - gap;
  vec3 rest = vec3(cell * span, min(cell.x, cell.y) * u_depth);
  vec3 dims = rest * mix(vec3(1.), vec3(1. + u_stretch * speed, vec2(1. - u_shrink)), fly);

  vec3 wp = p + rotate(q, position * dims);
  vec3 wn = rotate(q, normal);

  float face = normal.z > .5 ? 1. : normal.z < -.5 ? -1. : 0.;
  vec2 local = vec2(face < 0. ? -position.x : position.x, position.y);
  v_face = face;
  v_cellUv = cellUv(i_cell);
  v_uv = v_cellUv + local * span / u_grid;
  v_fly = fly;
  v_k = k;

  vec4 vp = u_viewMatrix * vec4(wp, 1.);
  v_pos = vp.xyz;
  v_normal = mat3(u_viewMatrix) * wn;
  vec4 clip = u_projectionMatrix * vp;
  clip.xy = clip.xy * u_elementSize * .5 + u_origin.zw * clip.w;
  if (face == 0.) clip.z += 2e-5 * clip.w;
  gl_Position = clip;
}
`;

export default prismVert;
