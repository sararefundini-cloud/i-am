/* Horror atmosphere for the grid chapters. by Sara */
(() => {
  'use strict';

  const stats = { calls: 0, triangles: 0, pr: 1, mode: '', frameMs: 0, fps: 0 };
  let soft = false;
  let booted = false;
  let grainURL = '';

  function mulberry(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function fbm(x, z) {
    const n = (a, b) => {
      const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    return n(x, z) * 0.55 + n(x * 2.1 + 4, z * 2.1) * 0.28 + n(x * 4.3, z * 4.3 + 9) * 0.17;
  }

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function paintNoise(g, w, h, rnd, amount, dark) {
    for (let i = 0; i < amount; i++) {
      const v = dark ? 0 : 255;
      g.fillStyle = `rgba(${v},${v},${v},${0.03 + rnd() * 0.08})`;
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
    }
  }

  function paintStone(seed, tint) {
    const rnd = mulberry(seed);
    const c = canvas(256, 256);
    const g = c.getContext('2d');
    g.fillStyle = tint;
    g.fillRect(0, 0, 256, 256);
    const rows = 6;
    for (let row = 0; row < rows; row++) {
      const y = (row * 256) / rows;
      const h = 256 / rows - 3;
      let x = (row % 2) * 28;
      while (x < 256) {
        const bw = 36 + rnd() * 48;
        const shade = 18 + rnd() * 28;
        g.fillStyle = `rgba(${shade},${shade - 2},${shade - 6},${0.35 + rnd() * 0.35})`;
        g.fillRect(x + 2, y + 2, bw - 4, h);
        g.strokeStyle = 'rgba(8,6,5,0.65)';
        g.strokeRect(x + 1.5, y + 1.5, bw - 3, h - 1);
        if (rnd() > 0.72) {
          g.strokeStyle = 'rgba(90,110,70,0.28)';
          g.beginPath();
          g.moveTo(x + 8, y + h * 0.7);
          g.lineTo(x + bw * 0.6, y + h * 0.3);
          g.stroke();
        }
        x += bw;
      }
    }
    paintNoise(g, 256, 256, rnd, 5000, true);
    paintNoise(g, 256, 256, rnd, 1200, false);
    return c;
  }

  function paintEarth(seed) {
    const rnd = mulberry(seed);
    const c = canvas(256, 256);
    const g = c.getContext('2d');
    g.fillStyle = '#1a1612';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = `rgba(${30 + rnd() * 40},${28 + rnd() * 24},${18 + rnd() * 12},0.35)`;
      g.beginPath();
      g.ellipse(rnd() * 256, rnd() * 256, 10 + rnd() * 40, 6 + rnd() * 18, rnd() * 3, 0, 7);
      g.fill();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(40,58,32,${0.15 + rnd() * 0.35})`;
      g.beginPath();
      g.ellipse(rnd() * 256, rnd() * 256, 8 + rnd() * 22, 4 + rnd() * 8, rnd(), 0, 7);
      g.fill();
    }
    paintNoise(g, 256, 256, rnd, 4000, true);
    return c;
  }

  function paintWood(seed) {
    const rnd = mulberry(seed);
    const c = canvas(256, 128);
    const g = c.getContext('2d');
    g.fillStyle = '#241810';
    g.fillRect(0, 0, 256, 128);
    for (let y = 0; y < 128; y += 2) {
      const v = 20 + Math.sin(y * 0.35) * 10 + rnd() * 12;
      g.strokeStyle = `rgb(${v + 18},${v},${v - 8})`;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.08 + y) * 1.4);
      g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.beginPath();
    g.moveTo(40, 0);
    g.bezierCurveTo(70, 40, 20, 80, 55, 128);
    g.stroke();
    return c;
  }

  function paintWater() {
    const c = canvas(256, 256);
    const g = c.getContext('2d');
    g.fillStyle = '#1a4550';
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 5) {
      g.strokeStyle = `rgba(170,200,206,${0.18 + (y % 17) * 0.012})`;
      g.beginPath();
      for (let x = 0; x <= 256; x += 6) {
        const yy = y + Math.sin(x * 0.08 + y * 0.16) * 2.6;
        x ? g.lineTo(x, yy) : g.moveTo(x, yy);
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(230,236,232,0.7)';
    for (let i = 0; i < 80; i++) g.fillRect((i * 37) % 256, (i * 19) % 256, 10, 1);
    return c;
  }

  function paintCloth() {
    const rnd = mulberry(9);
    const c = canvas(128, 128);
    const g = c.getContext('2d');
    g.fillStyle = '#14110f';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 4) {
      g.strokeStyle = `rgba(70,58,44,${0.25 + rnd() * 0.3})`;
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(128, i + Math.sin(i) * 2);
      g.stroke();
    }
    return c;
  }

  function paintSkin() {
    const rnd = mulberry(21);
    const c = canvas(64, 64);
    const g = c.getContext('2d');
    g.fillStyle = '#6d5648';
    g.fillRect(0, 0, 64, 64);
    paintNoise(g, 64, 64, rnd, 400, true);
    return c;
  }

  function paintBread() {
    const rnd = mulberry(4);
    const c = canvas(128, 128);
    const g = c.getContext('2d');
    g.fillStyle = '#4a3424';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(${20 + rnd() * 40},${12 + rnd() * 20},8,0.35)`;
      g.beginPath();
      g.arc(rnd() * 128, rnd() * 128, 2 + rnd() * 8, 0, 7);
      g.fill();
    }
    return c;
  }

  function paintLeaf() {
    const c = canvas(256, 256);
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    g.translate(128, 148);
    g.scale(1, 1.15);
    function lobe(ang, len, wid) {
      g.save();
      g.rotate(ang);
      g.beginPath();
      g.moveTo(0, 20);
      g.bezierCurveTo(wid, 10, wid * 0.85, -len * 0.45, wid * 0.15, -len);
      g.bezierCurveTo(-wid * 0.2, -len * 0.7, -wid * 0.9, -len * 0.2, 0, 20);
      g.fill();
      g.restore();
    }
    g.fillStyle = '#3e4d34';
    lobe(0, 108, 34);
    lobe(-0.55, 86, 30);
    lobe(0.62, 80, 28);
    lobe(-1.05, 62, 24);
    lobe(1.12, 58, 22);
    g.fillStyle = '#243022';
    g.beginPath();
    g.moveTo(0, 30);
    g.bezierCurveTo(-8, -10, 6, -70, 0, -100);
    g.lineWidth = 3;
    g.strokeStyle = '#1a2216';
    g.stroke();
    g.strokeStyle = 'rgba(120,130,80,0.45)';
    g.lineWidth = 1;
    for (const a of [-0.55, 0.62, -1.05, 1.12]) {
      g.beginPath();
      g.moveTo(0, 10);
      g.lineTo(Math.sin(a) * 50, 10 - Math.cos(a) * 70);
      g.stroke();
    }
    g.fillStyle = 'rgba(20,16,10,0.55)';
    g.beginPath();
    g.ellipse(8, -20, 10, 16, 0.4, 0, 7);
    g.fill();
    return c;
  }

  function paintPlaster(seed) {
    const rnd = mulberry(seed);
    const c = canvas(256, 256);
    const g = c.getContext('2d');
    g.fillStyle = '#6e675c';
    g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 5; row++) {
      let x = (row % 2) * 22;
      const y = row * 52;
      while (x < 256) {
        const bw = 48 + rnd() * 36;
        const shade = 70 + rnd() * 35;
        g.fillStyle = `rgb(${shade},${shade - 6},${shade - 14})`;
        g.fillRect(x + 2, y + 3, bw - 5, 44);
        g.strokeStyle = 'rgba(30,26,20,.55)';
        g.strokeRect(x + 2, y + 3, bw - 5, 44);
        x += bw;
      }
    }
    g.fillStyle = '#d7d0c2';
    g.globalAlpha = 0.82;
    g.fillRect(0, 0, 256, 256);
    g.globalAlpha = 1;
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(92,86,74,${0.35 + rnd() * 0.45})`;
      g.beginPath();
      g.ellipse(rnd() * 256, rnd() * 256, 8 + rnd() * 28, 4 + rnd() * 10, rnd() * 3, 0, 7);
      g.fill();
    }
    g.strokeStyle = 'rgba(92,58,38,.45)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(20, 40);
    g.bezierCurveTo(80, 70, 40, 140, 120, 180);
    g.stroke();
    g.strokeStyle = 'rgba(70,78,42,.4)';
    g.beginPath();
    g.moveTo(180, 30);
    g.bezierCurveTo(150, 90, 210, 120, 160, 200);
    g.stroke();
    paintNoise(g, 256, 256, rnd, 2500, true);
    return c;
  }

  function paintMetal() {
    const rnd = mulberry(15);
    const c = canvas(128, 128);
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 128, 128);
    grd.addColorStop(0, '#5c5348');
    grd.addColorStop(0.5, '#2a241c');
    grd.addColorStop(1, '#6a5a40');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.moveTo(rnd() * 128, rnd() * 128);
      g.lineTo(rnd() * 128, rnd() * 128);
      g.stroke();
    }
    return c;
  }

  let lib = null;
  function library() {
    if (lib) return lib;
    const T = window.T;
    function tex(c, rx, ry) {
      const t = new T.Texture(c);
      if ('colorSpace' in t) t.colorSpace = 'srgb';
      t.wrapS = t.wrapT = 1000;
      t.repeat.set(rx || 1, ry || 1);
      t.needsUpdate = true;
      return t;
    }
    const stoneC = paintStone(3, '#3a342c');
    const mudC = paintStone(8, '#4a3b30');
    const prisonC = paintStone(11, '#2a2c30');
    const libTex = {
      stone: tex(stoneC, 2, 2),
      mud: tex(mudC, 2, 2),
      prison: tex(prisonC, 2, 1),
      earth: tex(paintEarth(5), 3, 3),
      sand: tex(paintEarth(12), 3, 3),
      grass: tex(paintEarth(18), 4, 4),
      wood: tex(paintWood(2), 1, 2),
      plaster: tex(paintPlaster(7), 2, 2),
      water: tex(paintWater(), 3, 3),
      cloth: tex(paintCloth(), 1, 2),
      skin: tex(paintSkin(), 1, 1),
      bread: tex(paintBread(), 1, 1),
      leaf: tex(paintLeaf(), 1, 1),
      metal: tex(paintMetal(), 1, 1)
    };
    const M = (color, map, rough, metal, extra) => new T.Material(Object.assign({
      color, map, roughness: rough, metalness: metal || 0, side: 2
    }, extra || {}));
    lib = {
      T, tex: libTex,
      stone: M(0xb4aa9c, libTex.stone, 0.86, 0.04),
      mud: M(0xc4b09a, libTex.mud, 0.9, 0.02),
      prison: M(0x9aa6b0, libTex.prison, 0.7, 0.12),
      earth: M(0x3e362e, libTex.earth, 0.9, 0),
      sand: M(0xc2b39a, libTex.sand, 0.88, 0.02),
      grass: M(0x3d4634, libTex.grass, 0.96, 0),
      wood: M(0x5a4030, libTex.wood, 0.84, 0.02),
      plaster: M(0xcfc6b6, libTex.plaster, 0.94, 0.02),
      water: M(0x163038, libTex.water, 0.22, 0.18, { transparent: true, opacity: 0.86 }),
      cloth: M(0x2a241e, libTex.cloth, 0.9, 0),
      skin: M(0x8a7060, libTex.skin, 0.72, 0.02),
      bread: M(0x8a6840, libTex.bread, 0.86, 0),
      metal: M(0x8a8070, libTex.metal, 0.38, 0.62),
      moss: M(0x3e4a32, libTex.grass, 0.9, 0),
      ember: new T.Basic({ color: 0xff9a4a })
    };
    return lib;
  }

  function boot(renderer) {
    const gl = renderer.getContext();
    try {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const name = String((ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
      soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      stats.renderer = name;
    } catch (e) { soft = true; }
    const cap = soft ? 0.72 : Math.min(window.devicePixelRatio || 1, 1.25);
    const pr = soft ? Math.min(cap, 0.62) : cap;
    renderer.setPixelRatio(pr);
    stats.pr = pr;
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = 'srgb';
    renderer.toneMapping = 4;
    renderer.toneMappingExposure = 1.08;
    if (renderer.shadowMap) {
      renderer.shadowMap.enabled = !soft;
      renderer.shadowMap.type = 2;
    }
    stats.soft = soft;
    booted = true;
    return { soft, pr };
  }

  let adaptState = { acc: 0, n: 0, pr: 0 };
  function adapt(renderer, ms) {
    if (!booted) return;
    adaptState.acc += ms;
    adaptState.n++;
    if (adaptState.n < 24) return;
    const avg = adaptState.acc / adaptState.n;
    stats.frameMs = avg;
    stats.fps = avg > 0 ? Math.round(1000 / avg) : 0;
    const current = renderer.getPixelRatio();
    const floor = 0.45;
    const ceil = soft ? 0.8 : Math.min(window.devicePixelRatio || 1, 1.25);
    let next = current;
    if (avg > 42) next = Math.max(floor, current * 0.84);
    else if (avg < 20 && current < ceil) next = Math.min(ceil, current * 1.06);
    if (Math.abs(next - current) > 0.03) {
      renderer.setPixelRatio(next);
      stats.pr = next;
      adaptState.resized = true;
    } else adaptState.resized = false;
    adaptState.acc = 0;
    adaptState.n = 0;
  }

  function grade() {
    if (document.getElementById('iam-grade')) return;
    if (!grainURL) {
      const c = canvas(64, 64);
      const g = c.getContext('2d');
      const img = g.createImageData(64, 64);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 90 + Math.random() * 80;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      grainURL = c.toDataURL();
    }
    const style = document.createElement('style');
    style.id = 'iam-grade';
    style.textContent = '#iam-vignette{position:fixed;inset:0;pointer-events:none;z-index:6;background:radial-gradient(ellipse at center,transparent 78%,rgba(0,0,0,.18) 100%)}#iam-grain{position:fixed;inset:-30%;pointer-events:none;z-index:7;opacity:.05;mix-blend-mode:overlay;background:url(' + grainURL + ');animation:iamgrain .7s steps(2) infinite}@keyframes iamgrain{50%{transform:translate(-3%,2%)}}';
    document.head.appendChild(style);
    const v = document.createElement('div');
    v.id = 'iam-vignette';
    const gr = document.createElement('div');
    gr.id = 'iam-grain';
    document.body.append(v, gr);
  }

  function paintFoam() {
    const c = canvas(256, 64);
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 64);
    const rnd = mulberry(19);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(210,214,208,${0.15 + rnd() * 0.45})`;
      g.lineWidth = 1 + rnd() * 2;
      g.beginPath();
      const y = 20 + rnd() * 24;
      g.moveTo(0, y);
      for (let x = 0; x <= 256; x += 12) g.lineTo(x, y + Math.sin(x * 0.08 + i) * 4);
      g.stroke();
    }
    return c;
  }

  function paintMist() {
    const c = canvas(128, 128);
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    grd.addColorStop(0, 'rgba(180,190,188,0.35)');
    grd.addColorStop(1, 'rgba(180,190,188,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return c;
  }

  let rippleTex = null;
  function livingWater(width, depth, sea) {
    const T = window.T;
    const segX = sea ? 40 : 30;
    const segZ = sea ? 30 : 22;
    const pos = [];
    const uv = [];
    const idx = [];
    for (let z = 0; z <= segZ; z++) {
      for (let x = 0; x <= segX; x++) {
        pos.push((x / segX - 0.5) * width, 0, (z / segZ - 0.5) * depth);
        uv.push(x / segX * (sea ? 6 : 4), z / segZ * (sea ? 6 : 4));
      }
    }
    for (let z = 0; z < segZ; z++) {
      for (let x = 0; x < segX; x++) {
        const a = z * (segX + 1) + x;
        idx.push(a, a + segX + 1, a + 1, a + 1, a + segX + 1, a + segX + 2);
      }
    }
    const geo = new T.Geo();
    geo.setAttribute('position', new T.Attr(new Float32Array(pos), 3));
    geo.setAttribute('uv', new T.Attr(new Float32Array(uv), 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const uTime = { value: 0 };
    const amp = sea ? 0.55 : 0.32;
    if (!rippleTex) {
      rippleTex = new T.Texture(paintWater());
      rippleTex.wrapS = rippleTex.wrapT = 1000;
      if ('colorSpace' in rippleTex) rippleTex.colorSpace = 'srgb';
      rippleTex.needsUpdate = true;
    }
    const mat = new T.Material({
      color: 0xffffff,
      map: rippleTex,
      roughness: sea ? 0.18 : 0.1,
      metalness: sea ? 0.55 : 0.62,
      transparent: true,
      opacity: 0.94,
      side: 2
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uTime;
      shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        'vec3 transformed = vec3( position );\n' +
        'float w1 = sin(position.x*0.62 + uTime*1.15)*cos(position.z*0.41 + uTime*0.72);\n' +
        'float w2 = sin(position.x*1.55 - uTime*1.7 + position.z*1.15)*0.42;\n' +
        'float w3 = sin(position.z*2.8 + uTime*2.15)*0.2;\n' +
        'transformed.y += (w1 + w2 + w3)*' + amp + ';\n'
      );
      shader.fragmentShader = 'uniform float uTime;\n' + shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n' +
        'float g1 = pow(max(sin(gl_FragCoord.x*0.17 + uTime*2.4)*sin(gl_FragCoord.y*0.11 - uTime*1.8), 0.0), 4.0);\n' +
        'float g2 = pow(max(sin(gl_FragCoord.x*0.05 - uTime*0.8 + gl_FragCoord.y*0.04), 0.0), 3.0);\n' +
        'totalEmissiveRadiance += vec3(0.85, 0.92, 0.95)*g1*1.6;\n' +
        'totalEmissiveRadiance += vec3(0.35, 0.5, 0.55)*g2;\n'
      );
    };
    mat.userData.uTime = uTime;
    mat.emissive = new T.Color(sea ? 0x12343c : 0x1a4550);
    if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.55;
    const mesh = new T.Mesh(geo, mat);
    const shimmer = new T.Mesh(geo, new T.Basic({
      map: rippleTex,
      color: 0xd5e8ee,
      transparent: true,
      opacity: sea ? 0.28 : 0.42,
      depthWrite: false,
      blending: 2
    }));
    shimmer.position.y = 0.05;
    const group = new T.Group();
    group.add(mesh);
    group.add(shimmer);
    group.userData.uTime = uTime;
    return group;
  }

  function tubeGeometry(points, radiusAt, sides) {
    const T = window.T;
    const pos = [];
    const uv = [];
    const idx = [];
    let nx = 0, ny = 1, nz = 0;
    const frames = [];
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      let tx = next.x - prev.x, ty = next.y - prev.y, tz = next.z - prev.z;
      let len = Math.hypot(tx, ty, tz) || 1;
      tx /= len; ty /= len; tz /= len;
      let dot = nx * tx + ny * ty + nz * tz;
      let ux = nx - tx * dot, uy = ny - ty * dot, uz = nz - tz * dot;
      let ul = Math.hypot(ux, uy, uz);
      if (ul < 1e-4) {
        ux = Math.abs(ty) > 0.9 ? 1 : 0;
        uy = Math.abs(ty) > 0.9 ? 0 : 1;
        uz = 0;
        dot = ux * tx + uy * ty + uz * tz;
        ux -= tx * dot; uy -= ty * dot; uz -= tz * dot;
        ul = Math.hypot(ux, uy, uz) || 1;
      }
      ux /= ul; uy /= ul; uz /= ul;
      const bx = ty * uz - tz * uy;
      const by = tz * ux - tx * uz;
      const bz = tx * uy - ty * ux;
      nx = ux; ny = uy; nz = uz;
      frames.push({ ux, uy, uz, bx, by, bz });
    }
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const f = frames[i];
      const r0 = radiusAt(i / Math.max(1, points.length - 1), i);
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const c = Math.cos(a), sn = Math.sin(a);
        const furrow = 1 + Math.sin(a * 4 + i * 0.85) * 0.07 + (hash(i * 13 + s) - 0.5) * 0.05;
        const rr = r0 * furrow;
        pos.push(p.x + (f.ux * c + f.bx * sn) * rr, p.y + (f.uy * c + f.by * sn) * rr, p.z + (f.uz * c + f.bz * sn) * rr);
        uv.push(s / sides, i / Math.max(1, points.length - 1));
      }
    }
    for (let i = 0; i < points.length - 1; i++) {
      for (let s = 0; s < sides; s++) {
        const s2 = (s + 1) % sides;
        const a = i * sides + s;
        const b = i * sides + s2;
        const c = (i + 1) * sides + s;
        const d = (i + 1) * sides + s2;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new T.Geo();
    g.setAttribute('position', new T.Attr(new Float32Array(pos), 3));
    g.setAttribute('uv', new T.Attr(new Float32Array(uv), 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function mergeGeos(list) {
    const T = window.T;
    let vcount = 0;
    let icount = 0;
    for (const g of list) {
      vcount += g.getAttribute('position').count;
      icount += g.index.count;
    }
    const pos = new Float32Array(vcount * 3);
    const uv = new Float32Array(vcount * 2);
    const idx = new Uint32Array(icount);
    let vo = 0, io = 0, base = 0;
    for (const g of list) {
      const p = g.getAttribute('position').array;
      const u = g.getAttribute('uv').array;
      pos.set(p, vo * 3);
      if (u) uv.set(u, vo * 2);
      const id = g.index.array;
      for (let i = 0; i < id.length; i++) idx[io++] = id[i] + base;
      base += g.getAttribute('position').count;
      vo += g.getAttribute('position').count;
      g.dispose();
    }
    const out = new T.Geo();
    out.setAttribute('position', new T.Attr(pos, 3));
    out.setAttribute('uv', new T.Attr(uv, 2));
    out.setIndex(Array.from(idx));
    out.computeVertexNormals();
    return out;
  }

  function leafGeometry() {
    const T = window.T;
    const segX = 6, segY = 8;
    const pos = [], uv = [], idx = [];
    for (let y = 0; y <= segY; y++) {
      for (let x = 0; x <= segX; x++) {
        const u = x / segX, v = y / segY;
        const lobe = Math.sin(v * Math.PI) * (0.55 + 0.45 * Math.cos((u - 0.5) * 3.2));
        const px = (u - 0.5) * lobe * 0.9;
        const py = (v - 0.08) * 1.15;
        const pz = Math.sin(v * Math.PI) * 0.08 + Math.cos((u - 0.5) * 4) * 0.03 * v;
        pos.push(px, py, pz);
        uv.push(u, 1 - v);
      }
    }
    for (let y = 0; y < segY; y++) {
      for (let x = 0; x < segX; x++) {
        const a = y * (segX + 1) + x;
        const b = a + 1;
        const c = a + segX + 1;
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new T.Geo();
    g.setAttribute('position', new T.Attr(new Float32Array(pos), 3));
    g.setAttribute('uv', new T.Attr(new Float32Array(uv), 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function curve(a, b, bend, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      pts.push({
        x: u * u * a.x + 2 * u * t * bend.x + t * t * b.x,
        y: u * u * a.y + 2 * u * t * bend.y + t * t * b.y,
        z: u * u * a.z + 2 * u * t * bend.z + t * t * b.z
      });
    }
    return pts;
  }

  function clothMat(color, rough, metal) {
    const T = window.T;
    return new T.Material({ color, roughness: rough, metalness: metal || 0 });
  }

  function addPerson(parent, kind) {
    const T = window.T;
    const g = new T.Group();
    parent.add(g);
    const priest = kind === 'priest' || kind === 'baptist' || kind === 'person' || !kind;
    const scale = kind === 'boy' ? 0.72 : kind === 'woman' ? 0.94 : kind === 'leper' ? 0.88 : 1;
    g.scale.setScalar(scale);
    const ash = clothMat(0x9ca0a4, 0.78, 0.04);
    const slate = clothMat(0x4e5358, 0.74, 0.08);
    const robe = clothMat(0x2b2f34, 0.84, 0.06);
    const pewter = clothMat(0x6d6a66, 0.32, 0.78);
    const oxblood = clothMat(0x8e2c38, 0.42, 0.12);
    const skin = clothMat(0xc8c2ba, 0.62, 0.02);
    if (!priest) {
      const skirt = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        skirt.push({ x: 0, y: t * 1.35, z: Math.sin(t * Math.PI) * 0.04 });
      }
      g.add(new T.Mesh(tubeGeometry(skirt, t => 0.42 - t * 0.2, 8), robe));
      g.rotation.x = kind === 'leper' ? 0.22 : 0.06;
      return g;
    }
    const tunic = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      tunic.push({ x: 0, y: 0.02 + t * 1.55, z: 0 });
    }
    g.add(new T.Mesh(tubeGeometry(tunic, t => 0.16 + (t < 0.15 ? 0.06 : 0), 8), ash));
    for (const side of [-1, 1]) {
      const sleeve = curve(
        { x: side * 0.16, y: 1.28, z: 0 },
        { x: side * 0.34, y: 0.72, z: 0.06 },
        { x: side * 0.28, y: 1.02, z: 0.02 },
        5
      );
      g.add(new T.Mesh(tubeGeometry(sleeve, () => 0.055, 6), ash));
    }
    const pleats = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      pleats.push({ x: Math.sin(t * 2) * 0.02, y: t * 1.48, z: 0.02 });
    }
    g.add(new T.Mesh(tubeGeometry(pleats, t => 0.34 + Math.sin(t * Math.PI) * 0.08 - t * 0.06, 10), robe));
    const ephod = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      ephod.push({ x: 0, y: 0.72 + t * 0.62, z: 0.1 });
    }
    const ephodMesh = new T.Mesh(tubeGeometry(ephod, () => 0.2, 6), slate);
    ephodMesh.scale.set(1.15, 1, 0.55);
    g.add(ephodMesh);
    const sash = new T.Mesh(new T.Cylinder(0.2, 0.2, 0.08, 8), slate);
    sash.position.set(0, 0.95, 0.08);
    g.add(sash);
    const plate = new T.Mesh(new T.Box(0.28, 0.34, 0.045), pewter);
    plate.position.set(0, 1.18, 0.2);
    g.add(plate);
    const jewels = [0x6d6a66, 0x5c4048, 0x4a5560, 0x6a5348, 0x555e58, 0x704048, 0x5a5a62, 0x6d5a52, 0x455058, 0x624848, 0x585860, 0x6a6058];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const gem = new T.Mesh(new T.Sphere(0.028, 6, 4), clothMat(jewels[row * 3 + col], 0.22, 0.65));
        gem.position.set(-0.07 + col * 0.07, 1.28 - row * 0.07, 0.23);
        g.add(gem);
      }
    }
    for (const side of [-1, 1]) {
      const chain = curve(
        { x: side * 0.12, y: 1.32, z: 0.18 },
        { x: side * 0.16, y: 1.48, z: 0.06 },
        { x: side * 0.18, y: 1.4, z: 0.12 },
        3
      );
      g.add(new T.Mesh(tubeGeometry(chain, () => 0.012, 4), pewter));
    }
    const nHem = 10;
    for (let i = 0; i < nHem; i++) {
      const a = (i / nHem) * Math.PI * 2;
      const hx = Math.cos(a) * 0.46;
      const hz = Math.sin(a) * 0.46;
      if (i % 2 === 0) {
        const fruit = new T.Mesh(new T.Sphere(0.11, 8, 6), oxblood);
        fruit.position.set(hx, 0.32, hz);
        g.add(fruit);
        const crown = new T.Mesh(new T.Cylinder(0.015, 0.07, 0.07, 5), oxblood);
        crown.position.set(hx, 0.44, hz);
        g.add(crown);
      } else {
        const bell = new T.Mesh(new T.Cylinder(0.025, 0.07, 0.12, 6), pewter);
        bell.position.set(hx, 0.3, hz);
        g.add(bell);
      }
    }
    for (const side of [-1, 1]) {
      const setting = new T.Mesh(new T.Box(0.11, 0.025, 0.09), pewter);
      setting.position.set(side * 0.22, 1.4, 0.1);
      g.add(setting);
      const onyx = new T.Mesh(new T.Box(0.08, 0.055, 0.065), clothMat(0x141618, 0.16, 0.62));
      onyx.position.set(side * 0.22, 1.45, 0.1);
      g.add(onyx);
    }
    const pivot = new T.Group();
    pivot.position.set(0.38, 0.86, 0.14);
    g.add(pivot);
    pivot.add(new T.Mesh(tubeGeometry(curve({ x: 0, y: 0, z: 0 }, { x: 0.04, y: -0.55, z: 0.02 }, { x: 0.1, y: -0.28, z: 0 }, 4), () => 0.012, 4), pewter));
    const bowl = new T.Mesh(new T.Sphere(0.07, 8, 6), pewter);
    bowl.scale.y = 0.65;
    bowl.position.set(0.05, -0.58, 0.03);
    pivot.add(bowl);
    const smokeMat = new T.Basic({ color: 0xd5d8da, transparent: true, opacity: 0.35, depthWrite: false });
    const wisps = [];
    for (let i = 0; i < 4; i++) {
      const wisp = new T.Mesh(new T.Sphere(0.03, 5, 4), smokeMat);
      wisp.position.set(0.05, -0.48, 0.03);
      pivot.add(wisp);
      wisps.push(wisp);
    }
    for (const side of [-1, 1]) {
      const foot = new T.Mesh(new T.Box(0.07, 0.045, 0.16), skin);
      foot.position.set(side * 0.09, 0.03, 0.34);
      g.add(foot);
    }
    const tunicHem = new T.Mesh(new T.Cylinder(0.2, 0.22, 0.08, 8), ash);
    tunicHem.position.set(0, 0.1, 0.08);
    g.add(tunicHem);
    (function swing() {
      const t = performance.now() * 0.001;
      pivot.rotation.z = Math.sin(t * 1.4) * 0.45;
      wisps.forEach((wisp, i) => {
        const u = (t * 0.35 + i * 0.25) % 1;
        wisp.position.y = -0.48 + u * 0.55;
        wisp.position.x = 0.05 + Math.sin(t + i) * 0.03;
        wisp.scale.setScalar(0.6 + u);
      });
      requestAnimationFrame(swing);
    })();
    const head = new T.Mesh(new T.Box(0.13, 0.2, 0.11), skin);
    head.position.set(0, 1.62, 0.04);
    g.add(head);
    const brow = new T.Mesh(new T.Box(0.15, 0.035, 0.06), clothMat(0x8e8880, 0.7, 0));
    brow.position.set(0, 1.7, 0.09);
    g.add(brow);
    const socket = new T.Basic({ color: 0x100e0c });
    const glint = new T.Basic({ color: 0xd8c090 });
    for (const side of [-1, 1]) {
      const pit = new T.Mesh(new T.Box(0.03, 0.02, 0.02), socket);
      pit.position.set(side * 0.035, 1.64, 0.1);
      g.add(pit);
      const eye = new T.Mesh(new T.Sphere(0.008, 4, 3), glint);
      eye.position.set(side * 0.035, 1.64, 0.112);
      g.add(eye);
    }
    const mitre = new T.Mesh(new T.Cylinder(0.1, 0.12, 0.16, 8), ash);
    mitre.position.set(0, 1.82, 0.02);
    g.add(mitre);
    const wrap = new T.Mesh(new T.Cylinder(0.125, 0.125, 0.05, 8), ash);
    wrap.position.set(0, 1.74, 0.02);
    g.add(wrap);
    const frontlet = new T.Mesh(new T.Box(0.08, 0.035, 0.015), pewter);
    frontlet.position.set(0, 1.76, 0.13);
    g.add(frontlet);
    g.rotation.y = 0.15;
    return g;
  }

  function openCell(map, x, y) {
    const row = map[y];
    if (!row || x < 0 || x >= row.length) return false;
    return row[x] === 0 || row[x] === '0';
  }

  function exposed(map, x, y) {
    if (openCell(map, x, y)) return false;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => openCell(map, x + a, y + b));
  }

  function checksum(map) {
    let h = map.length * 131;
    for (let y = 0; y < map.length; y++) {
      const row = map[y];
      for (let x = 0; x < row.length; x++) h = (h * 33 + (openCell(map, x, y) ? 1 : 2)) | 0;
    }
    return h;
  }

  function runs(map, horizontal) {
    const found = [];
    const seen = new Set();
    const H = map.length;
    const W = map[0].length;
    if (horizontal) {
      for (let y = 0; y < H; y++) {
        let x = 0;
        while (x < W) {
          if (exposed(map, x, y) && !seen.has(x + ',' + y)) {
            let x2 = x;
            while (x2 < W && exposed(map, x2, y)) {
              seen.add(x2 + ',' + y);
              x2++;
            }
            found.push({ x, y, len: x2 - x, horizontal: true });
            x = x2;
          } else x++;
        }
      }
    } else {
      for (let x = 0; x < W; x++) {
        let y = 0;
        while (y < H) {
          if (exposed(map, x, y) && !seen.has(x + ',' + y)) {
            let y2 = y;
            while (y2 < H && exposed(map, x, y2) && !seen.has(x + ',' + y2)) y2++;
            if (y2 - y > 1) {
              for (let yy = y; yy < y2; yy++) seen.add(x + ',' + yy);
              found.push({ x, y, len: y2 - y, horizontal: false });
            }
            y = y2;
          } else y++;
        }
      }
    }
    return found;
  }

  function floorRuns(map) {
    const out = [];
    for (let y = 0; y < map.length; y++) {
      let x = 0;
      const row = map[y];
      while (x < row.length) {
        if (openCell(map, x, y)) {
          let x2 = x;
          while (x2 < row.length && openCell(map, x2, y)) x2++;
          out.push({ x, y, len: x2 - x });
          x = x2;
        } else x++;
      }
    }
    return out;
  }

  function disposeTree(root) {
    if (!root) return;
    root.traverse(obj => {
      if (obj.geometry && !obj.geometry.userData.keep) obj.geometry.dispose();
    });
  }

  const THEME = {
    dwelling: { outside: false, h: 2.45, ceil: 2.55, floor: 'earth', wall: 'plaster', fog: 0xc8bfb2, bg: 0xb7aea2, near: 40, far: 80, sky: 0xfff4e8, ground: 0xa89078, hemi: 0.95, moon: 0xfff6ea, moonI: 0.7, warm: 0xffaa50, warmI: 14 },
    river: { outside: true, h: 0.7, floor: 'sand', wall: 'stone', fog: 0xc5cdd0, bg: 0xd5dee2, near: 40, far: 100, sky: 0xeef3f6, ground: 0xb0a898, hemi: 1.05, moon: 0xffffff, moonI: 0.9, warm: 0xffe0c0, warmI: 4, water: true },
    prison: { outside: false, h: 2.45, ceil: 2.4, floor: 'prison', wall: 'prison', fog: 0xb0b8be, bg: 0x9aa4aa, near: 36, far: 70, sky: 0xe4eef4, ground: 0x8a949c, hemi: 0.9, moon: 0xeef4f8, moonI: 0.65, warm: 0xffc080, warmI: 10, bars: true },
    room: { outside: false, h: 3.4, ceil: 3.6, floor: 'prison', wall: 'prison', fog: 0xb7c6d0, bg: 0x9eb0bc, near: 40, far: 80, sky: 0xe4eef4, ground: 0x7e94a6, hemi: 1.0, moon: 0xe8f0f4, moonI: 0.85, warm: 0xd8d4cc, warmI: 6 },
    desert: { outside: true, h: 0.38, floor: 'sand', wall: 'stone', fog: 0xd8d0c4, bg: 0xe4dcc8, near: 36, far: 80, sky: 0xf6efe2, ground: 0xc4b49a, hemi: 1.05, moon: 0xfff4e4, moonI: 0.9, warm: 0xffd0a0, warmI: 4 },
    field: { outside: true, h: 0.34, floor: 'grass', wall: 'stone', fog: 0xc8d2c4, bg: 0xd5e0d0, near: 36, far: 80, sky: 0xeef4ea, ground: 0xa8b8a0, hemi: 1.05, moon: 0xf4f8f2, moonI: 0.85, warm: 0xffe0b8, warmI: 4 },
    boat: { outside: true, h: 1.05, floor: 'wood', wall: 'wood', fog: 0xc8cec8, bg: 0xd5dbd5, near: 36, far: 80, sky: 0xeef2ee, ground: 0xa8aea4, hemi: 1.0, moon: 0xf7faf6, moonI: 0.85, warm: 0xfff0d8, warmI: 5, water: true, sea: true },
    water: { outside: true, h: 0.42, floor: 'sand', wall: 'stone', fog: 0xc5cdd0, bg: 0xd5dee2, near: 36, far: 90, sky: 0xeef3f6, ground: 0xb0a898, hemi: 1.05, moon: 0xffffff, moonI: 0.9, warm: 0xffe0c0, warmI: 4, water: true }
  };

  function makeWorld(canvas) {
    const L = library();
    const T = L.T;
    const renderer = new T.Renderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
    boot(renderer);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
    canvas.parentNode.insertBefore(renderer.domElement, canvas);
    canvas.style.opacity = '0';
    grade();
    const cam = new T.Camera(68, 1, 0.06, 70);
    let world = null;
    let signature = '';
    let propsKey = '';
    let props = [];
    let waters = [];
    let libFoam = null;
    let libMist = null;
    let dust = [];
    let lastPos = null;
    let clock = 0;

    function box(parent, x, y, z, w, h, d, mat) {
      const mesh = new T.Mesh(new T.Box(w, h, d), mat);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }

    function build(map, mode) {
      disposeTree(world);
      const theme = THEME[mode] || THEME.room;
      world = new T.Scene();
      world.background = new T.Color(theme.bg);
      world.fog = new T.Fog(theme.fog, theme.near, theme.far);
      world.add(new T.Hemisphere(theme.sky, theme.ground, theme.hemi));
      const moon = new T.Directional(theme.moon, theme.moonI);
      moon.position.set(-7, 11, 4);
      if (!soft && renderer.shadowMap.enabled) {
        moon.castShadow = true;
        moon.shadow.mapSize.set(512, 512);
        const sc = moon.shadow.camera;
        sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 30;
      }
      world.add(moon);
      const warm = new T.Point(theme.warm, theme.warmI, theme.outside ? 28 : 18, 1.4);
      warm.position.set((map[0].length || 8) * 0.45, theme.outside ? 1.6 : 1.9, (map.length || 8) * 0.55);
      world.add(warm);
      world.userData.warm = warm;
      world.userData.warmBase = soft ? theme.warmI * 0.55 : theme.warmI;
      world.userData.mode = mode;
      const floorMat = new T.Basic({ color: theme.outside ? 0xb5a78f : (mode === 'room' ? 0x6d8494 : mode === 'prison' ? 0x6a7278 : 0x6a5c4c) });
      const wallMat = L[theme.wall] || L.stone;
      for (const run of floorRuns(map)) {
        box(world, run.x + run.len / 2, -0.08, run.y + 0.5, run.len, 0.16, 1, floorMat);
        if (!theme.outside) box(world, run.x + run.len / 2, theme.ceil, run.y + 0.5, run.len, 0.12, 1, wallMat);
      }
      const wallH = theme.h;
      for (const run of runs(map, true).concat(runs(map, false))) {
        if (run.horizontal) box(world, run.x + run.len / 2, wallH / 2, run.y + 0.5, run.len, wallH, 1, wallMat);
        else box(world, run.x + 0.5, wallH / 2, run.y + run.len / 2, 1, wallH, run.len, wallMat);
      }
      waters = [];
      if (theme.water) {
        const w = map[0].length, h = map.length;
        const sea = !!theme.sea;
        const shore = new T.Mesh(new T.Box(sea ? 62 : w + 12, 0.08, sea ? 62 : h + 12), L.sand);
        shore.position.set(w / 2, sea ? -0.34 : -0.04, h / 2);
        world.add(shore);
        const surface = livingWater(sea ? 48 : w + 6, sea ? 48 : h + 6, sea);
        surface.position.set(w / 2, sea ? -0.16 : 0.02, h / 2);
        world.add(surface);
        waters.push(surface.material);
        if (!libFoam) {
          libFoam = new T.Texture(paintFoam());
          libFoam.wrapS = libFoam.wrapT = 1000;
          if ('colorSpace' in libFoam) libFoam.colorSpace = 'srgb';
          libFoam.needsUpdate = true;
          libMist = new T.Texture(paintMist());
          libMist.needsUpdate = true;
        }
        const foamMat = new T.Basic({ map: libFoam, transparent: true, opacity: 0.85, depthWrite: false, color: 0xf2f4f0 });
        const span = sea ? 46 : Math.max(w, h);
        for (const edge of [[0, -0.48], [0, 0.48], [-0.48, 0], [0.48, 0]]) {
          const foam = new T.Mesh(new T.Box(Math.abs(edge[0]) > 0 ? 0.35 : span, 0.02, Math.abs(edge[1]) > 0 ? 0.35 : span), foamMat);
          foam.position.set(w / 2 + edge[0] * (sea ? 40 : w + 4), (sea ? -0.12 : 0.045), h / 2 + edge[1] * (sea ? 40 : h + 4));
          world.add(foam);
        }
        const mist = new T.Mesh(new T.Box(sea ? 40 : w + 4, 0.02, sea ? 30 : h + 2), new T.Basic({
          map: libMist, transparent: true, opacity: 0.28, depthWrite: false, color: 0xc5cdc8
        }));
        mist.position.set(w / 2, sea ? 0.05 : 0.18, h / 2);
        world.add(mist);
        waters.push(libFoam);
      }
      if (!theme.outside) {
        const beamMat = L.wood;
        for (let i = 2; i < map.length; i += 4) {
          box(world, map[0].length / 2, theme.ceil - 0.28, i, map[0].length * 0.7, 0.12, 0.18, beamMat);
        }
        const shaft = new T.Mesh(new T.Box(0.7, theme.ceil, 0.7), new T.Basic({
          color: theme.warm, transparent: true, opacity: 0.05, depthWrite: false
        }));
        shaft.position.set(map[0].length * 0.48, theme.ceil * 0.45, map.length * 0.42);
        world.add(shaft);
      }
      if (theme.sea) {
        const w = map[0].length, h = map.length;
        const bow = curve({ x: w - 1.2, y: 0.35, z: h / 2 }, { x: w + 4.2, y: 1.15, z: h / 2 }, { x: w + 1.2, y: 0.2, z: h / 2 }, 10);
        world.add(new T.Mesh(tubeGeometry(bow, t => 0.16 + (1 - t) * 0.34, 8), L.wood));
        for (const side of [-1, 1]) {
          const gun = curve(
            { x: 1.2, y: 0.85, z: h / 2 + side * 1.35 },
            { x: w + 2.4, y: 1.05, z: h / 2 + side * 0.35 },
            { x: w * 0.55, y: 0.7, z: h / 2 + side * 1.55 },
            8
          );
          world.add(new T.Mesh(tubeGeometry(gun, () => 0.08, 6), L.wood));
          const oar = curve(
            { x: 4.2, y: 0.95, z: h / 2 + side * 0.4 },
            { x: 6.4, y: 0.15, z: h / 2 + side * 3.2 },
            { x: 5.2, y: 0.72, z: h / 2 + side * 1.6 },
            6
          );
          world.add(new T.Mesh(tubeGeometry(oar, t => 0.045 - t * 0.02, 5), L.wood));
        }
        const loaf = new T.Mesh(new T.Sphere(0.16, 8, 6), L.bread);
        loaf.scale.set(1.3, 0.45, 0.8);
        loaf.position.set(6.2, 0.72, h / 2);
        world.add(loaf);
        const beacon = new T.Point(0xfff2d2, 18, 40, 1.2);
        beacon.position.set(w * 0.5, 2.4, -8);
        world.add(beacon);
        const glow = new T.Mesh(new T.Sphere(0.35, 8, 6), new T.Basic({ color: 0xfff6dd }));
        glow.position.copy(beacon.position);
        world.add(glow);
      }
      if (theme.bars) {
        for (let i = 0; i < 7; i++) {
          const bar = new T.Mesh(new T.Cylinder(0.035, 0.035, 2.1, 6), L.metal);
          bar.position.set(2.2 + i * 0.34, 1.05, 4.15);
          world.add(bar);
        }
      }
      if (mode === 'dwelling') {
        warm.position.set(4.2, 1.05, 6.4);
        const lamp = new T.Mesh(new T.Cylinder(0.07, 0.11, 0.16, 8), L.mud);
        lamp.position.set(4.2, 0.72, 6.4);
        world.add(lamp);
        const flame = new T.Mesh(new T.Sphere(0.045, 6, 5), L.ember);
        flame.position.set(4.2, 0.86, 6.4);
        world.add(flame);
        world.userData.flame = flame;
        for (const slit of [[2.2, 3.2], [8.4, 5.2], [6.1, 8.2]]) {
          box(world, slit[0], 1.85, slit[1], 0.16, 0.42, 0.55, new T.Basic({ color: 0x1a2430 }));
        }
      }
      if (mode === 'room') {
        const len = map[0].length;
        const mid = map.length * 0.5;
        box(world, len * 0.48, 0.42, mid, len * 0.55, 0.08, 1.15, L.wood);
        for (let i = 0; i < 6; i++) {
          const loaf = new T.Mesh(new T.Sphere(0.11, 6, 4), L.bread);
          loaf.scale.set(1.2, 0.45, 0.85);
          loaf.position.set(2.4 + i * 1.3, 0.55, mid + (i % 2 ? 0.18 : -0.12));
          world.add(loaf);
        }
        for (let i = 0; i < 3; i++) {
          const jar = new T.Mesh(new T.Cylinder(0.1, 0.14, 0.28, 6), L.prison);
          jar.position.set(3 + i * 2.4, 0.58, mid - 0.28);
          world.add(jar);
        }
        for (let i = 0; i < 4; i++) {
          const arch = curve(
            { x: 2 + i * 2.6, y: 2.1, z: mid - 2.2 },
            { x: 2 + i * 2.6, y: 2.1, z: mid + 2.2 },
            { x: 2 + i * 2.6, y: 3.35, z: mid },
            8
          );
          world.add(new T.Mesh(tubeGeometry(arch, () => 0.1, 6), L.prison));
        }
        const hearth = new T.Mesh(new T.Box(0.4, 1.6, 2.2), L.prison);
        hearth.position.set(len - 1.2, 0.8, mid);
        world.add(hearth);
        const mouth = new T.Mesh(new T.Box(0.2, 0.7, 1.1), new T.Basic({ color: 0x2a3036 }));
        mouth.position.set(len - 1.45, 0.7, mid);
        world.add(mouth);
        const ember = new T.Mesh(new T.Sphere(0.12, 6, 4), new T.Basic({ color: 0xb9b3aa }));
        ember.position.set(len - 1.35, 0.35, mid);
        world.add(ember);
        warm.position.set(len * 0.45, 2.6, mid);
        const keeper = new T.Group();
        keeper.position.set(4.2, 0, mid + 1.6);
        world.add(keeper);
        addPerson(keeper, 'priest');
      }
      if (mode === 'dwelling' || mode === 'river') {
        const keeper = new T.Group();
        keeper.position.set(mode === 'dwelling' ? 4.8 : 6.4, 0, mode === 'dwelling' ? 5.7 : 3.6);
        keeper.rotation.y = mode === 'river' ? Math.PI : 0;
        world.add(keeper);
        addPerson(keeper, 'priest');
      }
      if (mode === 'river' || mode === 'water') {
        const span = map[0].length;
        for (let i = 0; i < 16; i++) {
          const reed = new T.Mesh(new T.Cylinder(0.012, 0.028, 1.15 + (i % 4) * 0.28, 5), L.moss);
          const edge = i < 8;
          reed.position.set(1.1 + (i % 8) * (span / 8), 0.55, edge ? 1.15 : map.length - 1.4);
          reed.rotation.z = (i % 2 ? 1 : -1) * 0.18;
          reed.rotation.x = 0.12;
          world.add(reed);
        }
      }
      dust = [];
      const moteMat = new T.Basic({ color: 0xc8b090, transparent: true, opacity: 0.35, depthWrite: false });
      for (let i = 0; i < 14; i++) {
        const m = new T.Mesh(new T.Sphere(0.018, 4, 3), moteMat);
        m.userData.phase = i;
        world.add(m);
        dust.push(m);
      }
      props = [];
      propsKey = '';
      stats.mode = mode;
    }

    function prop(o, mode) {
      const T = L.T;
      const q = new T.Group();
      world.add(q);
      q.position.set(o.x, 0, o.y);
      const k = o.type;
      if (k === 'person' || k === 'woman' || k === 'boy') addPerson(q, k);
      else if (k === 'bread' || k === 'crumbs' || k === 'manna') {
        const n = k === 'bread' ? 1 : 6;
        for (let i = 0; i < n; i++) {
          const b = new T.Mesh(new T.Sphere(k === 'bread' ? 0.22 : 0.05, 8, 6), L.bread);
          b.position.set(Math.sin(i) * 0.16, 0.08, Math.cos(i * 1.7) * 0.16);
          b.scale.set(1, 0.28, 0.8);
          q.add(b);
        }
      } else if (k === 'herbs') {
        for (let i = 0; i < 5; i++) {
          const b = new T.Mesh(new T.Sphere(0.08, 6, 5), L.moss);
          b.position.set(Math.sin(i) * 0.12, 0.1, Math.cos(i) * 0.12);
          b.scale.y = 0.4;
          q.add(b);
        }
      } else if (k === 'water') {
        const pool = new T.Mesh(new T.Box(1.5, 0.06, 1.5), L.water);
        pool.position.y = 0.05;
        q.add(pool);
      } else if (k === 'door') box(q, 0, 1.1, 0, 0.8, 2.2, 0.12, L.wood);
      else if (k === 'bench') {
        box(q, 0, 0.48, 0, 1.2, 0.08, 0.42, L.wood);
        box(q, -0.5, 0.24, 0, 0.08, 0.48, 0.36, L.wood);
        box(q, 0.5, 0.24, 0, 0.08, 0.48, 0.36, L.wood);
      } else if (k === 'jar' || k === 'rot' || k === 'basket' || k === 'sack') {
        const mesh = new T.Mesh(new T.Cylinder(0.16, 0.24, 0.48, 8), k === 'rot' ? L.moss : L.mud);
        mesh.position.y = 0.24;
        q.add(mesh);
      } else if (k === 'glass') {
        const shard = new T.Mesh(new T.Box(0.28, 0.36, 0.06), L.metal);
        shard.position.y = 0.9;
        shard.rotation.z = 0.4;
        q.add(shard);
      } else if (k === 'mold') {
        const stone = new T.Mesh(new T.Box(0.46, 0.32, 0.36), L.prison);
        stone.position.y = 0.2;
        q.add(stone);
        const mold = new T.Mesh(new T.Sphere(0.12, 6, 5), L.moss);
        mold.position.set(0.08, 0.32, 0.06);
        mold.scale.y = 0.4;
        q.add(mold);
      } else {
        const rock = new T.Mesh(new T.Sphere(0.28, 8, 6), k === 'corner' ? L.mud : L.stone);
        rock.position.y = 0.2;
        rock.scale.set(1.1, 0.7, 0.9);
        q.add(rock);
      }
      const mark = new T.Mesh(new T.Sphere(0.035, 5, 4), new T.Basic({ color: 0xc9a36a }));
      mark.position.y = k === 'person' || k === 'woman' || k === 'boy' ? 1.85 : 0.85;
      q.add(mark);
      return q;
    }

    return function (map, p, objects, mode, t) {
      const themeName = THEME[mode] ? mode : 'room';
      const sig = themeName + ':' + checksum(map);
      if (sig !== signature) {
        signature = sig;
        build(map, themeName);
      }
      const list = (objects || []).filter(o => !o.used);
      const key = list.map(o => o.type + '@' + o.x + ',' + o.y).join('|');
      if (key !== propsKey) {
        for (const q of props) world.remove(q);
        props = list.map(o => prop(o, themeName));
        propsKey = key;
      }
      const w = canvas.clientWidth || innerWidth;
      const h = canvas.clientHeight || innerHeight;
      if (adaptState.resized || renderer.domElement.width !== Math.round(w * renderer.getPixelRatio())) {
        renderer.setSize(w, h, false);
        cam.aspect = w / Math.max(1, h);
        cam.updateProjectionMatrix();
        adaptState.resized = false;
      }
      const dt = Math.min(0.05, Math.max(0, (t || 0) - clock) || 0.016);
      clock = t || 0;
      const eye = 1.52;
      const bob = lastPos ? Math.min(0.03, Math.hypot(p.x - lastPos.x, p.y - lastPos.y) * 0.15) : 0;
      lastPos = { x: p.x, y: p.y };
      const pitch = p.pitch || 0;
      cam.position.set(p.x, eye + Math.sin((t || 0) * 8) * bob, p.y);
      cam.lookAt(p.x + Math.cos(p.a), eye - pitch * 3.1, p.y + Math.sin(p.a));
      for (const item of waters) {
        if (item && item.userData && item.userData.uTime) item.userData.uTime.value = t || 0;
        if (item && item.offset) item.offset.x = ((t || 0) * 0.08) % 1;
      }
      if (themeName === 'boat') {
        cam.position.y += Math.sin((t || 0) * 0.85) * 0.07;
        cam.position.x += Math.sin((t || 0) * 0.37) * 0.04;
      }
      if (world.userData.mode === 'dwelling' && world.userData.warm) {
        const flick = 0.78 + Math.sin((t || 0) * 11) * 0.1 + Math.sin((t || 0) * 23.5) * 0.07;
        world.userData.warm.intensity = world.userData.warmBase * flick;
        if (world.userData.flame) world.userData.flame.scale.setScalar(0.85 + flick * 0.2);
      }
      for (const m of dust) {
        const ph = m.userData.phase;
        m.position.set(
          cam.position.x + Math.sin((t || 0) * 0.2 + ph) * 1.4,
          0.4 + ((ph * 0.37 + (t || 0) * 0.08) % 2.2),
          cam.position.z + Math.cos((t || 0) * 0.17 + ph) * 1.6
        );
      }
      renderer.render(world, cam);
      const info = renderer.info && renderer.info.render;
      if (info) {
        stats.calls = info.calls;
        stats.triangles = info.triangles;
      }
      stats.mode = themeName;
      stats.pos = [Math.round(p.x*10)/10, Math.round(p.y*10)/10, Math.round((p.a||0)*100)/100];
      adapt(renderer, dt * 1000);
    };
  }

  window.IAMRealm = {
    makeWorld, boot, grade, adapt, library, tubeGeometry, mergeGeos, leafGeometry, curve, addPerson, fbm, hash, stats
  };
})();
