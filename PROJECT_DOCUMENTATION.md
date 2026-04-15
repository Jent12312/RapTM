# Rapira TM — P2P Маркетплейс

## Техническая документация

---

## 1. Общее описание проекта

**Rapira TM** — это Telegram Mini App (TMA), представляющий собой P2P-платформу для торговли криптовалютой (USDT, TMT) с использованием наличных расчётов. Приложение работает внутри Telegram и использует аутентификацию через данные пользователя Telegram (Telegram ID, имя, username).

Платформа ориентирована на рынок Туркменистана и предоставляет пользователям возможность:

- Покупать и продавать USDT за наличные манаты (TMT)
- Создавать и управлять P2P-объявлениями
- Обменивать USDT на TMT и наоборот
- Пополнять и выводить USDT через криптосети (TRC20, BEP20, APTOS)
- Верифицировать аккаунт (KYC)
- Общаться с контрагентами в чате сделки
- Оставлять отзывы о сделках

---

## 2. Технологический стек

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Стилизация**: Tailwind CSS 4
- **Иконки**: Lucide React
- **Telegram SDK**: @twa-dev/sdk
- **State Management**: Zustand 5
- **Шрифты**: Geist (Next.js default)

### Backend

- **Runtime**: Next.js API Routes (Serverless)
- **База данных**: PostgreSQL
- **ORM**: Prisma 6
- **Аутентификация**: Telegram WebApp initData

### Деплой

- **Платформа**: Vercel
- **База данных**: PostgreSQL (managed)

---

## 3. Архитектура базы данных

### Модель User (Пользователь)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| telegramId | String (unique) | ID пользователя Telegram |
| username | String? | Username Telegram |
| firstName | String? | Имя пользователя |
| isVerified | Boolean | Верификация (синяя галочка) |
| kycStatus | String | Статус KYC: none, pending, verified, rejected |
| kycPhotoUrl | String? | URL фото документа |
| nickname | String? | Никнейм на платформе |
| avatarUrl | String? | URL аватара |
| phone | String? | Телефон для верификации |
| email | String? | Почта |
| passcode | String? | PIN-код для 2FA |
| isAdmin | Boolean | Доступ к админ-панели |
| tgNotifications | Boolean | Включены ли уведомления в Telegram |
| tgChatId | String? | Chat ID для отправки уведомлений |
| language | String | Язык интерфейса: ru, tm, en |

**Связи:**
- One-to-One с Wallet
- One-to-Many с P2PAd
- One-to-Many с Order (покупатель и продавец)
- One-to-Many с Message
- One-to-Many с Review (выданные и полученные)
- One-to-Many с ExchangeRequest
- One-to-Many с CryptoTransaction
- One-to-Many с Code (созданные и активированные)

### Модель Wallet (Кошелёк)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| userId | String (unique) | Связь с пользователем |
| usdtBalance | Float | Баланс USDT |
| tmtBalance | Float | Баланс TMT |

### Модель P2PAd (P2P-объявление)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| userId | String | Связь с создателем |
| type | String | buy или sell |
| asset | String | USDT или TMT |
| fiat | String | TMT или USD |
| priceType | String | fixed или floating |
| price | Float | Цена (фикс. или процент маржи) |
| minLimit | Float | Минимальная сумма сделки |
| maxLimit | Float | Максимальная сумма сделки |
| city | String | Город проведения сделки |
| description | String? | Условия сделки |
| paymentTime | Int | Время на оплату в минутах |
| isPrivate | Boolean | Приватное объявление по ссылке |
| reqKyc | Boolean | Требовать KYC от контрагента |
| reqMinTrades | Int | Минимум успешных сделок |
| reqRating | Float | Минимальный рейтинг |
| isActive | Boolean | Активность объявления |

### Модель Order (Сделка)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| adId | String | Ссылка на объявление |
| buyerId | String | ID покупателя |
| sellerId | String | ID продавца |
| amountAsset | Float | Сумма в криптовалюте |
| amountFiat | Float | Сумма в фиате |
| status | String | PENDING, PAID, COMPLETED, CANCELLED |
| isDisputed | Boolean | Открыт ли спор |

### Модель Message (Сообщение)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| orderId | String | Ссылка на сделку |
| senderId | String | Отправитель |
| text | String? | Текст сообщения |
| imageUrl | String? | URL изображения |
| isSystem | Boolean | Системное сообщение |

### Модель Review (Отзыв)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| orderId | String | Ссылка на сделку |
| authorId | String | Автор отзыва |
| targetId | String | Получатель отзыва |
| rating | String | excellent, neutral, bad |
| comment | String? | Комментарий |

### Модель ExchangeRequest (Заявка на обмен)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| userId | String | Пользователь |
| direction | String | USDT_TO_TMT или TMT_TO_USDT |
| amountUsdt | Float | Сумма USDT |
| amountTmt | Float | Сумма TMT |
| userPhone | String? | Номер для перевода манатов |
| status | String | PENDING, COMPLETED, CANCELLED |

