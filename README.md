# Rapira TM App

## Требования

- Node.js 18+ (рекомендуется 20 LTS)
- npm (или yarn/pnpm/bun)
- Git

## Установка

### 1. Клонирование репозитория

```bash
git clone <URL_репозитория>
cd rapira-tm-app
```

### 2. Установка зависимостей

```bash
npm install
```

Это установит все зависимости из package.json:
- **next** - Next.js 16 фреймворк
- **react/react-dom** - React 19
- **@prisma/client** - ORM для работы с БД
- **zustand** - менеджер состояний
- **lucide-react** - иконки
- **@twa-dev/sdk** - Telegram Mini App SDK
- **tailwindcss** - стили
- **typescript** - типизация
- **prisma** - миграции и генерация клиента БД

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта и ставь значение с сообщение 

### 4. Настройка базы данных

```bash
npx prisma generate
```

Это сгенерирует Prisma Client на основе схемы БД.


## Как делать коммиты


```bash
git add .
git commit -m "описание изменений"
git push origin main
```

## Полезные команды

```bash
# Запуск линтера
npm run lint

# Генерация Prisma Client (после изменения schema.prisma)
npx prisma generate
npx prisma db push
```


