const PERM = new Uint8Array(512);
(function initPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = 1337;
  for (let i = 255; i > 0; i--) {
    s = s * 16807 % 2147483647;
    const j = s % (i + 1);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
function noise3(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const X = xi & 255;
  const Y = yi & 255;
  const Z = zi & 255;
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);
  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;
  return lerp(
    lerp(
      lerp(grad(PERM[AA], xf, yf, zf), grad(PERM[BA], xf - 1, yf, zf), u),
      lerp(grad(PERM[AB], xf, yf - 1, zf), grad(PERM[BB], xf - 1, yf - 1, zf), u),
      v
    ),
    lerp(
      lerp(grad(PERM[AA + 1], xf, yf, zf - 1), grad(PERM[BA + 1], xf - 1, yf, zf - 1), u),
      lerp(grad(PERM[AB + 1], xf, yf - 1, zf - 1), grad(PERM[BB + 1], xf - 1, yf - 1, zf - 1), u),
      v
    ),
    w
  );
}
function fbm(x, y, z = 0, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  let fz = z;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(fx, fy, fz);
    norm += amp;
    fx *= 2.03;
    fy *= 2.03;
    fz *= 2.03;
    amp *= 0.5;
  }
  return sum / norm;
}
function fbm01(x, y, z = 0, octaves = 5) {
  return fbm(x, y, z, octaves) * 0.5 + 0.5;
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
function lerpNum(a, b, t) {
  return a + (b - a) * t;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
export {
  clamp,
  fbm,
  fbm01,
  hash2,
  lerpNum,
  mulberry32,
  noise3,
  smoothstep
};
