# DigitalVine Telegram Mini App — Документация

## Структура файлов

```
tg-app/
├── index.html   — разметка: 4 экрана приложения
├── style.css    — стили: тема Telegram, переходы, компоненты
├── app.js       — логика: навигация, отправка, Telegram SDK
└── CLAUDE.md    — эта документация
```

## Экраны и навигация

```
[Welcome] → (MainButton «Начать») → [Task]
[Task]    → (MainButton «Далее»)  → [Contact]
[Contact] → (MainButton «Отправить») → [Success]
[Success] → (кнопка «Закрыть»)   → закрытие приложения

Назад: BackButton Telegram работает на экранах Task и Contact
```

## Где менять контент

| Что менять | Где искать |
|---|---|
| Имя специалиста, контакты | `index.html` — экран Welcome |
| Варианты задач (чипы) | `index.html` — `data-value` у кнопок `.chip` |
| Текст в полях формы | `index.html` — атрибуты `placeholder` |
| Шаги на экране успеха | `index.html` — блоки `.next-step` |
| Цвет акцента | `style.css` — переменная `--accent` |
| Фото специалиста | файл `../photo1.png` (в родительской папке) |

## Как работает отправка

```
Пользователь нажимает «Отправить заявку»
  → submitForm() в app.js
  → sendApplication()
  → tg.sendData(JSON) — данные летят напрямую в Telegram-бот
  → бот получает событие и пересылает Светлане
```

Данные в JSON:
```json
{
  "name": "Имя пользователя",
  "task": "Текст задачи",
  "contact": "@username или телефон",
  "telegram_username": "@username",
  "telegram_id": 123456789,
  "source": "mini_app_digitalvine"
}
```

## Тестирование без Telegram

Откройте `tg-app/index.html` в браузере — покажутся кнопки-заглушки снизу.
Данные из Telegram не подставятся, данные выведутся в `console.log`.

## Подключение к боту (шаги)

1. Написать [@BotFather](https://t.me/BotFather) → `/newbot`
2. Получить токен бота
3. `/newapp` → указать URL где задеплоен Mini App (Vercel)
4. Бот будет получать `sendData` через webhook или polling
5. URL Mini App на Vercel: `https://ваш-проект.vercel.app/tg-app/`

## Темная тема

Работает автоматически — все цвета берутся из CSS-переменных
`var(--tg-theme-bg-color)`, `var(--tg-theme-text-color)` и т.д.
Telegram сам подставляет нужные значения в зависимости от темы пользователя.
