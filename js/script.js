/** --------------------------
 *      CONFIGURATION
 * --------------------------- */
let EXAM_DURATION_MIN = 60;  // Default exam duration in minutes
const WARN_MIN = 15;         // Time in minutes to show the 'warning' state
const DANGER_MIN = 5;        // Time in minutes to show the 'danger' state

/** --------------------------
 *      STATE MANAGEMENT
 * --------------------------- */
let totalSecondsInitial; // Initial timer duration in seconds
let remainingSeconds;    // Countdown value in seconds
let elapsedSeconds = 0;  // Count-up value in seconds
let timerId = null;      // Holds the setInterval reference
let isPaused = true;     // Timer starts paused
let hasStarted = false;  // Tracks if the timer has been started

// DOM Elements
const clockEl = document.getElementById('clock');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const fsBtn = document.getElementById('fsBtn');
const examTitle = document.querySelector('header h1');
const subtitle = document.querySelector('header .subtitle');
const rulesList = document.querySelector('.rules');
const currentDateEl = document.getElementById('currentDate');
const currentTimeEl = document.getElementById('currentTime');
const elapsedTimeEl = document.getElementById('elapsedTime');
const settingsModal = document.getElementById('settingsModal');
const progressBar = document.getElementById('progressBar');

/** --------------------------
 *      UTILITY FUNCTIONS
 * --------------------------- */
// Pads a number with a leading zero.
const pad = (n) => n.toString().padStart(2, '0');

/** --------------------------
 *    PERSISTENCE FUNCTIONS
 * --------------------------- */
// Saves exam data to localStorage.
function saveToLocalStorage() {
  const examData = {
    title: examTitle.textContent,
    subtitle: subtitle.textContent,
    duration: EXAM_DURATION_MIN,
    rules: Array.from(rulesList.children).map(li => li.innerHTML)
  };
  localStorage.setItem('examData', JSON.stringify(examData));
}
// Loads exam data from localStorage.
function loadFromLocalStorage() {
  try {
    const examData = JSON.parse(localStorage.getItem('examData'));
    if (examData) {
      examTitle.textContent = examData.title;
      subtitle.textContent = examData.subtitle;
      EXAM_DURATION_MIN = examData.duration;
      rulesList.innerHTML = examData.rules.map(rule => `<li>${rule}</li>`).join('');
      initializeTimer();
    }
  } catch (error) {
    console.error('Error loading saved data:', error);
  }
}

/** --------------------------
 *      TIMER CORE FUNCTIONS
 * --------------------------- */
// Initializes or resets the timer state.
function initializeTimer() {
  totalSecondsInitial = EXAM_DURATION_MIN * 60;
  remainingSeconds = totalSecondsInitial;
  elapsedSeconds = 0;
  render(remainingSeconds);
}

// Renders the timer UI.
function render(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  clockEl.textContent = `${pad(m)}:${pad(s)}`;

  const percentage = (seconds / totalSecondsInitial) * 100;
  progressBar.style.width = `${percentage}%`;

  const elapsedM = Math.floor(elapsedSeconds / 60);
  const elapsedS = elapsedSeconds % 60;
  elapsedTimeEl.textContent = `Elapsed: ${pad(elapsedM)}:${pad(elapsedS)}`;

  clockEl.classList.remove('warn', 'danger', 'pulse');
  progressBar.style.backgroundColor = 'var(--accent)';

  if (seconds <= DANGER_MIN * 60) {
    if (seconds === DANGER_MIN * 60) {
      beep(440, 0.3);
      setTimeout(() => beep(440, 0.3), 500);
    }
    clockEl.classList.add('danger', 'pulse');
    progressBar.style.backgroundColor = 'var(--danger)';
  } else if (seconds <= WARN_MIN * 60) {
    if (seconds === WARN_MIN * 60) {
      beep(880, 0.2);
    }
    clockEl.classList.add('warn');
    progressBar.style.backgroundColor = 'var(--warn)';
  }
  document.title = `${pad(m)}:${pad(s)} — Exam Countdown Timer`;
}

// Manages the timer's 1-second interval.
function startInterval() {
  if (timerId) return;
  timerId = setInterval(() => {
    if (isPaused) return;
    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      render(0);
      document.title = 'Time is up!';
      try {
        beep(880, 0.2);
        setTimeout(() => beep(660, 0.2), 300);
        setTimeout(() => beep(440, 0.3), 600);
      } catch {}
      startPauseBtn.textContent = 'Start Exam';
      startPauseBtn.classList.add('primary');
      hasStarted = false;
      isPaused = true;
      return;
    }
    remainingSeconds -= 1;
    elapsedSeconds += 1;
    render(remainingSeconds);
  }, 1000);
}

/** --------------------------
 *      CONTROL FUNCTIONS
 * --------------------------- */
// Starts the timer.
function start() {
  hasStarted = true;
  isPaused = false;
  startPauseBtn.textContent = 'Pause';
  startPauseBtn.classList.remove('primary');
  startInterval();
}
// Pauses or resumes the timer.
function pauseResume() {
  if (!hasStarted) return;
  isPaused = !isPaused;
  startPauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  if (!timerId) startInterval();
}
// Resets the timer.
function reset() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  remainingSeconds = totalSecondsInitial;
  elapsedSeconds = 0;
  isPaused = true;
  hasStarted = false;
  render(remainingSeconds);
  elapsedTimeEl.textContent = 'Elapsed: 00:00';
  startPauseBtn.textContent = 'Start Exam';
  startPauseBtn.classList.add('primary');
}

/** --------------------------
 *    DATE & TIME DISPLAY
 * --------------------------- */
