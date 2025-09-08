// Firebase Firestore functions
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot,
    query,
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

// Глобальные переменные
let games = [];
let templateTasks = ["Подготовить дипломы", "Написать сценарий", "Подписать список на пропуски"];
let currentEditingGameId = null;
let currentGameForTasks = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Ждем пока Firebase инициализируется
    setTimeout(() => {
        if (window.db) {
            initializeApp();
            setupEventListeners();
        } else {
            console.error('Firebase не инициализирован');
        }
    }, 1000);
});

function initializeApp() {
    // Настраиваем реалтайм-слушатель для игр
    setupRealtimeListeners();

    // Загружаем шаблоны задач из localStorage (пока оставим локально)
    const savedTasks = localStorage.getItem('scienceQuizTemplateTasks');
    if (savedTasks) {
        templateTasks = JSON.parse(savedTasks);
    } else {
        saveTemplateTasks();
    }

    updateTemplateTasks();
}

// Настройка реалтайм-слушателей Firebase
function setupRealtimeListeners() {
    const gamesRef = collection(window.db, 'games');
    const q = query(gamesRef, orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
        games = [];
        snapshot.forEach((doc) => {
            games.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Обновляем интерфейс
        updateDashboard();
        updateGamesTable();
        updateStatistics();
    }, (error) => {
        console.error("Ошибка получения игр:", error);
        showNotification('Ошибка соединения с базой данных');
    });
}

function setupEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            showSection(section);
        });
    });

    // Модальные окна
    setupModalListeners();

    // Кнопки действий
    document.getElementById('addGameBtn').addEventListener('click', () => {
        openGameModal();
    });

    document.getElementById('addTemplateTaskBtn').addEventListener('click', () => {
        openTaskModal('template');
    });

    // Формы
    document.getElementById('gameForm').addEventListener('submit', handleGameSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // Фильтры и поиск
    document.getElementById('statusFilter').addEventListener('change', filterGames);
    document.getElementById('searchInput').addEventListener('input', filterGames);
}

function setupModalListeners() {
    // Закрытие модальных окон
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.id === 'cancelGameBtn' || e.target.classList.contains('modal-close')) {
                closeModal('gameModal');
            }
            if (e.target.id === 'cancelTaskBtn' || e.target.classList.contains('modal-close')) {
                closeModal('taskModal');
            }
            if (e.target.id === 'closeTasksBtn' || e.target.classList.contains('modal-close')) {
                closeModal('tasksModal');
            }
        });
    });

    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Закрытие уведомлений
    document.querySelector('.notification-close').addEventListener('click', () => {
        document.getElementById('notification').style.display = 'none';
    });
}

