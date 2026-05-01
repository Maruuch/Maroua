// ================================================================
// 🔔 TOAST — notifications légères
// ================================================================

const Toast = (() => {
  const container = () => document.getElementById('toastContainer');

  function show(message, type = 'default', duration = 3000) {
    const icons = { success: '✦', error: '✕', default: '◈' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.default}</span>
      <span>${message}</span>`;
    container().appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 400);
    }, duration);
  }

  return {
    success: (msg, d) => show(msg, 'success', d),
    error:   (msg, d) => show(msg, 'error', d),
    info:    (msg, d) => show(msg, 'default', d),
  };
})();
