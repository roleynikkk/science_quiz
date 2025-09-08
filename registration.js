// Firebase Firestore functions
import { 
    collection, 
    getDocs, 
    updateDoc, 
    doc, 
    query,
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

// Глобальные переменные
let games = [];
let selectedGame = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Ждем пока Firebase инициализируется
    setTimeout(() => {
        if (window.db) {
            console.log('Firebase инициализирован для регистрации');
            initializeRegistration();
        } else {
            console.error('Firebase не инициализирован');
            showNotification('Ошибка соединения с сервером', 'error');
        }
    }, 1000);
});

async function initializeRegistration() {
    try {
        await loadAvailableGames();
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

// Загрузка доступных игр
async function loadAvailableGames() {
    try {
        const gamesRef = collection(window.db, 'games');
        const q = query(gamesRef, 
            where('status', 'in', ['Планируется', 'В процессе']),
            orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        games = [];

        snapshot.forEach((doc) => {
            const gameData = doc.data();
            // Проверяем, что игра не в прошлом
            const gameDate = new Date(gameData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (gameDate >= today) {
                games.push({
                    id: doc.id,
                    ...gameData
                });
            }
        });

        console.log('Загружено игр для регистрации:', games.length);
        populateGamesSelect();

    } catch (error) {
        console.error('Ошибка загрузки игр:', error);
        showNotification('Ошибка загрузки списка игр', 'error');
    }
}

// Заполнение списка игр
function populateGamesSelect() {
    const gameSelect = document.getElementById('gameSelect');

    if (games.length === 0) {
        gameSelect.innerHTML = '<option value="">Нет доступных игр для регистрации</option>';
        gameSelect.disabled = true;
        return;
    }

    gameSelect.innerHTML = '<option value="">Выберите игру...</option>';

    games.forEach(game => {
        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = `${game.name} - ${formatDate(game.date)} в ${game.time}`;
        gameSelect.appendChild(option);
    });

    gameSelect.disabled = false;
}

// Обработчики событий
function setupEventListeners() {
    // Выбор игры
    document.getElementById('gameSelect').addEventListener('change', handleGameSelect);

    // Отправка формы
    document.getElementById('registrationForm').addEventListener('submit', handleFormSubmit);

    // Валидация полей
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
    }
}

function showGameInfo(game) {
    const gameInfo = document.getElementById('gameInfo');
    const teamsCount = game.teams ? game.teams.length : 0;
    const participantsCount = game.teams ? 
        game.teams.reduce((sum, team) => sum + team.memberCount, 0) : 0;

    gameInfo.innerHTML = `
        <h4>${game.name}</h4>
        <p><span class="highlight">Дата и время:</span> ${formatDate(game.date)} в ${game.time}</p>
        <p><span class="highlight">Место:</span> ${game.venue}</p>
        <p><span class="highlight">Статус:</span> ${game.status}</p>
        <p><span class="highlight">Уже зарегистрировано:</span> ${teamsCount} команд (${participantsCount} участников)</p>
    `;
}

// Валидация полей
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
        const existingTeam = selectedGame.teams.find(team => 
            team.name.toLowerCase() === value.toLowerCase()
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
    const value = parseInt(memberCount.value);

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

    // Простая проверка URL
    try {
        new URL(value);
        clearFieldError(captainContact);
        return true;
    } catch {
        setFieldError(captainContact, 'Введите корректную ссылку (например: https://vk.com/captain)');
        return false;
    }
}

function setFieldError(field, message) {
    clearFieldError(field);
    field.style.borderColor = '#ff4d4f';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#ff4d4f';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '4px';
    errorDiv.textContent = message;

    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '#e9e9e7';
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Обработка отправки формы
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Регистрируем команду...';

    try {
        await registerTeam();
        showSuccessMessage();

    } catch (error) {
        console.error('Ошибка регистрации команды:', error);
        showNotification('Ошибка при регистрации команды. Попробуйте еще раз.', 'error');

    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">✅</span> Зарегистрировать команду';
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
    const teamData = {
        id: generateId(),
        number: (selectedGame.teams ? selectedGame.teams.length : 0) + 1,
        name: document.getElementById('teamName').value.trim(),
        memberCount: parseInt(document.getElementById('memberCount').value),
        captainSocialLink: document.getElementById('captainContact').value.trim(),
        captainName: document.getElementById('captainName').value.trim() || null,
        registeredAt: new Date(),
        registrationSource: 'public_form'
    };

    // Обновляем список команд игры
    const updatedTeams = [...(selectedGame.teams || []), teamData];

    const gameRef = doc(window.db, 'games', selectedGame.id);
    await updateDoc(gameRef, { teams: updatedTeams });

    console.log('Команда зарегистрирована:', teamData.name);
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
    selectedGame = null;

    // Очищаем ошибки
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('input, select').forEach(field => {
        field.style.borderColor = '#e9e9e7';
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

// Вспомогательные функции
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

// Глобальные функции
window.resetForm = resetForm;
window.closeNotification = closeNotification;

console.log('registration.js загружен');