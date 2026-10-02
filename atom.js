(() => {
  const atom = document.querySelector('.atom-visual');
  if (!atom) return;
  const tracks = [...atom.querySelectorAll('.atom-track')];
  const setOrbitTempo = (softened) => tracks.forEach((track) => {
    const baseSpeed = Number.parseFloat(track.style.getPropertyValue('--speed'));
    if (Number.isFinite(baseSpeed)) track.style.animationDuration = `${baseSpeed * (softened ? 1.2 : 1)}s`;
  });

  atom.addEventListener('pointerover', (event) => {
    if (event.target.closest('.atom-node')) setOrbitTempo(true);
  });
  atom.addEventListener('pointerout', (event) => {
    const leavingNode = event.target.closest('.atom-node');
    if (leavingNode && !leavingNode.contains(event.relatedTarget)) setOrbitTempo(false);
  });
  atom.addEventListener('focusin', () => setOrbitTempo(true));
  atom.addEventListener('focusout', () => {
    requestAnimationFrame(() => setOrbitTempo(atom.contains(document.activeElement)));
  });

  // Touch devices reveal the same short label on press/focus without adding a permanent legend.
  atom.querySelectorAll('.atom-node').forEach((node) => {
    node.addEventListener('touchstart', () => node.classList.add('is-touched'), { passive: true });
    node.addEventListener('blur', () => node.classList.remove('is-touched'));
  });
})();