"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { BacklightCanvas } from "@/components/backlight-canvas";

/**
 * The Living Light 2.0: a WebGL light field behind the hero. Two or three
 * Signal-Blue light sources drift on slow, offset periods through a faint
 * noise field, with a small pointer parallax on fine pointers. Still a light
 * source, not decoration: low wattage, behind real imagery, one dominant
 * light per viewport.
 *
 * Fallback ladder (DESIGN.md §6): WebGL → canvas-2D breathing glow
 * (BacklightCanvas) → static .backlight. Reduced motion skips straight to
 * static. Single draw call, DPR capped at 1.5, paused offscreen and on
 * hidden tabs. Dithered to kill banding on the near-black canvas.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_boost;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float blob(vec2 p, vec2 c, float r) {
  float d = length(p - c);
  return exp(-(d * d) / (r * r));
}

void main() {
  float aspect = u_res.x / u_res.y;
  vec2 p = gl_FragCoord.xy / u_res;
  p.x *= aspect;

  float t = u_time;

  vec2 c1 = vec2(0.60 + 0.10 * sin(t * 0.11), 0.56 + 0.08 * sin(t * 0.07 + 1.7));
  vec2 c2 = vec2(0.36 + 0.12 * sin(t * 0.05 + 4.0), 0.40 + 0.10 * cos(t * 0.09));
  vec2 c3 = vec2(0.52 + 0.15 * cos(t * 0.04 + 2.2), 0.74 + 0.09 * sin(t * 0.06 + 0.6));
  c1.x *= aspect;
  c2.x *= aspect;
  c3.x *= aspect;
  c1 += u_pointer * 0.08;

  float l = 0.0;
  l += blob(p, c1, 0.44) * 0.55;
  l += blob(p, c2, 0.58) * 0.34;
  l += blob(p, c3, 0.40) * 0.30;

  float n = noise(p * 2.4 + vec2(t * 0.03, -t * 0.02));
  l *= 0.82 + 0.18 * n;
  l *= 0.16 + 0.05 * u_boost;

  float dither = (hash(gl_FragCoord.xy + fract(t)) - 0.5) * (3.0 / 255.0);
  l = max(l + dither, 0.0);

  vec3 blue = vec3(45.0, 140.0, 255.0) / 255.0;
  gl_FragColor = vec4(blue * l, l);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function LightField({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tier, setTier] = useState<"webgl" | "canvas2d">("webgl");

  useEffect(() => {
    if (reduceMotion || tier !== "webgl") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      setTier("canvas2d");
      return;
    }

    const vert = compile(gl, gl.VERTEX_SHADER, VERT);
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vert || !frag || !program) {
      setTier("canvas2d");
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setTier("canvas2d");
      return;
    }
    gl.useProgram(program);

    // One fullscreen triangle: fewer vertices than a quad, no index buffer.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uPointer = gl.getUniformLocation(program, "u_pointer");
    const uBoost = gl.getUniformLocation(program, "u_boost");

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden && raf === 0) {
          raf = requestAnimationFrame(draw);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden && visible && raf === 0) {
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pointer parallax, eased on the JS side so the field settles, not snaps.
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, boost: 0, tboost: 0 };
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const inside =
        event.clientX > rect.left - rect.width * 0.2 &&
        event.clientX < rect.right + rect.width * 0.2 &&
        event.clientY > rect.top - rect.height * 0.2 &&
        event.clientY < rect.bottom + rect.height * 0.2;
      pointer.tboost = inside ? 1 : 0;
      if (inside) {
        pointer.tx = (event.clientX - rect.left) / rect.width - 0.5;
        pointer.ty = 0.5 - (event.clientY - rect.top) / rect.height;
      }
    };
    if (finePointer) window.addEventListener("pointermove", onPointerMove);

    const start = performance.now() - Math.random() * 40000;

    const draw = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      pointer.boost += (pointer.tboost - pointer.boost) * 0.04;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uBoost, pointer.boost);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setTier("canvas2d");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (finePointer) window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buffer);
    };
  }, [reduceMotion, tier]);

  // Reduced motion: BacklightCanvas renders its static .backlight fallback.
  if (reduceMotion || tier === "canvas2d") {
    return <BacklightCanvas className={className} />;
  }

  return (
    <div aria-hidden className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
