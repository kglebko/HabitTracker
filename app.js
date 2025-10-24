// --- Конфигурация и константы ---
const LS_KEY = 'ht_habits_v2';
const ICONS = {
  water: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C12 2 6 8 6 12a6 6 0 1 0 12 0c0-4-6-10-6-10z" fill="currentColor"/></svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6a2 2 0 0 1 2-2h13v14a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6z" fill="currentColor"/></svg>`,
  dumbbell: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 8h-2v8h2V8zM6 8H4v8h2V8zM8 10h8v4H8v-4z" fill="currentColor"/></svg>`,
  star: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.6 6.9L21 10l-5 3.6L17.2 21 12 17.7 6.8 21 8 13.6 3 10l6.4-1.1L12 2z" fill="currentColor"/></svg>`,
  heart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>`,
  check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>`
};

// --- Глобальное состояние ---
let state = {
  habits: [],
  selectedHabitId: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  showAllHabits: false,
  statsPeriod: 'week' // 'week' или 'month'
};

// --- DOM элементы ---
const habitsListEl = document.getElementById('habitsList');
const addHabitBtn = document.getElementById('addHabitBtn');
const addHabitModal = document.getElementById('addHabitModal');
const habitTitleInput = document.getElementById('habitTitle');
const habitColorInput = document.getElementById('habitColor');
const iconChoicesEl = document.getElementById('iconChoices');
const saveHabitBtn = document.getElementById('saveHabitBtn');
const cancelHabitBtn = document.getElementById('cancelHabitBtn');
const calendarEl = document.getElementById('calendar');
const currentMonthEl = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedHabitInfo = document.getElementById('selectedHabitInfo');
const weekPercentEl = document.getElementById('weekPercent');
const totalChecksEl = document.getElementById('totalChecks');
const progressCircle = document.getElementById('progressCircle');
const progressText = document.getElementById('progressText');
const viewModeText = document.getElementById('viewModeText');
const deleteHabitBtn = document.getElementById('deleteHabitBtn');
const toastEl = document.getElementById('toast');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportBtn');
const toggleViewMode = document.getElementById('toggleViewMode');

// --- Утилиты для работы с датами ---
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function parseYMD(ymd) { 
  return new Date(ymd + "T00:00:00"); 
}

function isToday(date) {
  return formatDate(date) === formatDate(new Date());
}

function isFutureDate(date) {
  return date > new Date();
}

// --- Функции для работы с периодами ---
function getWeekRange(date = new Date()) {
  const day = date.getDay();
  const monday = new Date(date);
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: new Date(monday),
    end: new Date(sunday)
  };
}

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

function getDatesForPeriod(period, date = new Date()) {
  const dates = [];
  let range;
  
  if (period === 'week') {
    range = getWeekRange(date);
  } else {
    range = getMonthRange(date);
  }
  
  const current = new Date(range.start);
  while (current <= range.end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// --- Статистика ---
function getStats(habit = null, period = 'week') {
  const today = new Date();
  const dates = getDatesForPeriod(period, today);
  
  if (habit) {
    // Статистика для одной привычки
    const completed = dates.filter(date => {
      const dateStr = formatDate(date);
      return habit.checks[dateStr];
    }).length;
    
    const total = dates.length; // Всегда полное количество дней в периоде
    
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      period: period
    };
  } else {
    // Статистика для всех привычек
    let totalCompleted = 0;
    let totalPossible = dates.length * state.habits.length;
    
    state.habits.forEach(habit => {
      dates.forEach(date => {
        if (habit.checks[formatDate(date)]) {
          totalCompleted++;
        }
      });
    });
    
    return {
      completed: totalCompleted,
      total: totalPossible,
      percent: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      period: period
    };
  }
}

function getHabitStats(habit) {
  const weekStats = getStats(habit, 'week');
  const monthStats = getStats(habit, 'month');
  const totalChecks = Object.keys(habit.checks).length;
  
  return { 
    total: totalChecks, 
    week: weekStats,
    month: monthStats
  };
}

// --- Работа с localStorage ---
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.habits = saved.habits || [];
      state.selectedHabitId = saved.selectedHabitId || null;
      state.showAllHabits = saved.showAllHabits || false;
      state.statsPeriod = saved.statsPeriod || 'week';
    }
  } catch (e) { 
    console.error('Ошибка загрузки:', e);
    showToast('Ошибка загрузки данных');
  }
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      habits: state.habits,
      selectedHabitId: state.selectedHabitId,
      showAllHabits: state.showAllHabits,
      statsPeriod: state.statsPeriod
    }));
  } catch (e) {
    console.error('Ошибка сохранения:', e);
    showToast('Ошибка сохранения данных');
  }
}

