(() => {
  'use strict';
  document.querySelectorAll('[data-copy-email]').forEach(button => {
    button.addEventListener('click', async () => {
      const email = button.getAttribute('data-copy-email');
      const status = button.parentElement?.querySelector('.copy-email-status');
      if (!email || !status) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(email);
        status.textContent = 'Dirección copiada: ' + email;
      } catch {
        status.textContent = 'Copia esta dirección: ' + email;
      }
    });
  });
})();
