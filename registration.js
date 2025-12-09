// Firebase Firestore
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

let games = [];
let selectedGame = null;

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.db) {
      console.log('Firebase инициализирован для регистрации');
      initializeRegistration();
    } else {
      console.error('Firebase не инициализирован');
      showNotification('Ошибка соединения с сервером', 'error');
    }
  }, 500);
});

async function initializeRegistration() {
  try {
    await loadAvailableGames();
    setupEventListeners();
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    showNotification('Ошибка загрузки данных: ' + error.message, 'error');
  }
}

// Загрузка игр
async function loadAvailableGames() {
  try {
    console.log('Загружаем игры из Firebase...');
    const gamesRef = collection(window.db, 'games');
    const snapshot = await getDocs(gamesRef);
    console.log('Получено документов из Firebase:', snapshot.size);

    games = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    snapshot.forEach((d) => {
      const gameData = d.data();
      if (gameData.name && gameData.date && gameData.status) {
        if (gameData.status === 'Планируется' || gameData.status === 'В процессе') {
          const gameDate = new Date(gameData.date);
          if (gameDate >= today) {
            games.push({ id: d.id, ...gameData });
          }
        }
      }
    });

    games.sort((a, b) => new Date(a.date) - new Date(b.date));
    populateGamesSelect();
  } catch (error) {
    console.error('Ошибка загрузки игр:', error);
    showNotification('Ошибка загрузки игр. Попробуйте позже.', 'error');
    const gameSelect = document.getElementById('gameSelect');
    gameSelect.innerHTML = '';
    gameSelect.disabled = true;
  }
}

function populateGamesSelect() {
  const gameSelect = document.getElementById('gameSelect');
  if (!gameSelect) return;

  if (games.length === 0) {
    gameSelect.innerHTML = '<option value="">Нет доступных игр</option>';
    gameSelect.disabled = true;
    return;
  }

  gameSelect.innerHTML = '<option value="">Выберите игру</option>';
  games.forEach(game => {
    const option = document.createElement('option');
    option.value = game.id;
    option.textContent = `${game.name} - ${formatDate(game.date)} в ${game.time}`;
    gameSelect.appendChild(option);
  });
  gameSelect.disabled = false;
}

function setupEventListeners() {
  document.getElementById('gameSelect')
    .addEventListener('change', handleGameSelect);

  document.getElementById('registrationForm')
    .addEventListener('submit', handleFormSubmit);

  setupFieldValidation();
}

function handleGameSelect(e) {
  const gameId = e.target.value;
  const gameInfo = document.getElementById('gameInfo');

  if (gameId) {
    selectedGame = games.find(g => g.id === gameId);
    if (selectedGame) {
      showGameInfo(selectedGame);
      gameInfo.classList.add('visible');
    }
  } else {
    selectedGame = null;
    gameInfo.classList.remove('visible');
    gameInfo.innerHTML = '';
  }
}

function showGameInfo(game) {
  const gameInfo = document.getElementById('gameInfo');
  const teamsCount = game.teams ? game.teams.length : 0;
  const participantsCount = game.teams
    ? game.teams.reduce((sum, t) => sum + (t.memberCount || 0), 0)
    : 0;

  gameInfo.innerHTML =
    `Дата и время: ${formatDate(game.date)} в ${game.time}<br>` +
    `Место: ${game.venue}<br>` +
    `Статус: ${game.status}<br>` +
    `Уже зарегистрировано: ${teamsCount} команд (${participantsCount} участников)`;
}

// Валидация
function setupFieldValidation() {
  const teamName = document.getElementById('teamName');
  const memberCount = document.getElementById('memberCount');
  const captainContact = document.getElementById('captainContact');

  teamName.addEventListener('input', validateTeamName);
  memberCount.addEventListener('input', validateMemberCount);
  captainContact.addEventListener('input', validateCaptainContact);
}

