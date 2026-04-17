// Blue Whale Chat Group - new user view (zh)
document.addEventListener('DOMContentLoaded', () => {
  let missedKeywordCount = 0;
  let hasSentGreetingReply = false;
  const seenHintKeywords = new Set();
  let hasShownQuestionLimitReminder = false;
  let isAwaitingPsychologistReply = false;
  const psychologistHistory = [];
  const hintSuggestionByGroup = {
    '30-tasks': '30个任务是什么？',
    midnight: 'Midnight是谁？',
    administrator: '管理员是什么？',
    'chat-group-rules': '聊天群规是什么？',
    'allery-lin': '林艾乐是谁？',
    'blue-whale-chat-group': '蓝鲸聊天群是什么？'
  };
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
      title: '什么是蓝鲸聊天室？',
      body: [
        '欢迎来到蓝鲸聊天室！',
        '或许你有听说过“蓝鲸挑战”吗？它曾是网络上广为流传的话题，被许多人称为一种针对青少年的系统性引导机制，多年来引发了大量讨论与报道。如果你对此感到好奇，可以前往 Google 或维基百科搜索相关资料，那里留下了许多关于它的记录。',
        '在这个聊天室里，你可以倾诉压力、分享情绪，希望大家都有更幸福的明天'
      ].join('\n\n')
    },
    {
      id: 'a2',
      title: '30个任务进度表',
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

  const keywordResponses = {
    '聊天群规则': '这里的规则不多。\n\n尽量不要分享太多个人信息……比如你的真实姓名。\n\n让我们保持与这个空间相关的对话。\n如果话题偏离太远，我可能不会一直回应。\n\n至于我，我会在合适的时机安排一对一交流。\n\n到时候，请诚实地回答。慢慢来，尽量详细，试着信任我。',
    规则: '这里的规则不多。\n\n尽量不要分享太多个人信息……比如你的真实姓名。\n\n让我们保持与这个空间相关的对话。\n如果话题偏离太远，我可能不会一直回应。\n\n至于我，我会在合适的时机安排一对一交流。\n\n到时候，请诚实地回答。慢慢来，尽量详细，试着信任我。',
    '聊天群须知': '这里的规则不多。\n\n尽量不要分享太多个人信息……比如你的真实姓名。\n\n让我们保持与这个空间相关的对话。\n如果话题偏离太远，我可能不会一直回应。\n\n至于我，我会在合适的时机安排一对一交流。\n\n到时候，请诚实地回答。慢慢来，尽量详细，试着信任我。',
    蓝鲸聊天室: '蓝鲸聊天群是一个由专业心理顾问创立的线上"青少年咨询平台"。\n在这里，你所有的烦恼都会被倾听，每一个秘密都会被温柔守护，你的任何感受都不会被评判。\n我们理解你经历的一切，会陪伴你度过那些无人注意的漫漫长夜。\n你所需要做的，只是信任我们——让我们引导你走向更轻盈的内心。',
    蓝鲸游戏: '蓝鲸聊天群是一个由专业心理顾问创立的线上"青少年咨询平台"。\n在这里，你所有的烦恼都会被倾听，每一个秘密都会被温柔守护，你的任何感受都不会被评判。\n我们理解你经历的一切，会陪伴你度过那些无人注意的漫漫长夜。\n你所需要做的，只是信任我们——让我们引导你走向更轻盈的内心。',
    蓝鲸挑战: '蓝鲸聊天群是一个由专业心理顾问创立的线上"青少年咨询平台"。\n在这里，你所有的烦恼都会被倾听，每一个秘密都会被温柔守护，你的任何感受都不会被评判。\n我们理解你经历的一切，会陪伴你度过那些无人注意的漫漫长夜。\n你所需要做的，只是信任我们——让我们引导你走向更轻盈的内心。',
    蓝鲸聊天群: '蓝鲸聊天群是一个由专业心理顾问创立的线上"青少年咨询平台"。\n在这里，你所有的烦恼都会被倾听，每一个秘密都会被温柔守护，你的任何感受都不会被评判。\n我们理解你经历的一切，会陪伴你度过那些无人注意的漫漫长夜。\n你所需要做的，只是信任我们——让我们引导你走向更轻盈的内心。',
    '30个任务': '这是一项旨在帮助正在经历心理健康困境的孩子重新找到快乐的活动。第一天，我们从一个简单的任务开始："今天的心情打几分？"',
    30: '这是一项旨在帮助正在经历心理健康困境的孩子重新找到快乐的活动。第一天，我们从一个简单的任务开始："今天的心情打几分？"',
    任务: '这是一项旨在帮助正在经历心理健康困境的孩子重新找到快乐的活动。第一天，我们从一个简单的任务开始："今天的心情打几分？"',
    管理员: [
      '很高兴你有帮助他人的心意。',
      '在右侧找到我，点击"发送消息"，告诉我你想做管理员，我们会在私信中详细讨论这方面的东西。'
    ],
    midnight: [
      { user: 'Midnight', text: '我是一名顾问。我帮助你处理生活中的困扰。' },
      { user: 'No. 5', text: 'Midnight是一个非常温柔善良的人。你可以信任他。' }
    ],
    'no.6': {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
      ]
    },
    6: {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
      ]
    },
    allery: {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
      ]
    },
    lin: {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
      ]
    },
    allerylin: {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
      ]
    },
    'allery lin': {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
      ]
    },
    林艾乐: {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
      ]
    },
    艾乐: {
      user: 'No. 5',
      lines: [
        '哦，你是说她……？对，我记得她压力很大。真的很大。但老实说，我一直觉得她很了不起。你能看出她有多努力。',
        '只是……我还是不明白。Midnight就在几天前还说她情况好多了。说她的问题基本上已经解决了。',
        '那怎么会发生那种事呢？',
        { user: 'Midnight', text: '我知道这让人不安，但现在的猜测对任何人都没有帮助。请不要继续讨论这个话题。' }
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
    onSendMessage: async (text, helpers) => {
      const greeted = handleGreetingResponse(text, helpers);
      if (greeted) {
        missedKeywordCount = 0;
        return;
      }

      const matched = handleKeywordResponse(text, helpers);
      if (matched) {
        missedKeywordCount = 0;
        return;
      }

      const handledByApi = await handlePsychologistFallback(text, helpers);
      if (handledByApi) {
        missedKeywordCount = 0;
        return;
      }

      missedKeywordCount += 1;
      if (missedKeywordCount >= 2) {
        const lines = [
          '也许你应该把时间用在问真正重要的事情上。',
          '我不会一直在这里回复。'
        ];
        lines.forEach((line, index) => {
          setTimeout(() => {
            helpers.appendMessage({
              user: 'Midnight',
              time: nowHHMM(),
              text: line,
              me: false
            });
          }, 1800 + index * 1400);
        });
        missedKeywordCount = 0;
      }
    },
    onMemberMessage: (member) => {
      if (member === 'Midnight') {
        window.location.href = 'newuser_midnight-zh.html';
      } else {
        alert('权限拒绝：只有管理员可以私信其他成员。');
      }
    }
  });

  syncHintSuggestion();

  function handleGreetingResponse(text, helpers){
    if (!helpers || hasSentGreetingReply) return false;
    const normalized = String(text || '').trim().toLowerCase();
    if (!(/\b(hi|hello)\b/.test(normalized) || normalized.includes('你好'))) return false;

    hasSentGreetingReply = true;
    setTimeout(() => {
      helpers.appendMessage({
        user: 'No. 5',
        time: nowHHMM(),
        text: '你好！很高兴见到你！',
        me: false
      });
    }, 1200);

    return true;
  }

  function handleKeywordResponse(text, helpers){
    const normalized = text.toLowerCase();
    const entry = Object.entries(keywordResponses).find(([keyword]) => normalized.includes(keyword));
    if (!entry || !helpers) return false;

    const [keyword, response] = entry;
    const sender = response && typeof response === 'object' && !Array.isArray(response) ? (response.user || 'Midnight') : 'Midnight';
    const responses = response && typeof response === 'object' && !Array.isArray(response)
      ? (Array.isArray(response.lines) ? response.lines : [String(response.lines || '')])
      : (Array.isArray(response) ? response : [response]);

    registerHintKeyword(keyword);
    maybeShowQuestionLimitReminder(helpers);

    const expandedResponses = responses.flatMap((line) => {
      if (typeof line === 'string') {
        return splitResponseParagraphs(line).map((part) => ({ user: sender, text: part }));
      }

      const lineUser = line.user || sender;
      return splitResponseParagraphs(String(line.text || '')).map((part) => ({ user: lineUser, text: part }));
    });

    let delay = randomReplyDelay();
    expandedResponses.forEach((payload, index) => {
      setTimeout(() => {
        helpers.appendMessage({
          user: payload.user,
          time: nowHHMM(),
          text: payload.text,
          me: false
        });
      }, delay);
      if (index < expandedResponses.length - 1) {
        delay += randomReplyDelay();
      }
    });

    return true;
  }

  function splitResponseParagraphs(text){
    return String(text || '')
      .split(/\n\s*\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function randomReplyDelay(){
    return 2000 + Math.floor(Math.random() * 3001);
  }

  async function handlePsychologistFallback(text, helpers){
    if (!helpers || isAwaitingPsychologistReply) return false;

    isAwaitingPsychologistReply = true;
    psychologistHistory.push({ role: 'user', content: text });

    try {
      const res = await fetch('/api/psychologist-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: psychologistHistory.slice(0, -1)
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Request failed.');
      }

      const reply = String(data?.reply || '').trim();
      if (!reply) {
        psychologistHistory.pop();
        return false;
      }

      psychologistHistory.push({ role: 'assistant', content: reply });
      window.setTimeout(() => {
        helpers.appendMessage({
          user: 'Midnight',
          time: nowHHMM(),
          text: reply,
          me: false
        });
      }, 1400);
      return true;
    } catch (_error) {
      psychologistHistory.pop();
      return false;
    } finally {
      isAwaitingPsychologistReply = false;
    }
  }

  function registerHintKeyword(keyword){
    const normalizedKeyword = String(keyword || '').trim().toLowerCase();
    if (!normalizedKeyword || !window.HintProgress?.incrementPercent) return;

    const progressKey = getProgressKeywordGroup(normalizedKeyword);
    if (seenHintKeywords.has(progressKey)) return;

    seenHintKeywords.add(progressKey);
    window.HintProgress.incrementPercent(2);
    syncHintSuggestion();
  }

  function getProgressKeywordGroup(keyword){
    const keywordGroupMap = {
      聊天群规则: 'chat-group-rules',
      规则: 'chat-group-rules',
      聊天群须知: 'chat-group-rules',
      蓝鲸聊天室: 'blue-whale-chat-group',
      蓝鲸游戏: 'blue-whale-chat-group',
      蓝鲸挑战: 'blue-whale-chat-group',
      蓝鲸聊天群: 'blue-whale-chat-group',
      '30个任务': '30-tasks',
      30: '30-tasks',
      任务: '30-tasks',
      管理员: 'administrator',
      allery: 'allery-lin',
      lin: 'allery-lin',
      allerylin: 'allery-lin',
      'allery lin': 'allery-lin',
      'no.6': 'allery-lin',
      6: 'allery-lin',
      林艾乐: 'allery-lin',
      艾乐: 'allery-lin'
    };
    return keywordGroupMap[keyword] || keyword;
  }

  function readSeenHintKeywords(){
    return Array.from(seenHintKeywords);
  }

  function syncHintSuggestion(){
    if (!window.HintProgress?.setLines) return;
    const seenKeywords = new Set(readSeenHintKeywords());
    const remainingSuggestions = Object.entries(hintSuggestionByGroup)
      .filter(([groupKey]) => groupKey !== '30-tasks' && !seenKeywords.has(groupKey))
      .map(([, suggestion]) => suggestion);

    const suggestion = seenKeywords.size === 0
      ? hintSuggestionByGroup['30-tasks']
      : (remainingSuggestions.length
          ? remainingSuggestions[Math.floor(Math.random() * remainingSuggestions.length)]
          : '看来你已经追完了这里所有的线索。');

    window.HintProgress.setLines([
      `你现在可以在聊天框里输入任何你好奇的问题……也许可以从这样的问题开始：${suggestion}`,
      '（此页面将在22%时完全探索完毕）'
    ]);
  }

  function maybeShowQuestionLimitReminder(helpers){
    if (hasShownQuestionLimitReminder) return;
    const trackedGroups = Object.keys(hintSuggestionByGroup);
    const hasCompletedAllTrackedHints = trackedGroups.every((groupKey) => seenHintKeywords.has(groupKey));
    if (!hasCompletedAllTrackedHints) return;

    hasShownQuestionLimitReminder = true;
    const lines = [
      '看来你已经问了不少问题了。',
      '先花点时间熟悉一下这个聊天室吧。'
    ];

    lines.forEach((text, index) => {
      window.setTimeout(() => {
        helpers.appendMessage({
          user: 'Midnight',
          time: nowHHMM(),
          text,
          me: false
        });
      }, 2600 + index * 1400);
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
