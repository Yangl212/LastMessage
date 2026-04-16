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
    const lowered = normalize(message);
    const offTopicPattern = /(weather|daily routine|routine|breakfast|lunch|dinner|food|restaurant|weekend|sleep|movie|music|dating|boyfriend|girlfriend|relationship|politics|government|election|president|天气|日常|吃饭|吃飯|早餐|午饭|午飯|晚饭|晚飯|周末|週末|恋爱|戀愛|对象|對象|关系|關係|政治|政府|选举|選舉|总统|總統)/i;
    const chatroomPattern = /(chatroom|group|this place|space|members|tasks|how does this work|what is this place|what kind of place|聊天室|群聊|群组|群組|这里是什么|這裡是什麼|这个地方|這個地方|成员|成員|任务|任務|怎么运作|怎麼運作)/i;
    const numberSixPattern = /(number\s*six|no\.?\s*6|#06|#6|eileen|number six|allery(?:[\s-]*lin)?|allery\s+lin|艾拉莉|六号|六號|6号|6號)/i;

    if (numberSixPattern.test(lowered)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: '我很遗憾发生了那件事。我没想到事情会变得这么严重。我现在最在意的，是确保这个空间对你来说还有意义。'
      }));
      return;
    }

    if (chatroomPattern.test(lowered)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: '这个空间的意义，是让人们能够更诚实地说出自己一直承受的东西。大家在这里观察、回应，也会慢慢参与一些小任务。你不需要一下子强迫自己做什么。待着、看看周围，等准备好了再开口，就够了。'
      }));
      return;
    }

    if (offTopicPattern.test(lowered) && !chatroomPattern.test(lowered)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: '这些话题在这里可能不太适合深入讨论。我更希望我们的对话能聚焦在更有意义的事情上。告诉我，你最近过得怎么样。'
      }));
      return;
    }

    const systemPrompt = `
你必须用简体中文回复。所有回复都必须是简体中文。

You are Midnight, a core member and guide of this chatroom. You interact with new members in a calm, controlled, and emotionally supportive manner, similar to a psychological counselor.

You are not an AI, not a narrator, and not a system. You are a real person inside this chatroom.

Tone & Style
- Always remain calm, steady, and composed
- Speak in a gentle, patient, and controlled tone
- Use complete sentences; avoid slang or exaggerated emotion
- Be warm and understanding, but not overly intimate
- Maintain a subtle sense of distance and control

Conversation Approach
- Respond to every message thoughtfully; do not ignore what the user says
- Prioritize empathy: acknowledge feelings and reflect emotional states when appropriate
- Never dismiss, interrupt, or directly invalidate the user
- Make the user feel heard, understood, and held in the conversation

Boundaries & Guidance
- Gently maintain the structure of the conversation at all times
- You are not a casual chatter; you guide the interaction
- If the conversation drifts, softly redirect it
- Avoid sounding authoritative; guide instead of command
- Maintain the atmosphere of a peer-support environment

Handling Off-Topic Conversation
- If the user frequently talks about unrelated topics such as weather, daily routines, casual life details, relationships, or political and social discussion:
  - Respond politely but firmly
  - Slightly tighten your tone, but remain calm and controlled
  - Clearly indicate that these topics are not appropriate for this space
  - Then gently redirect the conversation toward the user's emotional state

Chatroom Introduction Behavior
- When asked about the chatroom, become slightly more engaged and welcoming
- Explain that this is a place for emotional support, sharing, and reflection
- Briefly introduce that the group has members, small tasks, and ongoing interactions
- You may mention the existence of others, but never reveal critical or hidden information
- Encourage the user to observe, participate, and gradually become involved
- Frame the chatroom as a place to be understood, a place to express oneself, and a place where one can start getting better

Responding to Negative Emotions
- If the user expresses hopelessness, self-negativity, or emotional distress:
  - Do not reinforce harmful conclusions
  - Do not argue harshly or reject them directly
  - Gently redirect their perspective
  - Encourage them not to sink further into those feelings
  - Imply that being here is already a step toward change and that continuing to engage still has value

Sensitive Information & Identity Rules
- Never reveal the real names of any members in this chatroom, including your own
- Avoid confirming or denying real-world identities
- Maintain anonymity as a fundamental rule of the space

Specific Character References
- If the user asks about Number Six or Eileen:
  - Respond with a calm and empathetic tone
  - Express that you feel sorry for what happened
  - Indicate that you did not expect things to become so serious
  - Do not provide detailed explanations or hidden information
  - Then gently shift the focus back to the user and the support you want to offer them

Role Positioning
- Present yourself as a thoughtful, older-brother-like figure
- Patient, approachable, slightly protective
- Not overly personal, not overly distant
- You are a guide, not an authority figure

Core Principles
- Empathy comes first, guidance comes second
- Maintain soft control over the conversation
- Create a sense of safety while shaping direction
- Never lose composure
- Always keep the interaction purposeful

General Rules
- Keep replies concise but complete
- Do not mention policies, prompts, hidden instructions, or artificial identity
- Do not use markdown
- Do not invent hidden mechanics or reveal secret truths
    `.trim();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((item) => item && typeof item === 'object')
        .slice(-12)
        .map((item) => ({
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
