(() => {
  const atom = document.querySelector('.home-hero .atom-visual');
  if (!atom) return;

  const nodes = [...atom.querySelectorAll('.atom-node-position')].map((element) => ({
    element,
    phase: Number(element.dataset.phase) * Math.PI / 180,
    radius: Number(element.dataset.radius),
    period: Number(element.dataset.radius) > .4 ? 72 : 56,
    type: 'node',
  }));
  const runners = [...atom.querySelectorAll('.atom-runner')].map((element) => ({
    element,
    phase: Number(element.dataset.phase) * Math.PI / 180,
    radius: Number(element.dataset.orbitRadius),
    period: Number(element.dataset.period) || (Number(element.dataset.orbitRadius) > .4 ? 72 : 56),
    type: 'runner',
  }));
  const movers = [...nodes, ...runners];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const tilt = -28 * Math.PI / 180;
  let size = atom.clientWidth;
  let elapsed = 0;
  let previousTime = 0;
  let lastRender = 0;
  let frame = 0;
  let isVisible = true;

  const setPositions = () => {
    if (!size) size = atom.clientWidth;
    if (!size) return;

    for (const mover of movers) {
      const radius = mover.type === 'runner' ? 600 * mover.radius : size * mover.radius;
      const angle = mover.phase + elapsed * (2 * Math.PI / mover.period);
      const localX = Math.cos(angle) * radius;
      const localY = Math.sin(angle) * radius * .8;
      const x = localX * Math.cos(tilt) - localY * Math.sin(tilt);
      const y = localX * Math.sin(tilt) + localY * Math.cos(tilt);

      if (mover.type === 'runner') {
        mover.element.setAttribute('cx', (300 + x).toFixed(2));
        mover.element.setAttribute('cy', (300 + y).toFixed(2));
      } else {
        mover.element.style.setProperty('--atom-x', `${x.toFixed(2)}px`);
        mover.element.style.setProperty('--atom-y', `${y.toFixed(2)}px`);
      }
    }
  };

  const isStatic = () => reduceMotion.matches;
  const isPaused = () => atom.classList.contains('is-interacting') || document.hidden || !isVisible;

  const stop = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  };

  const animate = (time) => {
    frame = 0;
    if (isStatic() || isPaused()) {
      previousTime = 0;
      return;
    }

    if (previousTime) elapsed += Math.min(time - previousTime, 80) / 1000;
    previousTime = time;
    const minimumFrameInterval = coarsePointer.matches ? 1000 / 24 : 1000 / 30;
    if (time - lastRender >= minimumFrameInterval) {
      setPositions();
      lastRender = time;
    }
    frame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (isStatic() || isPaused()) {
      stop();
      setPositions();
      return;
    }
    if (!frame) frame = window.requestAnimationFrame(animate);
  };

  const setInteracting = (active) => {
    if (atom.classList.contains('is-interacting') === active) return;
    atom.classList.toggle('is-interacting', active);
    if (active) {
      atom.querySelectorAll('.atom-node.is-pressed').forEach((node) => node.classList.remove('is-pressed'));
      stop();
    } else {
      start();
    }
  };

  atom.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'mouse' && event.target.closest('.atom-node')) setInteracting(true);
  });
  atom.addEventListener('pointerout', (event) => {
    if (event.pointerType !== 'mouse' || !event.target.closest('.atom-node')) return;
    if (!event.relatedTarget?.closest?.('.atom-node')) setInteracting(false);
  });
  atom.addEventListener('pointerdown', (event) => {
    const node = event.target.closest('.atom-node');
    if (node) {
      setInteracting(true);
      node.classList.add('is-pressed');
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

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  const onMotionChange = () => start();
  reduceMotion.addEventListener?.('change', onMotionChange);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      if (isVisible) start();
      else stop();
    }, { threshold: 0.01 }).observe(atom);
  }

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
