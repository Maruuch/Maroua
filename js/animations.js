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

  // ── Particles — 3 strates de bulles + paillettes (parallaxe) ─
  function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';

    const isMobile = window.innerWidth < 640;

    // Distribution :
    //  - BG  (fond, lent, gros, flou)   : 30%
    //  - MID (intermédiaire, net)        : 45%
    //  - FG  (avant, petit, vif)         : 25%
    const total       = isMobile ? 36 : 72;
    const bgCount     = Math.round(total * .30);
    const midCount    = Math.round(total * .45);
    const fgCount     = total - bgCount - midCount;
    const sparkCount  = isMobile ?  8 : 18;

    const spawn = (variant, opts) => {
      const p = document.createElement('div');
      p.className = `particle particle--${variant}`;
      const size     = opts.size();
      const riseDur  = opts.riseDur();
      const swayDur  = opts.swayDur();
      const pulseDur = 3.5 + Math.random() * 3;
      const delay    = -Math.random() * riseDur;

      // Montage du cssText (le BG n'a pas l'animation pulse → 2 anims, sinon 3)
      const animDur   = variant === 'bg'
        ? `${riseDur}s, ${swayDur}s`
        : `${riseDur}s, ${swayDur}s, ${pulseDur}s`;
      const animDelay = variant === 'bg'
        ? `${delay}s, ${delay}s`
        : `${delay}s, ${delay}s, ${-Math.random() * pulseDur}s`;

      p.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${100 + Math.random() * 60}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${animDur};
        animation-delay: ${animDelay};
      `;
      container.appendChild(p);
    };

    // STRATE BG : grosses, floues, montée très lente (parallaxe lointain)
    for (let i = 0; i < bgCount; i++) {
      spawn('bg', {
        size:    () => 22 + Math.random() * 22,           // 22-44px
        riseDur: () => 26 + Math.random() * 18,           // 26-44s (très lent)
        swayDur: () => 8  + Math.random() * 6,
      });
    }
    // STRATE MID : standard
    for (let i = 0; i < midCount; i++) {
      spawn('mid', {
        size:    () => 8  + Math.random() * 12,           // 8-20px
        riseDur: () => 14 + Math.random() * 12,           // 14-26s
        swayDur: () => 5  + Math.random() * 4,
      });
    }
    // STRATE FG : petites, brillantes, montée rapide (parallaxe proche)
    for (let i = 0; i < fgCount; i++) {
      spawn('fg', {
        size:    () => 4 + Math.random() * 6,             // 4-10px
        riseDur: () => 9 + Math.random() * 7,             // 9-16s (rapide)
        swayDur: () => 3 + Math.random() * 3,
      });
    }

    // Paillettes étoile (sparkle) — points très brillants
    for (let i = 0; i < sparkCount; i++) {
      const s = document.createElement('div');
      s.className = 'particle particle--spark';
      const size = 2 + Math.random() * 3;
      const dur  = 7 + Math.random() * 8;
      const pulseDur = 2.5 + Math.random() * 2;
      s.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${100 + Math.random() * 50}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${dur}s, ${3 + Math.random() * 3}s, ${pulseDur}s;
        animation-delay: ${-Math.random() * dur}s, ${-Math.random() * 3}s, ${-Math.random() * pulseDur}s;
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
