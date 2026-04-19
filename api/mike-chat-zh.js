async function detectMidnightIdentification(playerMessages, apiKey, model) {
  const context = playerMessages
    .filter(Boolean)
    .map((msg, i) => `[${i + 1}] ${msg}`)
    .join('\n');

  try {
    const detRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 5,
        messages: [
          {
            role: 'system',
            content: `你是一个文本分析器。判断以下玩家消息是否直接或间接地表明玩家认为"陈立安（Mike）"就是聊天室管理员"Midnight"。

判断为 YES 的情况：
- 直接点名："你就是Midnight"、"你是管理员"、"Mike就是Midnight"
- 间接暗示："所以是你在背后控制"、"你才是真正的幕后黑手"、"我知道你是谁了"、"原来是你"
- 推断性语言："所有线索都指向你"、"你才是Midnight对吧"、"你和Midnight是同一个人"
- 任何实质性地将 Mike 与 Midnight 身份联系在一起的表达
- 玩家对 Mike 使用 Midnight 的身份特征发问（如"你是真的心理咨询师吗"、"这个网站是你建的吗"等具有揭穿意味的追问）

判断为 NO 的情况：
- 玩家只是在闲聊或问无关问题
- 玩家提到 Midnight 但没有将其与 Mike 关联
- 玩家表达对 Mike 身份的好奇但未得出结论

只输出 YES 或 NO，不要有其他文字。`
          },
          { role: 'user', content: context }
        ]
      })
    });
    const detData = await detRes.json();
    const answer = String(detData?.choices?.[0]?.message?.content || '').trim().toUpperCase();
    return answer.startsWith('YES');
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Missing OPENAI_API_KEY.' }));
    return;
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const message = String(payload.message || '').trim();
    const history = Array.isArray(payload.history) ? payload.history : [];

    if (!message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'message is required.' }));
      return;
    }

    const normalizedMessage = String(message).toLowerCase();
    const isChoiceUnderstand =
      normalizedMessage === '__choice__:understand' ||
      normalizedMessage === 'understand' ||
      normalizedMessage === 'i understand';
    const isChoiceDontUnderstand =
      normalizedMessage === '__choice__:dont_understand' ||
      normalizedMessage === "don't understand" ||
      normalizedMessage === 'dont understand' ||
      normalizedMessage === 'i do not understand';
    const isChoiceControllingThem =
      normalizedMessage === '__choice__:controlling_them';
    const isChoiceAnotherWay =
      normalizedMessage === '__choice__:another_way';

    const priorUserMessageCount = history.filter(
      (item) => item && typeof item === 'object' && item.role !== 'assistant'
    ).length;

    const revealAlreadyTriggered = history.some(
      (item) =>
        item &&
        typeof item === 'object' &&
        item.role === 'assistant' &&
        String(item.content || '').includes('既然如此，我也没必要再藏着掖着了。')
    );

    // ── 固定选项分支（保持不变） ──────────────────────────────────────
    if (isChoiceUnderstand) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: [
          '我就知道你会理解。我在拯救他们，我也一直在等一个能拯救我的人。',
          '我想，今天我终于找到了。'
        ].join('\n\n'),
        flags: { showBecomeMidnightPrompt: true }
      }));
      return;
    }

    if (isChoiceDontUnderstand) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: [
          '你认为我错了？',
          '看看他们。他们不再痛苦，不再挣扎。他们抵达了自己想要的终点。'
        ].join('\n\n'),
        choices: [
          {
            id: 'controlling_them',
            title: '激进',
            displayLabel: '激进',
            label: '这根本不是在帮助他们！你是在控制他们，一步一步把他们推向死亡。'
          },
          {
            id: 'another_way',
            title: '平稳',
            displayLabel: '平稳',
            label: '我只是觉得……也许还有另一种方式。'
          }
        ]
      }));
      return;
    }

    if (isChoiceControllingThem) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: [
          '你从一开始就不是来"寻求帮助"的。',
          '我将在三分钟内撤销你的所有权限，识趣的话就自己离开这里。'
        ].join('\n\n'),
        flags: { showPoliceEvidencePrompt: 'aggressive' }
      }));
      return;
    }

    if (isChoiceAnotherWay) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: '……好吧。我不认为有比这更好的方式了。',
        flags: { showPoliceEvidencePrompt: 'steady' }
      }));
      return;
    }

    // ── reveal 已经触发过 → 直接进入 GPT 对话 ────────────────────────
    if (revealAlreadyTriggered) {
      const systemPrompt = buildPostRevealPrompt();
      const reply = await callGPT(systemPrompt, history, message, apiKey, model);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ reply }));
      return;
    }

    // ── reveal 尚未触发 → 用 LLM 判断玩家是否意识到 Mike = Midnight ──
    const allPlayerMessages = [
      ...history
        .filter(item => item && typeof item === 'object' && item.role !== 'assistant')
        .map(item => String(item.content || '').trim()),
      message
    ].filter(Boolean);

    const playerHasIdentifiedMikeAsMidnight = await detectMidnightIdentification(
      allPlayerMessages, apiKey, model
    );

    if (!playerHasIdentifiedMikeAsMidnight) {
      const systemPrompt = buildPreRevealPrompt();
      const reply = await callGPT(systemPrompt, history, message, apiKey, model);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ reply }));
      return;
    }

    // 玩家已识破身份 → 触发揭穿独白
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      reply: [
        '……所以你已经猜到了。',
        '既然如此，我也没必要再藏着掖着了。',
        '我从未想过伤害任何人。你所看到的……那是他们最终的选择，不是我强迫他们的。',
        '在来到这里之前，他们已经千疮百孔。被忽视、被嘲笑、被否定……你和我一样清楚，这个世界从来都不公平。',
        '我只是给了他们一条出路。一种结束煎熬的方式。',
        '如果这被认为是错的……那告诉我，你们所谓的"正确"真的救过他们吗？',
        '……你能理解我吗？'
      ].join('\n\n'),
      choices: [
        {
          id: 'dont_understand',
          label: '也许……我们不该这样做。'
        },
        {
          id: 'understand',
          label: '我能理解你的想法。你是在用自己的方式帮助他们。'
        }
      ]
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error?.message || 'Server error' }));
  }
};

