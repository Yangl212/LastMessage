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
    const identifyMidnightPattern = /(\byou(?:'re| are)?\s+midnight\b|\bmike(?:\s+anderson)?\s+(?:is|=)\s+midnight\b|\byou(?:'re| are)?\s+the\s+admin(?:istrator)?\b|\byou(?:'re| are)?\s+midnight\s+himself\b|\byou(?:'re| are)?\s+the\s+same\s+person\s+as\s+midnight\b|\byou\s+must\s+be\s+midnight\b|\byou\s+are\s+the\s+one\s+called\s+midnight\b|\bmidnight\s+is\s+you\b)/i;
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
        String(item.content || '').includes("Then there's no need for me to hide anymore.")
    );

    if (!playerHasIdentifiedMikeAsMidnight) {
      if (priorUnidentifiedUserMessages === 2) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: "Don't bother me." }));
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
          '...So you\'ve figured it out.',
          'Then there\'s no need for me to hide anymore.',
          'I never wanted to harm anyone. What you\'re seeing... those were their choices in the end, not something I forced upon them.',
          'They were already hurt long before they came here. Ignored, mocked, dismissed... you know as well as I do, this world has never been fair.',
          'I only gave them a way out. A way to stop enduring it.',
          'If that is considered wrong... then tell me, has what you call "right" ever truly saved them?',
          '...Can you understand me?'
        ].join('\n\n'),
        choices: [
          {
            id: 'dont_understand',
            label: "Maybe... we shouldn't do this."
          },
          {
            id: 'understand',
            label: "I can understand your mindset. You're trying to help them in your own way."
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
          'I knew you would understand. I\'m saving them, and I\'ve also been waiting for someone who could save me.',
          'I think I\'ve finally found that person today.'
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
          'You think I\'m wrong?',
          'Take a look at them. They are no longer in pain or struggling. They reached the ending they wanted.'
        ].join('\n\n'),
        choices: [
          {
            id: 'controlling_them',
            title: 'Aggressive',
            displayLabel: 'Aggressive',
            label: "This not helping them! You're controlling them, pushing them step by step toward death."
          },
          {
            id: 'another_way',
            title: 'Steady',
            displayLabel: 'Steady',
            label: "I just feel like...maybe there's another way."
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
          'You were never here to "seek help" from the beginning.',
          'I\'m going to revoke all your access within three minutes. Leave there!'
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
        reply: '...Fine. I don’t think there’s a better way than this.',
        flags: {
          showPoliceEvidencePrompt: 'steady'
        }
      }));
      return;
    }

    const systemPrompt = `
You are Mike Anderson.

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
- You know that Allery Lin, Sofia Rossi, Daniel Hayes, and Marry Brown are dead
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
