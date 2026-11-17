'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVestige } from '@/lib/store';
import { scoreTone } from '@/lib/health-model';
import type { HealthProfile, HealthResult } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Custom GLSL Shaders for the 3D Holographic Human Wireframe
// Applies structural spinal compression, digital glitches, and
// red/crimson distortion under health debt, smoothly restoring
// to a vibrant bioluminescent cyan/green aura as habits improve.
// ─────────────────────────────────────────────────────────────

const HOLO_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uDebt;
  uniform float uSitStrain;
  uniform float uDehydration;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vGlitch;

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  void main() {
    vec3 pos = position;

    // 1. Structural posture distortion: sitting compresses spine & hunches upper torso forward
    float torsoMask = smoothstep(-0.4, 1.3, pos.y);
    pos.z += torsoMask * uSitStrain * 0.22;
    pos.y -= torsoMask * uSitStrain * 0.11;

    // 2. Digital glitch shear slices when health debt is elevated
    float slice = floor(pos.y * 14.0 + uTime * 7.0);
    float rnd = hash(slice + floor(uTime * 12.0));
    float trigger = step(1.0 - uDebt * 0.48, rnd);
    float shift = (rnd - 0.5) * 0.38 * uDebt * trigger;
    pos.x += shift;
    pos.z += shift * 0.5;

    // 3. Dehydration & sleep-debt micro-tremor along normal
    float tremor = sin(uTime * 22.0 + pos.y * 18.0) * 0.018 * (uDebt + uDehydration * 0.5);
    pos += normal * tremor;

    // 4. Gentle breathing expansion when healthy
    float breath = sin(uTime * 2.1) * 0.022 * (1.0 - uDebt * 0.7) * smoothstep(0.0, 0.9, pos.y);
    pos += normal * breath;

    vPos = pos;
    vNormal = normalize(normalMatrix * normal);
    vGlitch = trigger * uDebt;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const HOLO_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uDebt;
  uniform vec3 uHealthyColor;
  uniform vec3 uDebtColor;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vGlitch;

  void main() {
    // Fresnel rim for holographic aura
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 1.8);

    // Horizontal holographic scanlines + sweeping biometric laser
    float scanline = 0.72 + 0.28 * sin(vPos.y * 55.0 - uTime * 5.0);
    float sweepPos = mod(uTime * 0.85, 3.6) - 1.8;
    float laser = smoothstep(0.16, 0.0, abs(vPos.y - sweepPos));

    // Blend between vibrant bioluminescent cyan/green and crimson glitch state
    vec3 bioMix = mix(uHealthyColor, vec3(0.13, 0.95, 1.0), 0.35 + 0.35 * sin(vPos.y * 2.0 + uTime));
    vec3 baseCol = mix(bioMix, uDebtColor, smoothstep(0.15, 0.85, uDebt));

    // Glitch flash overrides with intense crimson/orange
    vec3 finalCol = mix(baseCol, vec3(1.0, 0.18, 0.38), clamp(vGlitch * 1.4, 0.0, 1.0));
    finalCol += laser * mix(vec3(0.24, 1.0, 0.71), vec3(1.0, 0.24, 0.5), uDebt) * 0.65;

    float alpha = clamp((0.32 + fresnel * 0.55 + laser * 0.45 + vGlitch * 0.35) * scanline, 0.18, 0.96);
    gl_FragColor = vec4(finalCol, alpha);
  }
