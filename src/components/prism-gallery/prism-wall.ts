import {
  Box,
  Camera,
  GeometryAttribute,
  Mesh,
  Obj,
  Program,
  ScrollScene,
  Texture,
  TransformFeedback,
  Uniform,
  Vec3,
  type UniformKind,
  type WTCGLRenderingContext,
  type WTCGLUniformValue,
} from "wtc-gl";

import simulateVert from "./shaders/simulate-vert";
import prismVert from "./shaders/prism-vert";
import prismFrag from "./shaders/prism-frag";

export interface PrismParams {
  cellWidth: number;
  cellHeight: number;
  bricks: boolean;
  gap: number;
  depth: number;
  duration: number;
  stagger: number;
  flowScale: number;
  flowSpeed: number;
  evolve: number;
  steer: number;
  explode: number;
  drift: number;
  tether: number;
  stretch: number;
  shrink: number;
  gloss: number;
}

export const PARAMS: PrismParams = {
  cellWidth: 25,
  cellHeight: 8,
  bricks: true,
  gap: 0.2,
  depth: 1.5,
  duration: 1.5,
  stagger: 1.0,
  flowScale: 0.69,
  flowSpeed: 1.04,
  evolve: 0.52,
  steer: 4.14,
  explode: 1.83,
  drift: -0.61,
  tether: 1.17,
  stretch: 0.49,
  shrink: 0,
  gloss: 1,
};

const DEFAULT_FOV = 30;
const distanceFor = (fov: number) => 1 / Math.tan(((fov / 2) * Math.PI) / 180);
const BACKGROUND = [0.04, 0.04, 0.05];

const EMPTY_FRAGMENT = `#version 300 es
precision highp float;
out vec4 c;
void main() { c = vec4(0.); }`;

const u = (value: WTCGLUniformValue, kind: UniformKind = "float") =>
  new Uniform({ value, kind });

type TimelineUniforms = {
  u_grid: Uniform;
  u_view: Uniform;
  u_clock: Uniform;
  u_duration: Uniform;
  u_stagger: Uniform;
  u_direction: Uniform;
};

type SimUniforms = TimelineUniforms & {
  u_time: Uniform;
  u_dt: Uniform;
  u_flowScale: Uniform;
  u_flowSpeed: Uniform;
  u_evolve: Uniform;
  u_steer: Uniform;
  u_explode: Uniform;
  u_drift: Uniform;
  u_tether: Uniform;
};

type PrismUniforms = TimelineUniforms & {
  u_gap: Uniform;
  u_depth: Uniform;
  u_stretch: Uniform;
  u_shrink: Uniform;
  u_gloss: Uniform;
  u_from: Uniform;
  u_to: Uniform;
  u_fromAspect: Uniform;
  u_toAspect: Uniform;
  u_origin: Uniform;
  u_elementSize: Uniform;
};

