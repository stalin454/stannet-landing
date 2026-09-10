(() => {
  const sections = document.querySelectorAll('[data-reveal]');
  const progress = document.createElement('div');
  progress.className = 'scroll-signal';
  document.body.append(progress);
  const updateProgress = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  if (!('IntersectionObserver' in window)) { sections.forEach((section) => section.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
  sections.forEach((section) => observer.observe(section));
})();
