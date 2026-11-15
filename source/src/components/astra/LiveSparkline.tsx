import { useEffect, useRef } from "react";

import type { CardKey } from "./healthCards";

/**
 * Streaming waveform that scrolls like a hospital monitor.
 * Drawn on a canvas; new samples arrive on the right and flow left.
 * Falls back to a single static trace when reduced motion is preferred.
 */

type WaveShape = "ecg" | "pulse" | "sine" | "drift";

const SHAPE_BY_KEY: Record<CardKey, WaveShape> = {
  hr: "ecg",
  rhr: "ecg",
  bp: "pulse",
  spo2: "sine",
  activity: "drift",
  exercise: "drift",
  sleep: "sine",
  water: "drift",
  temp: "sine",
  radiation: "drift",
  co2: "sine",
  gravity: "sine",
};

// Deterministic pseudo-random so the trace looks organic but stable per card.
function noise(t: number, seed: number): number {
  return (
    Math.sin(t * 1.7 + seed) * 0.5 +
    Math.sin(t * 3.1 + seed * 2.3) * 0.3 +
    Math.sin(t * 7.9 + seed * 4.1) * 0.2
  );
}

// Value in roughly [-1, 1] for a given point in the waveform cycle.
function waveSample(shape: WaveShape, phase: number, t: number, seed: number): number {
  const p = phase % 1;
  switch (shape) {
    case "ecg": {
      // P-QRS-T complex: small bump, sharp spike, recovery bump.
      const pWave = 0.18 * Math.exp(-(((p - 0.18) / 0.05) ** 2));
      const qrs =
        p > 0.3 && p < 0.36
          ? -0.35 * Math.sin(((p - 0.3) / 0.06) * Math.PI)
          : p >= 0.36 && p < 0.44
            ? Math.sin(((p - 0.36) / 0.08) * Math.PI)
            : 0;
      const tWave = 0.3 * Math.exp(-(((p - 0.62) / 0.08) ** 2));
      return pWave + qrs + tWave + noise(t, seed) * 0.06;
    }
    case "pulse": {
      // Arterial pressure wave: fast rise, dicrotic notch, slow decay.
      const rise = Math.exp(-(((p - 0.12) / 0.09) ** 2));
      const notch = 0.3 * Math.exp(-(((p - 0.38) / 0.06) ** 2));
      return rise + notch - 0.15 + noise(t, seed) * 0.05;
    }
    case "sine":
      return Math.sin(p * Math.PI * 2) * 0.55 + noise(t, seed) * 0.08;
    case "drift":
    default:
      return noise(t, seed) * 0.6;
  }
}

export function LiveSparkline({
  cardKey,
  color = "var(--primary)",
  height = 48,
}: {
  cardKey: CardKey;
  color?: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const shape = SHAPE_BY_KEY[cardKey] ?? "drift";
    const seed = [...cardKey].reduce((a, c) => a + c.charCodeAt(0), 0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cssColor = getComputedStyle(canvas).getPropertyValue("--primary");
    const stroke = color.startsWith("var(")
      ? (getComputedStyle(document.documentElement).getPropertyValue(color.slice(4, -1).trim()) || cssColor).trim()
      : color;

    let raf = 0;
    let width = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.round(height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mid = height / 2;
    const amp = height * 0.36;
    // Samples per second and pixels per second control the flow speed.
    const pxPerSec = 42;
    const samplesPerPx = 1 / 3;

    let phase = 0;
    let t = 0;
    let last = performance.now();
    // Rolling buffer of y positions; redrawn each frame so the trace stays crisp.
    const points: number[] = [];

    const drawBackground = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
    };

    if (reduced) {
      // Static single trace across the width.
      drawBackground();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const steps = Math.max(2, Math.floor(width));
      for (let i = 0; i <= steps; i++) {
        const y = mid - waveSample(shape, (i / steps) * 3, i / 40, seed) * amp;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      return () => ro.disconnect();
    }

    drawBackground();
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      t += dt;
      phase += dt * (shape === "ecg" ? 1.1 : shape === "pulse" ? 1.2 : 0.5);

      const advance = pxPerSec * dt;
      const steps = Math.max(1, Math.round(advance * samplesPerPx));

      // Append new samples at the leading edge.
      for (let i = 1; i <= steps; i++) {
        const frac = i / steps;
        points.push(mid - waveSample(shape, phase - (1 - frac) * dt * 1.1, t, seed) * amp);
      }
      // Keep only what fits on screen; the rest has scrolled off.
      const capacity = Math.ceil(width * samplesPerPx) + 2;
      if (points.length > capacity) points.splice(0, points.length - capacity);

      // Redraw the whole trace from the buffer so it stays crisp.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const step = 1 / samplesPerPx;
      const x0 = width - 2 - (points.length - 1) * step;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const px = x0 + i * step;
        if (i === 0) ctx.moveTo(px, points[i]);
        else ctx.lineTo(px, points[i]);
      }
      ctx.stroke();

      // Glowing leading dot.
      const lastY = points[points.length - 1];
      ctx.fillStyle = stroke;
      ctx.beginPath();
      ctx.arc(width - 2, lastY, 2, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [cardKey, color, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className="w-full"
      role="img"
      aria-label="Live streaming measurement graph"
    />
  );
}
