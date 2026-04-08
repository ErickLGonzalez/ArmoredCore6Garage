"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GarageBuildIds } from "@/lib/garage/default-assembly";
import type { CanonicalPart } from "@/lib/schema";

type Props = {
  partsById: Map<number, CanonicalPart>;
  build: GarageBuildIds;
};

type Vec3 = { x: number; y: number; z: number };
type Cuboid = { c: Vec3; s: Vec3; color: string; label: string };

function colorFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 55% 45%)`;
}

function rotateY(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotateX(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function project(p: Vec3, w: number, h: number) {
  const d = 6.5;
  const z = p.z + d;
  const k = 180 / Math.max(1, z);
  return { x: w / 2 + p.x * k, y: h / 2 - p.y * k, z };
}

function cuboidFaces(c: Cuboid) {
  const { x, y, z } = c.c;
  const { x: sx, y: sy, z: sz } = c.s;
  const v: Vec3[] = [
    { x: x - sx, y: y - sy, z: z - sz },
    { x: x + sx, y: y - sy, z: z - sz },
    { x: x + sx, y: y + sy, z: z - sz },
    { x: x - sx, y: y + sy, z: z - sz },
    { x: x - sx, y: y - sy, z: z + sz },
    { x: x + sx, y: y - sy, z: z + sz },
    { x: x + sx, y: y + sy, z: z + sz },
    { x: x - sx, y: y + sy, z: z + sz },
  ];
  return [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [1, 2, 6, 5],
    [0, 3, 7, 4],
  ].map((idx) => idx.map((i) => v[i]!));
}

export function MechViewerCanvas({ partsById, build }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const [yaw, setYaw] = useState(-0.4);
  const [pitch, setPitch] = useState(-0.15);

  const blocks = useMemo<Cuboid[]>(() => {
    const getName = (id: number) => partsById.get(id)?.identity.name ?? String(id);
    return [
      { c: { x: 0, y: 1.55, z: 0 }, s: { x: 0.45, y: 0.28, z: 0.35 }, color: colorFromName(getName(build.head)), label: "HEAD" },
      { c: { x: 0, y: 0.8, z: 0 }, s: { x: 0.75, y: 0.55, z: 0.45 }, color: colorFromName(getName(build.core)), label: "CORE" },
      { c: { x: -1.05, y: 0.8, z: 0 }, s: { x: 0.25, y: 0.6, z: 0.24 }, color: colorFromName(getName(build.leftArm)), label: "L-ARM" },
      { c: { x: 1.05, y: 0.8, z: 0 }, s: { x: 0.25, y: 0.6, z: 0.24 }, color: colorFromName(getName(build.rightArm)), label: "R-ARM" },
      { c: { x: -0.4, y: -0.35, z: 0 }, s: { x: 0.35, y: 0.8, z: 0.35 }, color: colorFromName(getName(build.legs)), label: "LEGS-L" },
      { c: { x: 0.4, y: -0.35, z: 0 }, s: { x: 0.35, y: 0.8, z: 0.35 }, color: colorFromName(getName(build.legs)), label: "LEGS-R" },
      { c: { x: -1.05, y: 1.35, z: -0.45 }, s: { x: 0.25, y: 0.22, z: 0.35 }, color: colorFromName(getName(build.leftBack)), label: "L-BACK" },
      { c: { x: 1.05, y: 1.35, z: -0.45 }, s: { x: 0.25, y: 0.22, z: 0.35 }, color: colorFromName(getName(build.rightBack)), label: "R-BACK" },
    ];
  }, [build, partsById]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let auto = true;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "#0a1d2e";
      ctx.fillRect(0, 0, w, h);

      const drawFaces: {
        depth: number;
        pts: { x: number; y: number; z: number }[];
        color: string;
      }[] = [];

      for (const b of blocks) {
        for (const face of cuboidFaces(b)) {
          const rotated = face.map((p) => rotateX(rotateY(p, yaw), pitch));
          const pts = rotated.map((p) => project(p, w, h));
          const depth = pts.reduce((s, p) => s + p.z, 0) / pts.length;
          drawFaces.push({ depth, pts, color: b.color });
        }
      }
      drawFaces.sort((a, b) => b.depth - a.depth);

      for (const f of drawFaces) {
        ctx.beginPath();
        ctx.moveTo(f.pts[0]!.x, f.pts[0]!.y);
        for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i]!.x, f.pts[i]!.y);
        ctx.closePath();
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.88;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(80,210,255,0.28)";
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(180,238,255,0.8)";
      ctx.font = "12px monospace";
      ctx.fillText("Drag to rotate", 12, h - 12);
    };

    const tick = () => {
      if (auto && !draggingRef.current) setYaw((v) => v + 0.004);
      draw();
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      auto = false;
      lastRef.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      draggingRef.current = false;
      canvas.releasePointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      setYaw((v) => v + dx * 0.01);
      setPitch((v) => Math.max(-1.2, Math.min(1.2, v + dy * 0.01)));
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointermove", onMove);

    return () => {
      window.cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [blocks, pitch, yaw]);

  return (
    <div className="space-y-2 rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">3D Viewer</h3>
      <canvas ref={canvasRef} className="h-[420px] w-full rounded border border-cyan-300/20 bg-[#0b2032]" />
    </div>
  );
}
