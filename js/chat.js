// Blue Whale Chat Group - group view
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages');
  const input = document.getElementById('input');
  const form = document.getElementById('composer');
  const quickSearch = document.getElementById('quickSearch');
  const memberList = document.getElementById('memberList');
  const memberModal = document.getElementById('memberModal');
  const modalMessageButton = document.getElementById('modalMessageButton');
  const sendButton = form?.querySelector('.send');
  const announcementList = document.getElementById('announcementList');
  const announcementModal = document.getElementById('announcementModal');
  const announcementTitle = document.getElementById('announcementTitle');
  const announcementBody = document.getElementById('announcementBody');

  let interventionQueued = false;

  const announcements = [
    {
      id: 'a1',
      title: 'Role of Blue Whale Chat Group',
      body: [
        'Blue Whale Chatroom is an online emotional support platform.',
        'It is around that time that we launched our now-famous “Blue Whale Challenge,” a systematic guide that would help teenagers. The said methodology has been quite popular over the years, and discussions regarding it have been well-recorded in Google and Wiki.'
      ].join('\n\n')
    },
    {
      id: 'a2',
      title: '30-Day Reflection Progress',
      bodyHtml: [
        '<div class="progress-row"><span>No.2</span><span>Archived</span></div>',
        '<div class="progress-row"><span>No.3</span><span>Archived</span></div>',
        '<div class="progress-row"><span>No.4</span><span>Archived</span></div>',
        '<div class="progress-row"><span>No.5</span><span>18/30</span></div>',
        '<div class="progress-row"><span><a href="https://x.com/allerylin?s=21&t=Jb69PBnj3t_P4vimVyn-eQ" target="_blank" rel="noopener noreferrer">No.6</a></span><span>30/30</span></div>',
        '<div class="progress-row"><span>No.7</span><span>02/30</span></div>'
      ].join('')
    },
    {
      id: 'a3',
      title: 'Administrator Recruitment',
      body: [
        'As the number of participants in this space continues to grow, we are seeking one additional administrator to assist Midnight in maintaining structure and consistency within the group.',
        'Responsibilities include:',
        '– Managing participant records',
        '– Providing supportive guidance when necessary',
        '– Moderating group discussions',
        '',
        'If you believe you are ready to take on greater responsibility within this space, please contact Midnight privately.'
      ].join('\n')
    }
  ];

  createChatApp({
    messagesEl,
    input,
    form,
    quickSearch,
    memberList,
    memberModal,
    modalMessageButton,
    sendButton,
    showTime: false,
    ownMessageTimePlacement: 'center',
    onSendMessage: (_text, helpers) => {
      scheduleRemovalSequence(helpers);
    },
    onMemberMessage: (member) => {
      if (member === 'You') {
        alert('You cannot chat with yourself.');
      } else if (member === 'Midnight') {
        window.location.href = 'midnight_lin_chat.html';
      } else {
        alert('Permission denied: you do not have access to message this member.');
      }
    }
  });

  function scheduleRemovalSequence(helpers){
    if (!helpers || interventionQueued) return;
    interventionQueued = true;

    window.setTimeout(() => {
      helpers.appendMessage({
        user: 'No. 7',
        time: nowHHMM(),
        text: 'Wait… what?'
      });

      window.setTimeout(() => {
        helpers.appendMessage({
          user: 'No. 5',
          time: nowHHMM(),
          text: 'The news literally said you were dead two days ago!'
        });

        window.setTimeout(() => {
          helpers.appendMessage({
            user: 'System',
            time: nowHHMM(),
            text: 'The system has removed you from the group.',
            variant: 'system'
          });

          helpers.lockComposer('Access revoked.');
        }, 2000);
      }, 1000);
    }, 2000);
  }

  function nowHHMM(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }

  function openAnnouncement(id){
    if (!announcementModal || !announcementTitle || !announcementBody) return;
    const item = announcements.find(a => a.id === id);
    if (!item) return;
    announcementTitle.textContent = item.title;
    if (item.bodyHtml) {
      announcementBody.innerHTML = item.bodyHtml;
    } else {
      announcementBody.innerText = item.body;
    }
    announcementModal.hidden = false;
  }

  function closeAnnouncement(){
    if (!announcementModal) return;
    announcementModal.hidden = true;
  }

  announcementList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-announcement-id]');
    if (!btn) return;
    const id = btn.getAttribute('data-announcement-id');
    openAnnouncement(id);
  });

  announcementModal?.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target.classList.contains('modal-backdrop')) {
      closeAnnouncement();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && announcementModal && !announcementModal.hidden) {
      closeAnnouncement();
    }
  });
});
