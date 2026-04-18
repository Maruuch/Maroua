// ================================================================
// 👤 ACCOUNT DRAWER — espace client
// ================================================================

const AccountDrawer = (() => {

  function open() {
    document.getElementById('accountDrawer').classList.add('open');
    document.getElementById('accountOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('accountDrawer').classList.remove('open');
    document.getElementById('accountOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    document.getElementById('accountBtn').addEventListener('click', open);
    document.getElementById('accountClose').addEventListener('click', close);
    document.getElementById('accountOverlay').addEventListener('click', close);

    const shopBtn = document.getElementById('accountShopBtn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => {
        close();
        Store.navigate('catalog', { filter: '' });
      });
    }
  }

  return { init, open, close };
})();
