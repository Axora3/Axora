"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Shape, type Group, type ShaderMaterial } from "three";

const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const metalShader = `uniform float time; varying vec2 vUv; void main(){float wave=sin(vUv.x*9.+vUv.y*5.+sin(vUv.y*8.-time*.28)*.65); float light=pow(.5+.5*wave,3.); vec3 silver=mix(vec3(.12,.16,.22),vec3(.91,.94,.98),light); silver+=pow(.5+.5*sin(vUv.x*18.+vUv.y*10.+time*.15),24.)*.35; gl_FragColor=vec4(silver,1.);}`;
const gradientShader = `uniform float time; varying vec2 vUv; void main(){vec2 p=vUv; float field=sin(p.x*4.+sin(p.y*4.+time*.12))*cos(p.y*3.-time*.08); vec3 col=mix(vec3(.020,.024,.032),vec3(.035,.065,.13),smoothstep(-.7,.8,field)); gl_FragColor=vec4(col,1.);}`;

function GradientPlane() {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (material.current)
      material.current.uniforms.time.value += Math.min(delta, 0.05);
  });
  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[10, 8]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={gradientShader}
      />
    </mesh>
  );
}

function Sculpture() {
  const group = useRef<Group>(null);
  const materials = useRef<(ShaderMaterial | null)[]>([]);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  const shapes = useMemo(() => {
    const polygon = (points: number[][]) => {
      const shape = new Shape();
      points.forEach(([x, y], index) => {
        if (!index) shape.moveTo((x - 32) / 22, (30 - y) / 22);
        else shape.lineTo((x - 32) / 22, (30 - y) / 22);
      });
      shape.closePath();
      return shape;
    };
    return [
      polygon([
        [4, 54],
        [25, 6],
        [37, 6],
        [16, 54],
      ]),
      polygon([
        [28, 34],
        [36, 16],
        [60, 54],
        [47, 54],
        [41, 42],
        [25, 42],
      ]),
    ];
  }, []);
  useFrame(({ clock, pointer }, delta) => {
    for (const material of materials.current)
      if (material) material.uniforms.time.value = clock.elapsedTime;
    if (!group.current) return;
    const ease = 1 - Math.exp(-delta * 3);
    group.current.rotation.y +=
      (pointer.x * 0.16 +
        Math.sin(clock.elapsedTime * 0.24) * 0.08 -
        group.current.rotation.y) *
      ease;
    group.current.rotation.x +=
      (-pointer.y * 0.1 - group.current.rotation.x) * ease;
  });
  return (
    <group ref={group}>
      {shapes.map((shape, i) => (
        <mesh key={i}>
          <extrudeGeometry
            args={[
              shape,
              {
                depth: 0.16,
                bevelEnabled: true,
                bevelSegments: 3,
                steps: 1,
                bevelSize: 0.035,
                bevelThickness: 0.035,
              },
            ]}
          />
          <shaderMaterial
            ref={(material) => {
              materials.current[i] = material;
            }}
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={metalShader}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function BrandScene() {
  const [lost, setLost] = useState(false);
  if (lost) return null;
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 37 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      fallback={<span />}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          () => setLost(true),
          { once: true },
        );
      }}
    >
      <GradientPlane />
      <Sculpture />
    </Canvas>
  );
}
