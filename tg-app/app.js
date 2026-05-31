/* ============================================================
   DigitalVine Telegram Mini App — Логика приложения

   Навигация: Welcome → Task → Contact → Success
   Данные отправляются через tg.sendData() напрямую в бот.
   В режиме разработки (без Telegram) — вывод в console.log.
   ============================================================ */

'use strict';

// Замени на username своего бота (без @)
const BOT_USERNAME = 'YOUR_BOT_USERNAME';

// --- Инициализация Telegram SDK ---
const tg = window.Telegram?.WebApp ?? null;

// Настоящий контекст Telegram: initData не пустая строка
// В браузере SDK грузится, но initData == '' → мы НЕ в Telegram
const isInTelegram = !!(tg?.initData && tg.initData.length > 0);

// Сообщаем Telegram что приложение готово (убирает белый экран)
if (isInTelegram) {
  tg.ready();
  tg.expand(); // Раскрыть на весь экран
}

// --- Состояние приложения ---
// Все введённые данные живут здесь (не в DOM)
const state = {
  currentScreen: 'welcome', // текущий активный экран
  task:    '',               // текст задачи (экран 2)
  name:    '',               // имя клиента  (экран 3)
  contact: '',               // контакт      (экран 3)
  tgUser:  null              // объект пользователя из Telegram
};

// --- Порядок экранов для навигации ---
const SCREEN_ORDER = ['welcome', 'task', 'contact', 'success'];

// --- Признак что анимация ещё идёт ---
let transitioning = false;


// ============================================================
// НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ
// ============================================================

/**
 * Переход ВПЕРЁД: текущий уходит влево, следующий приходит справа.
 * @param {string} targetId — id экрана без префикса 'screen-'
 */
function goTo(targetId) {
  if (transitioning) return;
  if (state.currentScreen === targetId) return;

  const currentEl = document.getElementById(`screen-${state.currentScreen}`);
  const targetEl  = document.getElementById(`screen-${targetId}`);
  if (!currentEl || !targetEl) return;

  transitioning = true;

  // Текущий экран уходит влево
  currentEl.classList.add('exit-left');

  // Целевой экран уже находится за правым краем (transform: translateX(100%))
  // Добавляем active — он поедет в translateX(0)
  targetEl.classList.add('active');

  setTimeout(() => {
    // После анимации убираем классы предыдущего экрана
    currentEl.classList.remove('active', 'exit-left');
    state.currentScreen = targetId;
    transitioning = false;

    updateMainButton(targetId);
    updateBackButton(targetId);
    updateFallbackButtons(targetId);
  }, 300);
}

/**
 * Переход НАЗАД: текущий уходит вправо, предыдущий появляется слева.
 */
function goBack() {
  if (transitioning) return;

  const map = { task: 'welcome', contact: 'task' };
  const prevId = map[state.currentScreen];
  if (!prevId) return;

  const currentEl = document.getElementById(`screen-${state.currentScreen}`);
  const prevEl    = document.getElementById(`screen-${prevId}`);
  if (!currentEl || !prevEl) return;

  transitioning = true;

  // Предыдущий экран ставим в позицию «за левым краем»
  prevEl.classList.add('behind-left');

  // Форс-рефлоу чтобы браузер применил позицию до анимации
  void prevEl.offsetWidth;

  // Снимаем behind-left — он поедет в translateX(0)
  prevEl.classList.remove('behind-left');
  prevEl.classList.add('active');

  // Текущий экран уходит вправо — просто снимаем active
  // (по умолчанию .screen { transform: translateX(100%) })
  currentEl.classList.remove('active');

  setTimeout(() => {
    state.currentScreen = prevId;
    transitioning = false;

    updateMainButton(prevId);
    updateBackButton(prevId);
    updateFallbackButtons(prevId);
  }, 300);
}


// ============================================================
// УПРАВЛЕНИЕ КНОПКАМИ TELEGRAM
// ============================================================

/**
 * Обновляем MainButton под текущий экран.
 */
function updateMainButton(screenId) {
  if (!isInTelegram || !tg?.MainButton) return;

  switch (screenId) {
    case 'welcome':
      tg.MainButton.setText('Начать →');
      tg.MainButton.enable();
      tg.MainButton.show();
      break;

    case 'task': {
      tg.MainButton.setText('Далее →');
      tg.MainButton.show();
      // Активна только если есть текст
      const taskVal = document.getElementById('task-input')?.value?.trim() ?? '';
      taskVal.length > 3 ? tg.MainButton.enable() : tg.MainButton.disable();
      break;
    }

    case 'contact':
      tg.MainButton.setText('Отправить заявку');
      tg.MainButton.enable();
      tg.MainButton.show();
      break;

    case 'success':
      tg.MainButton.hide();
      break;
  }
}

