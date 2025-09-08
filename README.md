# ScienceQuiz Планировщик с Firebase

Веб-приложение для организации интеллектуальных игр ScienceQuiz с синхронизацией данных через Firebase Firestore.

## 🚀 Быстрый старт

### 1. Настройка Firebase

1. Перейдите на [Firebase Console](https://console.firebase.google.com)
2. Создайте новый проект:
   - Название: `sciencequiz-planner` (или любое другое)
   - Отключите Google Analytics (не обязательно)

3. Настройте Firestore Database:
   - В левом меню: Build → Firestore Database
   - Нажмите "Create database"
   - Выберите "Start in test mode" (для разработки)
   - Выберите регион (например, europe-west)

4. Добавьте веб-приложение:
   - В обзоре проекта нажмите на иконку `</>`
   - Введите название: "ScienceQuiz Web"
   - Скопируйте конфигурацию

### 2. Настройка конфигурации

Откройте файл `index.html` и найдите строки:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com", 
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

Замените на вашу конфигурацию из Firebase Console.

### 3. Загрузка на GitHub Pages

1. Загрузите все файлы в ваш GitHub репозиторий:
   - `index.html`
   - `app.js`
   - `style.css`
   - `firebase-config.js` (опционально)
   - `README.md`

2. Включите GitHub Pages в настройках репозитория

3. Откройте сайт - данные теперь синхронизируются между всеми пользователями!

## 📁 Структура файлов

```
├── index.html          # Главная страница
├── app.js             # Логика приложения с Firebase
├── style.css          # Стили (без изменений)
├── firebase-config.js # Конфигурация Firebase (опционально)
└── README.md          # Эта инструкция
```

## 🔧 Основные изменения

- ✅ localStorage заменен на Firebase Firestore
- ✅ Реалтайм-синхронизация между пользователями
- ✅ Данные сохраняются в облаке
- ✅ Автоматические обновления интерфейса

## 🛡️ Правила безопасности

Для продакшена обновите правила в Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if true; // Упрощенные правила
      // Позже можно добавить авторизацию
    }
  }
}
```

## 📊 Структура данных Firestore

**Коллекция `games`:**
```json
{
  "name": "ScienceQuiz #1 - Физика",
  "date": "2025-09-15", 
  "time": "18:00",
  "venue": "Актовый зал школы №5",
  "status": "Планируется",
  "tasks": [
    {
      "id": "unique-id",
      "name": "Подготовить дипломы",
      "completed": false
    }
  ],
  "createdAt": "2025-09-08T16:00:00.000Z"
}
```

## 🆘 Решение проблем

**Ошибка "Firebase не инициализирован":**
- Проверьте правильность конфигурации
- Убедитесь, что проект активен в Firebase Console

**Ошибка доступа к Firestore:**
- Проверьте правила безопасности в Firebase Console
- Убедитесь, что Firestore включен

**Данные не синхронизируются:**
- Откройте консоль браузера (F12) для просмотра ошибок
- Проверьте подключение к интернету

## 📞 Поддержка

При возникновении проблем:
1. Откройте консоль браузера (F12) 
2. Проверьте вкладку Console на наличие ошибок
3. Убедитесь, что Firebase правильно настроен

## 🎯 Возможности

- ✅ Совместное планирование игр
- ✅ Общие списки задач  
- ✅ Реалтайм-обновления
- ✅ Прогресс-бары подготовки
- ✅ Фильтрация и поиск
- ✅ Статистика и аналитика
- ✅ Адаптивный дизайн

---

Создано для организации интеллектуальных игр ScienceQuiz 🧠⚡