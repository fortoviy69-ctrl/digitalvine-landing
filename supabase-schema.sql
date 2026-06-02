-- DigitalVine — схема базы данных
-- Запусти этот файл в Supabase: Dashboard → SQL Editor → New query → Paste → Run

-- ============================
-- СПЕЦИАЛИСТЫ
-- ============================
CREATE TABLE specialists (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id     BIGINT UNIQUE NOT NULL,
  username        TEXT UNIQUE NOT NULL,       -- без @, используется в URL ?u=username
  display_name    TEXT NOT NULL,
  bio             TEXT DEFAULT '',
  bot_token       TEXT DEFAULT '',            -- токен бота специалиста
  bot_username    TEXT DEFAULT '',            -- @username бота
  photo_url       TEXT DEFAULT '',            -- URL фото в Supabase Storage
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_expires_at TIMESTAMPTZ,
  theme           JSONB DEFAULT '{"accent":"#7B2FBE","accent_light":"#9D4EDD","accent_soft":"rgba(123,47,190,0.15)","accent_mid":"rgba(123,47,190,0.35)","theme_id":"dark_purple","logo_url":null,"brand_name":null}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- УСЛУГИ
-- ============================
CREATE TABLE services (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  icon          TEXT DEFAULT '⚡',
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ЗАЯВКИ ОТ КЛИЕНТОВ
-- ============================
CREATE TABLE leads (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id      UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
  client_telegram_id BIGINT,
  client_name        TEXT NOT NULL,
  task               TEXT NOT NULL,
  contact            TEXT DEFAULT '',
  service_selected   TEXT DEFAULT '',
  status             TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'done', 'cancelled')),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ПОДПИСКИ
-- ============================
CREATE TABLE subscriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id   UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
  provider        TEXT NOT NULL CHECK (provider IN ('yookassa', 'stripe')),
  provider_sub_id TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  amount_kopecks  INTEGER DEFAULT 0,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);


-- ============================
-- ДАННЫЕ СВЕТЛАНЫ ЛОЗА (первый специалист)
-- ============================
-- ВАЖНО: замени YOUR_TELEGRAM_ID на свой Telegram ID
-- Получить ID: напиши @userinfobot в Telegram → он пришлёт твой ID

INSERT INTO specialists (telegram_id, username, display_name, bio, bot_token, bot_username, plan)
VALUES (
  YOUR_TELEGRAM_ID,                                                          -- ← заменить!
  'svetlana_loza',
  'Светлана Лоза',
  'Специалист по Telegram-ботам, мини-приложениям и автоматизации',
  '8811473584:AAF26VribpDDkY8DEKmqHl-UtsIYX2JktUU',                        -- токен бота из .env
  'digital_vine_bot',
  'pro'
);

-- Услуги Светланы
INSERT INTO services (specialist_id, title, description, icon, sort_order)
SELECT id, 'Telegram-бот',      'Автоответы, приём заявок, запись клиентов 24/7',         '🤖', 1 FROM specialists WHERE username = 'svetlana_loza';

INSERT INTO services (specialist_id, title, description, icon, sort_order)
SELECT id, 'Мини-приложение',   'Каталог услуг, запись или личный кабинет клиента',        '📱', 2 FROM specialists WHERE username = 'svetlana_loza';

INSERT INTO services (specialist_id, title, description, icon, sort_order)
SELECT id, 'Автоматизация',     'Связать CRM, таблицы и мессенджеры — убрать ручную работу', '⚙️', 3 FROM specialists WHERE username = 'svetlana_loza';

INSERT INTO services (specialist_id, title, description, icon, sort_order)
SELECT id, 'Сайт / Лендинг',   'Сайт, который приносит заявки от новых клиентов',         '🌐', 4 FROM specialists WHERE username = 'svetlana_loza';
