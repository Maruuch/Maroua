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

  // ── Particles — bulles de savon + paillettes dorées ─────
  function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';

    // Densité plus généreuse (féerie enfantine)
    const isMobile = window.innerWidth < 640;
    const bubbleCount = isMobile ? 28 : 60;
    const sparkCount  = isMobile ?  8 : 16;

    // Bulles de savon — tailles très variées
    for (let i = 0; i < bubbleCount; i++) {
      const p = document.createElement('div');
      p.className = 'particle';

      // Distribution log-normale : beaucoup de petites, peu de grandes (réaliste)
      const r = Math.random();
      const size = r < .55
        ? 5  + Math.random() * 8     // 55%  : 5-13px (petites)
        : r < .85
          ? 14 + Math.random() * 10  // 30%  : 14-24px (moyennes)
          : 25 + Math.random() * 14; // 15%  : 25-39px (grandes, "wow")

      const riseDur  = 12 + Math.random() * 18;            // 12-30s — montée lente, contemplative
      const swayDur  = 4  + Math.random() * 5;             // 4-9s   — ondulation latérale
      const delay    = -Math.random() * riseDur;           // négatif → démarrage déjà engagé
      const startTop = 100 + Math.random() * 60;           // démarre sous le hero pour défilement continu

      p.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${startTop}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${riseDur}s, ${swayDur}s;
        animation-delay: ${delay}s, ${delay}s;
      `;
      container.appendChild(p);
    }

    // Paillettes dorées — petits points scintillants
    for (let i = 0; i < sparkCount; i++) {
      const s = document.createElement('div');
      s.className = 'particle particle--spark';
      const size  = 2 + Math.random() * 3;        // 2-5px
      const dur   = 6 + Math.random() * 8;
      s.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${100 + Math.random() * 50}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${dur}s, ${3 + Math.random() * 3}s;
        animation-delay: ${-Math.random() * dur}s, ${-Math.random() * 3}s;
      `;
      container.appendChild(s);
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
