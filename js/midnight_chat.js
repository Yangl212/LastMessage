// Midnight direct channel interactions
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages');
  const input = document.getElementById('input');
  const form = document.getElementById('composer');
  const sendButton = form?.querySelector('.send');
  const isChinesePage = window.location.pathname.toLowerCase().endsWith('-zh.html');

  if (!messagesEl || !input || !form) return;

  let sequenceStarted = false;

  createChatApp({
    messagesEl,
    input,
    form,
    sendButton,
    ownAvatarSrc: 'assets/images/AlleyLin.jpg',
    memberAvatarOverrides: {
      Midnight: 'assets/images/member-Midnight.jpeg'
    },
    onSendMessage: (text, helpers) => {
      if (sequenceStarted || !helpers) return;
      sequenceStarted = true;
      helpers.lockComposer(isChinesePage ? '访问已被撤销。' : 'Access revoked.');

      window.setTimeout(() => {
        helpers.appendMessage({
          user: 'Midnight',
          time: nowHHMM(),
          text: isChinesePage ? '别问。' : 'Don’t ask.'
        });

        window.setTimeout(() => {
          helpers.appendMessage({
            user: 'Midnight',
            time: nowHHMM(),
            text: isChinesePage
              ? '不要试图知道那些你不需要知道的事。她会在别的地方过得很好。'
              : 'Do not seek what you do not need to know. She will be perfectly fine somewhere else.'
          });

          window.setTimeout(() => {
            window.location.href = isChinesePage ? 'warning-zh.html' : 'warning.html';
          }, 3200);
        }, 1800);
      }, 1400);
    }
  });

  function nowHHMM(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }
});
