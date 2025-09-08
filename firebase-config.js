// firebase-config.js
// ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:
// 1. Зайдите в Firebase Console (console.firebase.google.com)
// 2. Создайте новый проект или выберите существующий
// 3. Перейдите в настройки проекта (иконка шестеренки)
// 4. В разделе "Ваши приложения" выберите веб-приложение
// 5. Скопируйте конфигурацию и замените данные ниже

export const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Пример настоящей конфигурации:
/*
export const firebaseConfig = {
    apiKey: "AIzaSyB1234567890abcdefghijklmnop",
    authDomain: "sciencequiz-planner.firebaseapp.com",
    projectId: "sciencequiz-planner", 
    storageBucket: "sciencequiz-planner.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
*/