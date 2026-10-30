/**
 * Minimal WebGL helpers for the decorative canvases (hero relief, topo field,
 * skyline). No library: one full-screen triangle, one fragment shader, a few
 * textures. Every caller treats a null return as "no WebGL" and keeps its
 * plain fallback, so nothing here is on the critical path.
 */

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() {
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

export type GLProgram = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniform: (name: string) => WebGLUniformLocation | null;
  draw: () => void;
  dispose: () => void;
};

export function createProgram(canvas: HTMLCanvasElement, frag: string): GLProgram | null {
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    antialias: false,
    alpha: true,
  });
  if (!gl) return null;
  // Contour lines need fwidth(); every WebGL1 implementation in use ships it.
  const derivatives = gl.getExtension("OES_standard_derivatives");
  const header = derivatives ? "#extension GL_OES_standard_derivatives : enable\n" : "";

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("[gl] shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, header + "precision mediump float;\n" + frag);
  if (!vs || !fs) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One oversized triangle covers the viewport with three vertices.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    gl,
    program,
    uniform: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
      return cache.get(name)!;
    },
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
    // Free GL objects but keep the context: a canvas has only one, and React
    // (StrictMode, fast refresh) may mount the same canvas again.
    dispose: () => {
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

/** Loads a CORS-enabled image (Cloudinary sends ACAO *) into texture `unit`. */
export function loadTexture(
  gl: WebGLRenderingContext,
  src: string,
  unit: number,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      // NPOT-safe sampling (WebGL1): clamp + linear, no mipmaps.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Resizes the drawing buffer to the element's CSS box (DPR capped at 2). */
export function fitCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Runs `frame(t)` on rAF only while `el` is on screen and the tab is visible.
 * Returns a stop function.
 */
export function runWhileVisible(el: Element, frame: (t: number) => void): () => void {
  let raf = 0;
  let visible = false;
  const start = performance.now();
  const loop = (now: number) => {
    frame((now - start) / 1000);
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  });
  io.observe(el);
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}
