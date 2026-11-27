(() => {
  'use strict';
  if (window.self !== window.top) return;

  const storageKey = 'iam.music.muted';
  const notes = [55, 55.35, 82.6, 41.2];
  let ctx = null;
  let master = null;
  let muted = false;
  let bpm = 54;
  let next = 0;
  let beatGain = 0.55;

  try { muted = localStorage.getItem(storageKey) === '1'; } catch { /* Preference stays in memory. */ }

  function paint() {
    const on = !muted;
    document.querySelectorAll('[data-iam-music]').forEach(button => {
      button.textContent = on ? 'Music ON' : 'Music OFF';
      button.setAttribute('aria-pressed', String(on));
    });
  }

  function save() {
    try { localStorage.setItem(storageKey, muted ? '1' : '0'); } catch { /* The choice still applies this visit. */ }
    paint();
  }

  function applyGain() {
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.08);
  }

  function beat(time, amount) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(62, time);
    osc.frequency.exponentialRampToValueAtTime(34, time + 0.14);
    gain.gain.setValueAtTime(1e-4, time);
    gain.gain.exponentialRampToValueAtTime(beatGain * amount, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(1e-4, time + 0.2);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  function tick() {
    if (!ctx) return;
    while (next < ctx.currentTime + 0.2) {
      beat(next, 1);
      beat(next + 0.26, 0.7);
      next += 60 / bpm;
    }
  }

  function start() {
    if (ctx) {
      try { ctx.resume && ctx.resume(); } catch { /* Already running. */ }
      applyGain();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try { ctx = new AudioCtx(); } catch { ctx = null; return; }
    try {
      const resumed = ctx.resume && ctx.resume();
      if (resumed && resumed.catch) resumed.catch(() => {});
    } catch { /* A later gesture can resume it. */ }
    try {
      const kick = ctx.createBufferSource();
      kick.buffer = ctx.createBuffer(1, 1, 22050);
      kick.connect(ctx.destination);
      kick.start(0);
    } catch { /* The drone does not depend on the unlock click. */ }

    try {
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 320;
    lowpass.Q.value = 4;
    const drone = ctx.createGain();
    drone.gain.value = 0.11;
    lowpass.connect(drone);
    drone.connect(master);
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 3 ? 'sine' : 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(lowpass);
      osc.start();
    });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);
    lfo.start();

    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const wind = ctx.createBufferSource();
    wind.buffer = noise;
    wind.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 500;
    band.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.025;
    wind.connect(band);
    band.connect(windGain);
    windGain.connect(master);
    wind.start();

    next = ctx.currentTime + 0.5;
    setInterval(tick, 50);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && ctx) try { ctx.resume(); } catch { /* Stay quiet until the page is visible. */ }
    });
    } catch {
      try { ctx && ctx.close(); } catch { /* Nothing is playing. */ }
      ctx = null;
      master = null;
    }
  }

  function toggle() {
    muted = !muted;
    save();
    if (!ctx) start();
    else applyGain();
  }

  window.IAMMusic = {
    start,
    toggle,
    isMuted: () => muted
  };

  paint();
  const onToggle = event => !!(event.target && event.target.closest && event.target.closest('[data-iam-music]'));
  const arm = event => { if (!onToggle(event)) window.IAMMusic.start(); };
  window.addEventListener('click', arm, {capture: true, once: true});
  window.addEventListener('touchstart', arm, {capture: true, once: true, passive: true});
  window.addEventListener('keydown', arm, {capture: true, once: true});
  document.addEventListener('click', event => {
    if (event.target.closest('[data-iam-music]')) window.IAMMusic.toggle();
  });
})();
