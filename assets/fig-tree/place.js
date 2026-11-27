import * as THREE from "three";
import { buildFigTree } from "./tree.js";
import { createFigLeaves } from "./leafTexture.js";
import { applyLeafLighting, applySurfaceMix } from "./shaders.js";
import { sampleTerrain } from "./terrain.js";

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

export async function mountApprovedFig(renderer) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const leaves = await createFigLeaves(anisotropy);
  const [barkDiff, barkNor, barkRough, barkAo, barkDisp, mossDiff] = await Promise.all([
    loadTex(file("bark/bark_brown_02_diff_2k.jpg"), true, anisotropy),
    loadTex(file("bark/bark_brown_02_nor_gl_2k.jpg"), false, anisotropy),
    loadTex(file("bark/bark_brown_02_rough_2k.jpg"), false, anisotropy),
    loadTex(file("bark/bark_brown_02_ao_2k.jpg"), false, anisotropy),
    loadTex(file("bark/bark_brown_02_disp_2k.jpg"), false, anisotropy),
    loadTex(file("moss/mossy_rock_diff_2k.jpg"), true, anisotropy),
  ]);

  const barkMat = new THREE.MeshStandardMaterial({
    map: barkDiff,
    normalMap: barkNor,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: barkRough,
    roughness: 0.92,
    aoMap: barkAo,
    aoMapIntensity: 0.85,
    metalness: 0,
    color: new THREE.Color("#d2cdc4"),
    envMapIntensity: 0.95,
    vertexColors: true,
  });
  applySurfaceMix(barkMat, mossDiff, 1.15);

  const disp = imageSampler(barkDisp.image);
  const leafMats = leaves.variations.map((variation) => {
    const mat = new THREE.MeshStandardMaterial({
      map: variation.map,
      normalMap: variation.normal,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughnessMap: variation.roughness,
      roughness: 0.82,
      metalness: 0,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide,
      alphaTest: 0.45,
    });
    applyLeafLighting(mat, variation.back, variation.thickness);
    return mat;
  });

  const fig = buildFigTree(barkMat, leaves.geo, leafMats, disp);
  const group = new THREE.Group();
  group.name = "approved-fig";
  group.add(fig.bark, ...fig.leaves);
  return { group, leaves: fig.leaves, ground0: sampleTerrain(0, 0) };
}
