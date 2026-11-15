import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, Lightformer, useGLTF } from "@react-three/drei";
import type { Group } from "three";
import astronautModel from "@/assets/models/astronaut.glb.asset.json";
import { assetUrl } from "@/lib/astra/local-assets";

// "Astronaut" by Poly by Google, CC-BY 3.0 (via modelviewer.dev shared assets).
const SPIN = 0.6; // radians per second; negative Y = right-to-left

function Astronaut({ reducedMotion, onReady }: { reducedMotion: boolean; onReady: () => void }) {
  const { scene } = useGLTF(assetUrl(astronautModel, "astronaut.glb"));
  const model = useMemo(() => scene.clone(true), [scene]);
  const root = useRef<Group>(null);
  useEffect(onReady, [onReady]);
  useFrame((state, delta) => {
    if (!root.current || reducedMotion) return;
    root.current.rotation.y -= Math.min(delta, 0.05) * SPIN;
    root.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.05;
  });
  return (
    <group ref={root}>
      <Center><primitive object={model} scale={1.15} /></Center>
    </group>
  );
}

export default function MissionAstronaut3D() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  return (
    <div className="mission-astronaut-stage" role="img" aria-label="Realistic 3D astronaut rotating" data-scene-ready={ready || undefined}>
      <Canvas camera={{ position: [0, 0, 4.2], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={2.4} />
        <directionalLight position={[-4, 1, -3]} intensity={0.9} color="#8fb8ff" />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={1} color="#88bbff" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <Astronaut reducedMotion={reducedMotion} onReady={() => setReady(true)} />
        </Suspense>
      </Canvas>
    </div>
  );
}
