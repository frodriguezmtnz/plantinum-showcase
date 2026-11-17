import { curl, hash, timeline } from "./common";

const simulateVert = /* glsl */ `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_velocity;
in vec4 a_cell;

uniform float u_time;
uniform float u_dt;
uniform float u_flowScale;
uniform float u_flowSpeed;
uniform float u_evolve;
uniform float u_steer;
uniform float u_explode;
uniform float u_drift;
uniform float u_tether;

out vec3 v_position;
out vec3 v_velocity;

${hash}
${timeline}
${curl}

vec3 current(vec3 p, vec3 home) {
  vec3 v = curlNoise(p * u_flowScale, u_time * u_evolve) * u_flowSpeed;
  v.x -= u_direction * u_drift;
  return v + (home - p) * u_tether;
}

void main() {
  vec3 home = homeOf(a_cell);
  float k = progressOf(a_cell, u_clock);
  float before = progressOf(a_cell, u_clock - u_dt);

  vec3 p = a_position;
  vec3 vel = a_velocity;

  if (k <= 0. || k >= 1.) {
    p = home;
    vel = vec3(0.);
  } else {
    if (before <= 0.) {
      vec4 r = hash44(a_cell * 17.3 + 3.1);
      vec3 dir = normalize(vec3(home.xy * .5 + (r.xy - .5) * 1.2, 1.2 + r.z));
      vel = dir * u_explode * (.6 + .8 * r.w);
    }
    vel = mix(vel, current(p, home), 1. - exp(-u_dt * u_steer));
    p += vel * u_dt;
  }

  v_position = p;
  v_velocity = vel;
}
`;

export default simulateVert;
