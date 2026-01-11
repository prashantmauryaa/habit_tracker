// HabitFlow V3 - Multi-user Functionality

// --- State Management ---
let appState = {
    habits: [],
    goals: [],
    settings: { theme: 'dark' },
    history: {}
};

// --- DOM References ---
const els = {
    navItems: document.querySelectorAll('.nav-item'),
    views: {
        dashboard: document.getElementById('view-dashboard'),
        goals: document.getElementById('view-goals'),
        calendar: document.getElementById('view-calendar'),
        analytics: document.getElementById('view-analytics')
    },
    titles: {
        main: document.getElementById('pageTitle'),
        sub: document.getElementById('pageSubtitle')
    },
    buttons: {
        addHabit: document.getElementById('addHabitBtn'),
        addGoal: document.getElementById('addGoalBtn'),
        theme: document.getElementById('themeToggle')
    },
    modals: {
        habit: document.getElementById('modalOverlay'),
        goal: document.getElementById('goalModalOverlay'),
        logout: document.getElementById('logoutModalOverlay') // New Ref
    },
    lists: {
        habits: document.getElementById('habitsList'),
        goals: document.getElementById('goalsList')
    },
    stats: {
        total: document.getElementById('totalHabits'),
        rate: document.getElementById('completionRate'),
        streak: document.getElementById('bestStreak')
    }
};

// --- Init ---
function init() {
    setupNavigation();
    setupModals();
    setupHabits();
    setupGoals();
    setupAuthListeners();

    // Check theme
    if (appState.settings.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        els.buttons.theme.textContent = '☀️';
    }

    // Default flow
    checkAuth();
}

// --- Auth & Data Logic (Multi-User) ---

function getUserKey(user, key) {
    return `habitflow_${user}_${key}`;
}

function checkAuth() {
    const user = localStorage.getItem('habitflow_current_user');
    const appView = document.getElementById('app-view');
    const authView = document.getElementById('auth-view');
    const userNameDisplay = document.querySelector('.user-details .name');

    if (user) {
        // User logged in
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
        if (userNameDisplay) userNameDisplay.textContent = user;

        loadData(user);
        checkDailyReset(user);
        renderDashboard();
    } else {
        // No user
        authView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
}

function loadData(user) {
    if (!user) return;
    const habits = localStorage.getItem(getUserKey(user, 'habits'));
    const goals = localStorage.getItem(getUserKey(user, 'goals'));
    const settings = localStorage.getItem(getUserKey(user, 'settings'));
    const history = localStorage.getItem(getUserKey(user, 'history'));

    appState.habits = habits ? JSON.parse(habits) : [];
    appState.goals = goals ? JSON.parse(goals) : [];
    appState.settings = settings ? JSON.parse(settings) : { theme: 'dark' };
    appState.history = history ? JSON.parse(history) : {};

    // Theme sync
    if (appState.settings.theme) {
        document.documentElement.setAttribute('data-theme', appState.settings.theme);
        els.buttons.theme.textContent = appState.settings.theme === 'light' ? '☀️' : '🌙';
    }
}

function saveData() {
    const user = localStorage.getItem('habitflow_current_user');
    if (!user) return; // Don't save if no user

    localStorage.setItem(getUserKey(user, 'habits'), JSON.stringify(appState.habits));
    localStorage.setItem(getUserKey(user, 'goals'), JSON.stringify(appState.goals));
    localStorage.setItem(getUserKey(user, 'settings'), JSON.stringify(appState.settings));
    localStorage.setItem(getUserKey(user, 'history'), JSON.stringify(appState.history));
}

function setupAuthListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = document.getElementById('loginName');
        const name = userInput.value.trim();
        if (name) {
            localStorage.setItem('habitflow_current_user', name);
            userInput.value = ''; // clear input
            checkAuth();
        }
    });

    // Logout Modal Logic
    const logoutBtn = document.getElementById('logoutBtn');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Show custom modal instead of alert
            els.modals.logout.classList.add('active');
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', () => {
            els.modals.logout.classList.remove('active');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            els.modals.logout.classList.remove('active');

            // Perform Logout Animation
            const app = document.getElementById('app-view');
            app.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0, 0, 1)';
            app.style.opacity = '0';
            app.style.transform = 'scale(0.95) translateY(10px)';

            setTimeout(() => {
                localStorage.removeItem('habitflow_current_user');
                appState = { habits: [], goals: [], settings: { theme: 'dark' }, history: {} };
                checkAuth();
                // Reset styles
                app.style.opacity = '';
                app.style.transform = '';
            }, 400);
        });
    }
}

