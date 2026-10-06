(() => {
  'use strict';
  const hero = document.querySelector('.home-hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'home-ai-network';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);
  const context = canvas.getContext('2d');
  if (!context) { canvas.remove(); return; }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 720px)');
  let width = 0;
  let height = 0;
  let points = [];
  let edges = [];
  let pointer = null;
  let visible = false;
  let active = false;
  let frame = 0;
  let lastDraw = 0;

  function resize() {
    const bounds = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const columns = smallScreen.matches ? 5 : 8;
    const rows = smallScreen.matches ? 6 : 8;
    points = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        points.push({
          x: width * ((column + .5) / columns) + Math.sin(index * 12.73) * 25,
          y: height * ((row + .5) / rows) + Math.cos(index * 7.93) * 28,
          phase: index * .83
        });
      }
    }
    edges = [];
    const neighbors = [[1, 0], [0, 1], [1, 1], [-1, 1]];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        for (const [dx, dy] of neighbors) {
          const nextColumn = column + dx;
          const nextRow = row + dy;
          if (nextColumn >= 0 && nextColumn < columns && nextRow < rows) {
            edges.push([row * columns + column, nextRow * columns + nextColumn]);
          }
        }
      }
    }
    draw(0);
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    const moving = active && time > 0;
    const positions = points.map(point => {
      let x = point.x + (moving ? Math.sin(time * .00034 + point.phase) * 8 : 0);
      let y = point.y + (moving ? Math.cos(time * .00029 + point.phase) * 8 : 0);
      if (pointer && moving) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 1 && distance < 180) {
          const influence = (1 - distance / 180) * 12;
          x += dx / distance * influence;
          y += dy / distance * influence;
        }
      }
      return { x, y };
    });

    for (const [i, j] of edges) {
      const a = positions[i];
      const b = positions[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance > 290) continue;
      context.strokeStyle = 'rgba(100, 225, 255, ' + ((1 - distance / 290) * .26).toFixed(3) + ')';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
    positions.forEach((point, index) => {
      context.fillStyle = index % 5 === 0 ? 'rgba(181, 135, 255, .48)' : 'rgba(91, 221, 247, .38)';
      context.beginPath();
      context.arc(point.x, point.y, index % 7 === 0 ? 2.2 : 1.4, 0, Math.PI * 2);
      context.fill();
    });
  }

  function tick(time) {
    if (!active) return;
    if (time - lastDraw >= 50) {
      draw(time);
      lastDraw = time;
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const shouldAnimate = visible && !document.hidden && !reducedMotion.matches && !smallScreen.matches;
    if (shouldAnimate === active) return;
    active = shouldAnimate;
    cancelAnimationFrame(frame);
    frame = 0;
    lastDraw = 0;
    if (active) frame = requestAnimationFrame(tick);
    else draw(0);
  }

  hero.addEventListener('pointermove', event => {
    if (!active || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer = null; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = Boolean(entry && entry.isIntersecting);
      sync();
    }, { threshold: .01 }).observe(hero);
  } else {
    visible = true;
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener?.('change', sync);
  smallScreen.addEventListener?.('change', () => { resize(); sync(); });
  resize();
  sync();
})();
