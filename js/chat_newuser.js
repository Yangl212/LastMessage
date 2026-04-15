// Blue Whale Chat Group - new user view
document.addEventListener('DOMContentLoaded', () => {
  let missedKeywordCount = 0;
  let hasSentGreetingReply = false;
  const seenHintKeywords = new Set();
  let hasShownQuestionLimitReminder = false;
  let isAwaitingPsychologistReply = false;
  const psychologistHistory = [];
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
      title: '30 Task Reflection Progress',
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
    'chat group rules': 'There aren’t too many rules here.\n\nJust try not to share too much personal information… things like your real name, for example.\n\nAnd let’s keep the conversation related to this space.\nIf it drifts too far into unrelated topics, I may not always respond.\n\nAs for me, I’ll arrange one-on-one sessions when the time feels right.\n\nWhen that happens, just answer honestly. Take your time, and be as detailed as you can and try to trust me.',
    'chat group rule': 'There aren’t too many rules here.\n\nJust try not to share too much personal information… things like your real name, for example.\n\nAnd let’s keep the conversation related to this space.\nIf it drifts too far into unrelated topics, I may not always respond.\n\nAs for me, I’ll arrange one-on-one sessions when the time feels right.\n\nWhen that happens, just answer honestly. Take your time, and be as detailed as you can and try to trust me.',
    'chat groups rules': 'There aren’t too many rules here.\n\nJust try not to share too much personal information… things like your real name, for example.\n\nAnd let’s keep the conversation related to this space.\nIf it drifts too far into unrelated topics, I may not always respond.\n\nAs for me, I’ll arrange one-on-one sessions when the time feels right.\n\nWhen that happens, just answer honestly. Take your time, and be as detailed as you can and try to trust me.',
    'blue whale chat group': 'The Blue Whale chat group is an online "youth counseling platform" created by professional psychological advisors.\nHere, every frustration you carry will be heard, every secret will be held gently, and none of your feelings will ever be judged.\nWe understand what you have been through, and we will stay with you through the nights no one else notices.\nAll you need to do is trust us - let us guide you toward a lighter heart.',
    '30 task': 'This is an activity designed to help children struggling with mental health find their way back to happiness. On the first day, we begin with a simple task: “Rate your mood today.”',
    admin: [
      'I’m glad you have the intention to help others.',
      'We’ll go into this in more detail in private. Find me on the right and click “send message.”'
    ],
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
          'Maybe you should spend your time asking something that actually matters.',
          'I won’t always be around to reply.'
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
        window.location.href = 'newuser_midnight.html';
      } else {
        alert('Permission denied: only administrators are allowed to privately message others.');
      }
    }
  });

  syncHintSuggestion();

  function handleGreetingResponse(text, helpers){
    if (!helpers || hasSentGreetingReply) return false;
    const normalized = String(text || '').trim().toLowerCase();
    if (!/\b(hi|hello)\b/.test(normalized)) return false;

    hasSentGreetingReply = true;
    setTimeout(() => {
      helpers.appendMessage({
        user: 'No. 5',
        time: nowHHMM(),
        text: 'hi! Nice to see you!',
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