function checkDailyReset(user) {
    if (!user) return;
    const lastLoginKey = getUserKey(user, 'last_login');
    const lastLoginDate = localStorage.getItem(lastLoginKey);
    const todayStr = new Date().toDateString();

    if (lastLoginDate !== todayStr) {
        // New day
        appState.habits.forEach(h => {
            h.completedToday = false;
        });
        saveData();
        localStorage.setItem(lastLoginKey, todayStr);
    }
}


// --- Navigation Logic ---
function setupNavigation() {
    els.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.dataset.view;

            els.navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            Object.values(els.views).forEach(el => el.classList.remove('active'));
            els.views[targetView].classList.add('active');

            if (targetView === 'dashboard') {
                els.buttons.addHabit.classList.remove('hidden');
                els.buttons.addGoal.classList.add('hidden');
                els.titles.main.textContent = 'Overview';
                renderDashboard();
            } else if (targetView === 'goals') {
                els.buttons.addHabit.classList.add('hidden');
                els.buttons.addGoal.classList.remove('hidden');
                els.titles.main.textContent = 'Monthly Goals';
                renderGoals();
            } else if (targetView === 'calendar') {
                els.buttons.addHabit.classList.add('hidden');
                els.buttons.addGoal.classList.add('hidden');
                els.titles.main.textContent = 'History';
                renderCalendar();
            } else if (targetView === 'analytics') {
                els.buttons.addHabit.classList.add('hidden');
                els.buttons.addGoal.classList.add('hidden');
                els.titles.main.textContent = 'Performance';
                renderAnalytics();
            }
        });
    });
}

// --- Dashboard / Habits Logic ---
function setupHabits() {
    document.getElementById('habitForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const mt = document.getElementById('habitNameInput').value;
        const icon = document.querySelector('.icon-option.active').dataset.icon;
        appState.habits.push({
            id: Date.now(), title: mt, icon: icon,
            streak: 0, best: 0, completedToday: false
        });
        saveData();
        renderDashboard();
        closeModals();
        e.target.reset();
    });
}

function renderDashboard() {
    els.lists.habits.innerHTML = '';

    if (appState.habits.length === 0) {
        document.getElementById('emptyState').classList.add('visible');
    } else {
        document.getElementById('emptyState').classList.remove('visible');
        appState.habits.forEach(h => {
            const div = document.createElement('div');
            div.className = `habit-card ${h.completedToday ? 'completed' : ''}`;
            div.innerHTML = `
                <div class="habit-icon-box">${h.icon}</div>
                <div class="habit-details">
                    <div class="habit-name">${h.title}</div>
                    <div class="habit-meta">
                        <span class="${h.streak > 0 ? 'active' : ''}">🔥 ${h.streak} streak</span>
                    </div>
                </div>
                <div class="habit-actions" style="display:flex; align-items:center;">
                    <label class="check-container">
                        <input type="checkbox" class="check-input" ${h.completedToday ? 'checked' : ''}>
                        <div class="check-box"><svg class="check-tick" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    </label>
                    <button class="habit-delete" onclick="deleteHabit(${h.id})">🗑</button>
                </div>
             `;
            div.querySelector('input').addEventListener('change', () => toggleHabit(h.id));
            els.lists.habits.appendChild(div);
        });
    }
    updateStats();
}

