import * as THREE from "three";
import { buildFigTree } from "./tree.js";
import { createLeafGeometry, loadFigLeafMaps } from "./leafTexture.js";
import { applyLeafLighting, applySurfaceMix } from "./shaders.js";
import { sampleTerrain } from "./terrain.js";

const BARK_BROWN = "#6b4e37";
const OLIVE = "#4f6b32";
const BARK_TINT = "#d2cdc4";

function file(path) {
  return new URL(path, import.meta.url).href;
}

function loadTex(url, color, anisotropy) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        tex.anisotropy = anisotropy;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

function imageSampler(image) {
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return () => 0.5;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  return (u, v) => {
    let uu = u - Math.floor(u);
    let vv = v - Math.floor(v);
    if (uu < 0) uu += 1;
    if (vv < 0) vv += 1;
    const x = Math.min(w - 1, Math.max(0, Math.floor(uu * (w - 1))));
    const y = Math.min(h - 1, Math.max(0, Math.floor((1 - vv) * (h - 1))));
    return data[(y * w + x) * 4] / 255;
  };
}

function keepVisible(mesh) {
  mesh.frustumCulled = false;
}

export function mountApprovedFig(renderer) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const leafGeo = createLeafGeometry();
  const barkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BARK_BROWN),
    roughness: 0.92,
    metalness: 0,
    aoMapIntensity: 0.85,
    envMapIntensity: 0.95,
    vertexColors: true,
    normalScale: new THREE.Vector2(1.2, 1.2),
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(OLIVE),
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.7,
    side: THREE.DoubleSide,
    alphaTest: 0.45,
    normalScale: new THREE.Vector2(0.7, 0.7),
  });
  const fig = buildFigTree(barkMat, leafGeo, [leafMat], () => 0.5);
  const group = new THREE.Group();
  group.name = "approved-fig";
  group.add(fig.bark, ...fig.leaves);
  keepVisible(fig.bark);
  fig.leaves.forEach(keepVisible);

  Promise.all([
    loadTex(file("bark/bark_brown_02_diff_2k.jpg"), true, anisotropy),
    loadTex(file("bark/bark_brown_02_nor_gl_2k.jpg"), false, anisotropy),
    loadTex(file("bark/bark_brown_02_rough_2k.jpg"), false, anisotropy),
    loadTex(file("bark/bark_brown_02_ao_2k.jpg"), false, anisotropy),
    loadTex(file("bark/bark_brown_02_disp_2k.jpg"), false, anisotropy),
    loadTex(file("moss/mossy_rock_diff_2k.jpg"), true, anisotropy),
    loadFigLeafMaps(anisotropy),
  ]).then(([barkDiff, barkNor, barkRough, barkAo, barkDisp, mossDiff, leaves]) => {
    barkMat.map = barkDiff;
    barkMat.normalMap = barkNor;
    barkMat.roughnessMap = barkRough;
    barkMat.aoMap = barkAo;
    barkMat.color.set(BARK_TINT);
    applySurfaceMix(barkMat, mossDiff, 1.15);
    barkMat.needsUpdate = true;

    leafMat.map = leaves.map;
    leafMat.normalMap = leaves.normal;
    leafMat.roughnessMap = leaves.roughness;
    leafMat.color.set("#ffffff");
    applyLeafLighting(leafMat, leaves.back, leaves.thickness);
    leafMat.needsUpdate = true;

    const displaced = buildFigTree(barkMat, leafGeo, [leafMat], imageSampler(barkDisp.image));
    const previous = fig.bark.geometry;
    fig.bark.geometry = displaced.bark.geometry;
    previous.dispose();
    keepVisible(fig.bark);
  }).catch((err) => {
    console.error(err);
  });

  return { group, leaves: fig.leaves, ground0: sampleTerrain(0, 0) };
}
