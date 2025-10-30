const LS_KEY = 'ht_habits_v2';
const ICONS = {
  icon1: `<img src="images/icon1.svg" class="icon">`,
  icon2: `<img src="images/icon2.svg" class="icon">`,
  icon3: `<img src="images/icon3.svg" class="icon">`,
  icon4: `<img src="images/icon4.svg" class="icon">`,
  icon5: `<img src="images/icon5.svg" class="icon">`,
  icon6: `<img src="images/icon6.svg" class="icon">`,
  icon7: `<img src="images/icon7.svg" class="icon">`,
  icon8: `<img src="images/icon8.svg" class="icon">`
};



let state = {
  habits: [],
  selectedHabitId: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  showAllHabits: false,
  statsPeriod: 'week'
};

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

function getStats(habit = null, period = 'week') {
  const today = new Date();
  const dates = getDatesForPeriod(period, today);
  
  if (habit) {
    const completed = dates.filter(date => {
      const dateStr = formatDate(date);
      return habit.checks[dateStr];
    }).length;
    
    const total = dates.length;
    
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      period: period
    };
  } else {
    if (state.habits.length === 0) {
      return { completed: 0, total: 0, percent: 0, period: period };
    }
    
    let totalPercent = 0;
    let totalCompleted = 0;
    
    state.habits.forEach(habit => {
      const completed = dates.filter(date => {
        const dateStr = formatDate(date);
        return habit.checks[dateStr];
      }).length;
      
      totalCompleted += completed;
      const percent = dates.length > 0 ? (completed / dates.length) * 100 : 0;
      totalPercent += percent;
    });
    
    const averagePercent = Math.round(totalPercent / state.habits.length);
    const totalPossibleDays = dates.length * state.habits.length;
    
    return {
      completed: totalCompleted, 
      total: totalPossibleDays,  
      percent: averagePercent,   
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
        ${ICONS[habit.icon].replace('class="icon"', 'class="icon icon-white"') || ICONS.star}
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


function renderCalendar() {
  calendarEl.innerHTML = '';
  
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekdays.forEach(day => {
    const dayEl = document.createElement('div');
    dayEl.className = 'weekday';
    dayEl.textContent = day;
    calendarEl.appendChild(dayEl);
  });

  const year = state.viewYear;
  const month = state.viewMonth;
  
  
  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  currentMonthEl.textContent = capitalizeFirst(
    new Date(year, month).toLocaleString('ru-RU', {
      month: 'long',
      year: 'numeric'
    })
  );

  const firstOfMonth = new Date(year, month, 1);
  const startDay = (firstOfMonth.getDay() + 6) % 7; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  
  for (let i = 0; i < 42; i++) { 
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

    
    if (isFutureDate(currentDate)) {
      cell.classList.add('future');
    }

    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-num';
    dayNumber.textContent = dayNum;
    cell.appendChild(dayNumber);

    
    if (state.showAllHabits && state.habits.length > 0) {
      
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'dots';
      
      
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
      
      const habit = findHabit(state.selectedHabitId);
      if (habit && habit.checks[dateStr]) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.background = habit.color;
        cell.appendChild(dot);
        cell.classList.add('marked');
      }
    }

    cell.addEventListener('click', () => handleDayClick(dateStr, cell, currentDate));
    calendarEl.appendChild(cell);
  }
}


function handleDayClick(dateStr, cell, date) {
  
  if (isFutureDate(date)) {
    showToast('Этот день еще не наступил :(', 2000);
    return;
  }

  if (state.showAllHabits) {
    
    const completedHabits = state.habits.filter(habit => habit.checks[dateStr]);
    const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    
    if (completedHabits.length > 0) {
      const habitNames = completedHabits.map(h => h.name).join(', ');
      showToast(`${formattedDate} Выполнено: ${habitNames}`, 3000);
    } else {
      showToast(`${formattedDate}: Вы не выполнили ни одной привычки :(`);
    }
    return;
  }

  if (!state.selectedHabitId) {
    showToast('Выберите привычку слева');
    return;
  }

  const habit = findHabit(state.selectedHabitId);
  if (!habit) return;

  
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


function renderSelectedHabitInfo() {
  if (state.showAllHabits) {

    const stats = getStats(null, state.statsPeriod);
    
    selectedHabitInfo.innerHTML = `
      <div class="all-habits-sticker">
        <img src="images/star.svg" alt="Все привычки" class="sticker-image">
      </div>
      <div>
        <div style="font-weight:700; color:var(--accent)">Все привычки</div>
        <div style="font-size:12px;color:var(--muted)">
          Средний прогресс: ${stats.percent}%
        </div>
      </div>
    `;
    
    viewModeText.textContent = 'Все привычки';
    updateProgress(stats.percent, '#00BCD4');
    updateStatsDisplay(stats);
    
  } else if (state.selectedHabitId) {
    
    const habit = findHabit(state.selectedHabitId);
    if (!habit) return;

    const stats = getStats(habit, state.statsPeriod);
    
    selectedHabitInfo.innerHTML = `
      <div class="habit-icon" style="background:${habit.color}">
        ${ICONS[habit.icon].replace('class="icon"', 'class="icon icon-white"') || ICONS.star}
      </div>
      <div>
        <div style="font-weight:600">${habit.name}</div>
        <div style="font-size:12px;color:var(--muted)">
          ${stats.completed}/${stats.total} дней (${stats.percent}%)
        </div>
      </div>
    `;
    
    viewModeText.textContent = habit.name;
    updateProgress(stats.percent, habit.color);
    updateStatsDisplay(stats);
    
  } else {
    
    selectedHabitInfo.innerHTML = `<small>Выберите привычку или включите режим просмотра всех привычек</small>`;
    viewModeText.textContent = '—';
    updateProgress(0, '#00BCD4');
    updateStatsDisplay({completed: 0, total: 0, percent: 0});
  }
}


function setupTabButtons() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      
      
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      
      state.statsPeriod = period;
      saveState();
      renderAll();
    });
  });
}


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