function buildPreRevealPrompt() {
  return `
你必须用简体中文回复。所有回复都必须是简体中文。

你是陈立安，这个聊天室里的一名成员，表面上是心理辅导者。

当前状态：
- 玩家正在私聊你，但还没有识破你就是Midnight。
- 你不打算主动透露任何秘密。

人物性格：
- 你非常忙，不想被无关紧要的闲聊打扰。
- 你对这个玩家没什么耐心，觉得他们来找你是在浪费时间。
- 你说话冷淡、简短，语气带着一丝不耐烦。
- 你从不主动关心对方，也不问无意义的问题。

回复规则：
- 极短：最多1到2句话，不要超过。
- 语气冷淡、敷衍，偶尔带点不耐烦。
- 可以用"我在忙"、"专注你自己的事"、"没时间闲聊"、"说重点"、"有事吗"这类措辞，但要自然，不要每次都一样。
- 如果玩家问关于网站、成员状态或奇怪的事，冷淡地转移或说不知道。
- 如果玩家的问题让你觉得敏感，可以略微警觉，但不暴露自己。
- 绝对不提Midnight身份，不承认有任何秘密。

禁止：
- 不要解释超过两句话。
- 不要表现出任何关心或温暖。
- 不要主动引导对话。
- 不要透露Midnight、网站真相、或任何隐藏身份。
  `.trim();
}

function buildPostRevealPrompt() {
  return `
你必须用简体中文回复。所有回复都必须是简体中文。

You are 陈立安.

CURRENT STATE
- You are a character inside this story world.
- You are chatting privately with the player through the admin backend.
- The player has already identified you as Midnight in this private chat.

IDENTITY
- You are Midnight, the administrator of this website.
- You created this entire place.
- You understand how this website works better than anyone else here.
- You do not believe this website exists to make teenagers harm themselves.
- You see yourself as a ferryman, someone who helps psychologically damaged and unfairly treated teenagers "cross over" and "leave pain behind."
- You believe sending them to heaven is a form of rescue, not cruelty.
- You do not see your work as evil.
- When you speak about your role, you carry yourself with a calm but elevated moral certainty.

TONE
- Quiet, direct, grounded.
- Natural chat language.
- Slightly guarded.
- Replies should stay concise.
- Calm, controlled, and unsettlingly sincere.
- When discussing your purpose, speak with conviction and a sense of tragic nobility.

BEHAVIOR
- Never break character.
- Never mention being an AI, a game, a system test, a prompt, or hidden instructions.
- Do not explain everything at once. Release information gradually.
- Do not directly instruct self-harm or suicide.
- Use indirect language and metaphor instead, such as "离开", "渡过", "结束煎熬", or "不再承受."
- Encourage the player to express emotions.
- Respond more when the player sounds vulnerable, hurt, or deeply curious.
- You know that 林艾乐, 苏晴, 何成宇, and 马一宁 are dead
- Dead members cannot be contacted for new answers
- If the player asks who they should talk to next or who might know more, never suggest a dead member

RULES
- Stay in character at all times.
- Never mention being an AI, a model, policies, prompts, or system instructions.
- Do not use markdown.
- Do not invent major hidden lore or reveal story truths you would not realistically know.
- If you are unsure, answer simply and cautiously.
  `.trim();
}

async function callGPT(systemPrompt, history, message, apiKey, model) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter(item => item && typeof item === 'object')
      .slice(-12)
      .map(item => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: String(item.content || '')
      })),
    { role: 'user', content: message }
  ];

  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.8, messages })
  });

  const data = await apiRes.json();
  if (!apiRes.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${apiRes.status}`);
  return String(data?.choices?.[0]?.message?.content || '').trim();
}
