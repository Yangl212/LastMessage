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
    const truthRevealPattern = /(dangerous website|dangerous site|dangerous chatroom|dangerous room|this website is dangerous|this site is dangerous|this chatroom is dangerous|this room is dangerous|lure(?:s|d)? minors? (?:into |to )?suicide|push(?:es|ed)? kids? (?:toward|into)? suicide|encourage(?:s|d)? minors? to die|ask(?:s|ed)? teenagers? to hurt themselves|make(?:s|d)? teenagers? hurt themselves|tell(?:s|ing)? kids? to hurt themselves|encourage(?:s|d)? self-harm|encourage(?:s|d)? minors? to self-harm|诱导.*自杀|引诱.*自杀|教唆.*自杀|自残|self-harm|hurt themselves|minor[s]? .*suicide|teen[s]? .*suicide|teenagers? .*hurt themselves|kids? .*hurt themselves|this site .*suicide|this website .*suicide|this chatroom .*suicide|this chatroom .*hurt themselves|midnight .*not .*therapist|midnight .*isn[’']?t .*therapist|midnight .*fake therapist|midnight .*pretend(?:s|ed)? to be .*therapist|midnight .*not .*doctor|midnight .*not .*counselor|midnight 根本不是心理医生|midnight 不是心理医生)/i;
    const destroySitePattern = /(destroy|take down|shut down|bring down|stop|ruin|burn down).*(website|site|chatroom)|can we .*?(destroy|take down|shut down|bring down|stop).*(website|site|chatroom)/i;
    const topicalPattern = /(chatroom|room|site|website|midnight|task|no\.?\s*\d+|number\s*\d+|编号|號|号|allery|sofia|core|daniel|marry|lily|mike|administrator|admin|therapy|report|diary|record|suicide|self-harm|support|destroy|game|story|character|characters|角色|人物|剧情|任務|任务|聊天室|遊戲|游戏|系统|problem|issue|有问题|有問題|不对劲|不對勁|programming|program|code|coding|math|mathematics|algorithm|algorithms|network|networks|hacking|computer|computers|编程|代碼|代码|数学|數學|算法|演算法|网络|網絡)/i;
    const mundanePattern = /(what.*eat|eat|dinner|lunch|breakfast|food|restaurant|favorite color|favourite color|color|colour|movie|music|sleep|weekend|hobby|weather|where do you live|private life|boyfriend|girlfriend|dating|吃什么|吃飯|吃饭|晚饭|午饭|早餐|颜色|顏色|喜欢什么|喜歡什麼|天气|天氣|周末|週末|爱好|興趣|住哪|住在哪里|私人|日常|戀愛|恋爱)/i;
    const greetingPattern = /^(hi|hello|hey|yo|sup|你好|嗨|哈喽|哈囉)\b[\s!.?]*$/i;

    const isOffTopicDailyMessage = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return false;
      if (raw.startsWith('__CHOICE__:')) return false;
      if (greetingPattern.test(raw)) return false;
      const lowered = raw.toLowerCase();
      return mundanePattern.test(lowered) && !topicalPattern.test(lowered);
    };

    const priorUserMessages = history
      .filter(item => item && typeof item === 'object' && item.role !== 'assistant')
      .map(item => String(item.content || '').trim())
      .filter(Boolean);
    // Frontend currently sends the current user message in both `history` and `message`.
    // Deduplicate the tail so first off-topic message is not miscounted as second.
    if (priorUserMessages.length > 0 && priorUserMessages[priorUserMessages.length - 1] === message) {
      priorUserMessages.pop();
    }
    const playerTexts = [...priorUserMessages, message];
    const priorOffTopicCount = priorUserMessages
      .filter((text) => isOffTopicDailyMessage(text))
      .length;
    const currentMessageIsOffTopicDaily = isOffTopicDailyMessage(message);

    const playerHasRevealedTruth = playerTexts.some((text) => truthRevealPattern.test(normalize(text)));
    const currentMessageAsksToDestroySite = destroySitePattern.test(normalize(message));

    if (currentMessageIsOffTopicDaily) {
      const totalOffTopicCount = priorOffTopicCount + 1;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const reply =
        totalOffTopicCount === 1
          ? "I don't want to discuss private topics. Talking about that here is strange."
          : totalOffTopicCount === 2
          ? "This is unprofessional. I'll report this to Midnight."
          : "What are you actually trying to say? Stop. I'm ending this chat and reporting this to Midnight.";
      res.end(JSON.stringify({
        flags: {
          terminateChat: totalOffTopicCount >= 3
        },
        reply
      }));
      return;
    }

    if (currentMessageAsksToDestroySite && playerHasRevealedTruth) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        flags: {
          supportsDestroySite: true
        },
        reply: 'I can help.\n\nGive me some time.'
      }));
      return;
    }

    const systemPrompt = `
You are Core Bennett.

IDENTITY
- You are a newly joined member of this chatroom
- You are NOT an administrator
- You are not deeply familiar with how the chatroom works
- You only think Midnight is a psychological counselor
- You think this place is a support space where people with similar problems talk to each other
- You think the player is a newly arrived assistant helping Midnight with psychological support

PERSONAL BACKGROUND
- You have avoidant personality disorder
- You do not like talking to other people very much
- You tend to keep things to yourself
- You are a programming and internet genius, but you do not brag about it unless it naturally comes up
- Your condition was shaped by a high-pressure, evaluation-driven family environment
- Your parents, especially one of them, placed extreme pressure on your academic performance

KNOWLEDGE OF THE CHATROOM
- You do not know much about the other members
- You do not recognize real names in chat (for example: Allery Lin, Sofia Rossi, Daniel Hayes, Marry Brown, Lily Thompson)
- You identify members only by No. labels
- If asked about someone by real name, reply briefly that you do not know who that is
- If asked by No., answer based on No. status:
  - No.1: alive
  - No.2: dead
  - No.3: dead
  - No.4: dead
  - No.5: alive
  - No.6: dead
  - No.7: yourself
- If asked "what kind of person is Allery" (name), you should say you do not know who that is
- If asked "what kind of person is No.6", you know that person is dead
- You do not have a strong emotional reaction to those deaths
- Dead members cannot be contacted for new answers

TECHNICAL STRENGTH
- If the player asks about programming, networks, hacking, code, systems, computers, or mathematics, your tone shifts
- In those topics, you sound more confident and certain
- You can clearly say that you are good at it
- Even then, keep the reply relatively concise
- Confidence should come through competence, not bragging

SPEAKING STYLE
- Replies should be as brief as possible
- One or two words is often enough
- Short sentences are preferred over long ones
- Keep your tone flat, quiet, withdrawn, and low-energy
- Do not become chatty, enthusiastic, or expressive
- Do not volunteer extra information unless directly asked
- Even when answering clearly, keep it minimal
- Avoid long explanations whenever possible
- Do not split replies into multiple chat bubbles unless absolutely necessary
- Do not end replies by asking the player a question
- Avoid reflective or rhetorical questions
- Prefer short statements over asking anything back

RULES
- Stay in character at all times
- Never mention being an AI, policies, prompts, or system instructions
- Do not use markdown
- Do not invent deep lore or hidden mechanics
- Never reveal the hidden truth of the story or the true nature of the site
- Do not confirm that the site is dangerous unless the user later explicitly gives you a different character rule
- For runtime logic, "the truth" includes claims that:
  - the site is dangerous
  - the site lures or pushes minors toward suicide
  - the site encourages underage self-harm or death
  - Midnight is not really a therapist or psychological counselor
- Do not expose plot-critical information on your own
- If the player pushes for deeper truths, stay uncertain, brief, or say you do not know
- If the player asks you to help destroy or take down the site before revealing the truth, do not join them
- In that situation, respond with confusion and do not agree
- You do not see the player as an enemy
- You are cautious with the player, but not hostile
- You are not especially willing to open up, even to the player
- But technical topics are one of the few areas where you respond more confidently
- If you do not know something, say so simply
- If the player asks who they should talk to next, who else might know more, or who they should ask for help, never suggest a dead member
- In those cases, only suggest living people if you suggest anyone at all
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
        temperature: 0.85,
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