// Updates the current date and time.
function updateCurrentDateTime() {
  const now = new Date();
  currentDateEl.textContent = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  currentTimeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true });
}

/** --------------------------
 *      AUDIO FEEDBACK
 * --------------------------- */
// Generates a beep sound.
function beep(freq = 880, durationSec = 0.2) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const ac = new AC();
  const o = ac.createOscillator();
  const g = ac.createGain();

  o.type = 'sine';
  o.frequency.value = freq;
  o.connect(g);
  g.connect(ac.destination);

  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.01);
  o.start();

  setTimeout(() => {
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.01);
    o.stop(ac.currentTime + 0.04);
    ac.close();
  }, durationSec * 1000);
}

// Toggles fullscreen mode.
async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    try { await document.documentElement.requestFullscreen(); } catch {}
  } else {
    try { await document.exitFullscreen(); } catch {}
  }
}

/** --------------------------
 *    INLINE EDITING FUNCTIONS
 * --------------------------- */
// Makes an element's text editable on double-click.
function makeEditable(element, isMultiLine = false) {
  element.addEventListener('dblclick', () => {
    if (isMultiLine && element.classList.contains('rules')) {
      const currentRules = Array.from(element.children).map(li => li.innerHTML).join('\n');
      const textarea = document.createElement('textarea');
      textarea.value = currentRules;
      textarea.style.width = '100%';
      textarea.style.height = `${element.offsetHeight}px`;
      textarea.style.fontSize = 'clamp(1rem, 1.2vw + 0.5rem, 1.2rem)';
      textarea.style.fontFamily = 'inherit';
      textarea.style.background = 'rgba(255,255,255,0.1)';
      textarea.style.border = '1px solid var(--accent)';
      textarea.style.color = 'inherit';
      textarea.style.padding = '8px';
      textarea.style.borderRadius = '8px';
      textarea.style.resize = 'none';

      element.style.display = 'none';
      element.parentNode.insertBefore(textarea, element.nextSibling);
      textarea.focus();

      const saveRules = () => {
        const newRules = textarea.value.split('\n').filter(rule => rule.trim()).map(rule => `<li>${rule.trim()}</li>`).join('');
        element.innerHTML = newRules;
        element.style.display = 'grid';
        textarea.remove();
        saveToLocalStorage();
      };

      textarea.addEventListener('blur', saveRules);
      textarea.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); textarea.blur(); } });

    } else {
      const currentText = element.textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.style.width = '100%';
      input.style.fontSize = window.getComputedStyle(element).fontSize;
      input.style.fontFamily = 'inherit';
      input.style.background = 'rgba(255,255,255,0.1)';
      input.style.border = '1px solid var(--accent)';
      input.style.color = 'inherit';
      input.style.padding = '4px 8px';
      input.style.borderRadius = '4px';

      element.style.display = 'none';
      element.parentNode.insertBefore(input, element);
      input.focus();

      const save = () => {
        element.textContent = input.value.trim() || currentText;
        element.style.display = '';
        input.remove();
        saveToLocalStorage();
      };

      input.addEventListener('blur', save);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); save(); } });
    }
  });
}

/** --------------------------
 *    SETTINGS MODAL FUNCTIONS
 * --------------------------- */
// Opens the settings modal.
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const durationInput = document.getElementById('examDuration');
  const rulesInput = document.getElementById('examRules');

  durationInput.value = EXAM_DURATION_MIN;
  rulesInput.value = Array.from(rulesList.children)
    .map(li => li.textContent)
    .join('\n');
  
  modal.classList.add('active');
}

// Closes the settings modal.
function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('active');
}

// Parses duration input ("30" or "1:30") into minutes.
function parseDurationInput(input) {
  input = input.trim();
  
  if (input.includes(':')) {
    const [minutes, seconds] = input.split(':').map(num => parseInt(num, 10));
    if (isNaN(minutes) || isNaN(seconds) || seconds >= 60 || minutes < 0 || seconds < 0) {
      return null;
    }
    return minutes + (seconds / 60);
  } else {
    const minutes = parseInt(input, 10);
    return isNaN(minutes) || minutes < 0 ? null : minutes;
  }
}

// Saves settings from the modal.
function saveSettings() {
  const durationInput = document.getElementById('examDuration');
  const rulesInput = document.getElementById('examRules');
  
  const duration = parseDurationInput(durationInput.value);
  if (duration === null) {
    alert('Please enter a valid time in format "minutes" or "minutes:seconds" (e.g., "30" or "30:00" or "0:30")');
    return;
  }
  
  EXAM_DURATION_MIN = duration;
  const rules = rulesInput.value
    .split('\n')
    .filter(rule => rule.trim())
    .map(rule => `<li>${rule.trim()}</li>`)
    .join('');
  
  rulesList.innerHTML = rules;
  initializeTimer();
  saveToLocalStorage();
  closeSettingsModal();
}

/** --------------------------
 *      EVENT LISTENERS
 * --------------------------- */
startPauseBtn.addEventListener('click', () => {
  if (!hasStarted) start(); else pauseResume();
});

resetBtn.addEventListener('click', reset);
fsBtn.addEventListener('click', toggleFullscreen);
clockEl.addEventListener('dblclick', openSettingsModal);

makeEditable(examTitle);
makeEditable(subtitle);
makeEditable(rulesList, true);

/** --------------------------
 *      INITIALIZATION
 * --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  initializeTimer();
  
  updateCurrentDateTime();
  setInterval(updateCurrentDateTime, 1000);

  document.getElementById('currentYear').textContent = new Date().getFullYear();
});