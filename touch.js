/* Thumb walking for the chapters. by Sara */
(() => {
  'use strict';

  const state = {
    mx: 0,
    mz: 0,
    lookX: 0,
    lookY: 0,
    act: false,
    moveId: null,
    lookId: null,
    originX: 0,
    originY: 0,
    lookOriginX: 0,
    lookOriginY: 0
  };

  function stickEl() {
    return document.getElementById('iam-stick');
  }

  function resetMove() {
    state.mx = 0;
    state.mz = 0;
    state.moveId = null;
    const stick = stickEl();
    if (!stick) return;
    stick.classList.remove('live');
    stick.style.left = '';
    stick.style.top = '';
    stick.style.bottom = '';
    const nub = stick.querySelector('i');
    if (nub) nub.style.transform = 'translate(-50%, -50%)';
  }

  function resetLook() {
    state.lookId = null;
  }

  function resetAll() {
    resetMove();
    resetLook();
  }

  function placeStick(x, y) {
    const stick = stickEl();
    if (!stick) return;
    const half = 78;
    const left = Math.max(half, Math.min(innerWidth * 0.46 - half, x));
    const top = Math.max(half, Math.min(innerHeight - half - 8, y));
    stick.style.left = left + 'px';
    stick.style.top = top + 'px';
    stick.style.bottom = 'auto';
    state.originX = left;
    state.originY = top;
  }

  function applyStick(x, y) {
    let dx = (x - state.originX) / 78;
    let dy = (y - state.originY) / 78;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) { dx /= mag; dy /= mag; }
    const sens = mag < 0.12 ? 0 : Math.min(1, (mag - 0.12) / 0.88);
    state.mx = dx * sens;
    state.mz = dy * sens;
    const nub = stickEl() && stickEl().querySelector('i');
    if (nub) {
      const travel = 46 * Math.min(1, mag);
      nub.style.transform = 'translate(calc(-50% + ' + (dx * travel) + 'px), calc(-50% + ' + (dy * travel) + 'px))';
    }
  }

  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    const target = e.target;
    if (target.closest && target.closest('#iam-act,#iam-veins,button,a,input,textarea')) return;
    const left = e.clientX < innerWidth * 0.5 && e.clientY > innerHeight * 0.16;
    if (state.moveId == null && left) {
      state.moveId = e.pointerId;
      stickEl().classList.add('live');
      placeStick(e.clientX, e.clientY);
      applyStick(e.clientX, e.clientY);
      document.body.setPointerCapture && document.body.setPointerCapture(e.pointerId);
    } else if (state.lookId == null && e.clientX >= innerWidth * 0.42) {
      state.lookId = e.pointerId;
      state.lookOriginX = e.clientX;
      state.lookOriginY = e.clientY;
    }
  }

  function onMove(e) {
    if (e.pointerId === state.moveId) {
      applyStick(e.clientX, e.clientY);
      e.preventDefault();
    } else if (e.pointerId === state.lookId) {
      const sens = 0.0048;
      state.lookX += (e.clientX - state.lookOriginX) * sens;
      state.lookY += (e.clientY - state.lookOriginY) * sens;
      state.lookOriginX = e.clientX;
      state.lookOriginY = e.clientY;
      e.preventDefault();
    }
  }

  function onUp(e) {
    if (e.pointerId === state.moveId) resetMove();
    if (e.pointerId === state.lookId) resetLook();
  }

  function mount(opts) {
    opts = opts || {};
    if (document.getElementById('iam-touch')) return;
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) meta.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
    const style = document.createElement('style');
    style.textContent = [
      'html,body{touch-action:none;overscroll-behavior:none;-webkit-user-select:none;user-select:none}',
      '#iam-touch{position:fixed;inset:0;z-index:50;pointer-events:none}',
      '#iam-stick{position:fixed;left:calc(28px + env(safe-area-inset-left));bottom:calc(28px + env(safe-area-inset-bottom));width:156px;height:156px;margin-left:-78px;margin-top:-78px;border-radius:50%;border:2px solid rgba(214,196,150,.45);background:radial-gradient(circle,rgba(20,16,12,.2),rgba(8,7,6,.45));pointer-events:auto;touch-action:none}',
      '#iam-stick i{position:absolute;left:50%;top:50%;width:68px;height:68px;border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(236,220,180,.92),rgba(120,96,62,.8));transform:translate(-50%,-50%)}',
      '#iam-act,#iam-veins{position:fixed;right:calc(16px + env(safe-area-inset-right));pointer-events:auto;touch-action:none;border:1px solid rgba(214,196,150,.55);background:rgba(16,13,10,.72);color:#f0e6d2;font:600 15px/1 Georgia,serif;letter-spacing:.14em;border-radius:46px}',
      '#iam-act{bottom:calc(22px + env(safe-area-inset-bottom));width:92px;height:92px}',
      '#iam-veins{bottom:calc(126px + env(safe-area-inset-bottom));width:92px;height:64px;letter-spacing:.12em}',
      '#touch .arrows,#touch #use,#buttons [data-k],#controls{display:none!important}'
    ].join('');
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.id = 'iam-touch';
    root.innerHTML = '<div id="iam-stick" aria-hidden="true"><i></i></div><button id="iam-act" type="button">ACT</button>' + (opts.veins ? '<button id="iam-veins" type="button">VEINS</button>' : '');
    document.body.appendChild(root);
    const layer = document.body;
    layer.addEventListener('pointerdown', onDown);
    layer.addEventListener('pointermove', onMove);
    layer.addEventListener('pointerup', onUp);
    layer.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', resetAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) resetAll(); });
    document.getElementById('iam-act').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      state.act = true;
      if (opts.onAct) opts.onAct();
    });
    const veins = document.getElementById('iam-veins');
    if (veins && opts.veins) {
      veins.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        opts.veins();
      });
    }
  }

  function sample() {
    const out = {
      x: state.mx,
      y: -state.mz,
      yaw: state.lookX,
      pitch: state.lookY,
      act: state.act
    };
    state.lookX = 0;
    state.lookY = 0;
    state.act = false;
    return out;
  }

  window.IAMTouch = { mount, sample, reset: resetAll };
})();
