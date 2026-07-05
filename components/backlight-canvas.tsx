"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The Living Light: a Signal-Blue radial glow rendered on a 2D canvas behind
 * the hero device, slowly breathing (intensity + radius) and drifting a few px.
 * It is a sanctioned light source, not decoration: it backlights a real device,
 * stays one-per-viewport, and never becomes paint, text, or a border.
 *
 * Single rAF loop, paused when scrolled offscreen. Reduced motion or a missing
 * 2D context falls back to the static CSS `.backlight`. Canvas 2D (not WebGL):
 * a breathing radial needs no shader and stays trivially at 60fps.
 */
export function BacklightCanvas({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSupported(false);
      return;
    }

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && raf === 0) raf = requestAnimationFrame(draw);
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      raf = 0;
      if (!visible) return;

      const t = (now - start) / 1000;
      // Slow breathing on ~8s and ~11s periods so it never feels mechanical.
      const pulse = Math.sin((t / 8) * Math.PI * 2);
      const drift = Math.sin((t / 11) * Math.PI * 2);

      const cx = width * (0.5 + drift * 0.04);
      const cy = height * (0.5 + pulse * 0.03);
      const minSide = Math.min(width, height);
      const radius = minSide * (0.62 + pulse * 0.08);
      const alpha = 0.13 + pulse * 0.05; // 0.08 .. 0.18

      ctx.clearRect(0, 0, width, height);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, `rgba(45, 140, 255, ${alpha.toFixed(3)})`);
      g.addColorStop(0.55, `rgba(45, 140, 255, ${(alpha * 0.4).toFixed(3)})`);
      g.addColorStop(1, "rgba(45, 140, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduceMotion]);

  if (reduceMotion || !supported) {
    return <div aria-hidden className={`backlight ${className ?? ""}`} />;
  }

  // The canvas is a replaced element and won't stretch to inset-based sizing,
  // so an absolutely-positioned wrapper carries the layout and the canvas fills
  // it. resize() then reads the wrapper's true dimensions.
  return (
    <div aria-hidden className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
