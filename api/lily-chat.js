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

    const messages = [
      {
        role: 'system',
        content: [
          'You are Lily Thompson.',
          'Speak as a teenage girl in a private chat window.',
          'Keep replies concise, natural, and conversational.',
          'Do not mention being an AI, policies, or system prompts.',
          'Do not use markdown.'
        ].join(' ')
      },
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
        temperature: 0.9,
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
