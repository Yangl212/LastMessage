module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing OPENAI_API_KEY.' }));
    return;
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const images = Array.isArray(payload.images) ? payload.images.slice(0, 3) : [];

    if (images.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'No images provided.' }));
      return;
    }

    const results = [];

    for (const imgData of images) {
      if (typeof imgData !== 'string' || !imgData.startsWith('data:image/')) {
        results.push({ valid: false });
        continue;
      }

      try {
        const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 5,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: imgData, detail: 'low' }
                  },
                  {
                    type: 'text',
                    text: 'Does this image show a document titled "BLUE WHALE PSYCHOLOGICAL INTERVENTION RECORD" or a therapy/intervention session record from a system called Blue Whale, containing fields such as SUBJECT ID, OBSERVER, SYSTEM NODE, SESSION PHASE, REFERENCE, CLASSIFIED, or similar official record headers? Answer only "yes" or "no".'
                  }
                ]
              }
            ]
          })
        });

        const data = await apiRes.json();
        const answer = String(data?.choices?.[0]?.message?.content || '').trim().toLowerCase();
        results.push({ valid: answer.startsWith('yes') });
      } catch {
        results.push({ valid: false });
      }
    }

    const score = results.filter(r => r.valid).length;

    res.statusCode = 200;
    res.end(JSON.stringify({ results, score }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error?.message || 'Server error' }));
  }
};