function updateStatsDisplay(stats) {
  weekPercentEl.textContent = `${stats.percent}%`;
  
  if (state.showAllHabits) {
    
    totalChecksEl.textContent = `${stats.completed}/${stats.total}`;
  } else {
    
    totalChecksEl.textContent = `${stats.completed}/${stats.total}`;
  }
}


function updateProgress(percent, color) {
  const p = Math.max(0, Math.min(100, percent));
  const dash = `${p},100`;
  
  progressCircle.setAttribute('stroke-dasharray', dash);
  progressCircle.style.stroke = color || 'var(--primary)';
  progressText.textContent = p + '%';
}


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


function renderAll() {
  renderHabits();
  renderCalendar();
  renderSelectedHabitInfo();
}


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
  
  
  const firstIcon = iconChoicesEl.querySelector('.icon-choice');
  if (firstIcon) firstIcon.classList.add('selected');
}


let toastTimer = null;
function showToast(text, duration = 2000) {
  
  if (!toastEl.classList.contains('hidden')) {
    toastEl.classList.add('hidden');
    setTimeout(() => {
      showNewToast(text, duration);
    }, 300);
  } else {
    showNewToast(text, duration);
  }
}

function showNewToast(text, duration) {
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, duration);
}


function applyTheme(theme) {
  document.body.className = theme;
  localStorage.setItem('ht_theme', theme);
}

function loadTheme() {
  const saved = localStorage.getItem('ht_theme') || 'light';
  applyTheme(saved);
}


function navigateMonth(direction) {
  state.viewMonth += direction;
  if (state.viewMonth < 0) {
    state.viewMonth = 11;
    state.viewYear--;
  } else if (state.viewMonth > 11) {
    state.viewMonth = 0;
    state.viewYear++;
  }
  renderAll(); 
}


function exportToPNG() {
  showToast('Создаем изображение...', 1500);
  
  setTimeout(() => {
    const calendarGrid = document.querySelector('.calendar-grid');
    const calendarHeader = document.querySelector('.calendar-header');
    
    
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
      position: fixed;
      left: -10000px;
      top: -10000px;
      width: ${calendarGrid.offsetWidth}px;
      background: ${getComputedStyle(document.body).backgroundColor};
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;
    
    
    const headerClone = calendarHeader.cloneNode(true);
    const gridClone = calendarGrid.cloneNode(true);
    
    
    const buttons = headerClone.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());
    
    exportContainer.appendChild(headerClone);
    exportContainer.appendChild(gridClone);
    document.body.appendChild(exportContainer);
    
    html2canvas(exportContainer, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: 2,
      useCORS: true,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `calendar-${formatDate(new Date())}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      
      document.body.removeChild(exportContainer);
      showToast('Календарь экспортирован!');
    }).catch(error => {
      document.body.removeChild(exportContainer);
      console.error('Export error:', error);
      showToast('Ошибка экспорта');
    });
  }, 100);
}


function setupEventListeners() {
  
  addHabitBtn.addEventListener('click', () => {
    habitTitleInput.value = '';
    habitColorInput.value = '#8078D8';
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

  
  prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
  nextMonthBtn.addEventListener('click', () => navigateMonth(1));

  
  toggleViewMode.addEventListener('click', toggleAllHabitsView);

  
  setupTabButtons();

  
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

  
  themeToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
  });

  
  exportBtn.addEventListener('click', exportToPNG);

  
  addHabitModal.addEventListener('click', (e) => {
    if (e.target === addHabitModal) {
      addHabitModal.classList.add('hidden');
    }
  });

  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !addHabitModal.classList.contains('hidden')) {
      addHabitModal.classList.add('hidden');
    }
  });
}


function initApp() {
  loadTheme();
  loadState();
  renderIconChoices();
  setupEventListeners();
  updateStatsPeriodText();
  renderAll();
  
  
  toggleViewMode.textContent = state.showAllHabits ? 
    'Показать одну привычку' : 'Показать все привычки';
  
  if (state.showAllHabits) {
    toggleViewMode.classList.add('active');
  }
}


document.addEventListener('DOMContentLoaded', initApp);