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
      title: '什么是蓝鲸聊天室？',
      body: [
        '欢迎来到蓝鲸聊天室！',
        '或许你有听说过“蓝鲸挑战”吗？它曾是网络上广为流传的话题，被许多人称为一种针对青少年的系统性引导机制，多年来引发了大量讨论与报道。如果你对此感到好奇，可以前往 Google 或维基百科搜索相关资料，那里留下了许多关于它的记录。',
        '在这个聊天室里，你可以倾诉压力、分享情绪，希望大家都有更幸福的明天'
      ].join('\n\n')
    },
    {
      id: 'a2',
      title: '30个任务 进度表',
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
        text: '？'
      });

      window.setTimeout(() => {
        helpers.appendMessage({
          user: 'No. 5',
          time: nowHHMM(),
          text: '？？？前两天不是有新闻报道说你死了吗？'
        });

        window.setTimeout(() => {
          helpers.appendMessage({
            user: '系统',
            time: nowHHMM(),
            text: '你已被移除群聊。',
            variant: 'system'
          });
          helpers.lockComposer('你已被移除群聊');
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
