// Глобальные переменные
let games = [];
let templateTasks = ["Подготовить дипломы", "Написать сценарий", "Подписать список на пропуски"];
let currentEditingGameId = null;

// Начальные данные
const sampleGames = [
    {
        id: 1,
        name: "ScienceQuiz #1 - Физика и астрономия",
        date: "2025-09-15",
        time: "18:00",
        venue: "Актовый зал школы №5",
        status: "Планируется"
    },
    {
        id: 2,
        name: "ScienceQuiz #2 - Биология и медицина",
        date: "2025-09-22",
        time: "18:00",
        venue: "Конференц-зал библиотеки",
        status: "Планируется"
    }
];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

function initializeApp() {
    // Загрузить данные из localStorage или использовать образцы
    const savedGames = localStorage.getItem('scienceQuizGames');
    const savedTasks = localStorage.getItem('scienceQuizTemplateTasks');
    
    if (savedGames) {
        games = JSON.parse(savedGames);
    } else {
        // Инициализировать образцы игр с задачами
        games = sampleGames.map(game => ({
            ...game,
            tasks: templateTasks.map(taskName => ({
                id: generateId(),
                name: taskName,
                completed: false
            }))
        }));
        saveGames();
    }
    
    if (savedTasks) {
        templateTasks = JSON.parse(savedTasks);
    } else {
        saveTemplateTasks();
    }
}

function loadInitialData() {
    updateDashboard();
    updateGamesTable();
    updateTemplateTasks();
    updateStatistics();
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
    
    // Формы
    setupFormListeners();
    
    // Поиск и фильтры
    setupSearchAndFilters();
}

function setupModalListeners() {
    // Модальное окно добавления игры
    const addGameBtn = document.getElementById('addGameBtn');
    const closeGameModal = document.getElementById('closeGameModal');
    const cancelGameModal = document.getElementById('cancelGameModal');
    const gameModalOverlay = document.getElementById('gameModalOverlay');

    if (addGameBtn) {
        addGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentEditingGameId = null;
            document.getElementById('gameModalTitle').textContent = 'Добавить новую игру';
            document.getElementById('gameForm').reset();
            showModal('addGameModal');
        });
    }

    [closeGameModal, cancelGameModal, gameModalOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', () => hideModal('addGameModal'));
        }
    });

    // Модальное окно задач игры
    const closeTasksModal = document.getElementById('closeTasksModal');
    const closeTasksModalBtn = document.getElementById('closeTasksModalBtn');
    const tasksModalOverlay = document.getElementById('tasksModalOverlay');

    [closeTasksModal, closeTasksModalBtn, tasksModalOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', () => hideModal('gameTasksModal'));
        }
    });

    // Модальное окно добавления задачи в шаблон
    const addTemplateTaskBtn = document.getElementById('addTemplateTaskBtn');
    const closeTemplateTaskModal = document.getElementById('closeTemplateTaskModal');
    const cancelTemplateTaskModal = document.getElementById('cancelTemplateTaskModal');
    const templateTaskModalOverlay = document.getElementById('templateTaskModalOverlay');

    if (addTemplateTaskBtn) {
        addTemplateTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('templateTaskForm').reset();
            showModal('addTemplateTaskModal');
        });
    }

    [closeTemplateTaskModal, cancelTemplateTaskModal, templateTaskModalOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', () => hideModal('addTemplateTaskModal'));
        }
    });
}

function setupFormListeners() {
    // Форма добавления/редактирования игры
    const gameForm = document.getElementById('gameForm');
    if (gameForm) {
        gameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveGame();
        });
    }

    // Форма добавления задачи в шаблон
    const templateTaskForm = document.getElementById('templateTaskForm');
    if (templateTaskForm) {
        templateTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addTemplateTask();
        });
    }
}

function setupSearchAndFilters() {
    const gameSearch = document.getElementById('gameSearch');
    const statusFilter = document.getElementById('statusFilter');

    if (gameSearch) {
        gameSearch.addEventListener('input', updateGamesTable);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', updateGamesTable);
    }
}

// Навигация
function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Обновить активный элемент навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Обновить данные при переходе на секцию
    if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'games') {
        updateGamesTable();
    } else if (sectionId === 'templates') {
        updateTemplateTasks();
    } else if (sectionId === 'statistics') {
        updateStatistics();
    }
}

