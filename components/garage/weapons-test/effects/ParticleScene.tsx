"use client";

import { useEffect, useRef, useState } from "react";

import type { WeaponTestEvent } from "@/lib/garage/weapons-test/types";

import { presetForFamily } from "./effectsRegistry";

type FreeParticle = {
  kind: "free";
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

type ArcMissile = {
  kind: "arc";
  id: string;
  u: number;
  du: number;
  life: number;
  color: string;
  size: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
};

type VisualParticle = FreeParticle | ArcMissile;

type Props = {
  events: WeaponTestEvent[];
  quality: "off" | "low" | "high";
  /** Multiplies particle integration speed (sync with sim time scale). */
  visualTimeScale?: number;
  className?: string;
};

let seq = 0;

function bezier2(
  u: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const s = 1 - u;
  return {
    x: s * s * ax + 2 * s * u * bx + u * u * cx,
    y: s * s * ay + 2 * s * u * by + u * u * cy,
  };
}

export function ParticleScene({
  events,
  quality,
  visualTimeScale = 1,
  className,
}: Props) {
  const [particles, setParticles] = useState<VisualParticle[]>([]);
  const lastSeenRef = useRef(0);

  useEffect(() => {
    if (quality === "off") {
      setParticles([]);
      return;
    }
    if (events.length === 0) {
      lastSeenRef.current = 0;
      setParticles([]);
      return;
    }
    const newParts: VisualParticle[] = [];
    for (let i = lastSeenRef.current; i < events.length; i++) {
      const e = events[i]!;
      if (e.type === "weapon_fired") {
        const p = presetForFamily(e.family);
        if (e.family === "explosive") {
          const du = quality === "high" ? 0.95 : 0.78;
          newParts.push({
            kind: "arc",
            id: `arc-${++seq}`,
            u: 0,
            du,
            life: 1.35,
            color: p.trail,
            size: quality === "high" ? 4 : 3.2,
            ax: 20,
            ay: 46,
            bx: 52 + (Math.random() - 0.5) * 6,
            by: 18 + Math.random() * 8,
            cx: 80,
            cy: 46 + (Math.random() - 0.5) * 6,
          });
          const trailN = quality === "high" ? 5 : 3;
          for (let k = 0; k < trailN; k++) {
            const ang = (Math.PI * 2 * k) / trailN;
            newParts.push({
              kind: "free",
              id: `m-${++seq}`,
              x: 18 + Math.random() * 8,
              y: 44 + Math.random() * 8,
              vx: Math.cos(ang) * 1.8,
              vy: Math.sin(ang) * 0.5,
              life: 0.35,
              color: p.muzzle,
              size: 2.2,
            });
          }
        } else if (e.family === "laser") {
          const bolts = quality === "high" ? 6 : 3;
          for (let k = 0; k < bolts; k++) {
            newParts.push({
              kind: "free",
              id: `lz-${++seq}`,
              x: 16 + k * 3,
              y: 44 + (Math.random() - 0.5) * 4,
              vx: 14 + Math.random() * 4,
              vy: (Math.random() - 0.5) * 0.6,
              life: 0.28,
              color: p.trail,
              size: quality === "high" ? 2.8 : 2,
            });
          }
        } else {
          const n = quality === "high" ? 10 : 5;
          for (let k = 0; k < n; k++) {
            const ang = (Math.PI * 2 * k) / n + Math.random() * 0.4;
            const sp = 1.2 + Math.random() * 2.4;
            newParts.push({
              kind: "free",
              id: `m-${++seq}`,
              x: 18 + Math.random() * 8,
              y: 42 + Math.random() * 10,
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp * 0.35,
              life: 0.45 + Math.random() * 0.2,
              color: p.muzzle,
              size: quality === "high" ? 3.2 : 2.4,
            });
          }
        }
      }
      if (e.type === "projectile_impact") {
        const p = presetForFamily(e.family);
        const n = quality === "high" ? 14 : 7;
        for (let k = 0; k < n; k++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 0.8 + Math.random() * 3.2;
          newParts.push({
            kind: "free",
            id: `i-${++seq}`,
            x: 78 + Math.random() * 10,
            y: 44 + Math.random() * 12,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            life: 0.35 + Math.random() * 0.35,
            color: k % 3 === 0 ? p.impact : p.spark,
            size: quality === "high" ? 3.8 : 2.8,
          });
        }
      }
    }
    lastSeenRef.current = events.length;
    if (newParts.length) {
      setParticles((prev) => [...prev, ...newParts].slice(-140));
    }
  }, [events, quality]);

  useEffect(() => {
    if (quality === "off") return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt =
        Math.min(0.05, (now - prev) / 1000) *
        Math.max(0.15, visualTimeScale);
      prev = now;
      setParticles((prevP) =>
        prevP
          .map((p) => {
            if (p.kind === "arc") {
              const u = Math.min(1, p.u + p.du * dt);
              const life = p.life - dt;
              return { ...p, u, life };
            }
            return {
              ...p,
              x: p.x + p.vx * dt * 28,
              y: p.y + p.vy * dt * 28,
              life: p.life - dt,
              vy: p.vy + 12 * dt,
            };
          })
          .filter((p) => p.life > 0 && (p.kind !== "arc" || p.u < 1)),
      );
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [quality, visualTimeScale]);

  if (quality === "off") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      {particles.map((p) => {
        if (p.kind === "arc") {
          const pos = bezier2(
            Math.min(1, p.u),
            p.ax,
            p.ay,
            p.bx,
            p.by,
            p.cx,
            p.cy,
          );
          return (
            <span
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                opacity: Math.min(1, p.life * 0.9),
              }}
            />
          );
        }
        return (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              opacity: Math.min(1, p.life * 3),
            }}
          />
        );
      })}
    </div>
  );
}
