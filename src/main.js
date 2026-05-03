// ================================================================
// 🎬 MAROUA JEWELRY — animations GSAP premium
// ================================================================
// Module ES bundlé par Vite. Importe gsap + plugins depuis npm.
// Pratiques officielles Greensock : gsap.matchMedia, defaults,
// autoAlpha, stagger object, overwrite auto.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText }     from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// ────────────────────────────────────────────────────────────────
// DÉFAUTS GLOBAUX — appliqués à TOUS les tweens du projet
// ────────────────────────────────────────────────────────────────
gsap.defaults({
  duration: 0.8,
  ease: 'power3.out',
});

// ────────────────────────────────────────────────────────────────
// matchMedia — gère reduced-motion + breakpoints + cleanup auto
// ────────────────────────────────────────────────────────────────
const mm = gsap.matchMedia();

mm.add(
  {
    isDesktop:    '(min-width: 1024px)',
    isMobile:     '(max-width: 1023px)',
    reduceMotion: '(prefers-reduced-motion: reduce)',
  },
  (context) => {
    const { isDesktop, reduceMotion } = context.conditions;

    // ─── Mode accessibilité : on ne joue rien, tout reste visible ───
    if (reduceMotion) {
      gsap.set(
        '.hero-hairline, .hero-right .hero-card, .hero-left > *',
        { autoAlpha: 1, clearProps: 'transform' }
      );
      return; // pas d'animation
    }

    // ─── Démarre quand le splash loader disparaît ───
    // Flag pour garantir UN SEUL démarrage, peu importe la voie de déclenchement
    // (observer, garde-fou 5s, ou état déjà hidden).
    let started = false;
    let safetyCall = null;
    let obs = null;

    const start = () => {
      if (started) return;
      started = true;
      // Annule tout ce qui pourrait re-déclencher start()
      if (obs) { obs.disconnect(); obs = null; }
      if (safetyCall) { safetyCall.kill(); safetyCall = null; }
      requestAnimationFrame(() => initAll(isDesktop));
    };

    const loader = document.getElementById('loader');
    if (!loader || loader.classList.contains('hidden')) {
      start();
    } else {
      obs = new MutationObserver(() => {
        if (loader.classList.contains('hidden')) start();
      });
      obs.observe(loader, { attributes: true, attributeFilter: ['class'] });
      // Garde-fou : 5s max si le loader ne disparaît jamais (cas pathologique)
      safetyCall = gsap.delayedCall(5, start);
    }

    // Cleanup quand les conditions changent (resize, toggle reduced-motion)
    return () => {
      // gsap.matchMedia revert tout automatiquement, rien à faire ici
    };
  }
);

// ────────────────────────────────────────────────────────────────
// INIT GLOBAL — tout démarre ici
// ────────────────────────────────────────────────────────────────
function initAll(isDesktop) {
  initHero(isDesktop);
  if (isDesktop) initCursorHalo();   // halo souris : desktop uniquement
  initHeroBubbles(isDesktop);         // bulles GSAP cinématiques sur hero-left
  initImageReveals();
  initScrollReveal();
  initCategoriesScroll();             // reveal + stagger + parallaxe sur la section catégories
  initParallaxHeroBg();
  initHeaderScrollState();
  console.log('[GSAP] animations initialisées (skill: gsap-scrolltrigger + bulles cinématiques)');
}