// Управление модальными окнами
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Управление играми
function saveGame() {
    const formData = {
        name: document.getElementById('gameName').value,
        date: document.getElementById('gameDate').value,
        time: document.getElementById('gameTime').value,
        venue: document.getElementById('gameVenue').value,
        status: document.getElementById('gameStatus').value
    };

    if (currentEditingGameId) {
        // Редактирование существующей игры
        const gameIndex = games.findIndex(g => g.id === currentEditingGameId);
        if (gameIndex !== -1) {
            games[gameIndex] = { ...games[gameIndex], ...formData };
        }
    } else {
        // Создание новой игры
        const newGame = {
            id: generateId(),
            ...formData,
            tasks: templateTasks.map(taskName => ({
                id: generateId(),
                name: taskName,
                completed: false
            }))
        };
        games.push(newGame);
    }

    saveGames();
    hideModal('addGameModal');
    updateGamesTable();
    updateDashboard();
    
    showNotification('Игра успешно сохранена', 'success');
}

// Глобальные функции для обработки событий
window.editGame = function(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    currentEditingGameId = gameId;
    document.getElementById('gameModalTitle').textContent = 'Редактировать игру';
    document.getElementById('gameName').value = game.name;
    document.getElementById('gameDate').value = game.date;
    document.getElementById('gameTime').value = game.time;
    document.getElementById('gameVenue').value = game.venue;
    document.getElementById('gameStatus').value = game.status;
    
    showModal('addGameModal');
};

window.deleteGame = function(gameId) {
    if (confirm('Вы уверены, что хотите удалить эту игру?')) {
        games = games.filter(g => g.id !== gameId);
        saveGames();
        updateGamesTable();
        updateDashboard();
        showNotification('Игра удалена', 'info');
    }
};

window.duplicateGame = function(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const duplicatedGame = {
        ...game,
        id: generateId(),
        name: game.name + ' (копия)',
        status: 'Планируется',
        tasks: game.tasks.map(task => ({
            ...task,
            id: generateId(),
            completed: false
        }))
    };

    games.push(duplicatedGame);
    saveGames();
    updateGamesTable();
    updateDashboard();
    showNotification('Игра продублирована', 'success');
};

