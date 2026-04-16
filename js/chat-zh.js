// Blue Whale Chat Group - group view (zh)
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
  const disableAutoBan =
    document.body?.dataset?.disableAutoBan === 'true'
    || window.location.pathname.toLowerCase().endsWith('midnight_admin_chat-zh.html');
  let interventionQueued = false;

  const announcements = [
    {
      id: 'a1',
      title: '关于蓝鲸聊天群',
      body: [
        '蓝鲸聊天室是一个线上情感支持平台。',
        '正是在那段时间，我们推出了如今广为人知的"蓝鲸挑战"——一套旨在帮助青少年的系统性指引。多年来，该方法论颇受欢迎，相关讨论在Google和维基百科上均有详细记录。'
      ].join('\n\n')
    },
    {
      id: 'a2',
      title: '30天反思进度',
      bodyHtml: [
        '<div class="progress-row"><span>No.2</span><span>已归档</span></div>',
        '<div class="progress-row"><span>No.3</span><span>已归档</span></div>',
        '<div class="progress-row"><span>No.4</span><span>已归档</span></div>',
        '<div class="progress-row"><span>No.5</span><span>18/30</span></div>',
        '<div class="progress-row"><span><a href="https://x.com/allerylin?s=21&t=Jb69PBnj3t_P4vimVyn-eQ" target="_blank" rel="noopener noreferrer">No.6</a></span><span>30/30</span></div>',
        '<div class="progress-row"><span>No.7</span><span>02/30</span></div>'
      ].join('')
    },
    {
      id: 'a3',
      title: '管理员招募',
      body: [
        '随着参与者人数不断增加，我们正在寻找一位额外的管理员协助Midnight维持群组的秩序与一致性。',
        '职责包括：',
        '– 管理参与者记录',
        '– 在必要时提供支持性引导',
        '– 主持群组讨论',
        '',
        '如果你认为自己已准备好承担更多责任，请私信联系Midnight。'
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
      if (!disableAutoBan) {
        scheduleBanSequence(helpers);
      }
    },
    onMemberMessage: (member) => {
      if (member === 'You') {
        alert('你无法与自己聊天。');
      } else if (member === 'Midnight') {
        window.location.href = 'midnight_lin_chat-zh.html';
      } else {
        alert('权限拒绝：你无权发消息给该成员。');
      }
    }
  });

  function scheduleBanSequence(helpers){
    if (!helpers || interventionQueued) return;
    interventionQueued = true;

    window.setTimeout(() => {
      helpers.appendMessage({
        user: 'No. 7',
        time: nowHHMM(),
        text: '等等……什么？'
      });

      window.setTimeout(() => {
        helpers.appendMessage({
          user: 'No. 5',
          time: nowHHMM(),
          text: '新闻上明明说你两天前就死了！'
        });

        window.setTimeout(() => {
          helpers.appendMessage({
            user: 'System',
            time: nowHHMM(),
            text: 'You have been banned. You can no longer send messages.',
            variant: 'system'
          });
          helpers.lockComposer('Banned: sending messages is disabled.');
        }, 1500);
      }, 1200);
    }, 1800);
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
