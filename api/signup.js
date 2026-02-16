const ALLOWED_ORIGINS = [
  'https://dadmood.33c.dev',
  'https://dadfuel.33c.dev',
  'https://dadbites.33c.dev',
  'https://breathrep.33c.dev',
  'https://saunalog.33c.dev',
  'https://coldtimer.33c.dev',
  'http://localhost:3000',
];

const VALID_APPS = ['dadmood', 'dadfuel', 'dadbites', 'breathrep', 'saunalog', 'coldtimer'];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, app } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  if (!app || !VALID_APPS.includes(app)) {
    return res.status(400).json({ error: 'Valid app name required' });
  }

  const slackToken = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID || 'U09UV2B2SQ1';

  if (!slackToken) {
    console.error('SLACK_BOT_TOKEN not configured');
    return res.status(200).json({ ok: true, message: 'Signed up (notification skipped)' });
  }

  try {
    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        text: `New waitlist signup for *${app}*: ${email}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Waitlist Signup*\nApp: *${app}*\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
            },
          },
        ],
      }),
    });

    const data = await slackRes.json();
    if (!data.ok) {
      console.error('Slack error:', data.error);
    }
  } catch (err) {
    console.error('Slack notification failed:', err.message);
  }

  return res.status(200).json({ ok: true, message: 'You are on the list' });
}