// --- Работа с привычками ---
function createHabit(name, icon, color) {
  return {
    id: 'h_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name: name.trim(),
    icon: icon,
    color: color,
    checks: {},
    createdAt: new Date().toISOString()
  };
}

function findHabit(id) { 
  return state.habits.find(h => h.id === id); 
}

// --- Рендер списка привычек ---
function renderHabits() {
  habitsListEl.innerHTML = '';
  
  if (state.habits.length === 0) {
    habitsListEl.innerHTML = `
      <li class="empty-state">
        <div style="text-align: center; padding: 20px; color: var(--muted);">
          <div style="font-size: 48px; margin-bottom: 8px;">📊</div>
          <div>Список привычек пуст</div>
          <small>Добавьте первую привычку</small>
        </div>
      </li>`;
    return;
  }

  state.habits.forEach(habit => {
    const stats = getHabitStats(habit);
    const currentStats = state.statsPeriod === 'week' ? stats.week : stats.month;
    const isSelected = state.selectedHabitId === habit.id && !state.showAllHabits;
    
    const li = document.createElement('li');
    li.className = `habit-item ${isSelected ? 'selected' : ''} ${state.showAllHabits ? 'dimmed' : ''}`;
    li.dataset.id = habit.id;
    
    li.innerHTML = `
      <div class="habit-icon" style="background:${habit.color}">
        ${ICONS[habit.icon] || ICONS.star}
      </div>
      <div class="habit-content">
        <div class="habit-title">${habit.name}</div>
        <div class="habit-meta">
          <small>${stats.total} отметок • ${currentStats.percent}% за ${state.statsPeriod === 'week' ? 'неделю' : 'месяц'}</small>
        </div>
      </div>
    `;

    li.addEventListener('click', () => {
      state.showAllHabits = false;
      state.selectedHabitId = habit.id;
      saveState();
      renderAll();
    });

    habitsListEl.appendChild(li);
  });
}

