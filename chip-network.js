(() => {
  const board = document.querySelector('.chip-board');
  if (!board) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isVisible = false;

  const sync = () => {
    board.classList.toggle('is-running', isVisible && !document.hidden && !reducedMotion.matches);
    document.body.classList.toggle('chip-map-visible', isVisible);
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      sync();
    }, { threshold: 0.01 }).observe(board);
  } else {
    isVisible = true;
    sync();
  }

  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener?.('change', sync);
})();