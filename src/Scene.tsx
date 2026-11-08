import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import gsap from "gsap";
import { Architecture } from "./Architecture";
import { createSedan } from "./sedan";
import type { Vehicle } from "./data";
export type View = "entrance" | "intro" | "overview" | "car" | "roof" | "cabin";
type V3 = [number, number, number];
const xOf = (v: Vehicle) => (v === "E" ? -3.45 : 3.45);
const clamp = T.MathUtils.clamp;
function Box({
  pos,
  size,
  color,
  metal = 0,
  lit = 0,
}: {
  pos: V3;
  size: V3;
  color: string;
  metal?: number;
  lit?: number;
}) {
  return (
    <mesh position={pos} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metal}
        roughness={metal ? 0.33 : 0.62}
        emissive={color}
        emissiveIntensity={lit}
      />
    </mesh>
  );
}
function Sign() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1536;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#e3c89d";
    ctx.textAlign = "center";
    ctx.font = "95px Georgia";
    ctx.fillText("M A I S O N   V E Y R E", 768, 125);
    ctx.font = "28px Arial";
    ctx.fillText("C H A U F F E U R S    P R I V É S", 768, 195);
    return new T.CanvasTexture(c);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 3.35, -10.76]}>
      <planeGeometry args={[8, 1.34]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
function Studio({ door }: { door: React.RefObject<T.Group | null> }) {
  return (
    <>
      <Architecture />
      <Box pos={[0, 2.95, -11]} size={[24, 6, 0.34]} color="#232427" />
      <Box pos={[0, 6.02, 0]} size={[24, 0.18, 22]} color="#242526" />
      {[-12, 12].map((s) => (
        <group key={s}>
          <Box
            pos={[s, 2.98, 0]}
            size={[0.2, 6, 22]}
            color="#222a30"
            metal={0.6}
          />
          {[-9, -5, -1, 3, 7].map((z) => (
            <group key={z}>
              <Box
                pos={[s * 0.99, 3, z]}
                size={[0.19, 6, 0.14]}
                color="#101214"
                metal={0.6}
              />
              <Box
                pos={[s * 0.98, 0.38, z + 1.8]}
                size={[0.08, 0.035, 3.45]}
                color="#f2ce9a"
                lit={2.2}
              />
            </group>
          ))}
          <Box
            pos={[s * 0.78, 3, 9.9]}
            size={[5.65, 6, 0.45]}
            color="#1c1e20"
            metal={0.52}
          />
        </group>
      ))}
      {[-8, -4, 0, 4, 8].map((z) => (
        <group key={z}>
          <Box pos={[0, 5.84, z]} size={[23, 0.19, 0.26]} color="#232527" />
          <Box
            pos={[0, 5.72, z]}
            size={[19, 0.045, 0.085]}
            color="#ffdea9"
            lit={3}
          />
          <Box pos={[0, -0.004, z]} size={[24, 0.007, 0.025]} color="#1a1b1b" />
        </group>
      ))}
      {[-8, -4, 0, 4, 8].map((x) => (
        <Box
          key={x}
          pos={[x, -0.004, 0]}
          size={[0.014, 0.009, 22]}
          color="#26282a"
        />
      ))}
      <Box
        pos={[0, 5.63, 9.95]}
        size={[24, 0.75, 0.52]}
        color="#222223"
        metal={0.5}
      />
      <Box
        pos={[0, 5.2, 9.68]}
        size={[13, 0.045, 0.065]}
        color="#ffdda5"
        lit={3}
      />
      <Sign />
      <group ref={door}>
        {Array.from({ length: 14 }, (_, i) => (
          <Box
            key={i}
            pos={[0, 0.19 + i * 0.385, 9.91]}
            size={[13.2, 0.372, 0.2]}
            color={i % 2 ? "#282b2c" : "#252728"}
            metal={0.65}
          />
        ))}
      </group>
    </>
  );
}
function Environment() {
  const { scene, gl } = useThree();
  useLayoutEffect(() => {
    const pmrem = new T.PMREMGenerator(gl),
      room = new RoomEnvironment(),
      map = pmrem.fromScene(room, 0.03);
    scene.environment = map.texture;
    scene.environmentIntensity = 0.85;
    gl.toneMapping = T.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.91;
    return () => {
      scene.environment = null;
      map.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}
type Props = {
  view: View;
  vehicle: Vehicle;
  reduced: boolean;
  select: (v: Vehicle) => void;
  onEnter: () => void;
  showPoint: (s: string) => void;
};
export function Scene(props: Props) {
  const { view, vehicle, reduced } = props;
  const { camera, gl, size } = useThree();
  const controls = useMemo(
    () => new OrbitControls(camera, gl.domElement),
    [camera, gl],
  );
  const cars = useMemo(
    () => ({ E: createSedan("E"), S: createSedan("S") }),
    [],
  );
  const door = useRef<T.Group>(null),
    light = useRef<T.HemisphereLight>(null),
    busy = useRef(false),
    callbacks = useRef(props),
    keys = useRef(new Set<string>()),
    last = useRef(new T.Vector3()),
    prev = useRef<View>("entrance");
  callbacks.current = props;
  useEffect(
    () => () => {
      controls.dispose();
      Object.values(cars).forEach((g) =>
        g.traverse((obj) => {
          if (obj instanceof T.Mesh) {
            obj.geometry.dispose();
            const materials = Array.isArray(obj.material)
              ? obj.material
              : [obj.material];
            materials.forEach((m) => m.dispose());
          }
        }),
      );
    },
    [controls, cars],
  );
  useEffect(() => {
    const holder = gl.domElement.parentElement?.closest(".stage");
    if (!holder) return;
    const down = (e: Event) => {
      const ev = e as KeyboardEvent,
        k = ev.key.toLowerCase();
      if (
        ev.target !== holder ||
        ![
          "w",
          "a",
          "s",
          "d",
          "z",
          "q",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(k)
      )
        return;
      ev.preventDefault();
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clear = () => keys.current.clear();
    holder.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    holder.addEventListener("focusout", clear);
    return () => {
      holder.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      holder.removeEventListener("focusout", clear);
    };
  }, [gl]);
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = view;
    const x = xOf(vehicle);
    const cabin = view === "cabin";
    const ease = "power2.inOut";
    controls.enabled = false;
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.update();
    controls.minDistance = 0.06;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = 0.001;
    const lens = camera as T.PerspectiveCamera;
    lens.fov = view === "car" ? 39 : view === "cabin" ? 65 : 48;
    lens.updateProjectionMatrix();
    const tl = gsap.timeline();
    busy.current = true;
    const duration = reduced ? 0.01 : 1.15;
    const move = (pos: V3, target: V3, start: number, len: number) => {
      tl.to(
        camera.position,
        { x: pos[0], y: pos[1], z: pos[2], duration: len, ease },
        start,
      );
      tl.to(
        controls.target,
        { x: target[0], y: target[1], z: target[2], duration: len, ease },
        start,
      );
    };
    if (view === "intro") {
      camera.position.set(0, 2.05, 16.5);
      controls.target.set(0, 1.45, 0);
      door.current!.position.y = 0;
      light.current!.intensity = 0.28;
      tl.to(light.current!, { intensity: 1.9, duration: duration * 0.7 }, 0);
      tl.to(
        door.current!.position,
        { y: 5.75, ease, duration: duration * 1.8 },
        duration * 0.15,
      );
      move([0, 2.15, 7.5], [0, 0.9, -0.7], duration * 0.9, duration * 1.75);
    } else if (view === "entrance") {
      move([0, 2.05, 16.5], [0, 1.45, 0], 0, duration);
      tl.to(door.current!.position, { y: 0, duration }, duration * 0.85);
    } else {
      door.current!.position.y = 5.75;
      light.current!.intensity = 1.9;
      let pos: V3,
        target: V3,
        begin = 0;
      if (view === "overview") {
        pos = [0, size.width < 600 ? 2.8 : 2.15, size.width < 600 ? 9.2 : 7.8];
        target = [0, 0.85, -0.85];
      } else if (view === "car") {
        pos = [x + (vehicle === "E" ? 3.9 : -3.9), 1.62, 4.65];
        target = [x, 0.75, 0];
      } else if (view === "roof") {
        pos = [x + 1.2, 4.3, 1.4];
        target = [x, 0.6, -0.3];
      } else {
        pos = [x + 0.38, 1.17, -0.72];
        target = [x + 0.35, 1.13, -0.55];
      }
      if (view === "roof" || (cabin && was !== "roof")) {
        move([x + 0.05, 4.8, -0.25], [x, 0.65, -0.3], 0, duration);
        begin = duration * 0.97;
      }
      move(pos, target, begin, duration);
    }
    Object.entries(cars).forEach(([k, g]) => {
      const active = k === vehicle;
      g.traverse((o) => {
        if (!(o instanceof T.Mesh) || Array.isArray(o.material)) return;
        const mat = o.material as T.MeshStandardMaterial;
        if (o.name === "roof" || o.name === "glass") {
          const base =
            o.name === "roof"
              ? 1
              : ((mat.userData.baseOpacity ??= mat.opacity) as number);
          mat.transparent = true;
          tl.to(
            mat,
            {
              opacity:
                active && (view === "roof" || cabin)
                  ? o.name === "roof"
                    ? cabin
                      ? 1
                      : 0.035
                    : 0.08
                  : base,
              duration,
            },
            0,
          );
        }
        if (mat.name === "headlamp") {
          if (view === "intro") mat.emissiveIntensity = 0.05;
          tl.to(
            mat,
            {
              emissiveIntensity: active && view === "car" ? 3.4 : 1.6,
              duration,
            },
            0,
          );
        }
      });
    });
    tl.eventCallback("onComplete", () => {
      busy.current = false;
      controls.enabled = !["intro", "entrance"].includes(view);
      controls.enableZoom = !cabin;
      controls.enableDamping = !reduced;
      controls.dampingFactor = 0.1;
      controls.rotateSpeed = cabin ? -0.55 : 0.7;
      controls.minDistance = cabin
        ? 0.12
        : view === "car"
          ? 2.95
          : view === "roof"
            ? 2.1
            : 1.3;
      controls.maxDistance = cabin
        ? 0.22
        : view === "car"
          ? 7
          : view === "roof"
            ? 5.6
            : 13;
      controls.maxPolarAngle = cabin ? 2.44 : 1.51;
      controls.minPolarAngle = cabin ? 0.56 : 0.05;
      last.current.copy(camera.position);
      if (view === "intro") callbacks.current.onEnter();
    });
    return () => {
      tl.kill();
      busy.current = false;
    };
  }, [view, vehicle, cars, camera, controls, reduced, size.width]);
  useFrame((_, delta) => {
    if (busy.current) {
      camera.lookAt(controls.target);
      return;
    }
    if (!controls.enabled) return;
    if (view === "overview") {
      const v = new T.Vector3();
      camera.getWorldDirection(v);
      v.y = 0;
      v.normalize();
      const right = new T.Vector3(-v.z, 0, v.x);
      const k = keys.current,
        forward =
          Number(k.has("w") || k.has("z") || k.has("arrowup")) -
          Number(k.has("s") || k.has("arrowdown")),
        across =
          Number(k.has("d") || k.has("arrowright")) -
          Number(k.has("q") || k.has("a") || k.has("arrowleft"));
      if (forward || across) {
        const step = v
          .multiplyScalar(forward)
          .addScaledVector(right, across)
          .normalize()
          .multiplyScalar(Math.min(delta, 0.06) * 4);
        camera.position.add(step);
        controls.target.add(step);
      }
    }
    controls.update();
    if (view === "cabin") return;
    const p = camera.position;
    const bounded = new T.Vector3(
      clamp(p.x, -11.55, 11.55),
      clamp(p.y, 0.3, 5.55),
      clamp(p.z, -10.5, 9.5),
    );
    if (
      bounded.y < 1.75 &&
      (["E", "S"] as Vehicle[]).some(
        (k) =>
          Math.abs(bounded.x - xOf(k)) < 1.22 && Math.abs(bounded.z) < 2.73,
      )
    )
      bounded.copy(last.current);
    const diff = bounded.clone().sub(p);
    if (view === "overview") controls.target.add(diff);
    p.copy(bounded);
    last.current.copy(p);
  });
  return (
    <>
      <color attach="background" args={["#252932"]} />
      <fog attach="fog" args={["#25272a", 22, 55]} />
      <Environment />
      <hemisphereLight ref={light} args={["#e4eaf7", "#8b7662", 1.9]} />
      <directionalLight
        position={[1, 5.5, 5]}
        color="#ffecd4"
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-6, 4, -7]}
        intensity={1.35}
        color="#c0d4ff"
      />
      <Studio door={door} />
      {(["E", "S"] as Vehicle[]).map((k) => (
        <group key={k} position={[xOf(k), 0, 0]}>
          <primitive
            object={cars[k]}
            onClick={(e: { stopPropagation: () => void; delta: number }) => {
              if (e.delta < 4 && ["overview", "car"].includes(view)) {
                e.stopPropagation();
                callbacks.current.select(k);
              }
            }}
          />
          <pointLight
            position={[0, 3.1, 1.1]}
            color="#ffe2b5"
            intensity={k === vehicle && view !== "overview" ? 11 : 3}
            distance={8}
          />
          {vehicle === k &&
            view === "roof" &&
            [
              ["Sellerie", 0.43, 0.96, -1],
              ["Console", 0, 0.83, 0.34],
            ].map(([s, x, y, z]) => (
              <mesh
                key={s}
                position={[Number(x), Number(y), Number(z)]}
                onClick={(e) => {
                  e.stopPropagation();
                  callbacks.current.showPoint(String(s));
                }}
              >
                <sphereGeometry args={[0.085, 14, 10]} />
                <meshBasicMaterial color="#ffe0a0" />
              </mesh>
            ))}
        </group>
      ))}
    </>
  );
}