// --- Рендер календаря ---
function renderCalendar() {
  calendarEl.innerHTML = '';
  
  // Добавляем заголовки дней недели
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekdays.forEach(day => {
    const dayEl = document.createElement('div');
    dayEl.className = 'weekday';
    dayEl.textContent = day;
    calendarEl.appendChild(dayEl);
  });

  const year = state.viewYear;
  const month = state.viewMonth;
  
  // Обновляем заголовок месяца
  currentMonthEl.textContent = new Date(year, month).toLocaleString('ru-RU', {
    month: 'long',
    year: 'numeric'
  });

  const firstOfMonth = new Date(year, month, 1);
  const startDay = (firstOfMonth.getDay() + 6) % 7; // Пн = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Создаем ячейки календаря
  for (let i = 0; i < 42; i++) { // 6 недель
    const cell = document.createElement('div');
    cell.className = 'day';
    
    if (i < startDay || i >= startDay + daysInMonth) {
      cell.classList.add('empty');
      calendarEl.appendChild(cell);
      continue;
    }

    const dayNum = i - startDay + 1;
    const currentDate = new Date(year, month, dayNum);
    const dateStr = formatDate(currentDate);
    
    cell.dataset.date = dateStr;
    
    if (isToday(currentDate)) {
      cell.classList.add('today');
    }

    // Добавляем класс для будущих дат
    if (isFutureDate(currentDate)) {
      cell.classList.add('future');
    }

    // Номер дня
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-num';
    dayNumber.textContent = dayNum;
    cell.appendChild(dayNumber);

    // Отметки привычек
    if (state.showAllHabits && state.habits.length > 0) {
      // Режим показа всех привычек - показываем точки для каждой привычки
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'dots';
      
      // Ограничиваем количество отображаемых точек до 6
      const habitsToShow = state.habits.slice(0, 6);
      
      habitsToShow.forEach(habit => {
        if (habit.checks[dateStr]) {
          const dot = document.createElement('div');
          dot.className = 'habit-dot';
          dot.style.background = habit.color;
          dot.title = `${habit.name} - ${formatDate(currentDate)}`;
          dotsContainer.appendChild(dot);
        }
      });
      
      if (dotsContainer.children.length > 0) {
        cell.classList.add('multi-marked');
        cell.appendChild(dotsContainer);
        
        // Показываем количество дополнительных привычек если их больше 6
        if (state.habits.length > 6) {
          const extraCount = state.habits.slice(6).filter(h => h.checks[dateStr]).length;
          if (extraCount > 0) {
            const extraBadge = document.createElement('div');
            extraBadge.className = 'extra-badge';
            extraBadge.textContent = `+${extraCount}`;
            extraBadge.title = `Еще ${extraCount} привычек выполнено`;
            cell.appendChild(extraBadge);
          }
        }
      }
      
    } else if (state.selectedHabitId) {
      // Режим одной выбранной привычки
      const habit = findHabit(state.selectedHabitId);
      if (habit && habit.checks[dateStr]) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.background = habit.color;
        cell.appendChild(dot);
        cell.classList.add('marked');
      }
    }

    // Обработчик клика
    cell.addEventListener('click', () => handleDayClick(dateStr, cell, currentDate));
    calendarEl.appendChild(cell);
  }
}

// --- Обработчик клика по дню ---
function handleDayClick(dateStr, cell, date) {
  // Проверяем, не будущая ли это дата
  if (isFutureDate(date)) {
    showToast('Нельзя отмечать будущие даты!', 2000);
    return;
  }

  if (state.showAllHabits) {
    // В режиме всех привычек показываем информацию о том, какие привычки выполнены
    const completedHabits = state.habits.filter(habit => habit.checks[dateStr]);
    if (completedHabits.length > 0) {
      const habitNames = completedHabits.map(h => h.name).join(', ');
      showToast(`Выполнено (${formatDate(date)}): ${habitNames}`, 3000);
    } else {
      showToast('В этот день не выполнено ни одной привычки');
    }
    return;
  }

  if (!state.selectedHabitId) {
    showToast('Выберите привычку слева');
    return;
  }

  const habit = findHabit(state.selectedHabitId);
  if (!habit) return;

  // Переключаем отметку
  if (habit.checks[dateStr]) {
    delete habit.checks[dateStr];
    cell.classList.remove('marked');
    const dot = cell.querySelector('.dot');
    if (dot) dot.remove();
  } else {
    habit.checks[dateStr] = true;
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.background = habit.color;
    cell.appendChild(dot);
    cell.classList.add('marked');
  }

  saveState();
  renderSelectedHabitInfo();
}