// Навигация между секциями
function showSection(sectionName) {
    // Убираем активные классы
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Добавляем активные классы
    document.getElementById(sectionName).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// Обновление дашборда
function updateDashboard() {
    const totalGames = games.length;
    const upcomingGames = games.filter(game => game.status !== 'Завершена').length;
    const completedTasks = games.reduce((total, game) => {
        return total + (game.tasks ? game.tasks.filter(task => task.completed).length : 0);
    }, 0);

    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('upcomingGames').textContent = upcomingGames;
    document.getElementById('completedTasks').textContent = completedTasks;

    // Отображение ближайших игр
    updateUpcomingGamesList();
}

function updateUpcomingGamesList() {
    const upcomingGamesContainer = document.getElementById('upcomingGamesList');
    const upcomingGames = games
        .filter(game => game.status !== 'Завершена')
        .slice(0, 3);

    if (upcomingGames.length === 0) {
        upcomingGamesContainer.innerHTML = '<p class="no-games">Нет предстоящих игр</p>';
        return;
    }

    upcomingGamesContainer.innerHTML = upcomingGames.map(game => {
        const progress = calculateProgress(game);
        return `
            <div class="game-preview-card">
                <h3>${game.name}</h3>
                <div class="game-details">
                    <span>📅 ${formatDate(game.date)} в ${game.time}</span>
                    <span>📍 ${game.venue}</span>
                    <span class="status status-${game.status.toLowerCase()}">${game.status}</span>
                </div>
                <div class="progress-mini">
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${progress}%"></div>
                    </div>
                    <span>${progress}%</span>
                </div>
            </div>
        `;
    }).join('');
}

// Обновление таблицы игр
function updateGamesTable() {
    const tbody = document.getElementById('gamesTableBody');
    const statusFilter = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    let filteredGames = games;

    if (statusFilter) {
        filteredGames = filteredGames.filter(game => game.status === statusFilter);
    }

    if (searchQuery) {
        filteredGames = filteredGames.filter(game => 
            game.name.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredGames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Игры не найдены</td></tr>';
        return;
    }

    tbody.innerHTML = filteredGames.map(game => {
        const progress = calculateProgress(game);
        return `
            <tr>
                <td>${game.name}</td>
                <td>${formatDate(game.date)}</td>
                <td>${game.time}</td>
                <td>${game.venue}</td>
                <td><span class="status status-${game.status.toLowerCase().replace(' ', '.')}">${game.status}</span></td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${progress}%</span>
                    </div>
                </td>
                <td class="actions">
                    <button class="btn-icon" onclick="openTasksModal('${game.id}')" title="Задачи">
                        ✓
                    </button>
                    <button class="btn-icon" onclick="editGame('${game.id}')" title="Редактировать">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="duplicateGame('${game.id}')" title="Дублировать">
                        📋
                    </button>
                    <button class="btn-icon danger" onclick="deleteGame('${game.id}')" title="Удалить">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Firebase функции для игр
async function addGame(gameData) {
    try {
        // Создаем задачи для новой игры
        const tasks = templateTasks.map(taskName => ({
            id: generateId(),
            name: taskName,
            completed: false
        }));

        // Добавляем игру в Firestore
        const docRef = await addDoc(collection(window.db, 'games'), {
            ...gameData,
            tasks: tasks,
            createdAt: new Date()
        });

        console.log("Игра добавлена с ID: ", docRef.id);
        showNotification('Игра успешно добавлена!');
        closeModal('gameModal');

    } catch (error) {
        console.error("Ошибка добавления игры: ", error);
        showNotification('Ошибка при добавлении игры');
    }
}

async function updateGame(gameId, updateData) {
    try {
        const gameRef = doc(window.db, 'games', gameId);
        await updateDoc(gameRef, updateData);
        showNotification('Игра обновлена!');
        closeModal('gameModal');
    } catch (error) {
        console.error("Ошибка обновления игры: ", error);
        showNotification('Ошибка при обновлении игры');
    }
}

async function deleteGame(gameId) {
    if (!confirm('Вы уверены, что хотите удалить эту игру?')) {
        return;
    }

    try {
        await deleteDoc(doc(window.db, 'games', gameId));
        showNotification('Игра удалена!');
    } catch (error) {
        console.error("Ошибка удаления игры: ", error);
        showNotification('Ошибка при удалении игры');
    }
}

async function updateGameTasks(gameId, tasks) {
    try {
        const gameRef = doc(window.db, 'games', gameId);
        await updateDoc(gameRef, { tasks: tasks });
        showNotification('Задачи обновлены!');
    } catch (error) {
        console.error("Ошибка обновления задач: ", error);
        showNotification('Ошибка при обновлении задач');
    }
}

// Модальные окна и формы
function openGameModal(gameId = null) {
    currentEditingGameId = gameId;
    const modal = document.getElementById('gameModal');
    const title = document.getElementById('gameModalTitle');
    const form = document.getElementById('gameForm');

    if (gameId) {
        title.textContent = 'Редактировать игру';
        const game = games.find(g => g.id === gameId);
        if (game) {
            document.getElementById('gameName').value = game.name;
            document.getElementById('gameDate').value = game.date;
            document.getElementById('gameTime').value = game.time;
            document.getElementById('gameVenue').value = game.venue;
            document.getElementById('gameStatus').value = game.status;
        }
    } else {
        title.textContent = 'Добавить игру';
        form.reset();
        document.getElementById('gameStatus').value = 'Планируется';
    }

    modal.style.display = 'flex';
}

function openTasksModal(gameId) {
    currentGameForTasks = gameId;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    document.getElementById('tasksModalTitle').textContent = `Задачи для игры: ${game.name}`;
    updateTasksList();

    document.getElementById('tasksModal').style.display = 'flex';
}

function openTaskModal(type) {
    document.getElementById('taskModal').style.display = 'flex';
    document.getElementById('taskForm').reset();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    currentEditingGameId = null;
    currentGameForTasks = null;
}

// Обработчики форм
async function handleGameSubmit(e) {
    e.preventDefault();

    const gameData = {
        name: document.getElementById('gameName').value,
        date: document.getElementById('gameDate').value,
        time: document.getElementById('gameTime').value,
        venue: document.getElementById('gameVenue').value,
        status: document.getElementById('gameStatus').value
    };

    if (currentEditingGameId) {
        await updateGame(currentEditingGameId, gameData);
    } else {
        await addGame(gameData);
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();

    const taskName = document.getElementById('taskName').value;

    if (currentGameForTasks) {
        // Добавляем задачу к конкретной игре
        const game = games.find(g => g.id === currentGameForTasks);
        if (game) {
            const newTask = {
                id: generateId(),
                name: taskName,
                completed: false
            };
            const updatedTasks = [...(game.tasks || []), newTask];
            await updateGameTasks(currentGameForTasks, updatedTasks);
            updateTasksList();
        }
    } else {
        // Добавляем к шаблону
        templateTasks.push(taskName);
        saveTemplateTasks();
        updateTemplateTasks();
    }

    closeModal('taskModal');
}

// Управление задачами - ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ HTML
function updateTasksList() {
    if (!currentGameForTasks) return;

    const game = games.find(g => g.id === currentGameForTasks);
    if (!game) return;

    const tasks = game.tasks || [];
    const completed = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    // Обновляем прогресс
    document.getElementById('tasksProgress').style.width = progress + '%';
    document.getElementById('tasksProgressText').textContent = progress + '%';

    // Обновляем список задач - ПРАВИЛЬНАЯ СТРУКТУРА HTML
    const tasksList = document.getElementById('gameTasksList');
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item">
            <label class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask('${game.id}', '${task.id}')">
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.name}</span>
            </label>
            <button class="btn-icon danger" onclick="removeTask('${game.id}', '${task.id}')" title="Удалить">
                🗑️
            </button>
        </div>
    `).join('');
}

async function toggleTask(gameId, taskId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const tasks = game.tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });

    await updateGameTasks(gameId, tasks);
    updateTasksList();
}

async function removeTask(gameId, taskId) {
    if (!confirm('Удалить эту задачу?')) return;

    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const tasks = game.tasks.filter(task => task.id !== taskId);
    await updateGameTasks(gameId, tasks);
    updateTasksList();
}

// Шаблоны задач - ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ HTML
function updateTemplateTasks() {
    const container = document.getElementById('templateTasksList');
    container.innerHTML = templateTasks.map((task, index) => `
        <div class="task-item">
            <span class="task-text">${task}</span>
            <button class="btn-icon danger" onclick="removeTemplateTask(${index})" title="Удалить">
                🗑️
            </button>
        </div>
    `).join('');
}

function removeTemplateTask(index) {
    if (!confirm('Удалить эту задачу из шаблона?')) return;

    templateTasks.splice(index, 1);
    saveTemplateTasks();
    updateTemplateTasks();
}

function saveTemplateTasks() {
    localStorage.setItem('scienceQuizTemplateTasks', JSON.stringify(templateTasks));
}

// Другие функции
function editGame(gameId) {
    openGameModal(gameId);
}

async function duplicateGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const newGame = {
        ...game,
        name: game.name + ' (копия)',
        date: '',
        status: 'Планируется'
    };

    delete newGame.id;
    delete newGame.createdAt;

    // Сброс статуса задач
    if (newGame.tasks) {
        newGame.tasks = newGame.tasks.map(task => ({
            ...task,
            completed: false,
            id: generateId()
        }));
    }

    await addGame(newGame);
}

function filterGames() {
    updateGamesTable();
}

function updateStatistics() {
    const totalCompleted = games.filter(game => game.status === 'Завершена').length;
    const totalPlanned = games.filter(game => game.status === 'Планируется').length;

    const totalTasks = games.reduce((sum, game) => sum + (game.tasks?.length || 0), 0);
    const completedTasks = games.reduce((sum, game) => 
        sum + (game.tasks?.filter(task => task.completed).length || 0), 0);

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    document.getElementById('totalCompletedGames').textContent = totalCompleted;
    document.getElementById('totalPlannedGames').textContent = totalPlanned;
    document.getElementById('overallProgress').textContent = overallProgress + '%';
}

// Вспомогательные функции
function calculateProgress(game) {
    if (!game.tasks || game.tasks.length === 0) return 0;
    const completed = game.tasks.filter(task => task.completed).length;
    return Math.round((completed / game.tasks.length) * 100);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notificationText');

    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Глобальные функции для использования в HTML
window.openTasksModal = openTasksModal;
window.editGame = editGame;
window.duplicateGame = duplicateGame;
window.deleteGame = deleteGame;
window.toggleTask = toggleTask;
window.removeTask = removeTask;
window.removeTemplateTask = removeTemplateTask;