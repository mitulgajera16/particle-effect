import type { ParticleData, ParticleConfig, Renderer } from '../types';

const VERT_SRC = `#version 300 es
precision highp float;

// Per-vertex (quad)
in vec2 a_quad;

// Per-instance
in vec2 a_position;
in vec4 a_color;
in float a_size;

uniform vec2 u_resolution;
uniform float u_particleSize;

out vec4 v_color;
out vec2 v_uv;

void main() {
  float size = a_size * u_particleSize;
  vec2 pos = a_position + a_quad * size;

  // Pixel to clip space
  vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
  clip.y *= -1.0;

  gl_Position = vec4(clip, 0.0, 1.0);
  v_color = a_color;
  v_uv = a_quad + 0.5; // 0..1
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_uv;

uniform int u_shape; // 0 = square, 1 = circle

out vec4 fragColor;

void main() {
  if (u_shape == 1) {
    float dist = length(v_uv - 0.5);
    if (dist > 0.5) discard;
  }
  fragColor = v_color;
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile error: ' + info);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Program link error: ' + info);
  }
  return program;
}

export class WebGLRenderer implements Renderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private sizeBuffer: WebGLBuffer | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private width = 0;
  private height = 0;
  private maxInstances = 0;

  // Pre-allocated CPU-side buffers (reused every frame)
  private posData: Float32Array | null = null;
  private colorData: Float32Array | null = null;
  private sizeData: Float32Array | null = null;

  // Uniform locations
  private uResolution: WebGLUniformLocation | null = null;
  private uParticleSize: WebGLUniformLocation | null = null;
  private uShape: WebGLUniformLocation | null = null;

  init(canvas: HTMLCanvasElement): void {
    // Force a fresh context by removing any existing one
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    // Clear any lost context state
    if (gl.isContextLost()) throw new Error('WebGL2 context lost');

    this.gl = gl;
    this.width = canvas.width;
    this.height = canvas.height;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    this.program = createProgram(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.useProgram(this.program);

    this.uResolution = gl.getUniformLocation(this.program, 'u_resolution');
    this.uParticleSize = gl.getUniformLocation(this.program, 'u_particleSize');
    this.uShape = gl.getUniformLocation(this.program, 'u_shape');

    // Unit quad: two triangles forming a [-0.5, 0.5] square
    const quadVerts = new Float32Array([
      -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
    ]);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // Quad geometry
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    const aQuad = gl.getAttribLocation(this.program, 'a_quad');
    gl.enableVertexAttribArray(aQuad);
    gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0);

    // Instance position buffer
    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aPos, 1);

    // Instance color buffer
    this.colorBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    const aColor = gl.getAttribLocation(this.program, 'a_color');
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aColor, 1);

    // Instance size buffer
    this.sizeBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    const aSize = gl.getAttribLocation(this.program, 'a_size');
    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aSize, 1);

    gl.bindVertexArray(null);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private ensureBufferCapacity(count: number): void {
    const gl = this.gl!;
    if (count <= this.maxInstances) return;

    this.maxInstances = count;

    // Re-allocate GPU buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
    gl.bufferData(gl.ARRAY_BUFFER, count * 2 * 4, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
    gl.bufferData(gl.ARRAY_BUFFER, count * 4 * 4, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer!);
    gl.bufferData(gl.ARRAY_BUFFER, count * 4, gl.DYNAMIC_DRAW);

    // Re-allocate CPU-side typed arrays (reused every frame)
    this.posData = new Float32Array(count * 2);
    this.colorData = new Float32Array(count * 4);
    this.sizeData = new Float32Array(count);
    this.sizeData.fill(1.0);
  }

  render(particles: ParticleData, config: ParticleConfig): void {
    const gl = this.gl!;
    if (!gl || particles.count === 0) return;

    const { count, x, y, r, g, b, a } = particles;

    this.ensureBufferCapacity(count);

    // Upload positions (interleaved x,y) — reuses pre-allocated buffer
    const posData = this.posData!;
    for (let i = 0; i < count; i++) {
      posData[i * 2] = x[i];
      posData[i * 2 + 1] = y[i];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData);

    // Upload colors — reuses pre-allocated buffer
    const colorData = this.colorData!;
    if (config.colorMode === 'mono') {
      const hex = config.monoColor;
      const mr = parseInt(hex.slice(1, 3), 16) / 255;
      const mg = parseInt(hex.slice(3, 5), 16) / 255;
      const mb = parseInt(hex.slice(5, 7), 16) / 255;
      for (let i = 0; i < count; i++) {
        colorData[i * 4] = mr;
        colorData[i * 4 + 1] = mg;
        colorData[i * 4 + 2] = mb;
        colorData[i * 4 + 3] = a[i];
      }
    } else {
      for (let i = 0; i < count; i++) {
        colorData[i * 4] = r[i];
        colorData[i * 4 + 1] = g[i];
        colorData[i * 4 + 2] = b[i];
        colorData[i * 4 + 3] = a[i];
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, colorData);

    // Upload sizes — pre-filled with 1.0 in ensureBufferCapacity
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer!);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.sizeData!);

    // Set uniforms
    gl.useProgram(this.program!);
    gl.uniform2f(this.uResolution!, this.width, this.height);
    gl.uniform1f(this.uParticleSize!, config.particleSize);
    gl.uniform1i(this.uShape!, config.particleShape === 'circle' ? 1 : 0);

    // Parse background color
    const bg = config.backgroundColor;
    const bgR = parseInt(bg.slice(1, 3), 16) / 255;
    const bgG = parseInt(bg.slice(3, 5), 16) / 255;
    const bgB = parseInt(bg.slice(5, 7), 16) / 255;

    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(bgR, bgG, bgB, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindVertexArray(this.vao!);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    gl.bindVertexArray(null);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  destroy(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.program) gl.deleteProgram(this.program);
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.sizeBuffer) gl.deleteBuffer(this.sizeBuffer);
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
    this.gl = null;
  }
}