// --- Рендер информации о выбранной привычке ---
function renderSelectedHabitInfo() {
  if (state.showAllHabits) {
    // Режим всех привычек
    const totalChecks = state.habits.reduce((sum, habit) => 
      sum + Object.keys(habit.checks).length, 0
    );
    
    const stats = getStats(null, state.statsPeriod);
    const periodTotal = state.statsPeriod === 'week' ? 7 : new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    
    selectedHabitInfo.innerHTML = `
      <div class="habit-icon" style="background:var(--accent)">👁️</div>
      <div>
        <div style="font-weight:600">Все привычки</div>
        <div style="font-size:12px;color:var(--muted)">
          ${stats.completed}/${periodTotal} дней (${stats.percent}%)
        </div>
      </div>
    `;
    
    viewModeText.textContent = 'Все привычки';
    updateProgress(stats.percent, '#00BCD4');
    updateStatsDisplay(stats, periodTotal);
    
  } else if (state.selectedHabitId) {
    // Режим одной привычки
    const habit = findHabit(state.selectedHabitId);
    if (!habit) return;

    const stats = getStats(habit, state.statsPeriod);
    const periodTotal = state.statsPeriod === 'week' ? 7 : new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    
    selectedHabitInfo.innerHTML = `
      <div class="habit-icon" style="background:${habit.color}">
        ${ICONS[habit.icon] || ICONS.star}
      </div>
      <div>
        <div style="font-weight:600">${habit.name}</div>
        <div style="font-size:12px;color:var(--muted)">
          ${stats.completed}/${periodTotal} дней (${stats.percent}%)
        </div>
      </div>
    `;
    
    viewModeText.textContent = habit.name;
    updateProgress(stats.percent, habit.color);
    updateStatsDisplay(stats, periodTotal);
    
  } else {
    // Ничего не выбрано
    selectedHabitInfo.innerHTML = `<small>Выберите привычку или включите режим просмотра всех привычек</small>`;
    viewModeText.textContent = '—';
    updateProgress(0, '#00BCD4');
    updateStatsDisplay({completed: 0, total: 0, percent: 0});
  }
}

// --- Обработчики для табов ---
function setupTabButtons() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      
      // Обновляем активное состояние
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Обновляем период статистики
      state.statsPeriod = period;
      saveState();
      renderAll();
    });
  });
}

// --- Обновление активного таба ---
function updateStatsPeriodText() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    if (btn.dataset.period === state.statsPeriod) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// --- Обновление отображения статистики ---
function updateStatsDisplay(stats, periodTotal = null) {
  const totalDisplay = periodTotal || stats.total;
  weekPercentEl.textContent = `${stats.percent}%`;
  totalChecksEl.textContent = `${stats.completed}/${totalDisplay}`;
}

// --- Обновление прогресс-круга ---
function updateProgress(percent, color) {
  const p = Math.max(0, Math.min(100, percent));
  const dash = `${p},100`;
  
  progressCircle.setAttribute('stroke-dasharray', dash);
  progressCircle.style.stroke = color || 'var(--primary)';
  progressText.textContent = p + '%';
}

// --- Переключение режимов просмотра ---
function toggleAllHabitsView() {
  state.showAllHabits = !state.showAllHabits;
  if (state.showAllHabits) {
    toggleViewMode.textContent = 'Показать одну привычку';
    toggleViewMode.classList.add('active');
  } else {
    toggleViewMode.textContent = 'Показать все привычки';
    toggleViewMode.classList.remove('active');
  }
  saveState();
  renderAll();
}

// --- Рендер всего приложения ---
function renderAll() {
  renderHabits();
  renderCalendar();
  renderSelectedHabitInfo();
}

// --- Инициализация выбора иконок ---
function renderIconChoices() {
  iconChoicesEl.innerHTML = '';
  Object.entries(ICONS).forEach(([key, svg]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-choice';
    btn.innerHTML = svg;
    btn.dataset.icon = key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.icon-choice').forEach(n => n.classList.remove('selected'));
      btn.classList.add('selected');
    });
    iconChoicesEl.appendChild(btn);
  });
  
  // Выбираем первую иконку по умолчанию
  const firstIcon = iconChoicesEl.querySelector('.icon-choice');
  if (firstIcon) firstIcon.classList.add('selected');
}

// --- Toast уведомления ---
let toastTimer = null;
function showToast(text, duration = 2000) {
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, duration);
}

// --- Управление темой ---
function applyTheme(theme) {
  document.body.className = theme;
  localStorage.setItem('ht_theme', theme);
}

function loadTheme() {
  const saved = localStorage.getItem('ht_theme') || 'light';
  applyTheme(saved);
}

