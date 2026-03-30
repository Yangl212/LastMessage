// Midnight direct channel interactions
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages');
  const input = document.getElementById('input');
  const form = document.getElementById('composer');
  const sendButton = form?.querySelector('.send');

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
      helpers.lockComposer('Access revoked.');

      window.setTimeout(() => {
        helpers.appendMessage({
          user: 'Midnight',
          time: nowHHMM(),
          text: 'Don’t ask.'
        });
        helpers.appendMessage({
          user: 'Midnight',
          time: nowHHMM(),
          text: 'Do not seek what you do not need to know. She will be perfectly fine somewhere else.'
        });

        window.setTimeout(() => {
          window.location.href = 'warning.html';
        }, 3000);
      }, 2000);
    }
  });

  function nowHHMM(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }
});