type Span = [row: number, start: number, end: number];
type Transition = { index: number; direction: 1 | -1 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

export interface PrismWallOptions {
  images: string[];
  startIndex?: number;
  margin?: number;
  fov?: number;
  params?: Partial<PrismParams>;
  initializedClass?: string;
}

export class PrismWall {
  private readonly gl: WTCGLRenderingContext;
  private size: [number, number] = [0, 0];
  overrides: Partial<PrismParams>;
  private readonly camera: Camera;
  private readonly root: Obj;
  readonly scene: ScrollScene;
  private readonly blank: Texture;
  private readonly textures: Array<Texture | null>;
  private readonly aspects: number[];
  private readonly timeline: TimelineUniforms;
  private readonly simUniforms: SimUniforms;
  private readonly simProgram: Program;
  private readonly uniforms: PrismUniforms;
  private readonly program: Program;
  private current = -1;
  private target: Transition | null = null;
  private pending: Transition | null = null;
  private bricks: boolean | null = null;
  private mesh: Mesh | null = null;
  private simulation: TransformFeedback | null = null;
  private destroyed = false;
  private time = 0;

  constructor(
    gl: WTCGLRenderingContext,
    element: HTMLElement,
    {
      images,
      startIndex = 0,
      margin = 0,
      fov = DEFAULT_FOV,
      params = {},
      initializedClass,
    }: PrismWallOptions,
  ) {
    this.gl = gl;
    this.overrides = params;
    const settings = this.params;

    this.camera = new Camera({ near: 0.05 });
    this.fov = fov;
    this.root = new Obj();
    this.scene = new ScrollScene({
      element,
      scene: this.root,
      camera: this.camera,
      margin,
      useViewport: false,
      clipToViewport: false,
      elementSpace: true,
      initializedClass,
      onBeforeRender: (delta, rect) => this.frame(delta, rect),
    });

    this.blank = new Texture(gl, {
      data: new Uint8Array([
        ...BACKGROUND.map((c) => Math.round(c * 255)),
        255,
      ]),
      width: 1,
      height: 1,
      generateMipmaps: false,
    });
    this.textures = images.map(() => null);
    this.aspects = images.map(() => 1);

    this.timeline = {
      u_grid: u([1, 1], "float_vec2"),
      u_view: u([2, 2], "float_vec2"),
      u_clock: u(-1),
      u_duration: u(settings.duration),
      u_stagger: u(settings.stagger),
      u_direction: u(1),
    };

    this.simUniforms = {
      ...this.timeline,
      u_time: u(0),
      u_dt: u(1 / 60),
      u_flowScale: u(settings.flowScale),
      u_flowSpeed: u(settings.flowSpeed),
      u_evolve: u(settings.evolve),
      u_steer: u(settings.steer),
      u_explode: u(settings.explode),
      u_drift: u(settings.drift),
      u_tether: u(settings.tether),
    };
    this.simProgram = new Program(gl, {
      vertex: simulateVert,
      fragment: EMPTY_FRAGMENT,
      uniforms: this.simUniforms,
      transformFeedbackVaryings: ["v_position", "v_velocity"],
    });

    this.uniforms = {
      ...this.timeline,
      u_gap: u(settings.gap),
      u_depth: u(settings.depth),
      u_stretch: u(settings.stretch),
      u_shrink: u(settings.shrink),
      u_gloss: u(settings.gloss),
      u_from: u(this.blank, "texture"),
      u_to: u(this.blank, "texture"),
      u_fromAspect: u(1),
      u_toAspect: u(1),
      u_origin: this.scene.u_origin,
      u_elementSize: this.scene.u_elementSize!,
    };
    this.program = new Program(gl, {
      vertex: prismVert,
      fragment: prismFrag,
      uniforms: this.uniforms,
    });

    this.resize(element.clientWidth, element.clientHeight);

    images.forEach((src, i) => {
      loadImage(src)
        .then((img) => {
          if (this.destroyed) return;
          this.textures[i] = new Texture(gl, { image: img });
          this.aspects[i] = img.naturalWidth / img.naturalHeight;
          const pending = this.pending;
          if (!this.target && pending && pending.index === i) this.start(pending);
        })
        .catch(() => {
          console.warn(`PrismGallery: couldn't load ${src}`);
        });
    });
    this.transition(startIndex, 1);
  }

  get fov(): number {
    return this.camera.fov;
  }

  set fov(fov: number) {
    const distance = distanceFor(fov);
    this.camera.perspective({ fov, far: distance + 50 });
    this.camera.position = new Vec3(0, 0, distance);
  }

  get params(): PrismParams {
    return { ...PARAMS, ...this.overrides };
  }

  applyParams(): void {
    const params = this.params;
    this.simUniforms.u_flowScale.value = params.flowScale;
    this.simUniforms.u_flowSpeed.value = params.flowSpeed;
    this.simUniforms.u_evolve.value = params.evolve;
    this.simUniforms.u_steer.value = params.steer;
    this.simUniforms.u_explode.value = params.explode;
    this.simUniforms.u_drift.value = params.drift;
    this.simUniforms.u_tether.value = params.tether;
    this.uniforms.u_gap.value = params.gap;
    this.uniforms.u_depth.value = params.depth;
    this.uniforms.u_stretch.value = params.stretch;
    this.uniforms.u_shrink.value = params.shrink;
    this.uniforms.u_gloss.value = params.gloss;
    if (!this.target) {
      this.timeline.u_duration.value = params.duration;
      this.timeline.u_stagger.value = params.stagger;
    }
    this.resize(...this.size);
  }

  transition(index: number, direction: number): void {
    const request: Transition = { index, direction: direction ? 1 : -1 };
    if (this.target || !this.textures[index]) this.pending = request;
    else this.start(request);
  }

  private start(request: Transition): void {
    this.pending = null;
    if (request.index === this.current) return;
    this.target = request;
    this.uniforms.u_to.value = this.textures[request.index] ?? this.blank;
    this.uniforms.u_toAspect.value = this.aspects[request.index] ?? 1;
    this.timeline.u_direction.value = request.direction;
    const { duration, stagger } = this.params;
    this.timeline.u_duration.value = duration;
    this.timeline.u_stagger.value = stagger;
    this.timeline.u_clock.value = 0;
  }

  private finish(): void {
    const target = this.target;
    if (!target) return;
    this.current = target.index;
    this.uniforms.u_from.value = this.uniforms.u_to.value;
    this.uniforms.u_fromAspect.value = this.uniforms.u_toAspect.value;
    this.timeline.u_clock.value = -1;
    this.target = null;
    const pending = this.pending;
    if (pending && this.textures[pending.index]) this.start(pending);
  }

  private resize(width: number, height: number): void {
    width = Math.max(1, width);
    height = Math.max(1, height);
    this.size = [width, height];
    const aspect = width / height;
    this.camera.perspective({ aspect });
    this.timeline.u_view.value = [2 * aspect, 2];

    const { cellWidth, cellHeight, bricks } = this.params;
    const cols = Math.max(1, Math.round(width / cellWidth));
    const rows = Math.max(1, Math.round(height / cellHeight));
    const [c, r] = this.timeline.u_grid.value as [number, number];
    if (cols !== c || rows !== r || bricks !== this.bricks || !this.mesh) {
      this.build(cols, rows, bricks);
    }
  }

  static spans(cols: number, rows: number, bricks: boolean): Span[] {
    const spans: Span[] = [];
    for (let row = 0; row < rows; row++) {
      const shift = bricks && row % 2 ? 0.5 : 0;
      for (let col = 0; col < cols + (shift ? 1 : 0); col++) {
        spans.push([
          row,
          Math.max(0, col - shift),
          Math.min(cols, col + 1 - shift),
        ]);
      }
    }
    return spans;
  }

  private build(cols: number, rows: number, bricks: boolean): void {
    const { gl } = this;
    this.bricks = bricks;
    const spans = PrismWall.spans(cols, rows, bricks);
    const count = spans.length;
    const cells = new Float32Array(count * 4);
    const widths = new Float32Array(count);
    spans.forEach(([row, start, end], i) => {
      cells.set(
        [(start + end) / 2 - 0.5, row, Math.random(), Math.random()],
        i * 4,
      );
      widths[i] = end - start;
    });
    this.timeline.u_grid.value = [cols, rows];

    this.simulation?.remove();
    const simulation = new TransformFeedback(gl, {
      program: this.simProgram,
      attributes: {
        a_position: {
          data: new Float32Array(count * 3),
          size: 3,
          varying: "v_position",
        },
        a_velocity: {
          data: new Float32Array(count * 3),
          size: 3,
          varying: "v_velocity",
        },
      },
      staticAttributes: {
        a_cell: new GeometryAttribute({ data: cells, size: 4 }),
      },
    });
    this.simulation = simulation;

    const geometry = new Box(gl);
    geometry.addAttribute(
      "i_position",
      simulation.attribute("a_position", { instanced: 1 }),
    );
    geometry.addAttribute(
      "i_velocity",
      simulation.attribute("a_velocity", { instanced: 1 }),
    );
    geometry.addAttribute(
      "i_cell",
      new GeometryAttribute({ data: cells, size: 4, instanced: 1 }),
    );
    geometry.addAttribute(
      "i_width",
      new GeometryAttribute({ data: widths, size: 1, instanced: 1 }),
    );
    geometry.setInstancedCount(count);
    this.mesh?.setParent(null);
    this.mesh?.geometry.remove();
    this.mesh = new Mesh(gl, {
      geometry,
      program: this.program,
      frustumCulled: false,
    });
    this.mesh.setParent(this.root);
  }

  private frame(delta: number, rect: DOMRect): void {
    if (rect.width !== this.size[0] || rect.height !== this.size[1]) {
      this.resize(rect.width, rect.height);
    }
    const dt = Math.min(delta / 1000, 1 / 30);

    if (this.target) {
      const clock = Number(this.timeline.u_clock.value) + dt;
      if (clock > Number(this.timeline.u_stagger.value) + Number(this.timeline.u_duration.value)) {
        this.finish();
      } else {
        this.time += dt;
        this.timeline.u_clock.value = clock;
        this.simUniforms.u_time.value = this.time;
        this.simUniforms.u_dt.value = dt;
        this.simulation?.step();
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.scene.destroy();
    this.mesh?.geometry.remove();
    this.simulation?.remove();
    this.simProgram.remove();
    this.program.remove();
    [this.blank, ...this.textures].forEach((texture) => texture?.remove());
  }
}