// --- Навигация по месяцам ---
function navigateMonth(direction) {
  state.viewMonth += direction;
  if (state.viewMonth < 0) {
    state.viewMonth = 11;
    state.viewYear--;
  } else if (state.viewMonth > 11) {
    state.viewMonth = 0;
    state.viewYear++;
  }
  renderAll(); // Полностью перерендериваем, чтобы обновилась статистика
}

// --- Экспорт в PNG ---
function exportToPNG() {
  const mainArea = document.querySelector('.main-area');
  
  html2canvas(mainArea, {
    backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg'),
    scale: 2,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `habits-${formatDate(new Date())}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(e => {
    console.error('Export error:', e);
    showToast('Ошибка экспорта');
  });
}

// --- Обработчики событий ---
function setupEventListeners() {
  // Модальное окно привычек
  addHabitBtn.addEventListener('click', () => {
    habitTitleInput.value = '';
    habitColorInput.value = '#4caf50';
    document.querySelectorAll('.icon-choice').forEach(n => n.classList.remove('selected'));
    const firstIcon = iconChoicesEl.querySelector('.icon-choice');
    if (firstIcon) firstIcon.classList.add('selected');
    addHabitModal.classList.remove('hidden');
    habitTitleInput.focus();
  });

  cancelHabitBtn.addEventListener('click', () => addHabitModal.classList.add('hidden'));

  saveHabitBtn.addEventListener('click', () => {
    const name = habitTitleInput.value.trim();
    if (!name) {
      showToast('Введите название привычки');
      return;
    }

    const iconEl = document.querySelector('.icon-choice.selected');
    const icon = iconEl ? iconEl.dataset.icon : 'star';
    const color = habitColorInput.value;

    const habit = createHabit(name, icon, color);
    state.habits.unshift(habit);
    state.selectedHabitId = habit.id;
    state.showAllHabits = false;

    saveState();
    addHabitModal.classList.add('hidden');
    renderAll();
    showToast('Привычка добавлена!');
  });

  // Навигация
  prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
  nextMonthBtn.addEventListener('click', () => navigateMonth(1));

  // Переключение режимов
  toggleViewMode.addEventListener('click', toggleAllHabitsView);

  // Табы переключения периода
  setupTabButtons();

  // Удаление привычки
  deleteHabitBtn.addEventListener('click', () => {
    if (!state.selectedHabitId && !state.showAllHabits) {
      showToast('Выберите привычку для удаления');
      return;
    }

    if (state.showAllHabits) {
      showToast('Выйдите из режима просмотра всех привычек');
      return;
    }

    const habit = findHabit(state.selectedHabitId);
    if (!habit) return;

    if (!confirm(`Удалить привычку "${habit.name}" и все её данные?`)) return;

    const index = state.habits.findIndex(h => h.id === state.selectedHabitId);
    state.habits.splice(index, 1);
    state.selectedHabitId = state.habits.length > 0 ? state.habits[0].id : null;

    saveState();
    renderAll();
    showToast('Привычка удалена');
  });

  // Тема
  themeToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
  });

  // Экспорт
  exportBtn.addEventListener('click', exportToPNG);

  // Закрытие модального окна по клику вне его
  addHabitModal.addEventListener('click', (e) => {
    if (e.target === addHabitModal) {
      addHabitModal.classList.add('hidden');
    }
  });

  // Закрытие по ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !addHabitModal.classList.contains('hidden')) {
      addHabitModal.classList.add('hidden');
    }
  });
}

// --- Инициализация приложения ---
function initApp() {
  loadTheme();
  loadState();
  renderIconChoices();
  setupEventListeners();
  updateStatsPeriodText();
  renderAll();
  
  // Инициализируем текст кнопки переключения режима
  toggleViewMode.textContent = state.showAllHabits ? 
    'Показать одну привычку' : 'Показать все привычки';
  
  if (state.showAllHabits) {
    toggleViewMode.classList.add('active');
  }
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', initApp);