### Модель CryptoTransaction (Крипто-транзакция)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| userId | String | Пользователь |
| type | String | DEPOSIT или WITHDRAWAL |
| network | String | TRC20, BEP20 или APTOS |
| amount | Float | Сумма |
| address | String? | Адрес для вывода |
| txId | String? | Хэш транзакции |
| status | String | PENDING, COMPLETED, CANCELLED |

### Модель Code (Промокод/Ваучер)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| code | String (unique) | Код (TM-USDT-500-...) |
| codeHash | String (unique) | Хеш кода для безопасности |
| amount | Float | Номинал |
| currency | String | USDT |
| fee | Float | Комиссия за создание |
| status | String | ACTIVE, USED, EXPIRED, CANCELLED |
| creatorId | String | Создатель |
| redeemerId | String? | Активировавший |
| expiresAt | DateTime | Срок действия |
| usedAt | DateTime? | Дата активации |

---

## 4. API Endpoints

### Аутентификация

- `POST /api/auth` — Регистрация/логин через Telegram initData

### P2P Объявления

- `GET /api/p2p` — Получение списка активных объявлений с фильтрами
- `POST /api/p2p` — Создание нового объявления
- `GET /api/p2p/[id]` — Получение конкретного объявления
- `PUT /api/p2p/[id]` — Редактирование объявления
- `DELETE /api/p2p/[id]` — Удаление/деактивация объявления
- `GET /api/p2p/my` — Мои объявления

### Заказы (Сделки)

- `GET /api/orders` — Список заказов пользователя
- `POST /api/orders` — Создание новой сделки
- `GET /api/orders/[id]` — Получение конкретного заказа
- `PUT /api/orders/[id]/status` — Обновление статуса (оплачено, завершено, отменено)
- `POST /api/orders/[id]/dispute` — Открыть спор

### Сообщения

- `GET /api/orders/[id]/messages` — История чата сделки
- `POST /api/orders/[id]/messages` — Отправить сообщение

### Отзывы

- `POST /api/orders/[id]/review` — Оставить отзыв после сделки

### Кошелёк

- `GET /api/wallet/balance` — Получение баланса
- `GET /api/wallet/transactions` — История транзакций
- `POST /api/wallet/transactions` — Создание депозита или вывода
- `POST /api/wallet/faucet` — Тестовый кран (для разработки)

### Обмен (Exchange)

- `GET /api/exchange` — История обменов
- `POST /api/exchange` — Создание заявки на обмен

### Промокоды

- `POST /api/codes/create` — Создать код
- `POST /api/codes/redeem` — Активировать код
- `GET /api/codes/history` — История кодов

### KYC

- `GET /api/kyc/status` — Статус верификации
- `POST /api/kyc/submit` — Загрузить фото документа

### Пользователи

- `GET /api/user/[id]` — Профиль пользователя (публичный)
- `PUT /api/user/profile` — Редактирование профиля

### Админ-панель

- `GET /api/admin/users` — Список пользователей
- `GET /api/admin/orders` — Все заказы
- `GET /api/admin/disputes` — Активные споры
- `PUT /api/admin/kyc/[id]` — Одобрение/отклонение KYC
- `PUT /api/admin/order/[id]` — Решение спора

---

## 5. Дизайн-система (UI/UX)

### Цветовая палитра

**Основные цвета:**

| Назначение | Цвет | Hex |
|------------|------|-----|
| Primary (USDT) | Изумрудный | #10b981 |
| Secondary (TMT) | Синий | #3b82f6 |
| Danger (Продажа) | Красный | #ef4444 |
| Background | Светло-серый | #f8fafc |
| Card Background | Белый | #ffffff |
| Text Primary | Тёмно-серый | #1e293b |
| Text Secondary | Серый | #64748b |
| Text Muted | Светло-серый | #94a3b8 |

**Градиенты:**
- Баланс-карточка: `from-emerald-500 via-emerald-600 to-teal-700`

### Типографика

- **Заголовки**: Geist / System UI, bold
- **Основной текст**: 14-16px, medium
- **Мелкий текст**: 10-12px, medium
- **Цены**: 24-32px, bold

### Компоненты

#### Кнопки
- Primary: `bg-emerald-500 text-white rounded-2xl shadow-lg`
- Secondary: `bg-white ring-1 ring-slate-200`
- Danger: `bg-red-500 text-white`

#### Карточки
- Background: Белый
- Border-radius: `2rem` (32px)
- Shadow: `shadow-sm ring-1 ring-slate-100`
- Padding: `p-5`

#### Модальные окна
- Background: Белый
- Border-radius: `rounded-t-[2.5rem]`
- Padding: `p-6`
- Backdrop: `bg-slate-900/40 backdrop-blur-sm`
- Z-index: 60-100

#### Bottom Navigation
- Fixed внизу экрана
- 4 иконки: Кошелёк, Обмен, P2P, Профиль
- Active state: `text-emerald-600`
- Inactive: `text-slate-400`

