// ================================================================
// 📞 CONTACT DRAWER — accès rapide depuis le header
// ================================================================

const ContactDrawer = (() => {

  function open() {
    document.getElementById('contactDrawer').classList.add('open');
    document.getElementById('contactOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('contactDrawer').classList.remove('open');
    document.getElementById('contactOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    document.getElementById('contactBtn').addEventListener('click', open);
    document.getElementById('contactClose').addEventListener('click', close);
    document.getElementById('contactOverlay').addEventListener('click', close);
  }

  return { init, open, close };
})();
