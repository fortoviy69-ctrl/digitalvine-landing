const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const {
    specialist_username,
    name,
    task,
    contact,
    client_telegram_id,
    telegram_username
  } = req.body || {};

  if (!name || !task) {
    return res.status(400).json({ error: 'name and task are required' });
  }

  const username = ((specialist_username || 'svetlana_loza') + '').replace(/^@/, '');
  const dbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  // Найти специалиста
  const specRes = await fetch(
    `${SUPABASE_URL}/rest/v1/specialists?username=eq.${encodeURIComponent(username)}&select=id,telegram_id,bot_token`,
    { headers: dbHeaders }
  );
  const specialists = await specRes.json();
  if (!Array.isArray(specialists) || !specialists.length) {
    return res.status(404).json({ error: 'Specialist not found' });
  }

  const specialist = specialists[0];

  // Сохранить заявку в базу
  await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: { ...dbHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      specialist_id:      specialist.id,
      client_telegram_id: client_telegram_id || null,
      client_name:        name,
      task,
      contact:            contact || '',
      status:             'new'
    })
  });

  // Уведомить специалиста в Telegram
  const botToken = specialist.bot_token || process.env.BOT_TOKEN;
  const chatId   = specialist.telegram_id;

  if (botToken && chatId) {
    const lines = [
      '🆕 Новая заявка!',
      '',
      `👤 Имя: ${name}`,
      `📋 Задача: ${task}`,
      contact       ? `📱 Контакт: ${contact}` : null,
      telegram_username && telegram_username !== '—' ? `🔗 Telegram: ${telegram_username}` : null
    ].filter(Boolean);

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       lines.join('\n'),
        parse_mode: 'HTML'
      })
    });
  }

  return res.status(200).json({ ok: true });
}
