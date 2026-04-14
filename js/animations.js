// ================================================================
// ✨ ANIMATIONS — scroll reveal + particules hero
// ================================================================

const Animations = (() => {

  // ── Scroll Reveal ──────────────────────────────────────────
  let _observer;

  function initReveal() {
    _observer = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 80);
          _observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => _observer.observe(el));
  }

  function refreshReveal() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => _observer && _observer.observe(el));
    // Force les éléments déjà dans le viewport
    document.querySelectorAll('.reveal').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight - 40) el.classList.add('visible');
    });
  }

  // ── Particles ────────────────────────────────────────────
  function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count = window.innerWidth < 640 ? 12 : 24;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-duration: ${4 + Math.random() * 8}s;
        animation-delay: ${Math.random() * 6}s;
        width: ${1 + Math.random() * 2}px;
        height: ${1 + Math.random() * 2}px;
        opacity: ${0.3 + Math.random() * 0.5};
      `;
      container.appendChild(p);
    }
  }

  // ── Header scroll ─────────────────────────────────────────
  function initHeader() {
    const header = document.getElementById('header');
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    initReveal();
    initParticles();
    initHeader();
  }

  return { init, refreshReveal };
})();
