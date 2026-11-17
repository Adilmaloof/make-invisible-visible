'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { productById, productTotals, type Stage } from '@/lib/supply-chains';
import { useVestige } from '@/lib/store';
import type { ProductId } from '@/lib/types';

const DEG = Math.PI / 180;
const GLOBE_R = 1.65;

function latLngToVec3(lat: number, lng: number, radius = GLOBE_R): THREE.Vector3 {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function SupplyGlobeMesh({
  stages,
  color,
  activeStage,
  onSelectStage,
}: {
  stages: Stage[];
  color: string;
  activeStage: number;
  onSelectStage: (idx: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const travelerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const drag = useRef({ down: false, lastX: 0, lastY: 0, velX: 0.0035, rotX: 0.18 });

  const stageVecs = useMemo(() => stages.map((s) => latLngToVec3(s.lat, s.lng, GLOBE_R)), [stages]);

  const curves = useMemo(() => {
    const out: THREE.QuadraticBezierCurve3[] = [];
    for (let i = 0; i < stageVecs.length - 1; i++) {
      const a = stageVecs[i];
      const b = stageVecs[i + 1];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dist = a.distanceTo(b);
      mid.normalize().multiplyScalar(GLOBE_R + 0.28 + dist * 0.22);
      out.push(new THREE.QuadraticBezierCurve3(a, mid, b));
    }
    return out;
  }, [stageVecs]);

  const tubeGeometries = useMemo(
    () => curves.map((c) => new THREE.TubeGeometry(c, 44, 0.014, 8, false)),
    [curves],
  );

  // Graticule lines
  const graticuleGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lng = -180; lng < 180; lng += 6) {
        pts.push(latLngToVec3(lat, lng, GLOBE_R + 0.003));
        pts.push(latLngToVec3(lat, lng + 6, GLOBE_R + 0.003));
      }
    }
    for (let lng = -180; lng < 180; lng += 30) {
      for (let lat = -75; lat < 75; lat += 6) {
        pts.push(latLngToVec3(lat, lng, GLOBE_R + 0.003));
        pts.push(latLngToVec3(lat + 6, lng, GLOBE_R + 0.003));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      if (!drag.current.down) {
        groupRef.current.rotation.y += drag.current.velX;
        drag.current.velX += (0.0035 - drag.current.velX) * 0.04;
      }
      groupRef.current.rotation.x = drag.current.rotX;
    }

    // Animate pulses on stage nodes
    pulseRefs.current.forEach((m, idx) => {
      if (!m) return;
      const isAct = idx === activeStage;
      const s = isAct ? 1.4 + Math.sin(t * 4) * 0.45 : 1 + Math.sin(t * 2 + idx) * 0.2;
      m.scale.setScalar(s);
    });

    // Animate supply-chain traveler packets along each arc
    travelerRefs.current.forEach((m, idx) => {
      const curve = curves[idx];
      if (!m || !curve) return;
      const u = (t * 0.38 + idx * 0.23) % 1;
      const pos = curve.getPoint(u);
      m.position.copy(pos);
    });
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        drag.current.down = true;
        drag.current.lastX = e.clientX;
        drag.current.lastY = e.clientY;
      }}
      onPointerUp={() => {
        drag.current.down = false;
      }}
      onPointerOut={() => {
        drag.current.down = false;
      }}
      onPointerMove={(e) => {
        if (!drag.current.down || !groupRef.current) return;
        const dx = e.clientX - drag.current.lastX;
        const dy = e.clientY - drag.current.lastY;
        drag.current.lastX = e.clientX;
        drag.current.lastY = e.clientY;
        groupRef.current.rotation.y += dx * 0.007;
        drag.current.rotX = Math.max(-0.6, Math.min(0.6, drag.current.rotX + dy * 0.005));
        drag.current.velX = dx * 0.001;
      }}
    >
      {/* Core obsidian sphere */}
      <mesh>
        <sphereGeometry args={[GLOBE_R, 48, 48]} />
        <meshStandardMaterial color="#070b14" roughness={0.65} metalness={0.35} />
      </mesh>

      {/* Atmospheric outer halo */}
      <mesh scale={1.06}>
        <sphereGeometry args={[GLOBE_R, 36, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>

      {/* Graticule wireframe */}
      <lineSegments geometry={graticuleGeo}>
        <lineBasicMaterial color={color} transparent opacity={0.16} />
      </lineSegments>

      {/* Glowing supply-chain arcs */}
      {tubeGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial color={color} transparent opacity={i === activeStage || i + 1 === activeStage ? 0.92 : 0.45} />
        </mesh>
      ))}

      {/* Traveler particles along each supply chain leg */}
      {curves.map((_, i) => (
        <mesh
          key={`traveler-${i}`}
          ref={(el) => {
            travelerRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Stage beacons */}
      {stageVecs.map((pos, i) => {
        const isAct = i === activeStage;
        return (
          <group key={i} position={pos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectStage(i);
              }}
            >
              <sphereGeometry args={[isAct ? 0.065 : 0.045, 16, 16]} />
              <meshBasicMaterial color={isAct ? '#ffffff' : color} />
            </mesh>
            <mesh
              ref={(el) => {
                pulseRefs.current[i] = el;
              }}
            >
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={isAct ? 0.45 : 0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function GlobeScene({ productId }: { productId: ProductId }) {
  const exploreProduct = useVestige((s) => s.exploreProduct);
  const explored = useVestige((s) => s.effort.explored);
  const product = productById(productId);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    setActiveStage(0);
    if (!explored.includes(productId)) {
      const t = productTotals(product);
      exploreProduct(productId, t.people, t.minutes);
    }
  }, [productId, product, exploreProduct, explored]);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % product.stages.length);
    }, 3200);
    return () => clearInterval(id);
  }, [product.stages.length]);

  const currentStage = product.stages[activeStage] ?? product.stages[0];

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6 overflow-hidden space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-semibold text-slate-200 text-sm">3D Supply Chain Globe</h3>
          <p className="text-xs text-slate-500">Drag to rotate · Click any glowing relay node</p>
        </div>
        <div className="flex items-center gap-1.5">
          {product.stages.map((s, idx) => (
            <button
              key={s.role}
              onClick={() => setActiveStage(idx)}
              className="px-2.5 py-1 rounded-full text-[11px] font-display transition-all border"
              style={{
                borderColor: idx === activeStage ? product.color : 'rgba(255,255,255,0.08)',
                background: idx === activeStage ? `${product.color}20` : 'transparent',
                color: idx === activeStage ? product.color : '#64748b',
              }}
            >
              0{idx + 1} · {s.role}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden bg-ink/80" style={{ height: 440 }}>
        <Canvas camera={{ position: [0, 0, 4.4], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.7} />
          <pointLight position={[5, 4, 5]} intensity={1.8} color={product.color} />
          <pointLight position={[-5, -3, -4]} intensity={0.7} color="#22f2ff" />
          <SupplyGlobeMesh
            stages={product.stages}
            color={product.color}
            activeStage={activeStage}
            onSelectStage={setActiveStage}
          />
        </Canvas>

        {/* Floating HUD for active stage */}
        {currentStage && (
          <div
            className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm rounded-xl border bg-ink/90 backdrop-blur-md p-4 space-y-1.5 pointer-events-none"
            style={{ borderColor: `${product.color}44`, boxShadow: `0 0 30px ${product.color}18` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="chapter-badge" style={{ color: product.color }}>
                Stage 0{activeStage + 1} · {currentStage.place}
              </span>
              <span className="text-xs font-display text-slate-400">
                {currentStage.people} {currentStage.people === 1 ? 'worker' : 'workers'} · {currentStage.minutes} min
              </span>
            </div>
            <p className="font-display font-bold text-slate-100 text-sm">{currentStage.role}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{currentStage.detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
