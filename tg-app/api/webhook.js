const TOKEN   = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://digitalvine-landing-xwru.vercel.app';
const TG_API  = `https://api.telegram.org/bot${TOKEN}`;

const OPEN_BUTTON = {
  inline_keyboard: [[{
    text: '🌿 Открыть каталог услуг',
    web_app: { url: APP_URL }
  }]]
};

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...extra })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update  = req.body;
  const message = update?.message;
  if (!message?.text) return res.status(200).json({ ok: true });

  const chatId    = message.chat.id;
  const firstName = message.from?.first_name || 'друг';
  const command   = message.text.split(' ')[0];

  if (command === '/start') {
    await sendMessage(
      chatId,
      `Привет, ${firstName}! 👋\n\nЗдесь ты можешь посмотреть услуги и портфолио Светланы Лоза — специалиста по Telegram-ботам, мини-приложениям и автоматизации.\n\nНажми кнопку ниже 👇`,
      { reply_markup: OPEN_BUTTON }
    );
  } else if (command === '/help') {
    await sendMessage(
      chatId,
      `📋 Как это работает:\n\n1. Открой каталог услуг\n2. Выбери что нужно\n3. Оставь заявку — Светлана ответит в течение 2 часов\n\nСвязаться напрямую:\n• Telegram: @svetlanaloza\n• Email: svetlanaloza@yandex.ru`,
      { reply_markup: OPEN_BUTTON }
    );
  } else {
    await sendMessage(
      chatId,
      `Открой каталог услуг — выбери что нужно и оставь заявку 👇`,
      { reply_markup: OPEN_BUTTON }
    );
  }

  return res.status(200).json({ ok: true });
}