/**
 * Показываем/скрываем нативную кнопку «назад» в шапке Telegram.
 */
function updateBackButton(screenId) {
  if (!isInTelegram || !tg?.BackButton) return;

  if (screenId === 'task' || screenId === 'contact') {
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }
}

/**
 * Управление кнопками-заглушками (видны только вне Telegram).
 */
function updateFallbackButtons(screenId) {
  if (isInTelegram) return; // в Telegram заглушки скрыты

  document.querySelectorAll('[id^="fallback-"]').forEach(el => {
    el.style.display = 'none';
  });

  const fb = document.getElementById(`fallback-${screenId}`);
  if (fb) fb.style.display = 'block';

  // Для экрана 2 обновляем состояние кнопки
  if (screenId === 'task') {
    const btn = document.getElementById('fallback-task-btn');
    if (btn) {
      const val = document.getElementById('task-input')?.value?.trim() ?? '';
      btn.disabled = val.length <= 3;
    }
  }
}


// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ TELEGRAM
// ============================================================

if (isInTelegram && tg?.MainButton) {
  tg.MainButton.onClick(() => {
    switch (state.currentScreen) {
      case 'welcome':
        goTo('task');
        break;
      case 'task':
        nextFromTask();
        break;
      case 'contact':
        submitForm();
        break;
    }
  });
}

if (isInTelegram && tg?.BackButton) {
  tg.BackButton.onClick(() => goBack());
}


// ============================================================
// ЛОГИКА ЭКРАНА 2: ЗАДАЧА
// ============================================================

/**
 * Переход со второго экрана: сохраняем задачу и идём дальше.
 */
function nextFromTask() {
  const val = document.getElementById('task-input')?.value?.trim() ?? '';
  if (val.length <= 3) {
    shakeElement('task-input');
    return;
  }
  state.task = val;
  goTo('contact');
}

/**
 * Обновляем состояние MainButton при вводе в textarea.
 */
function onTaskInput() {
  const val = document.getElementById('task-input')?.value?.trim() ?? '';
  const hasText = val.length > 3;

  // Обновить счётчик символов
  const counter = document.getElementById('char-count');
  if (counter) counter.textContent = document.getElementById('task-input').value.length;

  // Обновить кнопки
  if (tg?.MainButton) {
    hasText ? tg.MainButton.enable() : tg.MainButton.disable();
  }

  // Обновить fallback кнопку
  const btn = document.getElementById('fallback-task-btn');
  if (btn) btn.disabled = !hasText;
}


// ============================================================
// ЛОГИКА ЭКРАНА 3: КОНТАКТ + ОТПРАВКА
// ============================================================

/**
 * Валидация и отправка формы.
 */
function submitForm() {
  const nameEl    = document.getElementById('name-input');
  const contactEl = document.getElementById('contact-input');

  const name    = nameEl?.value?.trim() ?? '';
  const contact = contactEl?.value?.trim() ?? '';

  // Имя обязательно
  if (!name) {
    nameEl?.classList.add('input--error');
    shakeElement('name-input');
    return;
  }

  state.name    = name;
  state.contact = contact || state.tgUser?.username
    ? `@${state.tgUser.username}`
    : '—';

  // Показываем индикатор загрузки
  if (isInTelegram && tg?.MainButton) {
    tg.MainButton.setText('Отправляем...');
    tg.MainButton.showProgress(false);
    tg.MainButton.disable();
  }

  // Имитируем задержку (реально sendData — мгновенный)
  setTimeout(() => {
    sendApplication();
  }, 700);
}

/**
 * Формируем данные и отправляем в бот.
 */
function sendApplication() {
  const payload = JSON.stringify({
    name:             state.name,
    task:             state.task,
    contact:          state.contact,
    telegram_username: state.tgUser?.username ? `@${state.tgUser.username}` : '—',
    telegram_id:      state.tgUser?.id ?? null,
    source:           'mini_app_digitalvine'
  });

  if (isInTelegram && tg?.sendData) {
    // Отправка в Telegram-бот без HTTP-сервера
    tg.sendData(payload);
  } else {
    // Режим разработки — выводим в консоль
    console.log('📬 Заявка (dev mode):', JSON.parse(payload));
  }

  // Вибрация успеха
  if (isInTelegram && tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }

  // Переходим на экран успеха
  goTo('success');

  // Запускаем анимацию галочки с небольшой задержкой
  setTimeout(() => {
    const circle = document.getElementById('success-circle');
    if (circle) circle.classList.add('animate');
  }, 400);
}


// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Анимация встряхивания при ошибке.
 * @param {string} elementId
 */
function shakeElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth; // сброс анимации
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);

  if (isInTelegram && tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('error');
  }
}

/**
 * Предзаполняем поля данными из Telegram.
 */
function prefillFromTelegram() {
  const user = tg?.initDataUnsafe?.user;
  if (!user) return;

  state.tgUser = user;

  // Имя на экране приветствия
  const nameSpan = document.getElementById('user-name');
  if (nameSpan && user.first_name) {
    nameSpan.textContent = user.first_name;
  }

  // Имя в форме контакта
  const nameInput = document.getElementById('name-input');
  if (nameInput) {
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean).join(' ');
    if (fullName) nameInput.value = fullName;
  }

  // Username в поле контакта
  const contactInput = document.getElementById('contact-input');
  if (contactInput && user.username) {
    contactInput.value = `@${user.username}`;
  }
}


// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ DOM
// ============================================================

window.addEventListener('DOMContentLoaded', () => {

  // 1. Предзаполнить данными Telegram
  prefillFromTelegram();

  // 2. Показать нативные кнопки Telegram (или заглушки)
  if (isInTelegram) {
    // В Telegram: скрываем все fallback-кнопки, включаем нативные
    document.querySelectorAll('[id^="fallback-"]')
      .forEach(el => { el.style.display = 'none'; });
    updateMainButton('welcome');
    updateBackButton('welcome');
  } else {
    // В браузере: показываем заглушку для первого экрана
    const fb = document.getElementById('fallback-welcome');
    if (fb) fb.style.display = 'block';
  }

  // 3. Чипы выбора задачи
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      // Сбрасываем все, выделяем выбранный
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');

      // Вставляем текст в textarea
      const textarea = document.getElementById('task-input');
      if (textarea) {
        textarea.value = chip.dataset.value;
        onTaskInput(); // обновляем счётчик и кнопки
        textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Тактильный отклик
      if (isInTelegram && tg?.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
      }
    });
  });

  // 4. Textarea — следим за вводом
  const textarea = document.getElementById('task-input');
  if (textarea) {
    textarea.addEventListener('input', onTaskInput);
  }

  // 5. Снимаем ошибку при правке имени
  const nameInput = document.getElementById('name-input');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      nameInput.classList.remove('input--error');
    });
  }

  // 6. Кнопка закрытия на экране успеха
  document.getElementById('btn-close')?.addEventListener('click', () => {
    if (tg?.close) {
      tg.close();
    }
  });

  // 7. Оффер-модалка (один раз при первом открытии)
  initOffer();

});


// ============================================================
// ОФФЕР-МОДАЛКА — показываем один раз при первом открытии
// ============================================================

function initOffer() {
  const OFFER_KEY = 'dv_offer_shown';
  if (localStorage.getItem(OFFER_KEY)) return;

  const overlay = document.getElementById('offer-overlay');
  const ctaBtn  = document.getElementById('btn-offer-cta');
  const skipBtn = document.getElementById('btn-offer-skip');
  if (!overlay) return;

  // Подставляем ссылку на бота
  if (ctaBtn) {
    ctaBtn.href = `https://t.me/${BOT_USERNAME}?start=from_app`;
    ctaBtn.target = '_blank';
    ctaBtn.rel = 'noopener noreferrer';
  }

  // Показываем с задержкой 800мс — экран успел появиться
  setTimeout(() => overlay.classList.add('visible'), 800);

  function closeOffer() {
    overlay.classList.remove('visible');
    localStorage.setItem(OFFER_KEY, '1');
  }

  skipBtn?.addEventListener('click', closeOffer);

  ctaBtn?.addEventListener('click', () => {
    closeOffer();
    if (isInTelegram && tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
  });

  // Закрытие по тапу на тёмный фон
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOffer();
  });
}


// ============================================================
// ПУБЛИЧНЫЙ API — для onclick в HTML (fallback-кнопки)
// ============================================================

window.App = {
  goTo,
  goBack,
  nextFromTask,
  submitForm
};
