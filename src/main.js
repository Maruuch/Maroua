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
    const start = () => requestAnimationFrame(() => initAll(isDesktop));
    const loader = document.getElementById('loader');

    if (!loader || loader.classList.contains('hidden')) {
      start();
    } else {
      const obs = new MutationObserver(() => {
        if (loader.classList.contains('hidden')) {
          obs.disconnect();
          start();
        }
      });
      obs.observe(loader, { attributes: true, attributeFilter: ['class'] });
      // Garde-fou : 5s max
      gsap.delayedCall(5, () => { obs.disconnect(); start(); });
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
  initParallaxHeroBg();
  initHeaderScrollState();
  console.log('[GSAP] animations initialisées (skill: gsap-core)');
}

// ────────────────────────────────────────────────────────────────
// 1️⃣  HERO — entrée chorégraphiée + SplitText calligraphique
// ────────────────────────────────────────────────────────────────
function initHero(isDesktop) {
  const heroLeft = document.querySelector('.hero-left');
  if (!heroLeft) return;

  // ── Préparation du titre via SplitText ──
  const titleEl = document.querySelector('.hero-title');
  let titleSplit = null;
  if (titleEl) {
    titleSplit = new SplitText(titleEl, {
      type: 'lines,words,chars',
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
      mask: 'lines',
    });
    gsap.set(titleSplit.chars, {
      yPercent: 110,
      autoAlpha: 0,
      rotationZ: 4,
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

  // Timeline maître
  const tl = gsap.timeline();

  tl.to('.hero-hairline', {
    scaleX: 1,
    autoAlpha: 0.7,
    duration: 1.4,
    ease: 'expo.out',
  })
  .to('.hero-left > .hero-line',    { autoAlpha: 1, y: 0 }, '-=1.0')
  .to('.hero-left > .hero-eyebrow', { autoAlpha: 1, y: 0 }, '-=0.65');

  // SplitText reveal — stagger object syntax (officiel GSAP)
  if (titleSplit) {
    tl.to(titleSplit.chars, {
      yPercent: 0,
      autoAlpha: 1,
      rotationZ: 0,
      duration: 1.0,
      ease: 'expo.out',
      stagger: { each: 0.022, from: 'start' },
    }, '-=0.5');
  }

  tl.to('.hero-left > .hero-desc', { autoAlpha: 1, y: 0 }, '-=0.4')
    .to('.hero-left > .hero-cta',  { autoAlpha: 1, y: 0 }, '-=0.55')
    .to('.hero-right .hero-card', {
      autoAlpha: 1, y: 0, rotationX: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: { each: 0.18, from: 'start' },
    }, '-=1.6');

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
// ────────────────────────────────────────────────────────────────
function initScrollReveal() {
  ScrollTrigger.batch('.reveal:not(.hero-card)', {
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