function toggleHabit(id) {
    const h = appState.habits.find(x => x.id === id);
    if (!h) return;
    h.completedToday = !h.completedToday;

    if (h.completedToday) {
        h.streak++;
        if (h.streak > h.best) h.best = h.streak;
        triggerConfetti();
        const dateKey = new Date().toISOString().split('T')[0];
        appState.history[dateKey] = (appState.history[dateKey] || 0) + 1;
    } else {
        h.streak = Math.max(0, h.streak - 1);
        const dateKey = new Date().toISOString().split('T')[0];
        if (appState.history[dateKey]) appState.history[dateKey]--;
    }
    saveData();
    renderDashboard();
}

function deleteHabit(id) {
    if (!confirm('Delete habit?')) return;
    appState.habits = appState.habits.filter(h => h.id !== id);
    saveData();
    renderDashboard();
}

function updateStats() {
    els.stats.total.textContent = appState.habits.length;
    const completed = appState.habits.filter(h => h.completedToday).length;
    els.stats.rate.textContent = appState.habits.length ? Math.round((completed / appState.habits.length) * 100) + '%' : '0%';
    els.stats.streak.textContent = Math.max(0, ...appState.habits.map(h => h.streak)) + ' days';
}

// --- Goals Logic ---
function setupGoals() {
    document.getElementById('goalForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('goalTitleInput').value;
        const target = parseInt(document.getElementById('goalTargetInput').value);
        appState.goals.push({ id: Date.now(), title, target, current: 0 });
        saveData();
        renderGoals();
        closeModals();
        e.target.reset();
    });
}

function renderGoals() {
    const list = els.lists.goals;
    list.innerHTML = '';

    if (appState.goals.length === 0) {
        document.getElementById('goalsEmptyState').classList.add('visible');
    } else {
        document.getElementById('goalsEmptyState').classList.remove('visible');
        appState.goals.forEach(g => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            const el = document.createElement('div');
            el.className = 'goal-card';
            el.innerHTML = `
                <div class="goal-header">
                    <div class="goal-title">${g.title}</div>
                    <div class="goal-stats">${g.current} / ${g.target}</div>
                </div>
                <div class="goal-progress-wrap">
                    <div style="font-size:12px; margin-bottom:4px;">${pct}% Completed</div>
                    <div class="goal-bar-bg">
                        <div class="goal-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
                <div class="goal-controls">
                    <button class="btn-mini" onclick="updateGoal(${g.id}, 1)">+ Add Progress</button>
                    <button class="btn-mini" onclick="deleteGoal(${g.id})">Remove</button>
                </div>
            `;
            list.appendChild(el);
        });
    }
}

function updateGoal(id, change) {
    const g = appState.goals.find(x => x.id === id);
    if (!g) return;
    g.current += change;
    saveData();
    renderGoals();
}

window.updateGoal = updateGoal;
window.deleteHabit = deleteHabit;
window.deleteGoal = (id) => {
    if (!confirm('Remove goal?')) return;
    appState.goals = appState.goals.filter(g => g.id !== id);
    saveData();
    renderGoals();
};

// --- Calendar Logic (REAL DATA) ---
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayNum = date.getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calendarMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    for (let i = 0; i < firstDay; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day empty';
        grid.appendChild(d);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day';
        d.textContent = i;

        const dayDate = new Date(currentYear, currentMonth, i);
        const year = dayDate.getFullYear();
        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
        const day = String(dayDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        const count = appState.history[dateKey] || 0;
        const totalHabits = appState.habits.length;

        if (count > 0) {
            if (totalHabits > 0 && count >= totalHabits) {
                d.classList.add('perfect');
            } else {
                d.classList.add('good');
            }
        }

        if (i === todayNum && currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth()) {
            d.classList.add('today');
        }

        grid.appendChild(d);
    }
}

