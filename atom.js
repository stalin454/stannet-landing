(() => {
  const atom = document.querySelector('.home-hero .atom-visual');
  if (!atom) return;

  const nodes = [...atom.querySelectorAll('.atom-node-position')].map((element) => ({
    element,
    phase: Number(element.dataset.phase) * Math.PI / 180,
    radius: Number(element.dataset.radius),
  }));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tilt = -28 * Math.PI / 180;
  let size = atom.clientWidth;
  let elapsed = 0;
  let previousTime = 0;
  let frame = 0;

  const setPositions = () => {
    if (!size) size = atom.clientWidth;
    if (!size) return;
    for (const node of nodes) {
      const period = node.radius > .4 ? 72 : 56;
      const angle = node.phase + elapsed * (2 * Math.PI / period);
      const rx = size * node.radius;
      const ry = rx * .8;
      const localX = Math.cos(angle) * rx;
      const localY = Math.sin(angle) * ry;
      const x = localX * Math.cos(tilt) - localY * Math.sin(tilt);
      const y = localX * Math.sin(tilt) + localY * Math.cos(tilt);
      node.element.style.setProperty('--atom-x', `${x.toFixed(2)}px`);
      node.element.style.setProperty('--atom-y', `${y.toFixed(2)}px`);
    }
  };

  const isStatic = () => reduceMotion.matches;
  const isPaused = () => atom.classList.contains('is-interacting') || document.hidden;

  const animate = (time) => {
    frame = 0;
    if (isStatic()) return;
    if (previousTime && !isPaused()) elapsed += Math.min(time - previousTime, 40) / 1000;
    previousTime = time;
    setPositions();
    frame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (isStatic()) {
      previousTime = 0;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      setPositions();
      return;
    }
    if (!frame) frame = window.requestAnimationFrame(animate);
  };

  const setInteracting = (active) => {
    atom.classList.toggle('is-interacting', active);
    if (active) atom.querySelectorAll('.atom-node.is-pressed').forEach((node) => node.classList.remove('is-pressed'));
  };

  atom.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'mouse' && event.target.closest('.atom-node')) setInteracting(true);
  });
  atom.addEventListener('pointerout', (event) => {
    if (event.pointerType !== 'mouse' || !event.target.closest('.atom-node')) return;
    if (!event.relatedTarget?.closest?.('.atom-node')) setInteracting(false);
  });
  atom.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.atom-node')) {
      setInteracting(true);
      event.target.closest('.atom-node').classList.add('is-pressed');
    }
  });
  atom.addEventListener('pointerup', (event) => {
    const node = event.target.closest('.atom-node');
    if (node) node.classList.remove('is-pressed');
    if (event.pointerType !== 'mouse' && !atom.contains(document.activeElement)) setInteracting(false);
  });
  atom.addEventListener('pointercancel', () => {
    atom.querySelectorAll('.atom-node.is-pressed').forEach((node) => node.classList.remove('is-pressed'));
    if (!atom.contains(document.activeElement)) setInteracting(false);
  });
  atom.addEventListener('focusin', () => setInteracting(true));
  atom.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => setInteracting(atom.contains(document.activeElement)));
  });

  document.addEventListener('visibilitychange', () => { previousTime = 0; });
  const onMotionChange = () => start();
  reduceMotion.addEventListener?.('change', onMotionChange);

  if ('ResizeObserver' in window) {
    new ResizeObserver((entries) => {
      size = entries[0]?.contentRect.width || atom.clientWidth;
      setPositions();
    }).observe(atom);
  } else {
    window.addEventListener('resize', () => {
      size = atom.clientWidth;
      setPositions();
    }, { passive: true });
  }

  setPositions();
  start();
})();
