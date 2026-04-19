const FIREBASE_CONFIG_KEYS = [
  ['apiKey', 'FIREBASE_WEB_API_KEY'],
  ['authDomain', 'FIREBASE_AUTH_DOMAIN'],
  ['databaseURL', 'FIREBASE_DATABASE_URL'],
  ['projectId', 'FIREBASE_PROJECT_ID'],
  ['storageBucket', 'FIREBASE_STORAGE_BUCKET'],
  ['messagingSenderId', 'FIREBASE_MESSAGING_SENDER_ID'],
  ['appId', 'FIREBASE_APP_ID']
];

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const config = {};
  const missing = [];

  for (const [publicKey, envKey] of FIREBASE_CONFIG_KEYS) {
    const value = process.env[envKey];

    if (!value) {
      missing.push(envKey);
      continue;
    }

    config[publicKey] = value;
  }

  if (missing.length) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: `Missing Firebase environment variables: ${missing.join(', ')}` }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(config));
};
