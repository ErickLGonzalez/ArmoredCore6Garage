"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Color, Vector3 } from "three";

import type { GarageBuildIds } from "@/lib/garage/default-assembly";
import type { CanonicalPart } from "@/lib/schema";

type Props = {
  partsById: Map<number, CanonicalPart>;
  build: GarageBuildIds;
};

type ViewerSlot =
  | "head"
  | "core"
  | "arms"
  | "legs"
  | "rightArm"
  | "leftArm"
  | "rightBack"
  | "leftBack";

type SlotPlacement = {
  slot: ViewerSlot;
  id: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

function slotFolder(slot: ViewerSlot): string {
  return {
    head: "head",
    core: "core",
    arms: "arms",
    legs: "legs",
    rightArm: "right-arm",
    leftArm: "left-arm",
    rightBack: "right-back",
    leftBack: "left-back",
  }[slot];
}

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function modelCandidates(slot: ViewerSlot, id: number, partName: string): string[] {
  const folder = slotFolder(slot);
  const s = slug(partName);
  return [
    `/models/parts/${folder}/${id}.glb`,
    `/models/parts/${folder}/${s}.glb`,
    `/models/parts/${folder}/default.glb`,
  ];
}

function colorFromId(id: number) {
  const hue = Math.abs(id * 29) % 360;
  return `hsl(${hue} 56% 46%)`;
}

function FallbackPart({
  position,
  rotation,
  color,
  scale = [1, 1, 1],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  scale?: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <boxGeometry args={[0.46, 0.46, 0.46]} />
      <meshStandardMaterial
        color={color}
        metalness={0.2}
        roughness={0.7}
      />
    </mesh>
  );
}

function GltfPart({
  url,
  position,
  rotation,
  scale = [1, 1, 1],
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  useEffect(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
    const normalize = 0.9 / maxAxis;
    scene.scale.setScalar(normalize);
    scene.position.set(0, 0, 0);
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

function SlotAssembler({
  slots,
  modelMap,
}: {
  slots: SlotPlacement[];
  modelMap: Map<string, string>;
}) {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.05, 0]}
      >
        <circleGeometry args={[2.3, 48]} />
        <meshStandardMaterial
          color={new Color("#0f2d45")}
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>
      {slots.map((s) => {
        const key = `${s.slot}:${s.id}`;
        const url = modelMap.get(key);
        if (url) {
          return (
            <Suspense fallback={null} key={key}>
              <GltfPart
                url={url}
                position={s.position}
                rotation={s.rotation}
                scale={s.scale}
              />
            </Suspense>
          );
        }
        return (
          <FallbackPart
            key={key}
            position={s.position}
            rotation={s.rotation}
            scale={s.scale}
            color={colorFromId(s.id)}
          />
        );
      })}
    </group>
  );
}

export function MechViewerCanvas({ partsById, build }: Props) {
  const slots = useMemo<SlotPlacement[]>(
    () => [
      { slot: "head", id: build.head, position: [0, 0.9, 0] },
      { slot: "core", id: build.core, position: [0, 0.25, 0], scale: [1.2, 1.4, 1] },
      { slot: "arms", id: build.arms, position: [0, 0.25, 0], scale: [1.1, 1.1, 1.1] },
      { slot: "legs", id: build.legs, position: [0, -0.5, 0], scale: [1.15, 1.4, 1.15] },
      { slot: "rightArm", id: build.rightArm, position: [0.86, 0.24, 0], scale: [0.8, 0.8, 1.35] },
      { slot: "leftArm", id: build.leftArm, position: [-0.86, 0.24, 0], scale: [0.8, 0.8, 1.35] },
      { slot: "rightBack", id: build.rightBack, position: [0.72, 0.72, -0.35], scale: [0.95, 0.95, 1.2] },
      { slot: "leftBack", id: build.leftBack, position: [-0.72, 0.72, -0.35], scale: [0.95, 0.95, 1.2] },
    ],
    [build],
  );

  const [modelMap, setModelMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const checks = await Promise.all(
        slots.map(async (s) => {
          const partName = partsById.get(s.id)?.identity.name ?? String(s.id);
          const candidates = modelCandidates(s.slot, s.id, partName);
          for (const c of candidates) {
            try {
              const res = await fetch(c, { method: "HEAD" });
              if (res.ok) return [`${s.slot}:${s.id}`, c] as const;
            } catch {
              // keep searching fallbacks
            }
          }
          return null;
        }),
      );
      if (cancelled) return;
      const next = new Map<string, string>();
      for (const item of checks) {
        if (item) next.set(item[0], item[1]);
      }
      setModelMap(next);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [slots, partsById]);

  const loadedCount = modelMap.size;
  return (
    <div className="space-y-2 rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">3D Viewer</h3>
      <p className="text-[11px] text-cyan-200/75">
        GLTF slot assembler active ({loadedCount}/8 slot models found). Missing slots fall back to debug geometry.
      </p>
      <div className="h-[460px] w-full overflow-hidden rounded border border-cyan-300/20 bg-[#0b2032]">
        <Canvas camera={{ position: [2.3, 1.7, 2.6], fov: 42 }}>
          <ambientLight intensity={0.42} />
          <directionalLight
            intensity={1.1}
            position={[3, 5, 2]}
          />
          <directionalLight
            intensity={0.4}
            position={[-3, 2, -2]}
          />
          <Suspense fallback={null}>
            <SlotAssembler
              slots={slots}
              modelMap={modelMap}
            />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={1.9}
            maxDistance={5.4}
            target={[0, 0.22, 0]}
          />
        </Canvas>
      </div>
    </div>
  );
}
