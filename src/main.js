// ================================================================
// 🎬 MAROUA JEWELRY — animations GSAP premium
// ================================================================
// Module ES bundlé par Vite. Importe gsap + plugins depuis npm.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText }     from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
  // Mode accessibilité : tout visible immédiatement, pas d'anim.
  document.querySelectorAll(
    '.hero-hairline, .hero-right .hero-card, .hero-left > *'
  ).forEach(el => { el.style.opacity = ''; });
} else {
  const start = () => requestAnimationFrame(initAll);
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
    setTimeout(() => { obs.disconnect(); start(); }, 5000);
  }
}

// ────────────────────────────────────────────────────────────────
// INIT GLOBAL — tout démarre ici
// ────────────────────────────────────────────────────────────────
function initAll() {
  initHero();
  initCursorHalo();
  initImageReveals();
  initScrollReveal();
  initParallaxHeroBg();
  initHeaderScrollState();
  console.log('[GSAP] animations initialisées (3 effets premium)');
}

// ────────────────────────────────────────────────────────────────
// 1️⃣  HERO — entrée chorégraphiée + SplitText calligraphique
// ────────────────────────────────────────────────────────────────
function initHero() {
  const heroLeft = document.querySelector('.hero-left');
  if (!heroLeft) return;

  // ── Préparation du titre via SplitText ──
  const titleEl = document.querySelector('.hero-title');
  let titleSplit = null;
  if (titleEl) {
    // Split en lignes → mots → caractères. Mask "lines" crée un wrapper
    // overflow:hidden autour de chaque ligne pour un reveal propre.
    titleSplit = new SplitText(titleEl, {
      type: 'lines,words,chars',
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
      mask: 'lines',
    });
    gsap.set(titleSplit.chars, {
      yPercent: 110,
      opacity: 0,
      rotateZ: 4,
      transformOrigin: '50% 100%',
    });
  }

  // États initiaux des autres éléments
  gsap.set('.hero-left > .hero-line, .hero-left > .hero-eyebrow, .hero-left > .hero-desc, .hero-left > .hero-cta', {
    opacity: 0, y: 30,
  });
  gsap.set('.hero-right .hero-card', {
    opacity: 0, y: 60, rotateX: -8, transformPerspective: 1100,
  });
  gsap.set('.hero-hairline', { scaleX: 0, opacity: 0, transformOrigin: 'center' });

  // Timeline maître
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl
    .to('.hero-hairline', {
      scaleX: 1, opacity: 0.7,
      duration: 1.4, ease: 'expo.out',
    })
    .to('.hero-left > .hero-line',    { opacity: 1, y: 0, duration: 0.8 }, '-=1.0')
    .to('.hero-left > .hero-eyebrow', { opacity: 1, y: 0, duration: 0.8 }, '-=0.65');

  // SplitText reveal — chaque caractère monte en cascade calligraphique
  if (titleSplit) {
    tl.to(titleSplit.chars, {
      yPercent: 0,
      opacity: 1,
      rotateZ: 0,
      duration: 1.0,
      stagger: 0.022,
      ease: 'expo.out',
    }, '-=0.5');
  }

  tl
    .to('.hero-left > .hero-desc', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
    .to('.hero-left > .hero-cta',  { opacity: 1, y: 0, duration: 0.8 }, '-=0.55')
    .to('.hero-right .hero-card', {
      opacity: 1, y: 0, rotateX: 0,
      duration: 1.1, stagger: 0.18, ease: 'power4.out',
    }, '-=1.6');

  // ── Tilt 3D au mouvement souris ──
  document.querySelectorAll('.hero-card').forEach(card => {
    const qX = gsap.quickTo(card, 'rotateY', { duration: 0.55, ease: 'power3.out' });
    const qY = gsap.quickTo(card, 'rotateX', { duration: 0.55, ease: 'power3.out' });
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

// ────────────────────────────────────────────────────────────────
// 3️⃣  CURSOR HALO — halo doré qui suit la souris avec lag premium
// ────────────────────────────────────────────────────────────────
function initCursorHalo() {
  // Pas de halo sur tactile (pas de souris)
  if (window.matchMedia('(hover: none)').matches) return;

  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  document.body.appendChild(halo);

  const xTo = gsap.quickTo(halo, 'x', { duration: 0.55, ease: 'power3.out' });
  const yTo = gsap.quickTo(halo, 'y', { duration: 0.55, ease: 'power3.out' });
  const sTo = gsap.quickTo(halo, 'scale', { duration: 0.35, ease: 'power3.out' });
  const oTo = gsap.quickTo(halo, 'opacity', { duration: 0.35, ease: 'power3.out' });

  // Initialement caché jusqu'au premier mousemove
  gsap.set(halo, { x: -200, y: -200, scale: 0.8, opacity: 0 });

  let firstMove = true;
  window.addEventListener('mousemove', (e) => {
    if (firstMove) { oTo(1); firstMove = false; }
    xTo(e.clientX);
    yTo(e.clientY);
  });

  // Grossit au survol des liens / boutons (signal interactif)
  document.querySelectorAll('a, button, [data-page], .product-card, .hero-card, .filter-btn')
    .forEach(el => {
      el.addEventListener('mouseenter', () => sTo(1.6));
      el.addEventListener('mouseleave', () => sTo(1));
    });

  // Disparaît quand la souris quitte la fenêtre
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

  // Refresh ScrollTrigger après chargement complet (pour images dynamiques)
  window.addEventListener('load', () => {
    setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}

// ────────────────────────────────────────────────────────────────
// AUTRES — sections au scroll, parallaxe, header
// ────────────────────────────────────────────────────────────────
function initScrollReveal() {
  ScrollTrigger.batch('.reveal:not(.hero-card)', {
    start: 'top 85%',
    onEnter: (els) => {
      gsap.fromTo(els,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 0.9, stagger: 0.08,
          ease: 'power3.out',
          overwrite: 'auto',
        }
      );
    },
  });
}

function initParallaxHeroBg() {
  // Léger drift de l'image fond du hero au scroll (optionnel, scrub continu)
  const heroLeft = document.querySelector('.hero-left');
  if (!heroLeft) return;
  gsap.to(heroLeft, {
    backgroundPosition: '50% 30%',
    scrollTrigger: {
      trigger: heroLeft,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
    },
  });
}

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