window.showGameTasks = function(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    document.getElementById('gameTasksTitle').textContent = `Задачи для игры: ${game.name}`;
    
    const tasksList = document.getElementById('gameTasksList');
    tasksList.innerHTML = '';

    game.tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTaskCompletion(${gameId}, ${task.id})">
            <span class="task-name">${task.name}</span>
        `;
        tasksList.appendChild(taskItem);
    });

    showModal('gameTasksModal');
};

window.toggleTaskCompletion = function(gameId, taskId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const task = game.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveGames();
    updateGamesTable();
    updateDashboard();
    
    // Обновить отображение задач в модальном окне
    showGameTasks(gameId);
};

// Управление шаблонами задач
function addTemplateTask() {
    const taskName = document.getElementById('templateTaskName').value;
    if (!taskName.trim()) return;

    templateTasks.push(taskName);
    saveTemplateTasks();
    updateTemplateTasks();
    hideModal('addTemplateTaskModal');
    showNotification('Задача добавлена в шаблон', 'success');
}

window.removeTemplateTask = function(taskName) {
    if (confirm('Удалить эту задачу из шаблона? Это не повлияет на уже созданные игры.')) {
        templateTasks = templateTasks.filter(task => task !== taskName);
        saveTemplateTasks();
        updateTemplateTasks();
        showNotification('Задача удалена из шаблона', 'info');
    }
};

// Обновление интерфейса
function updateDashboard() {
    // Обновить статистику
    const totalGames = games.length;
    const upcomingGames = games.filter(g => g.status === 'Планируется').length;
    const completedGames = games.filter(g => g.status === 'Завершена').length;

    const totalGamesEl = document.getElementById('totalGames');
    const upcomingGamesEl = document.getElementById('upcomingGames');
    const completedGamesEl = document.getElementById('completedGames');

    if (totalGamesEl) totalGamesEl.textContent = totalGames;
    if (upcomingGamesEl) upcomingGamesEl.textContent = upcomingGames;
    if (completedGamesEl) completedGamesEl.textContent = completedGames;

    // Обновить список ближайших игр
    updateUpcomingGames();
}

function updateUpcomingGames() {
    const upcomingGamesList = document.getElementById('upcomingGamesList');
    if (!upcomingGamesList) return;

    const upcoming = games
        .filter(g => g.status === 'Планируется')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    if (upcoming.length === 0) {
        upcomingGamesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <div class="empty-state-title">Нет предстоящих игр</div>
                <div class="empty-state-description">Создайте новую игру, чтобы начать планирование</div>
            </div>
        `;
        return;
    }

    upcomingGamesList.innerHTML = upcoming.map(game => {
        const progress = calculateGameProgress(game);
        const formattedDate = formatDate(game.date);
        
        return `
            <div class="upcoming-game-card">
                <div class="upcoming-game-info">
                    <h4>${game.name}</h4>
                    <div class="upcoming-game-details">
                        ${formattedDate} в ${game.time} • ${game.venue}
                    </div>
                </div>
                <div class="progress-info">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${progress}% готово</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateGamesTable() {
    const gameSearch = document.getElementById('gameSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    const searchTerm = gameSearch ? gameSearch.value.toLowerCase() : '';
    const statusFilterValue = statusFilter ? statusFilter.value : '';
    
    let filteredGames = games.filter(game => {
        const matchesSearch = game.name.toLowerCase().includes(searchTerm) ||
                            game.venue.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilterValue || game.status === statusFilterValue;
        return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('gamesTableBody');
    if (!tbody) return;
    
    if (filteredGames.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">🎯</div>
                    <div class="empty-state-title">Игры не найдены</div>
                    <div class="empty-state-description">Попробуйте изменить критерии поиска или добавьте новую игру</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredGames.map(game => {
        const progress = calculateGameProgress(game);
        const formattedDate = formatDate(game.date);
        const statusBadge = getStatusBadge(game.status);
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${game.name}</td>
                <td>${game.venue}</td>
                <td>${game.time}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${progress}% (${game.tasks.filter(t => t.completed).length}/${game.tasks.length})</div>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="showGameTasks(${game.id})" title="Задачи">📋</button>
                        <button class="action-btn" onclick="editGame(${game.id})" title="Редактировать">✏️</button>
                        <button class="action-btn" onclick="duplicateGame(${game.id})" title="Дублировать">📋</button>
                        <button class="action-btn" onclick="deleteGame(${game.id})" title="Удалить">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateTemplateTasks() {
    const templateTasksList = document.getElementById('templateTasksList');
    if (!templateTasksList) return;
    
    if (templateTasks.length === 0) {
        templateTasksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">Нет задач в шаблоне</div>
                <div class="empty-state-description">Добавьте задачи, которые будут автоматически создаваться для каждой новой игры</div>
            </div>
        `;
        return;
    }

    templateTasksList.innerHTML = templateTasks.map(taskName => `
        <div class="template-task-item">
            <span class="template-task-name">${taskName}</span>
            <div class="template-task-actions">
                <button class="action-btn" onclick="removeTemplateTask('${taskName}')" title="Удалить">🗑️</button>
            </div>
        </div>
    `).join('');
}

function updateStatistics() {
    const avgCompletionEl = document.getElementById('avgCompletion');
    if (!avgCompletionEl) return;

    if (games.length === 0) {
        avgCompletionEl.textContent = '0%';
        return;
    }

    const totalTasks = games.reduce((sum, game) => sum + game.tasks.length, 0);
    const completedTasks = games.reduce((sum, game) => sum + game.tasks.filter(t => t.completed).length, 0);
    const avgCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    avgCompletionEl.textContent = avgCompletion + '%';
}

// Вспомогательные функции
function generateId() {
    return Date.now() + Math.random();
}

function calculateGameProgress(game) {
    if (!game.tasks || game.tasks.length === 0) return 0;
    const completedTasks = game.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / game.tasks.length) * 100);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getStatusBadge(status) {
    const statusClasses = {
        'Планируется': 'status-badge--planned',
        'В процессе': 'status-badge--in-progress',
        'Завершена': 'status-badge--completed'
    };
    
    return `<span class="status-badge ${statusClasses[status] || ''}">${status}</span>`;
}

function saveGames() {
    localStorage.setItem('scienceQuizGames', JSON.stringify(games));
}

function saveTemplateTasks() {
    localStorage.setItem('scienceQuizTemplateTasks', JSON.stringify(templateTasks));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">×</button>
    `;

    const notificationsContainer = document.getElementById('notifications');
    if (notificationsContainer) {
        notificationsContainer.appendChild(notification);

        // Автоматически скрыть через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Закрытие по клику
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }
}