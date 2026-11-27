import * as THREE from "three";
const LEAF_CENTER_FRACTION = 0.42;
const ALBEDO = new URL("./leaves/fig-leaf-albedo.png", import.meta.url).href;
const BACK = new URL("./leaves/fig-leaf-back.png", import.meta.url).href;
const NORMAL = new URL("./leaves/fig-leaf-normal.png", import.meta.url).href;
const ROUGH = new URL("./leaves/fig-leaf-roughness.png", import.meta.url).href;
const THICK = new URL("./leaves/fig-leaf-thickness.png", import.meta.url).href;
function loadMap(url, color, anisotropy) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = anisotropy;
        resolve(tex);
      },
      void 0,
      reject
    );
  });
}
function createLeafGeometry() {
  const height = 0.27;
  const width = height * (869 / 1024);
  const geo = new THREE.PlaneGeometry(width, height, 6, 8);
  geo.translate(0, height * 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const yn = y / height;
    const xn = x / (width * 0.5);
    const droop = -0.055 * yn * yn;
    const curl = xn * xn * 0.04 * (0.25 + yn);
    pos.setZ(i, droop - curl);
  }
  geo.computeVertexNormals();
  return geo;
}
function loadFigLeafMaps(anisotropy = 8) {
  return Promise.all([
    loadMap(ALBEDO, true, anisotropy),
    loadMap(BACK, true, anisotropy),
    loadMap(NORMAL, false, anisotropy),
    loadMap(ROUGH, false, anisotropy),
    loadMap(THICK, false, anisotropy)
  ]).then(([map, back, normal, roughness, thickness]) => ({ map, back, normal, roughness, thickness }));
}
async function createFigLeaves(anisotropy = 8) {
  const variation = await loadFigLeafMaps(anisotropy);
  return { geo: createLeafGeometry(), variations: [variation] };
}
export {
  LEAF_CENTER_FRACTION,
  createFigLeaves,
  createLeafGeometry,
  loadFigLeafMaps
};
