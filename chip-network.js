(() => {
  const board = document.querySelector('.chip-board');
  if (!board) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactLayout = window.matchMedia('(max-width: 900px)');
  let isVisible = false;

  const sync = () => {
    board.classList.toggle('is-running', isVisible && !document.hidden && !reducedMotion.matches);
    document.body.classList.toggle('chip-map-visible', isVisible && compactLayout.matches);
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
  compactLayout.addEventListener?.('change', sync);
})();