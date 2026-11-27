import * as THREE from "three";
import { clamp, fbm01, smoothstep } from "./noise.js";
function sampleTerrain(x, z) {
  const d = Math.hypot(x, z);
  let h = -z * 0.042 + x * 8e-3;
  h += fbm01(x * 0.09, z * 0.09, 0.4, 5) * 1.15;
  h += fbm01(x * 0.28 + 4.2, z * 0.28, 1.7, 4) * 0.38;
  h += (fbm01(x * 0.85, z * 0.85, 3.1, 3) - 0.5) * 0.08;
  h -= Math.exp(-(d * d) / 10.5) * 0.16;
  const edge = smoothstep(22, 34, d);
  h -= edge * edge * 7.5;
  return h;
}
function buildGround(material) {
  const size = 72;
  const seg = 260;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const colors = new Float32Array(pos.count * 3);
  const moss = new Float32Array(pos.count);
  const wet = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = sampleTerrain(x, z);
    pos.setY(i, y);
    uv.setXY(i, x / 1.3, z / 1.3);
    const hL = sampleTerrain(x - 0.35, z);
    const hR = sampleTerrain(x + 0.35, z);
    const hD = sampleTerrain(x, z - 0.35);
    const hU = sampleTerrain(x, z + 0.35);
    const slope = Math.hypot(hR - hL, hU - hD);
    const n = fbm01(x * 0.37 + 2.2, z * 0.37, 0.2, 4);
    const n2 = fbm01(x * 0.16 + 8, z * 0.21, 1.4, 3);
    let m = smoothstep(0.5, 0.74, n) * (1 - smoothstep(0.28, 0.85, slope));
    m = Math.max(m, smoothstep(0.58, 0.82, n2) * 0.75 * (1 - smoothstep(0.4, 1.1, slope)));
    const nearTrunk = Math.exp(-Math.hypot(x, z) * 0.55);
    m = clamp(m + nearTrunk * 0.28 * n, 0, 0.88);
    moss[i] = m;
    const moisture = smoothstep(0.42, 0.72, fbm01(x * 0.11 + 3.4, z * 0.11, 2.2, 3));
    wet[i] = clamp(moisture * (1 - slope * 0.45) + nearTrunk * 0.18, 0, 1);
    const ao = clamp(0.78 + 0.22 * (1 - wet[i]) - nearTrunk * 0.18, 0.45, 1);
    colors[i * 3] = ao;
    colors[i * 3 + 1] = ao;
    colors[i * 3 + 2] = ao * 0.98;
  }
  geo.setAttribute("uv2", new THREE.BufferAttribute(uv.array.slice(0), 2));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aMoss", new THREE.BufferAttribute(moss, 1));
  geo.setAttribute("aWet", new THREE.BufferAttribute(wet, 1));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  mesh.name = "ground";
  return mesh;
}
export {
  buildGround,
  sampleTerrain
};