### Адаптивность

- **Максимальная ширина**: `max-w-md` (428px — iPhone Max)
- **Padding**: `px-4` или `px-5`
- **Safe area**: Учтён для iPhone (pb-32 для навигации)

### Анимации

- `animate-in fade-in` — Появление экранов
- `animate-in slide-in-from-bottom` — Модальные окна
- `animate-pulse` — Загрузка
- `active:scale-95` — Нажатие кнопок

### Взаимодействия

- Haptic Feedback в Telegram при успешных/ошибочных действиях
- Toast-уведомления (3 секунды)
- Pull-to-refresh на списках

---

## 6. Основные экраны

### 1. Кошелёк (Wallet)

- Карточка баланса с градиентом
- Баланс TMT (основной) и USDT (второстепенный)
- Скрытие/показ баланса (глаз)
- Кнопки: Пополнить, Вывод, Обмен
- История крипто-транзакций

**Модалки:**
- Пополнение: выбор сети (TRC20/BEP20/APTOS), адрес эскроу, ввод TxID
- Вывод: выбор сети, адрес, сумма

### 2. P2P Маркет

- Верхняя панель: Купить/Продать (табы)
- Выбор актива: USDT / TMT
- Выбор фиата: TMT / USD
- Фильтр по сумме
- Лента объявлений

**Карточка объявления:**
- Имя продавца (клик — профиль)
- Верификация (blue check)
- Цена (фикс. или floating с процентом)
- Лимиты
- Город
- Время на оплату

**Модалка создания сделки:**
- Итоговая цена
- Условия продавца
- Ввод суммы
- Расчёт получаемой суммы
- Проверка KYC/лимитов продавца

### 3. Профиль

- Аватар и имя
- Статистика: сделки, выполнено, объём
- KYC-статус
- P2P Центр:
  - Мои объявления
  - Создать объявление
  - Мои сделки
  - Промокоды
- Настройки:
  - Язык
  - Никнейм
  - Телефон / Почта
  - 2FA (passcode)
- Помощь
- Админ-панель (если isAdmin)

### 4. Экран сделки (Order)

- Статус сделки (Pending/Paid/Completed/Cancelled)
- Сумма к оплате / Сумма к получению
- Чат с контрагентом
- Кнопки: Я оплатил / Подтвердить получение
- Кнопка "Спор/Арбитраж"

### 5. Создание объявления

- Тип: На приём (buy) / На выплаты (sell)
- Актив: USDT / TMT
- Фиат: TMT / USD
- Цена: Фиксированная / Плавающая (+/- %)
- Лимиты: мин/макс
- Город
- Условия сделки (описание)
- Время на оплату
- Защита контрагента:
  - Только верифицированные
  - Минимум сделок

### 6. Обмен (Exchange)

- Направление: USDT → TMT или TMT → USDT
- Калькулятор курса
- Ввод суммы
- Подтверждение
- История обменов

### 7. KYC

- Загрузка фото документа
- Статусы: none → pending → verified/rejected
- Описание причин отклонения

### 8. Админ-панель

- Статистика: пользователи, споры, объёмы
- Управление KYC
- Список споров
- Заявки на обмен
- Транзакции

---

## 7. Deep Links и навигация

Приложение поддерживает следующие параметры запуска (`start_param`):

| Параметр | Описание |
|----------|----------|
| `user_[id]` | Открыть профиль пользователя |
| `order_[id]` | Открыть конкретную сделку |
| `wallet` | Переход в кошелёк |
| `p2p` | Переход в P2P |
| `profile` | Переход в профиль |
| `my_orders` | Переход в мои сделки |
| `my_ads` | Переход в мои объявления |
| `create_ad` | Переход к созданию объявления |
| `kyc` | Переход в KYC |

---

## 8. Многоязычность

Поддерживаются 3 языка:

- **Русский (ru)** — основной
- **Туркменский (tm)**
- **Английский (en)**

Переводы хранятся в `src/lib/dictionaries.ts` в объекте `dict`.

---

## 9. Безопасность

- Аутентификация через Telegram initData
- Верификация подписи через HMAC-SHA256
- Хеширование промокодов (bcrypt)
- Проверка баланса перед сделками
- Логирование операций
- Админ-функции защищены флагом `isAdmin`

---

## 10. Разработка и тестирование

### Команды

```bash
npm run dev      # Запуск dev-сервера
npm run build    # Сборка + Prisma generate
npm run lint     # ESLint проверка
```

### Переменные окружения

- `POSTGRES_URL` — Строка подключения к PostgreSQL
- `TELEGRAM_BOT_TOKEN` — Токен Telegram-бота (для уведомлений)

---

## 11. Планы развития

- Чат с поддержкой изображений
- P2P-кредитование (кредиты под залог USDT)
- Интеграция с платёжными системами
- Торговые пары с другими фиатами
- Мобильные push-уведомления
- Реферальная программа

---

*Документация создана на основе анализа исходного кода проекта Rapira TM*