// Blue Whale Chat Group - new user view
document.addEventListener('DOMContentLoaded', () => {
  let missedKeywordCount = 0;
  const seenHintKeywords = new Set();
  let hasShownQuestionLimitReminder = false;
  const hintSuggestionByGroup = {
    '30 task': 'What is the 30 Task?',
    midnight: 'Who is Midnight?',
    administrator: 'I want to be administrator.',
    'chat-group-rules': 'What is chat group rules?',
    'allery-lin': 'Who is Allery?',
    'blue whale chat group': 'What is blue whale chat group?'
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
    'blue whale chat group': 'The Blue Whale chat group is an online "youth counseling platform" created by professional psychological advisors.\nHere, every frustration you carry will be heard, every secret will be held gently, and none of your feelings will ever be judged.\nWe understand what you have been through, and we will stay with you through the nights no one else notices.\nAll you need to do is trust us - let us guide you toward a lighter heart.',
    '30 task': 'This is an activity designed to help children struggling with mental health find their way back to happiness. On the first day, we begin with a simple task: “Rate your mood today.”',
    administrator: [
      'I’m glad you have the intention to help others.',
      'We’ll go into this in more detail in private. Find me on the right and click “send message.”'
    ],
    midnight: [
      { user: 'Midnight', text: 'I’m a counselor. I help you work through the troubles in your life.' },
      { user: 'No. 5', text: 'Midnight is a very gentle and kind person. You can trust him.' }
    ],
    'no.6': {
      user: 'No. 5',
      lines: [
        'Oh, you mean her…? Yeah, I remember she was under a lot of pressure. Like, a lot. But honestly, I always thought she was kind of amazing. You could tell she was trying really hard.',
        'It’s just… I still don’t get it. Midnight literally said a couple of days ago that she was doing better. That her issues were basically resolved.',
        'So how does that even happen?',
        { user: 'Midnight', text: 'I know that’s unsettling, but speculation won’t help anyone right now. Please refrain from continuing this discussion.' }
      ]
    },
    6: {
      user: 'No. 5',
      lines: [
        'Oh, you mean her…? Yeah, I remember she was under a lot of pressure. Like, a lot. But honestly, I always thought she was kind of amazing. You could tell she was trying really hard.',
        'It’s just… I still don’t get it. Midnight literally said a couple of days ago that she was doing better. That her issues were basically resolved.',
        'So how does that even happen?',
        { user: 'Midnight', text: 'I know that’s unsettling, but speculation won’t help anyone right now. Please refrain from continuing this discussion.' }
      ]
    },
    allery: {
      user: 'No. 5',
      lines: [
        'Oh, you mean her…? Yeah, I remember she was under a lot of pressure. Like, a lot. But honestly, I always thought she was kind of amazing. You could tell she was trying really hard.',
        'It’s just… I still don’t get it. Midnight literally said a couple of days ago that she was doing better. That her issues were basically resolved.',
        'So how does that even happen?',
        { user: 'Midnight', text: 'I know that’s unsettling, but speculation won’t help anyone right now. Please refrain from continuing this discussion.' }
      ]
    },
    lin: {
      user: 'No. 5',
      lines: [
        'Oh, you mean her…? Yeah, I remember she was under a lot of pressure. Like, a lot. But honestly, I always thought she was kind of amazing. You could tell she was trying really hard.',
        'It’s just… I still don’t get it. Midnight literally said a couple of days ago that she was doing better. That her issues were basically resolved.',
        'So how does that even happen?',
        { user: 'Midnight', text: 'I know that’s unsettling, but speculation won’t help anyone right now. Please refrain from continuing this discussion.' }
      ]
    },
    allerylin: {
      user: 'No. 5',
      lines: [
        'Oh, you mean her…? Yeah, I remember she was under a lot of pressure. Like, a lot. But honestly, I always thought she was kind of amazing. You could tell she was trying really hard.',
        'It’s just… I still don’t get it. Midnight literally said a couple of days ago that she was doing better. That her issues were basically resolved.',
        'So how does that even happen?',
        { user: 'Midnight', text: 'I know that’s unsettling, but speculation won’t help anyone right now. Please refrain from continuing this discussion.' }
      ]
    },
    'allery lin': {
      user: 'No. 5',
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
      const matched = handleKeywordResponse(text, helpers);
      if (matched) {
        missedKeywordCount = 0;
        return;
      }
      missedKeywordCount += 1;
      if (missedKeywordCount >= 3) {
        window.HintProgress?.pulse?.();
        missedKeywordCount = 0;
      }
    },
    onMemberMessage: (member) => {
      if (member === 'Midnight') {
        window.location.href = 'newuser_midnight.html';
      } else {
        alert('Permission denied: only administrators are allowed to privately message others.');
      }
    }
  });

  syncHintSuggestion();

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

    return true;
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
      'chat group rules': 'chat-group-rules',
      'chat group rule': 'chat-group-rules',
      'chat groups rules': 'chat-group-rules',
      allery: 'allery-lin',
      lin: 'allery-lin',
      allerylin: 'allery-lin',
      'allery lin': 'allery-lin',
      'no.6': 'allery-lin',
      6: 'allery-lin'
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
      .filter(([groupKey]) => groupKey !== '30 task' && !seenKeywords.has(groupKey))
      .map(([, suggestion]) => suggestion);

    const suggestion = seenKeywords.size === 0
      ? hintSuggestionByGroup['30 task']
      : (remainingSuggestions.length
          ? remainingSuggestions[Math.floor(Math.random() * remainingSuggestions.length)]
          : 'Looks like you’ve already followed every lead here.');

    window.HintProgress.setLines([
      `You can now type anything you’re curious about into the chat box… maybe start with something like: ${suggestion}`,
      '(This page will be fully explored at 22%)'
    ]);
  }

  function maybeShowQuestionLimitReminder(helpers){
    if (hasShownQuestionLimitReminder) return;
    const trackedGroups = Object.keys(hintSuggestionByGroup);
    const hasCompletedAllTrackedHints = trackedGroups.every((groupKey) => seenHintKeywords.has(groupKey));
    if (!hasCompletedAllTrackedHints) return;

    hasShownQuestionLimitReminder = true;
    const lines = [
      'It seems like you’ve already asked quite a few questions.',
      'Take some time to get familiar with this chatroom first.'
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