function validateTeamName() {
  const teamName = document.getElementById('teamName');
  const value = teamName.value.trim();
  if (value.length < 2) {
    setFieldError(teamName, 'Название команды должно содержать минимум 2 символа');
    return false;
  }
  if (selectedGame && selectedGame.teams) {
    const existingTeam = selectedGame.teams.find(
      team => team.name.toLowerCase() === value.toLowerCase()
    );
    if (existingTeam) {
      setFieldError(teamName, 'Команда с таким названием уже зарегистрирована');
      return false;
    }
  }
  clearFieldError(teamName);
  return true;
}

function validateMemberCount() {
  const memberCount = document.getElementById('memberCount');
  const value = parseInt(memberCount.value, 10);
  if (isNaN(value) || value < 1 || value > 20) {
    setFieldError(memberCount, 'Количество участников должно быть от 1 до 20');
    return false;
  }
  clearFieldError(memberCount);
  return true;
}

function validateCaptainContact() {
  const captainContact = document.getElementById('captainContact');
  const value = captainContact.value.trim();
  if (!value) {
    setFieldError(captainContact, 'Контакт капитана обязателен');
    return false;
  }
  try {
    new URL(value);
    clearFieldError(captainContact);
    return true;
  } catch {
    setFieldError(captainContact, 'Введите корректную ссылку (например: https://vk.com/...)');
    return false;
  }
}

function setFieldError(field, message) {
  clearFieldError(field);
  field.style.borderColor = '#ff4d4f';
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
  field.style.borderColor = '#e9e9e7';
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) existingError.remove();
}

// Отправка формы
async function handleFormSubmit(e) {
  e.preventDefault();
  console.log('Начинаем регистрацию команды...');

  if (!validateForm()) {
    console.log('Форма не прошла валидацию');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Регистрируем команду...';

  try {
    await registerTeam();
    console.log('Команда успешно зарегистрирована');
    showSuccessMessage();
  } catch (error) {
    console.error('Ошибка регистрации команды:', error);
    showNotification('Ошибка при регистрации команды: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Зарегистрировать команду';
  }
}

function validateForm() {
  if (!selectedGame) {
    showNotification('Выберите игру для регистрации', 'error');
    return false;
  }
  return validateTeamName() && validateMemberCount() && validateCaptainContact();
}

async function registerTeam() {
  console.log('Регистрируем команду для игры:', selectedGame.name);

  const teamData = {
    id: generateId(),
    number: (selectedGame.teams ? selectedGame.teams.length : 0) + 1,
    name: document.getElementById('teamName').value.trim(),
    memberCount: parseInt(document.getElementById('memberCount').value, 10),
    captainSocialLink: document.getElementById('captainContact').value.trim(),
    captainName: document.getElementById('captainName').value.trim() || null,
    registeredAt: new Date(),
    registrationSource: 'public_form'
  };

  const updatedTeams = [...(selectedGame.teams || []), teamData];
  const gameRef = doc(window.db, 'games', selectedGame.id);
  await updateDoc(gameRef, { teams: updatedTeams });
}

function showSuccessMessage() {
  document.getElementById('registrationForm').classList.add('hidden');
  document.getElementById('successMessage').classList.add('visible');
}

function resetForm() {
  document.getElementById('successMessage').classList.remove('visible');
  document.getElementById('registrationForm').classList.remove('hidden');
  document.getElementById('registrationForm').reset();
  document.getElementById('gameInfo').classList.remove('visible');
  document.getElementById('gameInfo').innerHTML = '';
  selectedGame = null;

  document.querySelectorAll('.field-error').forEach(e => e.remove());
  document.querySelectorAll('input, select').forEach(f => {
    f.style.borderColor = '#e9e9e7';
  });
}

// Уведомления
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const text = document.getElementById('notificationText');
  text.textContent = message;
  notification.className = `notification ${type} visible`;
  setTimeout(() => {
    notification.classList.remove('visible');
  }, 5000);
}

function closeNotification() {
  document.getElementById('notification').classList.remove('visible');
}

// Вспомогательные
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Делаем функции доступными из HTML
window.resetForm = resetForm;
window.closeNotification = closeNotification;

console.log('registration.js загружен и готов к работе');
