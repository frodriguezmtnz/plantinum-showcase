const prismFrag = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_pos;
flat in vec2 v_cellUv;
flat in float v_face;
flat in float v_fly;
flat in float v_k;

uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_fromAspect;
uniform float u_toAspect;
uniform vec2 u_view;
uniform float u_gloss;

out vec4 colour;

vec2 cover(vec2 uv, float imageAspect) {
  float viewAspect = u_view.x / u_view.y;
  vec2 scale = viewAspect > imageAspect
    ? vec2(1., imageAspect / viewAspect)
    : vec2(viewAspect / imageAspect, 1.);
  return (uv - .5) * scale + .5;
}

void main() {
  vec3 col;
  if (v_face > .5) col = texture(u_from, cover(v_uv, u_fromAspect)).rgb;
  else if (v_face < -.5) col = texture(u_to, cover(v_uv, u_toAspect)).rgb;
  else {
    vec3 a = texture(u_from, cover(v_cellUv, u_fromAspect)).rgb;
    vec3 b = texture(u_to, cover(v_cellUv, u_toAspect)).rgb;
    col = mix(a, b, step(.5, v_k)) * .55;
  }

  vec3 n = normalize(v_normal);
  vec3 V = normalize(-v_pos);
  vec3 L = normalize(vec3(-.4, .6, .7));
  float dif = max(dot(n, L), 0.);
  float spec = pow(max(dot(n, normalize(L + V)), 0.), 40.);
  float rim = pow(1. - max(dot(n, V), 0.), 3.);
  vec3 lit = col * (.45 + .7 * dif) + (spec * .4 + rim * .12) * u_gloss;

  float shade = abs(v_face) > .5 ? v_fly : 1.;
  colour = vec4(mix(col, lit, shade), 1.);
}
`;

export default prismFrag;
