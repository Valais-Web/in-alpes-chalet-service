import { useEffect, useRef, useState } from "react";
import { createProgram, fitCanvas, loadTexture, prefersReducedMotion, runWhileVisible } from "./gl";

/**
 * A photo with real depth. A grayscale depth map (white = near, black = far),
 * generated from the photo itself, drives a parallax shader: the pointer (or,
 * on touch screens, a slow sway) moves the camera, so the village, the trees
 * and the peaks slide against each other. Optional cloud shadows drift over
 * the slopes in the same pass, following the same camera.
 *
 * Progressive enhancement: the plain <img> is rendered first (SSR, no JS),
 * and the canvas fades in on top only once both textures are on the GPU.
 * Reduced motion or no WebGL → the plain image stays.
 */

const FRAG = `
varying vec2 vUv;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform vec2 uCover;   // object-fit: cover scale
uniform vec2 uCam;     // smoothed camera offset, -1..1
uniform float uT;
uniform float uZoom;
uniform float uStrength;
uniform float uAspect; // canvas width / height
uniform float uWeather; // 0 none, 1 cloud shadows

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (vUv - 0.5) * uCover / uZoom + 0.5;
  vec2 o = uCam * uStrength;
  // Two-tap lookup: sample depth where the displaced pixel lands, which keeps
  // thin foreground edges (trees, roofs) from smearing.
  float d0 = texture2D(uDepth, uv).r;
  float d = texture2D(uDepth, uv + o * (d0 - 0.4)).r;
  vec2 suv = uv + o * (d - 0.4);
  vec3 col = texture2D(uImg, suv).rgb;

  if (uWeather > 0.5) {
    // Cloud shadows: noise laid on the ground plane (stretched with
    // distance, i.e. low depth) drifting across the valley. Sky is spared.
    float land = smoothstep(0.06, 0.16, d);
    vec2 g = vec2(suv.x * 2.2, suv.y * 1.2 / mix(0.35, 1.0, d));
    float c = fbm(g * 2.0 + vec2(uT * 0.045, uT * 0.012));
    float shade = smoothstep(0.5, 0.72, c) * land;
    col *= 1.0 - 0.28 * shade;
    // Sunlit gaps between clouds read a touch warmer.
    col += vec3(0.05, 0.035, 0.0) * (1.0 - shade) * land;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export type Weather = "none" | "clouds";
const WEATHER: Record<Weather, number> = { none: 0, clouds: 1 };

export function DepthPhoto({
  src,
  depthSrc,
  alt = "",
  weather = "none",
  strength = 0.03,
  drift = true,
  className = "",
  imgClassName = "",
  canvasClassName = "",
}: {
  src: string;
  depthSrc: string;
  alt?: string;
  weather?: Weather;
  /** Max UV displacement at full pointer travel. */
  strength?: number;
  /** Slow ambient push-in (replaces the CSS Ken Burns once WebGL is live). */
  drift?: boolean;
  className?: string;
  imgClassName?: string;
  canvasClassName?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv || prefersReducedMotion()) return;
    const prog = createProgram(cv, FRAG);
    if (!prog) return;
    const { gl, uniform, draw } = prog;

    let disposed = false;
    let stop = () => {};
    const target = { x: 0, y: 0 };
    const cam = { x: 0, y: 0 };
    let pointerSeen = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      pointerSeen = true;
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    Promise.all([loadTexture(gl, src, 0), loadTexture(gl, depthSrc, 1)])
      .then(([img]) => {
        if (disposed) return;
        gl.uniform1i(uniform("uImg"), 0);
        gl.uniform1i(uniform("uDepth"), 1);
        gl.uniform1f(uniform("uStrength"), strength);
        gl.uniform1f(uniform("uWeather"), WEATHER[weather]);
        const imgAspect = img.naturalWidth / img.naturalHeight;

        stop = runWhileVisible(el, (t) => {
          fitCanvas(cv, gl, 1.5);
          const aspect = cv.width / cv.height;
          // cover: shrink the UV range on the axis that overflows
          const cover = aspect > imgAspect ? [1, imgAspect / aspect] : [aspect / imgAspect, 1];
          gl.uniform2f(uniform("uCover"), cover[0], cover[1]);
          gl.uniform1f(uniform("uAspect"), aspect);

          // Touch / no pointer yet: a slow figure-eight sway keeps the relief readable.
          if (!pointerSeen) {
            target.x = Math.sin(t * 0.25) * 0.6;
            target.y = Math.sin(t * 0.5) * 0.25;
          }
          // Scrolling the hero away tilts the camera down into the valley.
          const r = el.getBoundingClientRect();
          const scrolled = Math.min(Math.max(-r.top / r.height, 0), 1);
          cam.x += (target.x - cam.x) * 0.05;
          cam.y += (target.y + scrolled * 1.2 - cam.y) * 0.05;
          gl.uniform2f(uniform("uCam"), cam.x, cam.y);
          gl.uniform1f(uniform("uT"), t);
          // Same curve as the CSS Ken Burns it replaces: 1.06 → 1.16 over 24s, ease-out.
          const k = drift ? 1 - Math.pow(1 - Math.min(t / 24, 1), 3) : 0;
          gl.uniform1f(uniform("uZoom"), 1.06 + 0.1 * k);
          draw();
        });
        setLive(true);
      })
      .catch(() => {
        /* texture failed (offline, CORS): the plain image stays */
      });

    return () => {
      disposed = true;
      stop();
      window.removeEventListener("pointermove", onMove);
      prog.dispose();
    };
  }, [src, depthSrc, weather, strength, drift]);

  return (
    <div ref={wrap} className={"relative overflow-hidden " + className}>
      <img src={src} alt={alt} aria-hidden={alt ? undefined : true} className={imgClassName} />
      <canvas
        ref={canvas}
        aria-hidden
        className={
          "absolute inset-0 h-full w-full transition-opacity duration-700 " +
          (live ? "opacity-100 " : "opacity-0 ") +
          canvasClassName
        }
      />
    </div>
  );
}
