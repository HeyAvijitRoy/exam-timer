// Configuration
let EXAM_DURATION_MIN = 60;  // default duration if not set
const WARN_MIN = 15;         // orange at <= 10 minutes
const DANGER_MIN = 5;        // red & pulse at <= 5 minutes

// State
let totalSecondsInitial;
let remainingSeconds;
let timerId = null;
let isPaused = true;     // start paused
let hasStarted = false;  // not started until Start pressed

// DOM Elements
const clockEl = document.getElementById('clock');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const fsBtn = document.getElementById('fsBtn');
const examTitle = document.querySelector('header h1');
const subtitle = document.querySelector('header .subtitle');
const rulesList = document.querySelector('.rules');
const settingsModal = document.getElementById('settingsModal');

// Utility Functions
const pad = (n) => n.toString().padStart(2, '0');

function saveToLocalStorage() {
  const examData = {
    title: examTitle.textContent,
    subtitle: subtitle.textContent,
    duration: EXAM_DURATION_MIN,
    rules: Array.from(rulesList.children).map(li => li.innerHTML)
  };
  localStorage.setItem('examData', JSON.stringify(examData));
}

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

// Timer Functions
function initializeTimer() {
  totalSecondsInitial = EXAM_DURATION_MIN * 60;
  remainingSeconds = totalSecondsInitial;
  render(remainingSeconds);
}

function render(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  clockEl.textContent = `${pad(m)}:${pad(s)}`;

  clockEl.classList.remove('warn', 'danger', 'pulse');
  
  // Warning sounds and visual indicators
  if (seconds <= DANGER_MIN * 60) {
    if (seconds === DANGER_MIN * 60) { // Exactly at danger threshold
      beep(440, 0.3); // Lower pitched warning
      setTimeout(() => beep(440, 0.3), 500);
    }
    clockEl.classList.add('danger', 'pulse');
  } else if (seconds <= WARN_MIN * 60) {
    if (seconds === WARN_MIN * 60) { // Exactly at warning threshold
      beep(880, 0.2); // Higher pitched warning
    }
    clockEl.classList.add('warn');
  }

  document.title = `${pad(m)}:${pad(s)} — Exam Countdown`;
}

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
        // Final alarm - three descending beeps
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
    render(remainingSeconds);
  }, 1000);
}

function start() {
  hasStarted = true;
  isPaused = false;
  startPauseBtn.textContent = 'Pause';
  startPauseBtn.classList.remove('primary');
  startInterval();
}

function pauseResume() {
  if (!hasStarted) return;
  isPaused = !isPaused;
  startPauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  if (!timerId) startInterval();
}

function reset() {
  remainingSeconds = totalSecondsInitial;  // Reset to configured duration instead of 0
  isPaused = true;
  hasStarted = false;
  render(remainingSeconds);
  startPauseBtn.textContent = 'Start Exam';
  startPauseBtn.classList.add('primary');
}

// Audio Functions
function beep(freq = 880, durationSec = 0.2) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ac = new AC();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.01);
  o.start();
  setTimeout(() => {
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.01);
    o.stop(ac.currentTime + 0.04);
    ac.close();
  }, durationSec * 1000);
}

// Fullscreen Functions
async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    try { await document.documentElement.requestFullscreen(); } catch {}
  } else {
    try { await document.exitFullscreen(); } catch {}
  }
}

// Editable Elements Functions
function makeEditable(element) {
  element.addEventListener('dblclick', () => {
    const currentText = element.textContent;
    const input = document.createElement('input');
    input.value = currentText;
    input.style.width = '100%';
    input.style.fontSize = window.getComputedStyle(element).fontSize;
    input.style.fontFamily = window.getComputedStyle(element).fontFamily;
    input.style.background = 'rgba(255,255,255,0.1)';
    input.style.border = '1px solid rgba(255,255,255,0.2)';
    input.style.color = 'inherit';
    input.style.padding = '4px 8px';
    input.style.borderRadius = '4px';

    element.textContent = '';
    element.appendChild(input);
    input.focus();

    function save() {
      const newText = input.value.trim();
      if (newText) {
        element.textContent = newText;
        saveToLocalStorage();
      } else {
        element.textContent = currentText;
      }
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      }
      if (e.key === 'Escape') {
        element.textContent = currentText;
      }
    });
  });
}

// Settings Modal Functions
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

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('active');
}

function parseDurationInput(input) {
  // Remove any whitespace and ensure the input is trimmed
  input = input.trim();
  
  // Check if input contains ":"
  if (input.includes(':')) {
    const [minutes, seconds] = input.split(':').map(num => parseInt(num, 10));
    if (isNaN(minutes) || isNaN(seconds) || seconds >= 60 || minutes < 0 || seconds < 0) {
      return null; // Invalid input
    }
    return minutes + (seconds / 60);
  } else {
    // If no ":", treat as minutes
    const minutes = parseInt(input, 10);
    return isNaN(minutes) || minutes < 0 ? null : minutes;
  }
}

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

// Event Listeners
startPauseBtn.addEventListener('click', () => {
  if (!hasStarted) start(); else pauseResume();
});

resetBtn.addEventListener('click', reset);
fsBtn.addEventListener('click', toggleFullscreen);
clockEl.addEventListener('dblclick', openSettingsModal);

// Make elements editable
makeEditable(examTitle);
makeEditable(subtitle);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  initializeTimer();
  
  // Set current year in footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
});