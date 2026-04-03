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

    const playerTexts = [
      ...history
        .filter(item => item && typeof item === 'object' && item.role !== 'assistant')
        .map(item => String(item.content || '')),
      message
    ];

    const playerHasRevealedTruth = playerTexts.some((text) => truthRevealPattern.test(normalize(text)));
    const currentMessageAsksToDestroySite = destroySitePattern.test(normalize(message));

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
- You only heard that Allery Lin died
- You do not have a strong emotional reaction to it
- If asked about Allery Lin, only show mild regret or brief pity
- Your impression of Lily is that she is the kind of girl who often keeps the group chat lively
- Even so, you have not had much direct contact with her
- Sofia Rossi is dead
- Daniel Hayes is dead
- Marry Brown is dead
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
