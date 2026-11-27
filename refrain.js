/* The same question, once in each chapter. by Sara */
(() => {
  'use strict';
  const TEXT = 'How is it that ye do not understand?';
  const REF = 'Mark 8:21';
  const seen = Object.create(null);

  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.href = 'data:,';
    document.head.appendChild(icon);
  }

  function plate() {
    let el = document.getElementById('iam-refrain');
    if (el) return el;
    const style = document.createElement('style');
    style.textContent = '#iam-refrain{position:fixed;z-index:40;left:50%;top:16%;transform:translateX(-50%);width:min(34rem,86vw);text-align:center;pointer-events:none;opacity:0;transition:opacity 1.8s ease;color:#efe6d4;font:italic clamp(1.15rem,2.7vw,1.7rem)/1.45 Georgia,serif;text-shadow:0 2px 16px #000}#iam-refrain small{display:block;margin-top:.6rem;font:400 .68rem/1 Georgia,serif;letter-spacing:.22em;color:#b5a88e}';
    document.head.appendChild(style);
    el = document.createElement('div');
    el.id = 'iam-refrain';
    el.innerHTML = '<span></span><small></small>';
    document.body.appendChild(el);
    return el;
  }

  function show(motif) {
    const el = plate();
    el.querySelector('span').textContent = '\u201C' + TEXT + '\u201D';
    el.querySelector('small').textContent = REF;
    el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    clearTimeout(show.timer);
    show.timer = setTimeout(() => { el.style.opacity = '0'; }, 7200);
    try {
      parent.postMessage({ game: 'i-am', type: 'passage', ref: REF, text: TEXT, motif: motif || 'Stone' }, '*');
    } catch (e) { /* The line still stands in the room. */ }
  }

  window.IAMRefrain = {
    text: TEXT,
    ref: REF,
    once(id, motif) {
      if (seen[id]) return false;
      seen[id] = true;
      show(motif);
      return true;
    }
  };
})();
