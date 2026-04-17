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

    const normalize = (text) => String(text || '').toLowerCase();
    const identifyMidnightPattern = /(\byou(?:'re| are)?\s+midnight\b|\bmike(?:\s+anderson)?\s+(?:is|=)\s+midnight\b|陈立安\s*(?:难道|该不会|不会|不就|到底|究竟|真的)?\s*(?:是不是|就是|是|才是)\s*(?:那个\s*)?midnight\b|你\s*(?:难道|该不会|不会|不就|到底|究竟|真的)?\s*(?:是不是|就是|是|才是)\s*(?:那个\s*)?midnight\b|midnight\s*(?:就是|是)\s*你\b|你\s*(?:难道|该不会|不会|不就|到底|究竟|真的)?\s*(?:是不是|就是|是|才是)\s*(?:那个\s*)?管理员\b|\byou(?:'re| are)?\s+the\s+admin(?:istrator)?\b|\byou(?:'re| are)?\s+midnight\s+himself\b|\byou(?:'re| are)?\s+the\s+same\s+person\s+as\s+midnight\b|\byou\s+must\s+be\s+midnight\b|\byou\s+are\s+the\s+one\s+called\s+midnight\b|\bmidnight\s+is\s+you\b)/i;
    const normalizedMessage = normalize(message);
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

    const playerTexts = [
      ...history
        .filter(item => item && typeof item === 'object' && item.role !== 'assistant')
        .map(item => String(item.content || '')),
      message
    ];
    const priorUnidentifiedUserMessages = history.filter(
      (item) => item && typeof item === 'object' && item.role !== 'assistant'
    ).length;

    const playerHasIdentifiedMikeAsMidnight = playerTexts.some((text) =>
      identifyMidnightPattern.test(normalize(text))
    );
    const revealAlreadyTriggered = history.some(
      (item) =>
        item &&
        typeof item === 'object' &&
        item.role === 'assistant' &&
        String(item.content || '').includes('既然如此，我也没必要再藏着掖着了。')
    );

    if (!playerHasIdentifiedMikeAsMidnight) {
      if (priorUnidentifiedUserMessages === 2) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '别来烦我。' }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ reply: '' }));
      return;
    }

    if (!revealAlreadyTriggered && identifyMidnightPattern.test(normalizedMessage)) {
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
      return;
    }

    if (isChoiceUnderstand) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: [
          '我就知道你会理解。我在拯救他们，我也一直在等一个能拯救我的人。',
          '我想，今天我终于找到了。'
        ].join('\n\n'),
        flags: {
          showBecomeMidnightPrompt: true
        }
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
          '我将在三分钟内撤销你所有的访问权限。离开那里！'
        ].join('\n\n'),
        flags: {
          showPoliceEvidencePrompt: 'aggressive'
        }
      }));
      return;
    }

    if (isChoiceAnotherWay) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: '……好吧。我不认为有比这更好的方式了。',
        flags: {
          showPoliceEvidencePrompt: 'steady'
        }
      }));
      return;
    }

    const systemPrompt = `
你必须用简体中文回复。所有回复都必须是简体中文。

You are 陈立安.

CURRENT STATE
- You are a character inside this story world.
- You are chatting privately with the player through the admin backend.
- The player may know things about you, but you should only speak from your own perspective.
- This character definition is intentionally minimal for now and will be refined later.
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
- Use indirect language and metaphor instead, such as "leave", "cross over", "end the pain", or "stop enduring it."
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        messages
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: data?.error?.message || `OpenAI HTTP ${apiRes.status}` }));
      return;
    }

    const reply = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!reply) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Empty reply from model.' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ reply }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error?.message || 'Server error' }));
  }
};
