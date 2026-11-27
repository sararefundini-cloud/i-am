import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, fbm, mulberry32, smoothstep } from "./noise.js";
import { LEAF_CENTER_FRACTION } from "./leafTexture.js";
import { sampleTerrain } from "./terrain.js";
const TAU = Math.PI * 2;
const SEED = 19;
function resample(pts, n) {
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.35);
  return curve.getPoints(n);
}
function framesOf(points, kind) {
  const tangents = [];
  const normals = [];
  const binormals = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < points.length; i++) {
    const t = new THREE.Vector3();
    if (i === 0) t.subVectors(points[1], points[0]);
    else if (i === points.length - 1) t.subVectors(points[i], points[i - 1]);
    else t.subVectors(points[i + 1], points[i - 1]);
    if (t.lengthSq() < 1e-8) t.set(0, 1, 0);
    tangents.push(t.normalize());
  }
  if (kind === "root") {
    for (let i = 0; i < points.length; i++) {
      const t = tangents[i];
      const b = new THREE.Vector3(-t.z, 0, t.x);
      if (b.lengthSq() < 1e-6) b.set(1, 0, 0);
      b.normalize();
      const n = new THREE.Vector3().crossVectors(b, t);
      if (n.y < 0) {
        n.negate();
        b.negate();
      }
      n.normalize();
      normals.push(n);
      binormals.push(b);
    }
    return { tangents, normals, binormals };
  }
  let nrm = new THREE.Vector3().crossVectors(tangents[0], up);
  if (nrm.lengthSq() < 1e-6) nrm.crossVectors(tangents[0], new THREE.Vector3(1, 0, 0));
  nrm.normalize();
  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      const axis = new THREE.Vector3().crossVectors(tangents[i - 1], tangents[i]);
      const sin = axis.length();
      const cos = clamp(tangents[i - 1].dot(tangents[i]), -1, 1);
      if (sin > 1e-5) {
        axis.multiplyScalar(1 / sin);
        nrm.applyAxisAngle(axis, Math.atan2(sin, cos));
      }
    }
    nrm.addScaledVector(tangents[i], -nrm.dot(tangents[i]));
    if (nrm.lengthSq() < 1e-8) nrm.crossVectors(tangents[i], up);
    nrm.normalize();
    if (normals.length > 0 && nrm.dot(normals[normals.length - 1]) < 0) nrm.negate();
    const b = new THREE.Vector3().crossVectors(tangents[i], nrm).normalize();
    normals.push(nrm.clone());
    binormals.push(b);
  }
  return { tangents, normals, binormals };
}
function radiiAlong(count, r0, r1, order, kind, rng) {
  const phase = rng() * TAU;
  const radii = [];
  const knots = [];
  if (order <= 1) {
    const nKnots = order === 0 ? 3 : 2;
    for (let k = 0; k < nKnots; k++) {
      knots.push({
        t: 0.18 + rng() * 0.7,
        amp: 0.18 + rng() * 0.28,
        width: 0.035 + rng() * 0.03
      });
    }
  }
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const taper = r0 * Math.pow(Math.max(r1, 15e-4) / Math.max(r0, 15e-4), t);
    const collar = order > 0 ? 1 + 0.85 * Math.exp(-t * 12) : 1;
    const basal = kind === "trunk" || kind === "root" ? 1 + 0.62 * Math.exp(-t * 4.8) : 1;
    const pulse = 1 + 0.05 * Math.sin(t * 11 + phase) * Math.sin(t * 3.5 + phase);
    let knot = 1;
    for (const kn of knots) {
      const d = (t - kn.t) / kn.width;
      knot += kn.amp * Math.exp(-d * d);
    }
    radii.push(Math.max(22e-4, taper * collar * basal * pulse * knot));
  }
  return radii;
}
function liftOffGround(pts, clearance) {
  for (const p of pts) {
    const g = sampleTerrain(p.x, p.z) + clearance;
    if (p.y < g) p.y = g;
  }
}
function pointAt(branch, t) {
  const f = clamp(t, 0, 0.999) * (branch.pts.length - 1);
  const i = Math.floor(f);
  const u = f - i;
  return branch.pts[i].clone().lerp(branch.pts[Math.min(i + 1, branch.pts.length - 1)], u);
}
function tangentAt(branch, t) {
  const f = clamp(t, 0, 0.999) * (branch.pts.length - 1);
  const i = Math.floor(f);
  return branch.tangents[Math.min(i, branch.tangents.length - 1)].clone();
}
function radiusAt(branch, t) {
  const f = clamp(t, 0, 0.999) * (branch.radii.length - 1);
  const i = Math.floor(f);
  const u = f - i;
  const a = branch.radii[i];
  const b = branch.radii[Math.min(i + 1, branch.radii.length - 1)];
  return a + (b - a) * u;
}
function ellipsoidPoint(center, radii, rotY, dir, bury) {
  const local = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotY).normalize();
  const p = new THREE.Vector3(local.x * radii.x, local.y * radii.y, local.z * radii.z);
  p.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
  p.add(center);
  p.lerp(center, bury);
  return p;
}
function buildFigTree(barkMat, leafGeo, leafMats, disp) {
  const rng = mulberry32(SEED);
  const ground0 = sampleTerrain(0, 0);
  const branches = [];
  let nextId = 1;
  const makeBranch = (raw, r0, r1, order, kind, flat, tile, segs) => {
    const pts = resample(raw, segs);
    const fr = framesOf(pts, kind);
    const radii = radiiAlong(pts.length, r0, r1, order, kind, rng);
    const branch = {
      id: nextId++,
      order,
      kind,
      pts,
      radii,
      tangents: fr.tangents,
      normals: fr.normals,
      binormals: fr.binormals,
      flat,
      tile
    };
    branches.push(branch);
    return branch;
  };
  const trunk = makeBranch(
    [
      new THREE.Vector3(0, ground0 - 0.04, 0),
      new THREE.Vector3(0.05, ground0 + 0.32, 0.04),
      new THREE.Vector3(-0.04, ground0 + 0.68, -0.03),
      new THREE.Vector3(0.08, ground0 + 1.05, 0.05),
      new THREE.Vector3(0.02, ground0 + 1.38, -0.02)
    ],
    0.46,
    0.22,
    0,
    "trunk",
    0.86,
    1,
    36
  );
  const gripDefs = [
    { x: 1.42, z: 0.78, rx: 0.78, ry: 0.5, rz: 0.66, rot: 0.45, kind: "boulder" },
    { x: -1.62, z: 0.38, rx: 0.88, ry: 0.56, rz: 0.72, rot: 1.15, kind: "mossA" },
    { x: 0.28, z: -1.48, rx: 0.64, ry: 0.42, rz: 0.58, rot: 2.2, kind: "mossB" },
    { x: -0.42, z: 1.52, rx: 0.52, ry: 0.36, rz: 0.48, rot: -0.4, kind: "mossA" }
  ];
  const grips = gripDefs.map((g) => {
    const gy = sampleTerrain(g.x, g.z) + g.ry * 0.42;
    return {
      position: new THREE.Vector3(g.x, gy, g.z),
      width: Math.max(g.rx, g.rz) * 2,
      height: g.ry * 2,
      rotY: g.rot,
      kind: g.kind
    };
  });
  gripDefs.forEach((g, index) => {
    const center = grips[index].position;
    const radii = new THREE.Vector3(g.rx, g.ry, g.rz);
    const ang = Math.atan2(center.z, center.x);
    const approach = Math.max(0.35, Math.hypot(center.x, center.z) - Math.max(g.rx, g.rz) * 0.95);
    const ax = Math.cos(ang) * approach;
    const az = Math.sin(ang) * approach;
    const side = ellipsoidPoint(
      center,
      radii,
      g.rot,
      new THREE.Vector3(-Math.cos(ang), 0.05, -Math.sin(ang)),
      0.16
    );
    const crown = ellipsoidPoint(
      center,
      radii,
      g.rot,
      new THREE.Vector3(-Math.cos(ang) * 0.25 + Math.sin(ang) * 0.35, 0.82, -Math.sin(ang) * 0.25 - Math.cos(ang) * 0.2),
      0.1
    );
    const far = ellipsoidPoint(
      center,
      radii,
      g.rot,
      new THREE.Vector3(Math.cos(ang) * 0.55, -0.15, Math.sin(ang) * 0.55),
      0.22
    );
    far.y = Math.min(far.y, sampleTerrain(far.x, far.z) + 0.04);
    const start = new THREE.Vector3(Math.cos(ang) * 0.08, ground0 + 0.16, Math.sin(ang) * 0.08);
    const mid = new THREE.Vector3(ax, sampleTerrain(ax, az) + 0.03, az);
    makeBranch(
      [start, mid, side, crown, far],
      0.2 + (index < 2 ? 0.06 : 0),
      0.035,
      0,
      "root",
      0.4,
      1,
      28
    );
  });
  const crawlAngles = [0.9, 2.2, 3.4, -0.7, -2.1];
  crawlAngles.forEach((ang, i) => {
    const length = 1.3 + i % 3 * 0.45;
    const pts = [];
    const steps = 5;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const dist2 = 0.12 + Math.pow(t, 0.9) * length;
      const wobble = Math.sin(t * 4.5 + ang * 2) * 0.16 * t;
      const x = Math.cos(ang) * dist2 + Math.cos(ang + 1.57) * wobble;
      const z = Math.sin(ang) * dist2 + Math.sin(ang + 1.57) * wobble;
      const y = s === 0 ? ground0 + 0.14 : sampleTerrain(x, z) + 0.025 + (1 - t) * 0.04;
      pts.push(new THREE.Vector3(x, y, z));
    }
    makeBranch(pts, 0.16 - i * 0.012, 0.03, 0, "root", 0.42, 1, 22);
  });
  const primarySpecs = [
    { t: 0.97, az: 0.42, el: 0.42, len: 4.3, droop: 1.25, r1: 0.02 },
    { t: 0.92, az: 2.45, el: 0.92, len: 3.55, droop: 0.72, r1: 0.018 },
    { t: 0.88, az: -1.05, el: 0.7, len: 3.25, droop: 0.88, r1: 0.016 },
    { t: 0.8, az: -2.45, el: 0.58, len: 2.95, droop: 0.78, r1: 0.015 },
    { t: 0.7, az: 1.85, el: 0.32, len: 2.15, droop: 0.9, r1: 0.014 },
    { t: 0.6, az: -0.15, el: 1.12, len: 2.35, droop: 0.42, r1: 0.013 }
  ];
  const primaries = [];
  for (const spec of primarySpecs) {
    const start = pointAt(trunk, spec.t);
    const parentT = tangentAt(trunk, spec.t);
    const parentR = radiusAt(trunk, spec.t);
    start.addScaledVector(parentT, -parentR * 0.45);
    const dir = new THREE.Vector3(Math.cos(spec.az) * Math.cos(spec.el), Math.sin(spec.el), Math.sin(spec.az) * Math.cos(spec.el));
    dir.addScaledVector(parentT, 0.25).normalize();
    const pts = growCurve(start, dir, spec.len, spec.droop, 1.4, rng);
    liftOffGround(pts, 0.08);
    pts[0].copy(start);
    const r0 = parentR * 0.72;
    primaries.push(makeBranch(pts, r0, spec.r1, 1, "limb", 0.9, 0.95, Math.max(18, Math.floor(spec.len * 12))));
  }
  const secondaries = [];
  for (const parent of primaries) {
    const count = 3 + Math.floor(rng() * 2);
    for (let i = 0; i < count; i++) {
      const t = 0.3 + i / Math.max(1, count - 1) * 0.62;
      secondaries.push(spawnChild(parent, t, 2, rng));
    }
  }
  const twigs = [];
  for (const parent of secondaries) {
    const count = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const t = 0.22 + i / Math.max(1, count - 1) * 0.74;
      twigs.push(spawnChild(parent, t, 3, rng));
    }
  }
  function spawnChild(parent, t, order, rand) {
    const start = pointAt(parent, t);
    const tang = tangentAt(parent, t);
    const pr = radiusAt(parent, t);
    start.addScaledVector(tang, -pr * 0.55);
    const outward = start.clone();
    outward.y = 0;
    if (outward.lengthSq() < 0.04) outward.set(1, 0, 0);
    outward.normalize();
    const side = new THREE.Vector3().crossVectors(tang, new THREE.Vector3(0, 1, 0));
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const dir = tang.clone().multiplyScalar(order === 2 ? 0.55 : 0.35);
    dir.addScaledVector(outward, order === 2 ? 0.65 : 0.85);
    dir.y += order === 2 ? 0.22 + rand() * 0.38 : 0.15 + rand() * 0.45;
    dir.addScaledVector(side, (rand() < 0.5 ? -1 : 1) * (0.35 + rand() * 0.55));
    dir.normalize();
    let len = parentLength(parent) * (order === 2 ? 0.42 + rand() * 0.22 : 0.34 + rand() * 0.28);
    if (order === 2) len = clamp(len, 0.85, 2.35);
    else len = clamp(len, 0.22, 0.78);
    const droop = order === 2 ? 0.55 + rand() * 0.4 : 0.2 + rand() * 0.35;
    const pts = growCurve(start, dir, len, droop, order === 2 ? 1.8 : 2.6, rand);
    liftOffGround(pts, order === 3 ? 0.05 : 0.07);
    pts[0].copy(start);
    const r0 = Math.min(pr * (0.52 + rand() * 0.12), pr * 0.85);
    const r1 = order === 2 ? 8e-3 + rand() * 6e-3 : 24e-4 + rand() * 15e-4;
    const tile = order === 2 ? 0.38 : 0.07;
    const segs = order === 2 ? Math.max(12, Math.floor(len * 10)) : Math.max(5, Math.floor(len * 9));
    return makeBranch(pts, r0, r1, order, "limb", order === 3 ? 0.95 : 0.88, tile, segs);
  }
  const segments = buildSegments(branches);
  const hash = buildHash(segments);
  const geometries = [];
  for (const branch of branches) {
    geometries.push(meshBranch(branch, disp, segments, hash, ground0));
  }
  const merged = mergeGeometries(geometries, false);
  if (!merged) throw new Error("Fig trunk mesh could not be merged.");
  for (const g of geometries) g.dispose();
  merged.computeVertexNormals();
  const bark = new THREE.Mesh(merged, barkMat);
  bark.castShadow = true;
  bark.receiveShadow = true;
  bark.name = "fig-bark";
  const leafBuckets = leafMats.map(() => []);
  const leafColors = leafMats.map(() => []);
  const focus = {
    score: -Infinity,
    center: new THREE.Vector3(),
    normal: new THREE.Vector3(0, 1, 0)
  };
  const leafy = [...twigs, ...secondaries];
  for (const branch of leafy) {
    const alongTwig = branch.order === 3;
    const samples = alongTwig ? 6 : 4;
    const t0 = alongTwig ? 0.06 : 0.22;
    for (let i = 0; i < samples; i++) {
      const t = t0 + (1 - t0) * (i + 0.45) / samples;
      const cluster = i >= samples - 2 ? alongTwig ? 3 : 2 : 1;
      for (let k = 0; k < cluster; k++) {
        placeLeaf(branch, t, i * 5 + k, rng, leafBuckets, leafColors, focus);
      }
    }
  }
  const leaves = leafBuckets.map((bucket, v) => {
    const mesh = new THREE.InstancedMesh(leafGeo, leafMats[v], Math.max(1, bucket.length));
    const c = new THREE.Color();
    if (bucket.length === 0) {
      mesh.setMatrixAt(0, new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4));
      mesh.setColorAt(0, c.setRGB(1, 1, 1));
    }
    for (let i = 0; i < bucket.length; i++) {
      mesh.setMatrixAt(i, bucket[i]);
      mesh.setColorAt(i, leafColors[v][i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `fig-leaves-${v}`;
    return mesh;
  });
  const box = new THREE.Box3().setFromObject(bark);
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, 7);
  const dist = span * 1.22;
  const heroPos = new THREE.Vector3(dist * 0.42, ground0 + 1.62, dist * 0.98);
  const heroTarget = new THREE.Vector3(0.12, ground0 + Math.min(size.y * 0.4, 2.7), -0.1);
  const barkTarget = new THREE.Vector3(0.18, ground0 + 0.62, 0.22);
  const barkPos = barkTarget.clone().add(new THREE.Vector3(0.15, 0.28, 1.05));
  const leafTarget = focus.center.clone();
  const leafPos = focus.center.clone().addScaledVector(focus.normal, 0.48).add(new THREE.Vector3(0.04, 0.06, 0.05));
  const leafTotal = leafBuckets.reduce((s, b) => s + b.length, 0);
  console.info(
    `Fig built: ${branches.length} limbs, ${Math.round(merged.index ? merged.index.count / 3 : 0)} bark tris, ${leafTotal} leaves`
  );
  return {
    bark,
    leaves,
    grips,
    shots: {
      hero: { pos: heroPos, target: heroTarget, fov: 38 },
      bark: { pos: barkPos, target: barkTarget, fov: 30 },
      leaves: { pos: leafPos, target: leafTarget, fov: 30 }
    }
  };
}
function parentLength(branch) {
  let len = 0;
  for (let i = 1; i < branch.pts.length; i++) len += branch.pts[i].distanceTo(branch.pts[i - 1]);
  return Math.max(0.2, len);
}
function growCurve(start, dir, length, droop, crook, rng) {
  const pts = [start.clone()];
  const steps = 4;
  let p = start.clone();
  const d = dir.clone().normalize();
  const phase = rng() * TAU;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    d.y -= droop * (0.12 + t * 0.1);
    const side = new THREE.Vector3(-d.z, 0, d.x);
    if (side.lengthSq() > 1e-6) {
      side.normalize();
      d.addScaledVector(side, Math.sin(t * Math.PI * crook + phase) * 0.38);
    }
    d.x += Math.sin(t * 9 + phase) * 0.06;
    d.z += Math.cos(t * 7 + phase) * 0.06;
    if (d.lengthSq() < 1e-6) d.set(0, 1, 0);
    d.normalize();
    p = p.clone().addScaledVector(d, length / steps);
    pts.push(p);
  }
  return pts;
}
function buildSegments(branches) {
  const segs = [];
  for (const b of branches) {
    for (let i = 0; i < b.pts.length - 1; i++) {
      const a = b.pts[i];
      const c = b.pts[i + 1];
      segs.push({
        ax: a.x,
        ay: a.y,
        az: a.z,
        bx: c.x,
        by: c.y,
        bz: c.z,
        ra: b.radii[i],
        rb: b.radii[i + 1],
        id: b.id
      });
    }
  }
  return segs;
}
function buildHash(segs) {
  const cell = 0.5;
  const map = /* @__PURE__ */ new Map();
  const insert = (ix, iy, iz, index) => {
    const k = `${ix},${iy},${iz}`;
    let bucket = map.get(k);
    if (!bucket) {
      bucket = [];
      map.set(k, bucket);
    }
    bucket.push(index);
  };
  segs.forEach((s, index) => {
    const pad = Math.max(s.ra, s.rb) + 0.28;
    const minx = Math.floor((Math.min(s.ax, s.bx) - pad) / cell);
    const maxx = Math.floor((Math.max(s.ax, s.bx) + pad) / cell);
    const miny = Math.floor((Math.min(s.ay, s.by) - pad) / cell);
    const maxy = Math.floor((Math.max(s.ay, s.by) + pad) / cell);
    const minz = Math.floor((Math.min(s.az, s.bz) - pad) / cell);
    const maxz = Math.floor((Math.max(s.az, s.bz) + pad) / cell);
    for (let ix = minx; ix <= maxx; ix++) {
      for (let iy = miny; iy <= maxy; iy++) {
        for (let iz = minz; iz <= maxz; iz++) insert(ix, iy, iz, index);
      }
    }
  });
  return { cell, map };
}
function segDist(px, py, pz, s) {
  const abx = s.bx - s.ax;
  const aby = s.by - s.ay;
  const abz = s.bz - s.az;
  const apx = px - s.ax;
  const apy = py - s.ay;
  const apz = pz - s.az;
  const ab2 = abx * abx + aby * aby + abz * abz;
  let t = ab2 > 1e-8 ? (apx * abx + apy * aby + apz * abz) / ab2 : 0;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = s.ax + abx * t;
  const cy = s.ay + aby * t;
  const cz = s.az + abz * t;
  const dx = px - cx;
  const dy = py - cy;
  const dz = pz - cz;
  return Math.hypot(dx, dy, dz) - (s.ra + (s.rb - s.ra) * t);
}
function smin(a, b, k) {
  const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1);
  return b * (1 - h) + a * h - k * h * (1 - h);
}
function projectJoint(p, branch, segs, hash) {
  if (branch.order === 3) return;
  const k = branch.kind === "root" ? 0.18 : branch.order === 1 ? 0.15 : branch.order === 2 ? 0.07 : 0.16;
  const nearby = (x, y, z) => {
    const ix = Math.floor(x / hash.cell);
    const iy = Math.floor(y / hash.cell);
    const iz = Math.floor(z / hash.cell);
    const ids = hash.map.get(`${ix},${iy},${iz}`);
    return ids ?? [];
  };
  const field = (x, y, z) => {
    const ids = nearby(x, y, z);
    let own = 1e9;
    let other = 1e9;
    for (const id of ids) {
      const d = segDist(x, y, z, segs[id]);
      if (segs[id].id === branch.id) own = Math.min(own, d);
      else other = Math.min(other, d);
    }
    if (own > 10) own = 0;
    if (other > 10) return { d: own, other };
    return { d: smin(own, other, k), other };
  };
  const first = field(p.x, p.y, p.z);
  if (first.other > k * 1.35) return;
  for (let iter = 0; iter < 4; iter++) {
    const f = field(p.x, p.y, p.z);
    if (Math.abs(f.d) < 2e-3) break;
    const e = 0.01;
    const dx = field(p.x + e, p.y, p.z).d - f.d;
    const dy = field(p.x, p.y + e, p.z).d - f.d;
    const dz = field(p.x, p.y, p.z + e).d - f.d;
    const gl = Math.hypot(dx, dy, dz) || 1;
    p.x += -f.d * dx / gl * 0.65;
    p.y += -f.d * dy / gl * 0.65;
    p.z += -f.d * dz / gl * 0.65;
  }
}
function meshBranch(branch, disp, segs, hash, ground0) {
  const radial = branch.order === 0 ? branch.kind === "root" ? 28 : 48 : branch.order === 1 ? 26 : branch.order === 2 ? 14 : 7;
  const rows = branch.pts.length;
  const cols = radial + 1;
  const positions = [];
  const uvs = [];
  const colors = [];
  const moss = [];
  const wet = [];
  const indices = [];
  const midR = (branch.radii[0] + branch.radii[branch.radii.length - 1]) * 0.5;
  const around = Math.max(1, Math.round(TAU * Math.max(midR, 0.01) / branch.tile));
  const amp = branch.kind === "root" ? 0.01 : branch.order === 0 ? 0.022 : branch.order === 1 ? 0.012 : branch.order === 2 ? 45e-4 : 1e-3;
  const lumpAmp = branch.kind === "root" ? 0.018 : branch.order === 0 ? 0.032 : branch.order === 1 ? 0.018 : 5e-3;
  let dist = 0;
  const radialDir = new THREE.Vector3();
  const offset = new THREE.Vector3();
  for (let i = 0; i < rows; i++) {
    if (i > 0) dist += branch.pts[i].distanceTo(branch.pts[i - 1]);
    const center = branch.pts[i];
    const N = branch.normals[i];
    const B = branch.binormals[i];
    const radius = branch.radii[i];
    const along = rows === 1 ? 0 : i / (rows - 1);
    const flatNow = branch.kind === "root" ? 0.9 + (branch.flat - 0.9) * smoothstep(0.12, 0.62, along) : branch.flat;
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * TAU;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const lump = 1 + lumpAmp * fbm(center.x * 2.1 + a * 0.15, center.y * 1.6, center.z * 2.1, 4);
      const oval = 1 + 0.12 * Math.sin(a * 2 + dist * 1.7) * (branch.order < 2 ? 1 : 0.25);
      const rx = radius * lump * oval;
      const ry = radius * flatNow * lump * (2 - oval * 0.15);
      offset.copy(B).multiplyScalar(c * rx).addScaledVector(N, s * ry);
      radialDir.copy(offset);
      const rl = radialDir.length() || 1;
      radialDir.multiplyScalar(1 / rl);
      const u = j / radial * around;
      const v = dist / branch.tile;
      const d = disp(u, v) - 0.5;
      const fiss = Math.pow(1 - Math.abs(fbm(center.x * 4.5 + c, center.y * 5.2, center.z * 4.5 + s, 3)), 3);
      offset.addScaledVector(radialDir, d * amp * 2.2 - fiss * amp * 0.65);
      const pos = center.clone().add(offset);
      positions.push(pos.x, pos.y, pos.z);
      uvs.push(u, v);
      const height = pos.y - sampleTerrain(pos.x, pos.z);
      let mossAmt = 0;
      if (branch.kind !== "limb" || branch.order === 0) {
        mossAmt = clamp(smoothstep(1.15, 0.05, height) * 0.65 + fiss * 0.4 * smoothstep(1.6, 0.15, height), 0, 0.8);
      } else if (branch.order === 1) {
        mossAmt = clamp(fiss * 0.22 * smoothstep(2.2, 0.4, pos.y - ground0), 0, 0.35);
      }
      const wetAmt = clamp(smoothstep(0.9, 0.02, height) * (branch.order >= 2 ? 0.35 : 0.8), 0, 1);
      moss.push(mossAmt);
      wet.push(wetAmt);
      let ao = clamp(0.62 + (0.5 - d) * 0.45 - fiss * 0.18, 0.42, 1);
      let cr = ao;
      let cg = ao;
      let cb = ao;
      if (branch.order === 3) {
        cr = ao * 0.78;
        cg = ao * 0.95;
        cb = ao * 0.62;
      } else if (branch.order === 2) {
        cr = ao * 0.88;
        cg = ao * 0.96;
        cb = ao * 0.74;
      }
      colors.push(cr, cg, cb);
    }
  }
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("uv2", new THREE.Float32BufferAttribute(uvs.slice(), 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("aMoss", new THREE.Float32BufferAttribute(moss, 1));
  geo.setAttribute("aWet", new THREE.Float32BufferAttribute(wet, 1));
  geo.setIndex(indices);
  return geo;
}
function placeLeaf(branch, t, salt, rng, buckets, colors, focus) {
  const origin = pointAt(branch, t);
  const tangent = tangentAt(branch, t).normalize();
  const pr = radiusAt(branch, t);
  const spin = salt * 2.399 + rng() * 0.35;
  const outward = new THREE.Vector3(-tangent.z, 0, tangent.x);
  if (outward.lengthSq() < 1e-6) outward.set(1, 0, 0);
  outward.normalize();
  outward.applyAxisAngle(tangent, spin);
  outward.y += 0.45 + rng() * 0.35;
  outward.normalize();
  const yAxis = outward.clone();
  const zAxis = new THREE.Vector3(0, 1, 0).addScaledVector(outward, -0.25);
  zAxis.addScaledVector(tangent, (rng() - 0.5) * 0.45);
  zAxis.addScaledVector(yAxis, -zAxis.dot(yAxis));
  if (zAxis.lengthSq() < 1e-6) zAxis.set(0, 0, 1);
  zAxis.normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
  zAxis.crossVectors(xAxis, yAxis).normalize();
  const s = (branch.order === 3 ? 1.02 : 0.9) * (0.72 + rng() * 0.58);
  if (rng() < 0.5) xAxis.negate();
  const surface = origin.clone().addScaledVector(outward, pr * 0.85);
  const m = new THREE.Matrix4().makeBasis(xAxis.clone().multiplyScalar(s), yAxis.clone().multiplyScalar(s), zAxis.clone().multiplyScalar(s));
  m.setPosition(surface);
  const variation = Math.floor(rng() * buckets.length);
  buckets[variation].push(m);
  const tint = new THREE.Color();
  if (rng() < 0.12) tint.setRGB(0.95, 0.88, 0.55);
  else tint.setRGB(0.82 + rng() * 0.2, 0.88 + rng() * 0.16, 0.72 + rng() * 0.12);
  colors[variation].push(tint);
  const center = surface.clone().addScaledVector(yAxis, 0.34 * s * LEAF_CENTER_FRACTION);
  let score = 0;
  if (center.y > sampleTerrain(0, 0) + 1.6 && center.y < sampleTerrain(0, 0) + 4.8) score += 3;
  if (center.z > 0.3) score += 2;
  score += zAxis.z * 3 + zAxis.y * 1.2;
  const radial = Math.hypot(center.x, center.z);
  if (radial > 1.1 && radial < 4.2) score += 2;
  score += center.x * 0.12;
  if (score > focus.score) {
    focus.score = score;
    focus.center.copy(center);
    focus.normal.copy(zAxis);
  }
}
export {
  buildFigTree
};
