document.addEventListener('DOMContentLoaded', () => {
  const panel = document.querySelector('.warning-panel');
  const message = panel?.querySelector('.warning-text');

  if (panel) {
    panel.setAttribute('tabindex', '-1');
    panel.focus();
  }

  if (message) {
    const phrases = [
      'This account has been automatically frozen.',
      'Access permanently revoked.',
      'Await further instructions.'
    ];
    let index = 0;
    window.setInterval(() => {
      index = (index + 1) % phrases.length;
      message.dataset.alt = phrases[index];
    }, 4000);
  }
});