// ────────────────────────────────────────────────────────────────
// BULLES CINÉMATIQUES GSAP — verre translucide flottant
// Remplace le système .particle legacy. Bulles fines (4-22px),
// dérive vertical lente + sine wave horizontale + pulse opacité.
// Chaque bulle est autonome avec sa propre boucle (recursive rise).
// ────────────────────────────────────────────────────────────────
function initHeroBubbles(isDesktop) {
  const container = document.getElementById('particles');
  if (!container) return;

  // Vide le container (supprime les .particle legacy)
  container.innerHTML = '';

  const count = isDesktop ? 18 : 10;
  const rand = gsap.utils.random;

  function spawnBubble(startProgress = 0) {
    const bubble = document.createElement('div');
    bubble.className = 'gsap-bubble';
    if (Math.random() < 0.2) bubble.classList.add('gsap-bubble--bright');

    // Taille : 4-22px, biais vers le petit (distribution puissance)
    const size = Math.pow(rand(0, 1), 1.6) * 18 + 4;
    const targetAlpha = bubble.classList.contains('gsap-bubble--bright')
      ? rand(0.55, 0.85)
      : rand(0.25, 0.55);

    Object.assign(bubble.style, {
      width:  `${size}px`,
      height: `${size}px`,
      left:   `${rand(0, 100)}%`,
      top:    '110%',           // démarre en bas (hors écran)
      opacity: 0,
    });
    container.appendChild(bubble);

    // ─── Sine wave horizontale (dérive organique) ───
    gsap.to(bubble, {
      x: rand(15, 50) * (Math.random() < 0.5 ? -1 : 1),
      duration: rand(3, 6),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: rand(0, 2),
    });

    // ─── Micro-rotation pour vie organique ───
    gsap.to(bubble, {
      rotation: rand(-25, 25),
      duration: rand(8, 14),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // ─── Apparition douce ───
    gsap.to(bubble, { opacity: targetAlpha, duration: 1.5, ease: 'power2.out', delay: 0.2 });

    // ─── Pulse de luminosité ───
    gsap.to(bubble, {
      opacity: targetAlpha * 0.55,
      duration: rand(2.5, 4.5),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 2 + rand(0, 2),
    });

    // ─── Montée principale avec auto-restart (boucle infinie autonome) ───
    const baseRiseDur = rand(14, 26);
    function rise(initialTop, dur) {
      gsap.fromTo(bubble,
        { top: initialTop },
        {
          top: '-20%',           // sort par le haut
          duration: dur,
          ease: 'none',
          onComplete: () => {
            // Reset position : repart du bas avec un nouveau x aléatoire
            gsap.set(bubble, { left: rand(0, 100) + '%' });
            // Boucle suivante : démarre du 110% pour un cycle complet
            rise('110%', baseRiseDur);
          },
        }
      );
    }

    // Premier cycle : démarre à un point aléatoire pour disperser dans le temps
    // (sinon toutes les bulles partiraient du bas en même temps)
    const initialTop = 110 - (startProgress * 130);   // 110% → -20%
    const remainingDur = baseRiseDur * (1 - startProgress);
    rise(initialTop + '%', remainingDur);
  }

  // Spawn toutes les bulles avec progress aléatoires (étalement temporel)
  for (let i = 0; i < count; i++) {
    spawnBubble(rand(0, 1));
  }
}

// ────────────────────────────────────────────────────────────────
// 1️⃣  HERO — entrée chorégraphiée + SplitText calligraphique
// ────────────────────────────────────────────────────────────────
function initHero(isDesktop) {
  const heroLeft = document.querySelector('.hero-left');
  if (!heroLeft) return;

  // ── Préparation du titre — IMPORTANT : on ne split PAS le <em> ──
  // Le <em> "L'élégance" a un dégradé doré (background-clip: text) qui
  // se casse si on découpe ses caractères en spans individuels.
  // Solution : on l'anime comme un bloc, et on split uniquement le
  // <span> "à portée de main" pour l'effet calligraphique.
  const titleEl = document.querySelector('.hero-title');
  const titleEm   = titleEl ? titleEl.querySelector('em')   : null;
  const titleSpan = titleEl ? titleEl.querySelector('span') : null;

  let spanSplit = null;
  if (titleSpan) {
    spanSplit = new SplitText(titleSpan, {
      type: 'words,chars',
      wordsClass: 'split-word',
      charsClass: 'split-char',
    });
    gsap.set(spanSplit.chars, {
      yPercent: 110,
      autoAlpha: 0,
      rotationZ: 4,
      transformOrigin: '50% 100%',
    });
  }
  if (titleEm) {
    gsap.set(titleEm, {
      autoAlpha: 0,
      y: 40,
      transformOrigin: '50% 100%',
    });
  }

  // États initiaux — autoAlpha gère opacity + visibility ensemble
  gsap.set(
    '.hero-left > .hero-line, .hero-left > .hero-eyebrow, .hero-left > .hero-desc, .hero-left > .hero-cta',
    { autoAlpha: 0, y: 30 }
  );
  gsap.set('.hero-right .hero-card', {
    autoAlpha: 0, y: 60, rotationX: -8, transformPerspective: 1100,
  });
  gsap.set('.hero-hairline', {
    scaleX: 0, autoAlpha: 0, transformOrigin: 'center',
  });

  // ── Timeline maître avec labels nommés (officiel GSAP timeline) ──
  // Phases : intro → text → title → outro
  // Chaque label sert de point d'ancrage pour les tweens qui suivent.
  const tl = gsap.timeline({
    defaults: { duration: 0.85 },   // override local pour le hero
  });

  tl
    // ── Phase 1 : INTRO — hairline qui se trace (signature éditoriale) ──
    .addLabel('intro')
    .to('.hero-hairline', {
      scaleX: 1,
      autoAlpha: 0.7,
      duration: 1.4,
      ease: 'expo.out',
    }, 'intro')

    // ── Phase 2 : TEXT — ligne + eyebrow démarrent dès le 1er tiers de l'intro ──
    .addLabel('text', 'intro+=0.45')
    .to('.hero-left > .hero-line',    { autoAlpha: 1, y: 0 }, 'text')
    .to('.hero-left > .hero-eyebrow', { autoAlpha: 1, y: 0 }, 'text+=0.25')

    // ── Phase 3a : TITLE EM — "L'élégance" en bloc (préserve le dégradé or) ──
    .addLabel('title', 'text+=0.55');

  if (titleEm) {
    tl.to(titleEm, {
      autoAlpha: 1,
      y: 0,
      duration: 1.0,
      ease: 'expo.out',
    }, 'title');
  }

  // ── Phase 3b : TITLE SPAN — "à portée de main" en stagger calligraphique ──
  if (spanSplit) {
    tl.to(spanSplit.chars, {
      yPercent: 0,
      autoAlpha: 1,
      rotationZ: 0,
      duration: 1.0,
      ease: 'expo.out',
      stagger: { each: 0.022, from: 'start' },
    }, 'title+=0.35');
  }

  // ── Phase 4 : OUTRO — desc + CTA + cartes en parallèle ──
  tl
    .addLabel('outro', 'title+=1.1')
    .to('.hero-left > .hero-desc', { autoAlpha: 1, y: 0 }, 'outro')
    .to('.hero-left > .hero-cta',  { autoAlpha: 1, y: 0 }, 'outro+=0.2')
    // Cartes démarrent un peu avant pour ne pas attendre la fin du texte
    .to('.hero-right .hero-card', {
      autoAlpha: 1, y: 0, rotationX: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: { each: 0.18, from: 'start' },
    }, 'outro-=0.4');

  // Stocker la référence pour pouvoir restart/reverse plus tard si besoin
  window._heroTl = tl;

  // ── Tilt 3D souris : DESKTOP uniquement ──
  if (isDesktop) {
    document.querySelectorAll('.hero-card').forEach(card => {
      const qX = gsap.quickTo(card, 'rotationY', { duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      const qY = gsap.quickTo(card, 'rotationX', { duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top)  / r.height;
        qX((x - 0.5) * 12);
        qY((y - 0.5) * -10);
      });
      card.addEventListener('mouseleave', () => { qX(0); qY(0); });
    });
  }
}

// ────────────────────────────────────────────────────────────────
// 3️⃣  CURSOR HALO — desktop uniquement (filtré au niveau matchMedia)
// ────────────────────────────────────────────────────────────────
function initCursorHalo() {
  // Sécurité : pas de halo sur tactile
  if (window.matchMedia('(hover: none)').matches) return;

  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  document.body.appendChild(halo);

  const xTo = gsap.quickTo(halo, 'x',       { duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
  const yTo = gsap.quickTo(halo, 'y',       { duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
  const sTo = gsap.quickTo(halo, 'scale',   { duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
  const oTo = gsap.quickTo(halo, 'autoAlpha', { duration: 0.35, ease: 'power3.out', overwrite: 'auto' });

  gsap.set(halo, { x: -200, y: -200, scale: 0.8, autoAlpha: 0 });

  let firstMove = true;
  window.addEventListener('mousemove', (e) => {
    if (firstMove) { oTo(1); firstMove = false; }
    xTo(e.clientX);
    yTo(e.clientY);
  });

  document.querySelectorAll('a, button, [data-page], .product-card, .hero-card, .filter-btn')
    .forEach(el => {
      el.addEventListener('mouseenter', () => sTo(1.6));
      el.addEventListener('mouseleave', () => sTo(1));
    });

  document.addEventListener('mouseleave', () => oTo(0));
  document.addEventListener('mouseenter', () => oTo(1));
}

// ────────────────────────────────────────────────────────────────
// 5️⃣  IMAGE REVEAL — clip-path qui découpe les images au scroll
// ────────────────────────────────────────────────────────────────
function initImageReveals() {
  const selectors = [
    '.product-card .product-image, .product-card img',
    '.hero-card-img',
    '.recent-card img',
    '.detail-thumb',
    '.detail-main img',
  ];
  const images = document.querySelectorAll(selectors.join(', '));

  images.forEach(img => {
    ScrollTrigger.create({
      trigger: img,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.fromTo(img,
          { clipPath: 'inset(0 0 100% 0)', scale: 1.1 },
          {
            clipPath: 'inset(0 0 0% 0)',
            scale: 1,
            duration: 1.4,
            ease: 'expo.out',
          }
        );
      },
    });
  });

  window.addEventListener('load', () => {
    gsap.delayedCall(0.2, () => ScrollTrigger.refresh());
  });
}

// ────────────────────────────────────────────────────────────────
// SCROLL REVEAL — sections qui montent en cascade au scroll
// (exclut hero-card ET cat-card, gérés séparément avec leur propre trigger)
// ────────────────────────────────────────────────────────────────
function initScrollReveal() {
  ScrollTrigger.batch('.reveal:not(.hero-card):not(.cat-card)', {
    start: 'top 85%',
    onEnter: (els) => {
      gsap.fromTo(els,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1, y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: { each: 0.08, from: 'start' },
          overwrite: 'auto',
        }
      );
    },
  });
}

// ────────────────────────────────────────────────────────────────
// CATEGORIES — showcase horizontal pinned + scale au centre
// Desktop : section pinned, cards défilent horizontalement, celle au
//           centre du viewport grandit (1.05) et s'opacifie pleinement.
// Mobile  : carousel natif (scroll-snap CSS) + reveal d'entrée.
// ────────────────────────────────────────────────────────────────
function initCategoriesScroll() {
  const section = document.getElementById('catsSection');
  if (!section) return;

  const track   = section.querySelector('.cats-track');
  const cards   = section.querySelectorAll('.cats-track .cat-card');
  const isDesktop = window.innerWidth >= 1024;

  // ─── 1. Reveal du header au passage ───
  const headParts = section.querySelectorAll(
    '.section-head-cats .section-label, .section-head-cats .section-title, .section-head-cats .section-sub'
  );
  if (headParts.length) {
    gsap.set(headParts, { autoAlpha: 0, y: 30 });
    gsap.to(headParts, {
      autoAlpha: 1,
      y: 0,
      duration: 1.0,
      ease: 'expo.out',
      stagger: { each: 0.12, from: 'start' },
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true,
      },
    });
  }

  if (!track || !cards.length) return;

  const viewport = section.querySelector('.cats-track-viewport');

  // ─── DESKTOP : CAROUSEL INFINI — 3 slots, wrap modulo, mouse-driven ───
  if (isDesktop && viewport) {

    const N = cards.length;                                    // nombre de catégories (5)
    const cardWidthVw  = 26;                                    // doit matcher le CSS (--card-width)
    const slotGapVw    = 4;                                     // espace entre slots (cards rapprochées)
    const getCardSpanPx = () => ((cardWidthVw + slotGapVw) / 100) * window.innerWidth;

    let phase    = 0;        // continu (peut être fractionnaire), wrap modulo N
    let velocity = 0;         // raw velocity from cursor (per-frame target)
    let smoothV  = 0;         // smoothed velocity (sharper or smoother)
    let isHovering = false;

    // ─── Update visuel — recalcule x/opacity/scale/filter de chaque carte ───
    function updateCards() {
      const span = getCardSpanPx();
      const half = N / 2;
      let activeIdx = 0;
      let minAbsRel = Infinity;
      const motionBlur = Math.min(4, Math.abs(smoothV) * 80);   // blur dynamique selon vitesse

      cards.forEach((card, i) => {
        // Position relative à la "phase" courante, wrap dans [-N/2 ; N/2]
        let rel = i - phase;
        while (rel >  half) rel -= N;
        while (rel < -half) rel += N;

        const absRel = Math.abs(rel);

        // X position (slots à -1, 0, +1 cardSpan ; ±2 = hors viewport)
        const x = rel * span;

        // Opacity, scale, filter par profondeur
        const opacity = absRel < 1.5 ? gsap.utils.mapRange(1.5, 0.4, 0, 1, Math.min(absRel, 1.5)) : 0;
        const scale   = gsap.utils.mapRange(0, 1.5, 1.05, 0.78, Math.min(absRel, 1.5));
        const sat     = gsap.utils.mapRange(0, 1, 1.05, 0.35, Math.min(absRel, 1));
        const bright  = gsap.utils.mapRange(0, 1, 1, 0.55, Math.min(absRel, 1));

        gsap.set(card, {
          x,
          xPercent: -50,
          yPercent: -50,
          opacity,
          scale,
          zIndex: Math.round(20 - absRel * 6),
          filter: `saturate(${sat.toFixed(2)}) brightness(${bright.toFixed(2)}) blur(${motionBlur.toFixed(2)}px)`,
        });

        if (absRel < minAbsRel) { minAbsRel = absRel; activeIdx = i; }
      });

      // Active = celle la plus proche du centre
      cards.forEach((c, i) => c.classList.toggle('is-active', i === activeIdx));
    }

    updateCards();   // initial render

    // ─── Mouse → vélocité (réactivité maximale, courbe quadratique) ───
    viewport.addEventListener('mouseenter', () => { isHovering = true; });
    viewport.addEventListener('mouseleave', () => {
      isHovering = false;
      velocity = 0;
      viewport.classList.remove('scroll-left', 'scroll-right');
    });

    viewport.addEventListener('mousemove', (e) => {
      const rect = viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width;
      const center = w / 2;
      const signed = (x - center) / center;          // -1..+1
      const absDist = Math.abs(signed);
      const deadZone = 0.08;                          // zone morte réduite (plus réactif)

      if (absDist < deadZone) {
        velocity = 0;
        viewport.classList.remove('scroll-left', 'scroll-right');
        return;
      }

      const sign = Math.sign(signed);
      const intensity = (absDist - deadZone) / (1 - deadZone);
      // Vitesse en card-units / frame. Max 0.06 = 3.6 cards/sec à 60fps (réactif mais lisible)
      velocity = sign * intensity * intensity * 0.06;
      viewport.classList.toggle('scroll-left',  sign < 0);
      viewport.classList.toggle('scroll-right', sign > 0);
    });

    // ─── Ticker GSAP — boucle d'animation ───
    const tickerHandler = () => {
      // Smoothing rapide pour réactivité (interpolation 25%)
      const target = isHovering ? velocity : 0;
      smoothV = smoothV + (target - smoothV) * 0.25;

      if (Math.abs(smoothV) < 0.0002 && !isHovering) return;

      // Avance phase et wrap dans [0, N)
      phase += smoothV;
      phase = ((phase % N) + N) % N;

      updateCards();
    };
    gsap.ticker.add(tickerHandler);

    // ─── Click sur carte : navigue vers elle (chemin le plus court via wrap) ───
    cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        if (card.classList.contains('is-active')) return;
        e.preventDefault();
        e.stopPropagation();

        // Trouve le chemin le plus court (forward ou backward via wrap)
        let target = idx;
        const diff = target - phase;
        if (diff >  N / 2) target -= N;
        if (diff < -N / 2) target += N;

        gsap.to({ p: phase }, {
          p: target,
          duration: 0.7,
          ease: 'power3.out',
          onUpdate() {
            phase = ((this.targets()[0].p % N) + N) % N;
            updateCards();
          },
        });
      });
    });

    // Recalcule en cas de resize (la matchMedia revert mais on garde aussi un listener léger)
    window.addEventListener('resize', updateCards);

  }
  // ─── MOBILE : reveal d'entrée + carousel CSS natif ───
  else {
    gsap.set(cards, {
      autoAlpha: 0,
      y: 60,
      rotationX: -4,
      transformPerspective: 1000,
      transformOrigin: '50% 100%',
    });

    ScrollTrigger.batch(cards, {
      start: 'top 88%',
      once: true,
      interval: 0.05,
      batchMax: 5,
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          rotationX: 0,
          duration: 1.0,
          ease: 'power4.out',
          stagger: { each: 0.10, from: 'start' },
          overwrite: 'auto',
        });
      },
    });
  }
}

// ────────────────────────────────────────────────────────────────
// PARALLAXE HERO BG — léger drift au scroll
// ────────────────────────────────────────────────────────────────
function initParallaxHeroBg() {
  const heroLeft = document.querySelector('.hero-left');
  if (!heroLeft) return;
  gsap.to(heroLeft, {
    backgroundPosition: '50% 30%',
    ease: 'none',
    scrollTrigger: {
      trigger: heroLeft,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
    },
  });
}

// ────────────────────────────────────────────────────────────────
// HEADER scroll state
// ────────────────────────────────────────────────────────────────
function initHeaderScrollState() {
  const header = document.getElementById('header');
  if (!header) return;
  ScrollTrigger.create({
    start: 'top -10',
    end: 99999,
    onEnter:     () => header.classList.add('header--scrolled'),
    onLeaveBack: () => header.classList.remove('header--scrolled'),
  });
}

window.addEventListener('resize', () => ScrollTrigger.refresh());
