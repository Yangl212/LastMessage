// Blue Whale Chat Group - new user view
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

  const announcements = [
    {
      id: 'a1',
      title: 'About Blue Whale Chat Group',
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

  const keywordResponses = {
    'chat group rules': '"Heart-knot" is the core password used to recognize your identity. Please remember it well.\n\nWhen chatting in the group, do not send unrelated content at will.\n\nIf you have any questions, please use keywords to ask them in the group chat.\n\nOn the day you join, follow the "0 DAY" principle: report your X account to the administrator and keep it continuously updated.\n\nYou do not have permission to send private messages to other members in the group.\n\nBliss in the Pure Land.',
    'chat group rule': '"Heart-knot" is the core password used to recognize your identity. Please remember it well.\n\nWhen chatting in the group, do not send unrelated content at will.\n\nIf you have any questions, please use keywords to ask them in the group chat.\n\nOn the day you join, follow the "0 DAY" principle: report your X account to the administrator and keep it continuously updated.\n\nYou do not have permission to send private messages to other members in the group.\n\nBliss in the Pure Land.',
    'chat groups rules': '"Heart-knot" is the core password used to recognize your identity. Please remember it well.\n\nWhen chatting in the group, do not send unrelated content at will.\n\nIf you have any questions, please use keywords to ask them in the group chat.\n\nOn the day you join, follow the "0 DAY" principle: report your X account to the administrator and keep it continuously updated.\n\nYou do not have permission to send private messages to other members in the group.\n\nBliss in the Pure Land.',
    roles: 'Roles Overview:\nMidnight - Administrator who validates clues and assigns reviews.\nCry - Observer focused on cross-checking alibis.\nNo. 5 - Archivist who mirrors media into the vault.\nNo. 7 - Field monitor gathering daily status reports.\nNo. 9 - Analyst translating symbols and numerics.\nNo. 13 - Liaison forwarding results to the outer circle.\nYou - Intake recorder capturing new-member impressions.',
    'blue whale chat group': 'The Blue Whale chat group is an online "youth counseling platform" created by professional psychological advisors.\nHere, every frustration you carry will be heard, every secret will be held gently, and none of your feelings will ever be judged.\nWe understand what you have been through, and we will stay with you through the nights no one else notices.\nAll you need to do is trust us - let us guide you toward a lighter heart.',
    '50 day': 'Follow us through these 50 tasks, and you will be reborn.\nWe will begin with the first one - a gentle step to help you connect with us and ease your mind.\n\nDay 1:\nRecord the first blue object you see today.\nOnce you take the photo, I will open our conversation.',
    'heart-knot': 'Heart-knot was the reason you were able to enter this place.\nBut please do not speak about it in public spaces.',
    midnight: [
      'Hello. Is there anything I can help you with?',
      'If you’re carrying something heavy, you’re welcome to share it with the group. And if you’d prefer, you can message me privately as well.'
    ],
    archived: [
      'Those are the members whose psychological case has been concluded.',
      'After the 30-day process, their journals are archived in the system.',
      'If you are interested in the structure of the task, you may look at No. 8’s record. In a few days, her record will be archived as well.'
    ],
    'no.8': {
      user: 'No. 9',
      lines: [
        'Oh, you mean her…? Yeah, I remember she was under a lot of pressure. Like, a lot. But honestly, I always thought she was kind of amazing. You could tell she was trying really hard.',
        'It’s just… I still don’t get it. Midnight literally said a couple of days ago that she was doing better. That her issues were basically resolved.',
        'So how does that even happen?',
        { user: 'Midnight', text: 'I know that’s unsettling, but speculation won’t help anyone right now. Please refrain from continuing this discussion.' }
      ]
    },
    'allery lin': {
      user: 'No. 9',
      lines: [
        'Oh, you mean her…? Yeah, I remember she was under a lot of pressure. Like, a lot. But honestly, I always thought she was kind of amazing. You could tell she was trying really hard.',
        'It’s just… I still don’t get it. Midnight literally said a couple of days ago that she was doing better. That her issues were basically resolved.',
        'So how does that even happen?',
        { user: 'Midnight', text: 'I know that’s unsettling, but speculation won’t help anyone right now. Please refrain from continuing this discussion.' }
      ]
    }
  };

  createChatApp({
    messagesEl,
    input,
    form,
    quickSearch,
    memberList,
    memberModal,
    modalMessageButton,
    sendButton,
    onSendMessage: (text, helpers) => {
      handleKeywordResponse(text, helpers);
    },
    onMemberMessage: (member) => {
      if (member === 'Midnight') {
        window.location.href = 'newuser_midnight.html';
      } else {
        alert('Permission denied: only administrators are allowed to privately message others.');
      }
    }
  });

  function handleKeywordResponse(text, helpers){
    const normalized = text.toLowerCase();
    const entry = Object.entries(keywordResponses).find(([keyword]) => normalized.includes(keyword));
    if (!entry || !helpers) return;

    const [, response] = entry;
    const sender = response && typeof response === 'object' && !Array.isArray(response) ? (response.user || 'Midnight') : 'Midnight';
    const responses = response && typeof response === 'object' && !Array.isArray(response)
      ? (Array.isArray(response.lines) ? response.lines : [String(response.lines || '')])
      : (Array.isArray(response) ? response : [response]);

    responses.forEach((line, index) => {
      const payload = typeof line === 'string'
        ? { user: sender, text: line }
        : { user: line.user || sender, text: String(line.text || '') };
      setTimeout(() => {
        helpers.appendMessage({
          user: payload.user,
          time: nowHHMM(),
          text: payload.text,
          me: false
        });
      }, 2000 + index * 1200);
    });
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
    if (e.target.dataset?.close !== undefined || e.target.classList.contains('modal-backdrop')) {
      closeAnnouncement();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && announcementModal && !announcementModal.hidden) {
      closeAnnouncement();
    }
  });
});
