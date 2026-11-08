import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { equipmentFor } from "./equipment";

type Point = [number, number, number];
type Material = THREE.MeshStandardMaterial;
type Variant = "E" | "S";
const vector = (p: Point) => new THREE.Vector3(...p);
const radians = (degrees: number) => (degrees * Math.PI) / 180;

// Original models. The origin is on the ground midway between the axles.
// Grouping static pieces by finish keeps both cars affordable on mobile GPUs.
export function createSedan(variant: Variant): THREE.Group {
  const prestige = variant === "S";
  const car = new THREE.Group();
  car.name = prestige ? "Prestige" : "Business";
  let buckets = new Map<Material, THREE.BufferGeometry[]>();
  function finish(
    name: string,
    color: number,
    metalness: number,
    roughness: number,
    extra = {},
  ) {
    const material = new THREE.MeshStandardMaterial({
      name,
      color,
      metalness,
      roughness,
      side: THREE.DoubleSide,
      ...extra,
    });
    return material;
  }
  const paint = finish("coachwork", prestige ? 0x24242a : 0x292e33, 0.73, 0.21);
  const roof = finish("roof", prestige ? 0x24242a : 0x292e33, 0.73, 0.21, {
    transparent: true,
  });
  const glass = finish("glass", 0x778987, 0.16, 0.13, {
    transparent: true,
    opacity: 0.33,
    depthWrite: false,
  });
  const black = finish("trim", 0x191b1d, 0.36, 0.32);
  const rubber = finish("tyres", 0x19191b, 0.04, 0.88);
  const brushed = finish("satin-aluminium", 0x96999c, 0.75, 0.32);
  const chrome = finish("polished-metal", 0xd2d4ce, 0.78, 0.2);
  const leather = finish(
    "upholstery",
    prestige ? 0xb29677 : 0x615954,
    0.02,
    0.74,
  );
  const stitch = finish("piping", prestige ? 0xd4bea3 : 0x857a6c, 0.04, 0.68);
  const well = finish("carpet", 0x262526, 0, 0.98);
  const walnut = finish(
    "cabin-inlay",
    prestige ? 0x6e4636 : 0x495052,
    0.2,
    0.38,
  );
  const lamp = finish("headlamp", 0xfff6df, 0.1, 0.15, {
    emissive: 0xffefcc,
    emissiveIntensity: 1.5,
  });
  const red = finish("tail-lamp", 0x762324, 0.16, 0.21, {
    emissive: 0xa8191c,
    emissiveIntensity: 0.52,
  });
  const display = finish("dashboard-display", 0x18222a, 0.2, 0.26, {
    emissive: 0x324852,
    emissiveIntensity: 0.6,
  });

  function add(
    geometry: THREE.BufferGeometry,
    material: Material,
    pos?: Point,
    rot?: Point,
  ) {
    let normalized = geometry;
    if (geometry.index) {
      normalized = geometry.toNonIndexed();
      geometry.dispose();
    }
    for (const key of Object.keys(normalized.attributes)) {
      if (key !== "position" && key !== "normal")
        normalized.deleteAttribute(key);
    }
    if (rot)
      normalized.applyMatrix4(
        new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)),
      );
    if (pos) normalized.translate(...pos);
    if (!buckets.has(material)) buckets.set(material, []);
    buckets.get(material)!.push(normalized);
  }
  function box(
    pos: Point,
    dimensions: Point,
    material: Material,
    radius = 0.025,
    rot?: Point,
  ) {
    const r = Math.min(radius, ...dimensions.map((n) => n / 2));
    add(
      r > 0.001
        ? new RoundedBoxGeometry(...dimensions, 1, r)
        : new THREE.BoxGeometry(...dimensions),
      material,
      pos,
      rot,
    );
  }
  function oval(pos: Point, size: Point, material: Material) {
    add(new THREE.SphereGeometry(1, 16, 10).scale(...size), material, pos);
  }
  function tube(
    points: Point[],
    radius: number,
    material: Material,
    segments = 18,
  ) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(vector),
      false,
      "centripetal",
    );
    add(new THREE.TubeGeometry(curve, segments, radius, 5, false), material);
  }
  function panel(
    uSteps: number,
    vSteps: number,
    point: (u: number, v: number) => Point,
    material: Material,
  ) {
    const positions: number[] = [],
      indices: number[] = [];
    for (let j = 0; j <= vSteps; j++) {
      for (let i = 0; i <= uSteps; i++)
        positions.push(...point(i / uSteps, j / vSteps));
    }
    const row = uSteps + 1;
    for (let j = 0; j < vSteps; j++)
      for (let i = 0; i < uSteps; i++) {
        const k = j * row + i;
        indices.push(k, k + row, k + 1, k + 1, k + row, k + row + 1);
      }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geom.setIndex(indices);
    geom.computeVertexNormals();
    add(geom, material);
  }
  // z, outer half-width, height of the shoulder crease.
  const sections = [
    [-2.42, 0.79, 0.78],
    [-2.31, 0.9, 0.9],
    [-1.85, 0.96, 0.96],
    [-1.35, 0.97, 0.985],
    [-0.4, 0.975, 0.975],
    [0.55, 0.974, 0.935],
    [1.35, 0.968, 0.901],
    [1.82, 0.943, 0.86],
    [2.19, 0.89, 0.79],
    [2.39, 0.77, 0.735],
  ];
  const lerp = THREE.MathUtils.lerp;
  function profile(z: number, col: number) {
    const idx = sections.findIndex((s, i) => i > 0 && z <= s[0]);
    if (idx < 0) return sections[sections.length - 1][col];
    const a = sections[idx - 1],
      b = sections[idx];
    return lerp(
      a[col],
      b[col],
      THREE.MathUtils.clamp((z - a[0]) / (b[0] - a[0]), 0, 1),
    );
  }
  const axles = [-1.51, 1.47];
  const wheelR = prestige ? 0.37 : 0.352;
  const bottom = (z: number) => {
    const d = Math.min(...axles.map((a) => Math.abs(z - a)));
    const arch = wheelR + 0.045;
    if (d < arch) return wheelR + Math.sqrt(arch * arch - d * d);
    return lerp(wheelR, 0.249, Math.min(1, (d - arch) / 0.073));
  };
  for (const side of [-1, 1]) {
    panel(
      120,
      5,
      (u, v) => {
        const z = lerp(-2.42, 2.39, side > 0 ? 1 - u : u);
        const width =
          profile(z, 1) - 0.052 * (1 - v) ** 2 + 0.018 * Math.sin(v * Math.PI);
        return [side * width, lerp(bottom(z), profile(z, 2), v), z];
      },
      paint,
    );
    panel(
      52,
      4,
      (u, v) => {
        const z = lerp(-2.42, 2.39, side > 0 ? 1 - u : u);
        return [
          side * (profile(z, 1) - v * 0.113),
          profile(z, 2) + 0.052 * Math.sin((v * Math.PI) / 2),
          z,
        ];
      },
      paint,
    );
    for (const axle of axles) {
      const outline: Point[] = [];
      for (let j = 0; j <= 26; j++) {
        const theta = (j * Math.PI) / 26,
          z = axle + Math.cos(theta) * (wheelR + 0.045);
        outline.push([
          side * (profile(z, 1) - 0.037),
          wheelR + Math.sin(theta) * (wheelR + 0.045),
          z,
        ]);
      }
      tube(outline, 0.012, paint, 30);
    }
    tube(
      [
        [side * 0.92, 0.29, -1.03],
        [side * 0.951, 0.275, -0.75],
        [side * 0.95, 0.28, 0.72],
        [side * 0.918, 0.31, 0.97],
      ],
      0.021,
      brushed,
    );
    tube(
      [
        [-1.98, 0.79],
        [-1.35, 0.85],
        [-0.3, 0.845],
        [0.91, 0.836],
        [1.99, 0.768],
      ].map(([z, y]) => [side * (profile(z, 1) + 0.006), y, z]),
      0.007,
      paint,
    );
    for (const z of [-1.13, -0.16, 0.92]) {
      const foot = z === -1.13 ? -0.99 : z - 0.065;
      tube(
        [
          [side * 0.882, profile(z, 2) + 0.046, z],
          [side * 0.971, 0.84, z],
          [side * 0.984, 0.7, z + 0.012],
          [side * 0.97, 0.49, foot],
          [side * 0.946, 0.34, foot - 0.01],
        ],
        0.005,
        black,
        15,
      );
    }
    for (const z of [-1.035, -0.075])
      box(
        [side * 0.974, 0.885, z],
        [0.028, 0.028, 0.145],
        prestige ? chrome : brushed,
        0.011,
      );
    tube(
      [
        [side * 0.82, 0.98, 0.68],
        [side * 0.937, 1.045, 0.68],
        [side * 1.015, 1.052, 0.7],
      ],
      0.025,
      black,
    );
    oval([side * 1.014, 1.068, 0.714], [0.1, 0.069, 0.137], paint);
    box([side * 1.024, 1.069, 0.621], [0.141, 0.077, 0.017], brushed, 0.014, [
      0,
      side * 0.12,
      0,
    ]);
  }
  // The bonnet and boot stop at the base of the windows, leaving a real cabin opening.
  const rearBase = prestige ? -1.75 : -1.66,
    frontBase = 0.99;
  for (const [start, end] of [
    [-2.42, rearBase],
    [frontBase, 2.39],
  ]) {
    panel(
      20,
      26,
      (u, v) => {
        const z = lerp(start, end, v),
          nx = 2 * u - 1;
        const crease =
          0.025 * Math.exp(-Math.pow((Math.abs(nx) - 0.63) / 0.13, 2));
        return [
          nx * (profile(z, 1) - 0.108),
          profile(z, 2) + 0.05 + (1 - nx * nx) * 0.048 + crease,
          z,
        ];
      },
      paint,
    );
  }
  for (const side of [-1, 1]) {
    tube(
      [
        [side * 0.802, 0.976, 1.01],
        [side * 0.775, 0.97, 1.26],
        [side * 0.681, 0.934, 1.72],
        [side * 0.619, 0.864, 2.12],
      ],
      0.0055,
      black,
    );
  }
  function fascia(front: boolean) {
    const z = front ? 2.389 : -2.419,
      dir = front ? 1 : -1,
      half = profile(z, 1);
    panel(
      32,
      8,
      (u, v) => {
        const x = (u * 2 - 1) * half;
        return [
          x,
          lerp(0.253, profile(z, 2) + 0.05 + 0.041 * (1 - (x / half) ** 2), v),
          z + dir * (0.067 * (1 - (x / half) ** 4) * Math.sin(Math.PI * v)),
        ];
      },
      paint,
    );
  }
  fascia(true);
  fascia(false);
  function grillePoint(u: number, v: number): Point {
    const nx = u * 2 - 1;
    const half = prestige ? lerp(0.5, 0.565, v) : lerp(0.49, 0.545, v);
    return [
      nx * half,
      lerp(0.457 + 0.037 * nx * nx, 0.738 - 0.007 * nx * nx, v),
      2.466 - 0.037 * nx * nx + 0.006 * (1 - v),
    ];
  }
  panel(30, 7, grillePoint, black);
  for (const v of [0, 1])
    tube(
      Array.from({ length: 9 }, (_, i) => grillePoint(i / 8, v)),
      0.012,
      chrome,
    );
  for (const u of [0, 1])
    tube(
      [grillePoint(u, 0), grillePoint(u, 0.5), grillePoint(u, 1)],
      0.012,
      chrome,
    );
  for (let i = 1; i <= (prestige ? 6 : 3); i++) {
    tube(
      Array.from({ length: 11 }, (_, j) => {
        const p = grillePoint(j / 10, i / (prestige ? 7 : 4));
        p[2] += 0.008;
        return p;
      }),
      prestige ? 0.007 : 0.011,
      brushed,
    );
  }
  box([0, 0.341, 2.446], [1.03, 0.092, 0.041], black, 0.028);
  box([0, 0.307, 2.47], [1.25, 0.011, 0.018], brushed, 0.004);
  for (const side of [-1, 1]) {
    tube(
      [
        [side * 0.555, 0.71, 2.41],
        [side * 0.665, 0.743, 2.42],
        [side * 0.793, 0.765, 2.373],
        [side * 0.879, 0.806, 2.203],
      ],
      0.049,
      black,
    );
    const stripe: Point[] = [
      [side * 0.55, 0.74, 2.44],
      [side * 0.638, 0.767, 2.452],
      [side * 0.773, 0.781, 2.408],
      [side * 0.846, 0.801, 2.305],
      [side * 0.879, 0.818, 2.196],
    ];
    tube(stripe, 0.012, lamp);
    if (prestige)
      tube(
        stripe.map(([x, y, z]) => [x, y - 0.028, z + 0.007]),
        0.007,
        lamp,
      );
    for (let i = 0; i < 3; i++)
      oval(
        [side * (0.62 + 0.053 * i), 0.736 + 0.01 * i, 2.446 - 0.012 * i],
        [0.019, 0.014, 0.012],
        lamp,
      );
    box([side * 0.685, 0.386, 2.392], [0.217, 0.113, 0.051], black, 0.025, [
      0,
      side * -0.18,
      0,
    ]);
    for (let i = 0; i < 3; i++)
      box(
        [side * 0.686, 0.358 + i * 0.024, 2.425],
        [0.176, 0.006, 0.012],
        brushed,
        0.002,
      );
    tube(
      [
        [side * 0.37, 0.772, -2.446],
        [side * 0.678, 0.794, -2.443],
        [side * 0.812, 0.815, -2.386],
        [side * 0.904, 0.848, -2.234],
      ],
      0.029,
      red,
    );
    tube(
      [
        [side * 0.5, 0.725, -2.453],
        [side * 0.725, 0.753, -2.445],
        [side * 0.818, 0.779, -2.385],
      ],
      0.01,
      red,
    );
    box([side * 0.58, 0.295, -2.44], [0.27, 0.057, 0.03], chrome, 0.022);
    box([side * 0.58, 0.294, -2.46], [0.22, 0.035, 0.012], black, 0.013);
  }
  box([0, 0.581, -2.466], [0.39, 0.11, 0.017], black, 0.008);
  // Glasshouse: sprung roof, raked windscreens, framed side windows and pillars.
  const roofBack = prestige ? -1.06 : -0.95,
    roofFront = 0.37,
    roofY = prestige ? 1.508 : 1.479;
  const windowEnd = (rear: boolean, upper: boolean, side: number): Point =>
    upper
      ? [side * 0.665, roofY - 0.048, rear ? roofBack : roofFront]
      : [
          side * (profile(rear ? rearBase : frontBase, 1) - 0.116),
          profile(rear ? rearBase : frontBase, 2) + 0.06,
          rear ? rearBase : frontBase,
        ];
  const lerpPoint = (a: Point, b: Point, t: number): Point => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
  panel(
    16,
    18,
    (u, v) => {
      const nx = 2 * u - 1,
        z = lerp(roofBack, roofFront, v);
      return [
        nx * 0.671,
        roofY + 0.019 * Math.sin(v * Math.PI) - 0.05 * nx * nx,
        z,
      ];
    },
    roof,
  );
  for (const rear of [false, true]) {
    panel(
      20,
      10,
      (u, v) => {
        const b = lerpPoint(
            windowEnd(rear, false, 1),
            windowEnd(rear, true, 1),
            v,
          ),
          nx = 2 * u - 1;
        return [
          b[0] * nx,
          b[1] + (1 - nx * nx) * 0.05,
          b[2] +
            (rear ? -1 : 1) * 0.073 * (1 - nx * nx) * Math.sin(Math.PI * v),
        ];
      },
      glass,
    );
  }
  for (const side of [-1, 1]) {
    function sideWindow(u: number, v: number): Point {
      return lerpPoint(
        lerpPoint(
          windowEnd(true, false, side),
          windowEnd(false, false, side),
          u,
        ),
        lerpPoint(windowEnd(true, true, side), windowEnd(false, true, side), u),
        v,
      );
    }
    panel(8, 6, sideWindow, glass);
    for (const u of [0, 1, 0.48]) {
      tube(
        [sideWindow(u, 0), sideWindow(u, 0.5), sideWindow(u, 1)],
        u === 0 ? 0.06 : 0.034,
        roof,
      );
    }
    tube(
      [sideWindow(0, 1), sideWindow(0.42, 1), sideWindow(1, 1)],
      0.023,
      roof,
    );
    tube(
      [sideWindow(0, 0), sideWindow(0.45, 0), sideWindow(1, 0)],
      0.012,
      chrome,
    );
    box([side * 0.82, 0.797, -0.38], [0.068, 0.267, 2.33], leather, 0.028);
    box([side * 0.782, 0.852, -0.39], [0.03, 0.035, 2.14], walnut, 0.013);
    for (const z of [-0.75, 0.22])
      box([side * 0.76, 0.755, z], [0.082, 0.05, 0.345], leather);
  }
  box([0, 0.369, -0.37], [1.68, 0.13, 2.32], well, 0.05);
  const seat = (side: number, z: number, back: boolean) => {
    const x = side * 0.421;
    box([x, 0.522, z], [0.614, 0.168, 0.49], leather, 0.072);
    box(
      [x, 0.79, z - 0.18],
      [0.568, 0.48, 0.154],
      leather,
      0.068,
      [-0.14, 0, 0],
    );
    box([x, 1.084, z - 0.214], [0.278, 0.173, 0.138], leather, 0.053);
    for (const sign of [-1, 1]) {
      oval([x + sign * 0.247, 0.561, z], [0.055, 0.067, 0.218], leather);
      box(
        [x + sign * 0.237, 0.8, z - 0.091],
        [0.066, 0.386, 0.087],
        leather,
        0.032,
        [-0.14, 0, 0],
      );
      tube(
        [
          [x + sign * 0.183, 0.61, z + 0.163],
          [x + sign * 0.184, 0.61, z + 0.025],
          [x + sign * 0.18, 0.604, z - 0.095],
        ],
        0.004,
        stitch,
        8,
      );
    }
    for (let i = 0; i < 5; i++) {
      const y = 0.66 + i * 0.062,
        frontZ = z - 0.085 - (y - 0.78) * 0.145;
      tube(
        [
          [x - 0.169, y + 0.008, frontZ],
          [x, y, frontZ + 0.015],
          [x + 0.169, y + 0.008, frontZ],
        ],
        0.004,
        stitch,
        8,
      );
    }
    if (back) box([x, 0.722, z + 0.14], [0.17, 0.045, 0.06], black, 0.013);
  };
  for (const side of [-1, 1]) {
    seat(side, 0.014, false);
    seat(side, -1.073, true);
  }
  box([0, 0.628, -0.13], [0.209, 0.228, 0.76], black, 0.036);
  box([0, 0.748, -0.264], [0.205, 0.071, 0.34], leather, 0.029);
  box([0, 0.746, 0.144], [0.197, 0.026, 0.32], walnut, 0.009);
  box([0, 0.827, 0.161], [0.06, 0.102, 0.064], brushed, 0.02, [-0.18, 0, 0]);
  box([0, 0.899, 0.71], [1.628, 0.187, 0.355], black, 0.06);
  box([0, 0.862, 0.52], [1.54, 0.061, 0.064], walnut, 0.018);
  box(
    [-0.228, 0.985, 0.535],
    [0.727, 0.153, 0.035],
    display,
    0.021,
    [-0.12, 0, 0],
  );
  for (const x of [-0.713, 0.318, 0.53, 0.695])
    box([x, 0.908, 0.524], [0.12, 0.032, 0.018], brushed, 0.01);
  const steer: Point = [-0.419, 0.91, 0.32];
  add(
    new THREE.TorusGeometry(0.153, 0.014, 8, 32),
    black,
    steer,
    [-0.22, 0, 0],
  );
  for (const angle of [-75, 75, 180]) {
    const theta = radians(angle);
    tube(
      [
        steer,
        [
          steer[0] + 0.07 * Math.sin(theta),
          steer[1] + 0.07 * Math.cos(theta),
          0.322,
        ],
        [
          steer[0] + 0.145 * Math.sin(theta),
          steer[1] + 0.141 * Math.cos(theta),
          0.32 - 0.031 * Math.cos(theta),
        ],
      ],
      0.009,
      brushed,
      7,
    );
  }
  oval(steer, [0.065, 0.039, 0.026], black);
  // Wheels share geometry buffers inside the finished model. The spokes are milled pairs.
  for (const side of [-1, 1])
    for (const z of axles) {
      const cx = side * 0.873,
        cy = wheelR,
        rimR = wheelR * 0.741;
      add(
        new THREE.TorusGeometry(wheelR - 0.064, 0.064, 10, 44),
        rubber,
        [cx, cy, z],
        [0, Math.PI / 2, 0],
      );
      add(
        new THREE.CylinderGeometry(wheelR - 0.013, wheelR - 0.013, 0.125, 40),
        rubber,
        [cx, cy, z],
        [0, 0, Math.PI / 2],
      );
      const face = side * 0.945;
      add(
        new THREE.CylinderGeometry(rimR, rimR, 0.012, 40),
        black,
        [face, cy, z],
        [0, 0, Math.PI / 2],
      );
      add(
        new THREE.CylinderGeometry(rimR * 0.766, rimR * 0.766, 0.014, 28),
        brushed,
        [face + side * 0.009, cy, z],
        [0, 0, Math.PI / 2],
      );
      add(
        new THREE.TorusGeometry(rimR - 0.008, 0.01, 6, 40),
        chrome,
        [face + side * 0.018, cy, z],
        [0, Math.PI / 2, 0],
      );
      const count = prestige ? 14 : 7;
      for (let i = 0; i < count; i++) {
        const theta = (2 * Math.PI * i) / count;
        for (const fork of prestige ? [0.075] : [-0.13, 0.13]) {
          const shape = (r: number, angle: number, x: number): Point => [
            face + side * x,
            cy + r * Math.cos(angle),
            z + r * Math.sin(angle),
          ];
          tube(
            [
              shape(0.062, theta, 0.038),
              shape(rimR * 0.69, theta + fork * 0.57, 0.03),
              shape(rimR - 0.014, theta + fork, 0.022),
            ],
            prestige ? 0.009 : 0.012,
            chrome,
            5,
          );
        }
      }
      add(
        new THREE.CylinderGeometry(0.066, 0.066, 0.026, 24),
        brushed,
        [face + side * 0.031, cy, z],
        [0, 0, Math.PI / 2],
      );
      add(
        new THREE.CylinderGeometry(0.029, 0.029, 0.01, 18),
        black,
        [face + side * 0.051, cy, z],
        [0, 0, Math.PI / 2],
      );
    }
  function finishBatch(parent: THREE.Group) {
    for (const [material, parts] of buckets) {
      const mesh = new THREE.Mesh(mergeGeometries(parts), material);
      mesh.name = material.name;
      mesh.castShadow = !material.transparent;
      mesh.receiveShadow = true;
      parent.add(mesh);
      for (const part of parts) part.dispose();
    }
    buckets = new Map();
  }
  finishBatch(car);

  for (const item of equipmentFor(variant)) {
    const accessory = new THREE.Group();
    accessory.name = "accessory-" + item.id;
    accessory.userData.equipment = item.id;
    if (item.id === "charger") {
      // The console ends at z=-.51. Both sockets and the trailing lead face the passenger.
      box([0, 0.657, -0.511], [0.167, 0.102, 0.014], walnut, 0.009);
      for (const x of [-0.047, 0.036]) {
        box([x, 0.661, -0.521], [0.038, 0.018, 0.007], brushed, 0.007);
        box([x, 0.661, -0.525], [0.03, 0.012, 0.004], black, 0.005);
        box([x, 0.661, -0.528], [0.02, 0.003, 0.002], brushed, 0.001);
      }
      box([-0.047, 0.661, -0.544], [0.03, 0.019, 0.04], rubber, 0.006);
      const cable: Point[] = [
        [-0.047, 0.661, -0.557],
        [-0.062, 0.651, -0.589],
        [-0.069, 0.604, -0.626],
        [-0.054, 0.57, -0.65],
        [-0.008, 0.561, -0.658],
        [0.045, 0.581, -0.642],
        [0.057, 0.612, -0.612],
        [0.052, 0.628, -0.564],
      ];
      tube(cable, 0.0065, black, 32);
      tube(
        cable.map(([x, y, z]) => [x - 0.002, y + 0.003, z]),
        0.0024,
        brushed,
        32,
      );
      box([0.052, 0.629, -0.553], [0.025, 0.014, 0.036], rubber, 0.005);
      box([0.052, 0.629, -0.529], [0.02, 0.007, 0.014], chrome, 0.003);
    }
    if (item.id === "water") {
      const x = -0.708,
        z = -0.796;
      const cylinder = (
        r1: number,
        r2: number,
        h: number,
        y: number,
        mat: Material,
      ) => add(new THREE.CylinderGeometry(r1, r2, h, 28), mat, [x, y, z]);
      const ring = (r: number, t: number, y: number, mat: Material) =>
        add(
          new THREE.TorusGeometry(r, t, 5, 28),
          mat,
          [x, y, z],
          [Math.PI / 2, 0, 0],
        );
      const shell = finish("bottle", 0xc3e6ed, 0.06, 0.15, {
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      });
      const water = finish("water", 0x79acb5, 0.11, 0.2, {
        transparent: true,
        opacity: 0.71,
        depthWrite: false,
      });
      const paper = finish("bottle-label", 0xf7f1de, 0.02, 0.77);
      const enamel = finish("cap", 0x284746, 0.32, 0.27);
      box([-0.755, 0.621, z], [0.145, 0.077, 0.144], black, 0.02);
      cylinder(0.058, 0.051, 0.085, 0.65, black);
      ring(0.055, 0.005, 0.693, brushed);
      const outline = [
        [0.001, 0.653],
        [0.035, 0.653],
        [0.044, 0.661],
        [0.047, 0.68],
        [0.046, 0.709],
        [0.045, 0.738],
        [0.049, 0.75],
        [0.049, 0.801],
        [0.047, 0.83],
        [0.042, 0.843],
        [0.028, 0.863],
        [0.019, 0.869],
        [0.019, 0.892],
        [0.001, 0.892],
      ];
      add(
        new THREE.LatheGeometry(
          outline.map(([r, y]) => new THREE.Vector2(r, y)),
          32,
        ),
        shell,
        [x, 0, z],
      );
      cylinder(0.044, 0.043, 0.137, 0.743, water);
      cylinder(0.048, 0.048, 0.046, 0.767, paper);
      for (const y of [0.749, 0.755, 0.779]) ring(0.048, 0.0018, y, enamel);
      for (const y of [0.711, 0.72, 0.729, 0.815, 0.825])
        ring(0.046, 0.0015, y, shell);
      cylinder(0.023, 0.023, 0.026, 0.891, enamel);
      for (let i = 0; i < 20; i++) {
        const angle = (i * Math.PI) / 10;
        box(
          [x + 0.023 * Math.cos(angle), 0.891, z + 0.023 * Math.sin(angle)],
          [0.0017, 0.02, 0.0017],
          brushed,
          0.0005,
        );
      }
    }
    if (item.id === "sweets") {
      box([0, 0.634, -1.034], [0.207, 0.117, 0.35], leather, 0.028);
      box([0, 0.703, -0.981], [0.174, 0.013, 0.177], walnut, 0.008);
      for (const sign of [-1, 1]) {
        box(
          [sign * 0.084, 0.716, -0.981],
          [0.009, 0.024, 0.178],
          brushed,
          0.004,
        );
        box(
          [0, 0.716, -0.981 + sign * 0.085],
          [0.166, 0.024, 0.009],
          brushed,
          0.004,
        );
      }
      const foil = finish("champagne-wrapper", 0xbb9652, 0.6, 0.28);
      const mint = finish("sage-wrapper", 0x688a80, 0.57, 0.31);
      const rose = finish("copper-wrapper", 0xc08163, 0.55, 0.3);
      for (const [x, z, angle, wrapper] of [
        [-0.029, -1.025, 0.14, foil],
        [0.025, -0.988, -0.41, mint],
        [-0.025, -0.943, 0.38, rose],
      ] as [number, number, number, Material][]) {
        const centre: Point = [x, 0.729, z];
        const geom = new THREE.SphereGeometry(1, 10, 7).scale(
          0.024,
          0.014,
          0.016,
        );
        add(geom, wrapper, centre, [0, angle, 0]);
        for (const sign of [-1, 1]) {
          const xt = (d: number): Point => [
            x + sign * d * Math.cos(angle),
            0.729,
            z - sign * d * Math.sin(angle),
          ];
          const paper = new THREE.CylinderGeometry(
            0.011,
            0.003,
            0.016,
            6,
            1,
            false,
          );
          paper.rotateZ((sign * -Math.PI) / 2);
          add(paper, wrapper, xt(0.029), [0, angle, 0]);
          oval(xt(0.021), [0.004, 0.006, 0.005], chrome);
        }
      }
    }
    finishBatch(accessory);
    car.add(accessory);
  }
  return car;
}
