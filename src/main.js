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
  initImageReveals();
  initScrollReveal();
  initCategoriesScroll();             // reveal + stagger + parallaxe sur la section catégories
  initParallaxHeroBg();
  initHeaderScrollState();
  console.log('[GSAP] animations initialisées (skill: gsap-scrolltrigger)');
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
// CATEGORIES — chorégraphie premium au scroll (3 effets coordonnés)
// ────────────────────────────────────────────────────────────────
function initCategoriesScroll() {
  const section = document.querySelector('.section-cats');
  if (!section) return;

  // ─── 1. Section header (eyebrow + title + sub) ───
  // Reveal en cascade quand la section entre en vue (top 80%)
  const headParts = document.querySelectorAll(
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

  // ─── 2. Cartes catégories — entrée en stagger 3D ───
  // Chaque carte arrive de bas avec rotation X subtile, en cascade éditoriale
  const cards = document.querySelectorAll('.cats-editorial .cat-card');
  if (cards.length) {
    gsap.set(cards, {
      autoAlpha: 0,
      y: 80,
      rotationX: -6,
      transformPerspective: 1000,
      transformOrigin: '50% 100%',
    });

    ScrollTrigger.batch(cards, {
      start: 'top 88%',
      once: true,                    // une fois suffit, pas de replay
      interval: 0.05,                 // collecte les cards entrées dans 50ms
      batchMax: 5,                    // toutes les cartes du grid d'un coup
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          rotationX: 0,
          duration: 1.1,
          ease: 'power4.out',
          stagger: { each: 0.12, from: 'start' },
          overwrite: 'auto',
        });
      },
    });
  }

  // ─── 3. Parallaxe sur les images des cartes ───
  // Quand l'utilisateur scrolle au travers de la section, l'image de
  // fond de chaque carte glisse légèrement plus lentement → effet de
  // profondeur cinématographique. Scrub continu.
  const catImages = document.querySelectorAll('.cats-editorial .cat-img--a');
  catImages.forEach(img => {
    gsap.fromTo(img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.cat-card'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );
  });
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