// --- Analytics Logic V2 ---
let charts = {};
function renderAnalytics() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7DaysLabels = [];
    const last7DaysData = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];

        last7DaysLabels.push(dayName);
        last7DaysData.push(appState.history[dateKey] || 0);
    }

    const totalHabits = appState.habits.length;

    // Efficiency Calculation
    let sumEfficiency = 0;
    let daysCounted = 0;

    Object.values(appState.history).forEach(dailyCount => {
        if (dailyCount > 0) {
            let dailyEff = dailyCount / Math.max(1, totalHabits);
            if (dailyEff > 1) dailyEff = 1;
            sumEfficiency += dailyEff;
            daysCounted++;
        }
    });
    const efficiency = daysCounted > 0 ? Math.round((sumEfficiency / daysCounted) * 100) : 0;

    const historyValues = Object.values(appState.history);
    const totalCompletions = historyValues.reduce((a, b) => a + b, 0);

    const dayCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    Object.keys(appState.history).forEach(dateStr => {
        const d = new Date(dateStr);
        const dayName = days[d.getDay()];
        dayCounts[dayName] += appState.history[dateStr];
    });
    const bestDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
    const bestDayName = dayCounts[bestDay] > 0 ? bestDay : "N/A";

    document.getElementById('consistencyScore').textContent = `${efficiency}%`;
    document.getElementById('totalCompletions').textContent = totalCompletions;
    document.getElementById('bestDay').textContent = bestDayName;

    const ctx1 = document.getElementById('trendChart');
    const ctx2 = document.getElementById('distributionChart');

    if (charts.trend) charts.trend.destroy();
    if (charts.dist) charts.dist.destroy();

    const gradient = ctx1.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

    charts.trend = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: last7DaysLabels,
            datasets: [{
                label: 'Habits',
                data: last7DaysData,
                borderColor: '#8b5cf6',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.5,
                pointBackgroundColor: '#0f1115',
                pointBorderColor: '#8b5cf6',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f232d',
                    titleColor: '#fff',
                    bodyColor: '#9499ad',
                    borderColor: '#2a2e3b',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { stepSize: 1, color: '#64748b' },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });

    // Distribution
    const activeDays = Math.max(1, historyValues.length);
    const totalPossible = totalHabits * activeDays;
    const skipped = Math.max(0, totalPossible - totalCompletions);

    charts.dist = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Missed'],
            datasets: [{
                data: [totalCompletions, skipped],
                backgroundColor: ['#10b981', '#1e293b'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '85%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#9499ad', usePointStyle: true, boxWidth: 8, padding: 20 }
                }
            }
        }
    });
}

function setupModals() {
    els.buttons.addHabit.addEventListener('click', () => els.modals.habit.classList.add('active'));
    els.buttons.addGoal.addEventListener('click', () => els.modals.goal.classList.add('active'));
    document.querySelectorAll('.closeModal').forEach(b => b.addEventListener('click', closeModals));
    els.buttons.theme.addEventListener('click', toggleTheme);
    document.getElementById('iconSelector').addEventListener('click', e => {
        if (e.target.classList.contains('icon-option')) {
            document.querySelectorAll('.icon-option').forEach(x => x.classList.remove('active'));
            e.target.classList.add('active');
        }
    });
}

function closeModals() {
    els.modals.habit.classList.remove('active');
    els.modals.goal.classList.remove('active');
    if (els.modals.logout) els.modals.logout.classList.remove('active');
}

function toggleTheme() {
    appState.settings.theme = appState.settings.theme === 'light' ? 'dark' : 'light';
    if (appState.settings.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        els.buttons.theme.textContent = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        els.buttons.theme.textContent = '🌙';
    }
    saveData();
}

function triggerConfetti() {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#6366f1', '#8b5cf6'] });
}

document.addEventListener('DOMContentLoaded', init);