`;

function buildHumanGeometries(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [];
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z = 0, rx = 0, ry = 0, rz = 0) => {
    const g = geo.clone();
    const m = new THREE.Matrix4();
    m.makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
    m.setPosition(x, y, z);
    g.applyMatrix4(m);
    parts.push(g);
  };

  // Head & cranium
  add(new THREE.IcosahedronGeometry(0.23, 2), 0, 1.42, 0);
  // Neck
  add(new THREE.CylinderGeometry(0.075, 0.09, 0.16, 12, 2), 0, 1.18, 0);
  // Upper torso / ribcage
  add(new THREE.CylinderGeometry(0.28, 0.21, 0.56, 16, 6), 0, 0.82, 0);
  // Core / lumbar spine
  add(new THREE.CylinderGeometry(0.2, 0.23, 0.34, 14, 4), 0, 0.38, 0);
  // Pelvis
  add(new THREE.CylinderGeometry(0.23, 0.18, 0.22, 14, 2), 0, 0.1, 0);
  // Shoulders
  add(new THREE.SphereGeometry(0.095, 10, 10), -0.34, 1.03, 0);
  add(new THREE.SphereGeometry(0.095, 10, 10), 0.34, 1.03, 0);
  // Upper arms
  add(new THREE.CylinderGeometry(0.068, 0.058, 0.42, 10, 4), -0.41, 0.77, 0, 0, 0, 0.16);
  add(new THREE.CylinderGeometry(0.068, 0.058, 0.42, 10, 4), 0.41, 0.77, 0, 0, 0, -0.16);
  // Forearms
  add(new THREE.CylinderGeometry(0.056, 0.045, 0.4, 10, 4), -0.48, 0.37, 0.03, -0.1, 0, 0.12);
  add(new THREE.CylinderGeometry(0.056, 0.045, 0.4, 10, 4), 0.48, 0.37, 0.03, -0.1, 0, -0.12);
  // Thighs
  add(new THREE.CylinderGeometry(0.105, 0.082, 0.56, 12, 5), -0.14, -0.28, 0, 0, 0, 0.03);
  add(new THREE.CylinderGeometry(0.105, 0.082, 0.56, 12, 5), 0.14, -0.28, 0, 0, 0, -0.03);
  // Knees
  add(new THREE.SphereGeometry(0.078, 10, 10), -0.15, -0.58, 0);
  add(new THREE.SphereGeometry(0.078, 10, 10), 0.15, -0.58, 0);
  // Calves
  add(new THREE.CylinderGeometry(0.078, 0.055, 0.54, 12, 5), -0.15, -0.88, 0);
  add(new THREE.CylinderGeometry(0.078, 0.055, 0.54, 12, 5), 0.15, -0.88, 0);

  return parts;
}

function HolographicHumanScene({ profile, result }: { profile: HealthProfile; result: HealthResult }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const drag = useRef({ down: false, lastX: 0 });

  const bodyParts = useMemo(() => buildHumanGeometries(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDebt: { value: result.debt },
      uSitStrain: { value: 0 },
      uDehydration: { value: 0 },
      uHealthyColor: { value: new THREE.Color('#3dffb5') },
      uDebtColor: { value: new THREE.Color('#ff3d5e') },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Particle field surrounding the body (red heavy glitch sparks vs bioluminescent rising motes)
  const particleCount = 260;
  const { basePositions, seeds, particleGeo } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const s = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.18 + Math.random() * 0.55;
      const y = -1.25 + Math.random() * 2.85;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      s[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
    return { basePositions: pos, seeds: s, particleGeo: geo };
  }, []);

  const particleMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.038,
        color: new THREE.Color('#3dffb5'),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    // Smoothly transition shader uniforms when habits change
    const targetDebt = result.debt;
    const targetSit = Math.max(0, Math.min(1, (profile.sittingHours - 5) / 8));
    const targetDehyd = Math.max(0, Math.min(1, (6 - profile.waterGlasses) / 6));

    uniforms.uDebt.value = THREE.MathUtils.lerp(uniforms.uDebt.value, targetDebt, 0.06);
    uniforms.uSitStrain.value = THREE.MathUtils.lerp(uniforms.uSitStrain.value, targetSit, 0.06);
    uniforms.uDehydration.value = THREE.MathUtils.lerp(uniforms.uDehydration.value, targetDehyd, 0.06);

    const smoothDebt = uniforms.uDebt.value;

    // Rotate model gently unless user is dragging
    if (groupRef.current && !drag.current.down) {
      groupRef.current.rotation.y = Math.sin(t * 0.45) * 0.35 + t * 0.18;
    }

    // Update particle positions & color (red chaotic bursts under debt vs calm rising bioluminescence)
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const seed = seeds[i];
        const bx = basePositions[i * 3];
        const by = basePositions[i * 3 + 1];
        const bz = basePositions[i * 3 + 2];

        if (smoothDebt > 0.42) {
          // Heavy red glitch dispersion
          const burst = Math.sin(t * 9.0 + seed * 40.0) * smoothDebt * 0.22;
          arr[i * 3] = bx + burst;
          arr[i * 3 + 1] = by - ((t * (0.4 + seed * 0.8)) % 1.2) * 0.3;
          arr[i * 3 + 2] = bz + Math.cos(t * 8.0 + seed * 30.0) * smoothDebt * 0.22;
        } else {
          // Balanced ascending bioluminescent aura
          const rise = ((by + 1.3 + t * (0.22 + seed * 0.18)) % 2.85) - 1.25;
          arr[i * 3] = bx + Math.sin(t * 1.5 + seed * 10.0) * 0.05;
          arr[i * 3 + 1] = rise;
          arr[i * 3 + 2] = bz + Math.cos(t * 1.5 + seed * 10.0) * 0.05;
        }
      }
      attr.needsUpdate = true;

      const targetCol = new THREE.Color().lerpColors(
        new THREE.Color('#3dffb5'),
        new THREE.Color('#ff3d5e'),
        smoothstepJS(0.2, 0.8, smoothDebt),
      );
      particleMat.color.lerp(targetCol, 0.08);
      particleMat.size = 0.032 + smoothDebt * 0.026;
    }

    if (ringRef.current) {
      ringRef.current.position.y = Math.sin(t * 1.1) * 1.15;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        drag.current.down = true;
        drag.current.lastX = e.clientX;
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
        drag.current.lastX = e.clientX;
        groupRef.current.rotation.y += dx * 0.01;
      }}
    >
      {/* Solid inner holographic silhouette */}
      {bodyParts.map((geo, idx) => (
        <mesh key={`solid-${idx}`} geometry={geo}>
          <shaderMaterial
            vertexShader={HOLO_VERTEX}
            fragmentShader={HOLO_FRAGMENT}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Outer anatomical wireframe shell */}
      {bodyParts.map((geo, idx) => (
        <mesh key={`wire-${idx}`} geometry={geo} scale={1.018}>
          <shaderMaterial
            vertexShader={HOLO_VERTEX}
            fragmentShader={HOLO_FRAGMENT}
            uniforms={uniforms}
            wireframe
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Lumbar stress ring when sitting hours are high */}
      {profile.sittingHours >= 7 && (
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.33, 32]} />
          <meshBasicMaterial color="#ff3d5e" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Sweeping biometric scanner ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.65, 48]} />
        <meshBasicMaterial
          color={result.debt > 0.5 ? '#ff3d5e' : '#3dffb5'}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base pedestal grid */}
      <mesh position={[0, -1.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.78, 48]} />
        <meshBasicMaterial
          color={result.debt > 0.5 ? '#ff3d5e' : '#22f2ff'}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Reactive WebGL particle aura */}
      <points ref={pointsRef} geometry={particleGeo} material={particleMat} />
    </group>
  );
}

function smoothstepJS(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function HolographicBody() {
  const result = useVestige((s) => s.health.result);
  const profile = useVestige((s) => s.health.profile);
  const { label, color } = scoreTone(result.score);

  return (
    <div
      className="sticky top-20 rounded-3xl border bg-ink-2/60 backdrop-blur-sm overflow-hidden transition-shadow duration-700"
      style={{ borderColor: `${color}33`, boxShadow: `0 0 60px ${color}18` }}
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
          <p className="text-xs font-display text-slate-300 tracking-wider uppercase">
            3D WebGL Biometric Hologram · Drag to rotate
          </p>
        </div>
        <span
          className="text-xs font-display font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {label} · {result.score}/100
        </span>
      </div>

      <div className="relative w-full" style={{ height: 560 }}>
        <Canvas camera={{ position: [0, 0.15, 3.35], fov: 44 }} dpr={[1, 2]}>
          <ambientLight intensity={0.6} />
          <HolographicHumanScene profile={profile} result={result} />
        </Canvas>

        {/* Bottom HUD readout */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
          <div className="space-y-1 text-xs font-display">
            <p className="text-slate-500 uppercase tracking-wider text-[10px]">Active Signals</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-ink/80 border border-white/10 text-slate-300">
                🌙 {profile.sleepHours}h sleep
              </span>
              <span className="px-2 py-0.5 rounded bg-ink/80 border border-white/10 text-slate-300">
                💧 {profile.waterGlasses} glasses
              </span>
              <span className="px-2 py-0.5 rounded bg-ink/80 border border-white/10 text-slate-300">
                🪑 {profile.sittingHours}h seated
              </span>
            </div>
          </div>
          <div className="text-right">
            <p
              className="font-display font-bold text-4xl leading-none"
              style={{ color, textShadow: `0 0 24px ${color}88` }}
            >
              {result.score}
            </p>
            <p className="text-[11px] font-display text-slate-400 mt-1">health score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
