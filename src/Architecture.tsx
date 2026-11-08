import { useEffect, useMemo } from "react";
import * as T from "three";
function paint(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
function seeded(seed: number) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function Architecture() {
  const maps = useMemo(() => {
    const random = seeded(717);
    const stone = paint(512, 512, (c) => {
      c.fillStyle = "#323337";
      c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 43000; i++) {
        const grey = Math.floor(90 + random() * 60);
        c.fillStyle = "rgba(" + grey + "," + grey + "," + grey + ",.12)";
        c.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1);
      }
      c.strokeStyle = "#0d0f12";
      c.lineWidth = 1.7;
      c.strokeRect(0, 0, 512, 512);
    });
    stone.wrapS = stone.wrapT = T.RepeatWrapping;
    stone.repeat.set(7, 8);
    const windows = paint(1536, 384, (c) => {
      const sky = c.createLinearGradient(0, 0, 0, 384);
      sky.addColorStop(0, "#121927");
      sky.addColorStop(0.7, "#343a44");
      sky.addColorStop(1, "#101720");
      c.fillStyle = sky;
      c.fillRect(0, 0, 1536, 384);
      for (let i = 0; i < 85; i++) {
        const x = random() * 1536,
          w = 7 + random() * 40,
          h = 20 + random() * 80;
        c.fillStyle = "#111923";
        c.fillRect(x, 275 - h, w, h + 110);
        for (let y = 280 - h; y < 330; y += 7) {
          for (let a = x + 3; a < x + w - 2; a += 5) {
            if (random() > 0.7) {
              c.fillStyle = random() > 0.55 ? "#a99675" : "#687888";
              c.fillRect(a, y, 1.4, 2);
            }
          }
        }
      }
      c.fillStyle = "rgba(4,9,14,.35)";
      c.fillRect(0, 0, 1536, 384);
      for (let x = 0; x <= 1536; x += 192) {
        c.fillStyle = "#0b0d10";
        c.fillRect(x, 0, 7, 384);
        c.fillStyle = "#424648";
        c.fillRect(x + 7, 0, 1, 384);
      }
    });
    const back = paint(1536, 384, (c) => {
      c.fillStyle = "#161719";
      c.fillRect(0, 0, 1536, 384);
      for (const x of [130, 495, 1041, 1406]) {
        const g = c.createRadialGradient(x, 380, 0, x, 380, 270);
        g.addColorStop(0, "#ab8154");
        g.addColorStop(0.48, "#514031");
        g.addColorStop(1, "#171819");
        c.fillStyle = g;
        c.fillRect(x - 270, 0, 540, 384);
      }
      for (let i = 0; i < 1536; i += 7) {
        c.fillStyle = "#05070998";
        c.fillRect(i, 0, 3.3, 384);
        c.fillStyle = "#99857130";
        c.fillRect(i + 3.3, 0, 1, 384);
      }
    });
    const shadow = paint(128, 128, (c) => {
      const r = c.createRadialGradient(64, 64, 13, 64, 64, 64);
      r.addColorStop(0, "rgba(0,0,0,.87)");
      r.addColorStop(0.56, "rgba(0,0,0,.66)");
      r.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = r;
      c.fillRect(0, 0, 128, 128);
    });
    return { stone, windows, back, shadow };
  }, []);
  useEffect(
    () => () => Object.values(maps).forEach((t) => t.dispose()),
    [maps],
  );
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 4]}
        receiveShadow
      >
        <planeGeometry args={[32, 46]} />
        <meshStandardMaterial
          map={maps.stone}
          color="#626269"
          metalness={0.23}
          roughness={0.48}
          envMapIntensity={0.22}
        />
      </mesh>
      <mesh position={[0, 2.99, -10.79]}>
        <planeGeometry args={[24, 6]} />
        <meshBasicMaterial map={maps.back} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 11.76, 3.14, 0]}
          rotation={[0, (-s * Math.PI) / 2, 0]}
        >
          <planeGeometry args={[20, 4.7]} />
          <meshBasicMaterial map={maps.windows} />
        </mesh>
      ))}
      {[-3.45, 3.45].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.55, 6.65]} />
            <meshBasicMaterial
              map={maps.shadow}
              transparent
              depthWrite={false}
            />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[x + s * 1.68, -0.006, -0.01]}>
              <boxGeometry args={[0.017, 0.012, 5.97]} />
              <meshBasicMaterial color="#a08d6d" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
