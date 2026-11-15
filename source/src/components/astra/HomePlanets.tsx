import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { Group, Mesh, SRGBColorSpace } from "three";
import earth from "@/assets/home/earth.jpg.asset.json";
import mars from "@/assets/home/mars.jpg.asset.json";
import { assetUrl } from "@/lib/astra/local-assets";

function SatelliteOrbit({ radius, phase, position, tilt, colors }: {
  radius: number; phase: number; position: [number, number, number]; tilt: number;
  colors: { line: string; body: string; panel: string };
}) {
  const satellite = useRef<Group>(null);
  const angle = useRef(phase);
  useFrame((_, delta) => {
    angle.current += Math.min(delta, 0.05) * 0.23;
    if (satellite.current) {
      satellite.current.position.set(Math.cos(angle.current) * radius, Math.sin(angle.current) * radius, 0);
      satellite.current.rotation.z = angle.current + Math.PI / 2;
    }
  });
  return <group position={position} rotation={[tilt, 0.12, -0.25]}>
    <mesh>
      <torusGeometry args={[radius, 0.006, 6, 128]} />
      <meshBasicMaterial color={colors.line} transparent opacity={0.65} />
    </mesh>
    <group ref={satellite} position={[Math.cos(phase) * radius, Math.sin(phase) * radius, 0]} scale={0.17}>
      <mesh><boxGeometry args={[0.65, 0.8, 0.6]} /><meshStandardMaterial color={colors.body} metalness={0.65} roughness={0.3} /></mesh>
      {[-1, 1].map((side) => <group key={side} position={[side * 0.9, 0, 0]}>
        <mesh><boxGeometry args={[1.05, 0.7, 0.07]} /><meshStandardMaterial color={colors.panel} metalness={0.4} roughness={0.4} /></mesh>
        {[-0.3, 0, 0.3].map((x) => <mesh key={x} position={[x, 0, 0.04]}><boxGeometry args={[0.015, 0.68, 0.012]} /><meshBasicMaterial color={colors.body} /></mesh>)}
      </group>)}
      <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.025, 0.025, 0.55, 8]} /><meshStandardMaterial color={colors.body} /></mesh>
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.23, 0.12, 16, 1, true]} /><meshStandardMaterial color={colors.body} side={2} /></mesh>
    </group>
  </group>;
}

function Planets({ ready, colors }: { ready: () => void; colors: { line: string; body: string; panel: string } }) {
  const earthMesh = useRef<Mesh>(null);
  const marsMesh = useRef<Mesh>(null);
  const signaled = useRef(false);
  const size = useThree((state) => state.size);
  const scale = Math.min(0.88, size.width / size.height / 1.22);
  const [earthMap, marsMap] = useTexture([assetUrl(earth, "earth.jpg"), assetUrl(mars, "mars.jpg")]);
  earthMap.colorSpace = SRGBColorSpace;
  marsMap.colorSpace = SRGBColorSpace;
  useFrame((_, delta) => {
    if (!signaled.current) { signaled.current = true; ready(); }
    const dt = Math.min(delta, 0.05);
    if (earthMesh.current) earthMesh.current.rotation.y += dt * 0.13;
    if (marsMesh.current) marsMesh.current.rotation.y += dt * 0.1;
  });
  return <group scale={scale}>
    <SatelliteOrbit radius={1.57} phase={Math.PI} position={[-0.8, 0.55, 0]} tilt={0.65} colors={colors} />
    <SatelliteOrbit radius={1.16} phase={0} position={[1.12, -0.77, 0.6]} tilt={-0.55} colors={colors} />
    <mesh ref={earthMesh} position={[-0.8, 0.55, 0]} rotation={[0.12, 2.8, 0.18]}>
      <sphereGeometry args={[1.24, 64, 48]} />
      <meshStandardMaterial map={earthMap} roughness={0.78} />
    </mesh>
    <mesh ref={marsMesh} position={[1.12, -0.77, 0.6]} rotation={[0.1, 1, -0.12]}>
      <sphereGeometry args={[0.86, 64, 48]} />
      <meshStandardMaterial map={marsMap} roughness={0.95} />
    </mesh>
  </group>;
}

export default function HomePlanets() {
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<{ line: string; body: string; panel: string }>();
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const canvas = document.createElement("canvas");
    canvas.width = 1; canvas.height = 1;
    const context = canvas.getContext("2d");
    if (context) {
      const resolve = (token: string) => {
        context.fillStyle = style.getPropertyValue(token).trim();
        context.fillRect(0, 0, 1, 1);
        const pixel = context.getImageData(0, 0, 1, 1).data;
        return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
      };
      setColors({ line: resolve("--primary"), body: resolve("--foreground"), panel: resolve("--secondary") });
    }
  }, []);
  return <div className="home-planets" role="img" aria-label="Rotating 3D Earth and Mars with two orbiting satellites" data-scene-ready={ready ? "true" : undefined}>
    <Canvas camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[-4, 4, 6]} intensity={2.4} />
      <Environment resolution={64}>
        <Lightformer intensity={0.6} position={[0, 4, 3]} scale={[8, 8, 1]} />
      </Environment>
      <Suspense fallback={null}>
        {colors && <Planets ready={() => setReady(true)} colors={colors} />}
      </Suspense>
    </Canvas>
    <div className="home-planet-labels font-mono text-xs text-muted-foreground" aria-hidden><span>EARTH / HOME</span><span>MARS / HORIZON</span></div>
  </div>;
}