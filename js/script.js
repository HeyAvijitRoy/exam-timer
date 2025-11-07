/** --------------------------
 *      CONFIGURATION
 * --------------------------- */
let EXAM_DURATION_MIN = 60;  // Default duration in minutes. Can be changed in settings.
const WARN_MIN = 15;         // Time in minutes to show the 'warning' state (e.g., orange color).
const DANGER_MIN = 5;        // Time in minutes to show the 'danger' state (e.g., red color and pulse).

/** --------------------------
 *      STATE MANAGEMENT
 * --------------------------- */
let totalSecondsInitial; // The initial total seconds of the timer, set from EXAM_DURATION_MIN.
let remainingSeconds;    // The countdown value, in seconds.
let elapsedSeconds = 0;  // The count-up value, in seconds.
let timerId = null;      // Holds the reference to the setInterval timer.
let isPaused = true;     // Timer starts in a paused state.
let hasStarted = false;  // Tracks if the 'Start' button has been pressed at least once.

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

/** --------------------------
 *      UTILITY FUNCTIONS
 * --------------------------- */
// Pads a number with a leading zero if it's less than 10.
const pad = (n) => n.toString().padStart(2, '0');

/** --------------------------
 *    PERSISTENCE FUNCTIONS
 * --------------------------- */
// Saves the current exam title, subtitle, duration, and rules to localStorage.
function saveToLocalStorage() {
  const examData = {
    title: examTitle.textContent,
    subtitle: subtitle.textContent,
    duration: EXAM_DURATION_MIN,
    rules: Array.from(rulesList.children).map(li => li.innerHTML)
  };
  localStorage.setItem('examData', JSON.stringify(examData));
}
// Loads and applies saved data from localStorage on page load.
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
  } catch (error) { // Catches potential JSON parsing errors.
    console.error('Error loading saved data:', error);
  }
}

/** --------------------------
 *      TIMER CORE FUNCTIONS
 * --------------------------- */
// Sets or resets the timer's initial state based on the configured duration.
function initializeTimer() {
  totalSecondsInitial = EXAM_DURATION_MIN * 60;
  remainingSeconds = totalSecondsInitial;
  elapsedSeconds = 0;
  render(remainingSeconds);
}

// Updates the UI with the current time, elapsed time, and visual states.
function render(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  clockEl.textContent = `${pad(m)}:${pad(s)}`;

  // Update elapsed time display
  const elapsedM = Math.floor(elapsedSeconds / 60);
  const elapsedS = elapsedSeconds % 60;
  elapsedTimeEl.textContent = `Elapsed: ${pad(elapsedM)}:${pad(elapsedS)}`;

  clockEl.classList.remove('warn', 'danger', 'pulse');
  
  // Apply visual styles and play sounds based on remaining time.
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
  // Update the browser tab title with the current time.
  document.title = `${pad(m)}:${pad(s)} — Exam Countdown`;
}

// Manages the main 1-second interval for the timer.
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
    elapsedSeconds += 1;
    render(remainingSeconds);
  }, 1000);
}

/** --------------------------
 *      CONTROL FUNCTIONS
 * --------------------------- */
// Handles the initial start of the timer.
function start() {
  hasStarted = true;
  isPaused = false;
  startPauseBtn.textContent = 'Pause';
  startPauseBtn.classList.remove('primary');
  startInterval();
}
// Toggles the paused state of the timer.
function pauseResume() {
  if (!hasStarted) return;
  isPaused = !isPaused;
  startPauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  if (!timerId) startInterval();
}
// Resets the timer to its initial state.
function reset() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  remainingSeconds = totalSecondsInitial;  // Reset to configured duration instead of 0
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
// Updates the current date and time display elements.
function updateCurrentDateTime() {
  const now = new Date();
  // Format date as "Month Day, Year" e.g., "November 6, 2025"
  currentDateEl.textContent = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  // Format time as "hh:mm:ss"
  currentTimeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true });
}

/** --------------------------
 *      AUDIO FEEDBACK
 * --------------------------- */
// Generates a beep sound using the Web Audio API for alerts.
function beep(freq = 880, durationSec = 0.2) {
  // Check for browser compatibility.
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  // Create an AudioContext, Oscillator, and Gain node.
  const ac = new AC();
  const o = ac.createOscillator(); // Creates a sound wave.
  const g = ac.createGain();       // Controls the volume.

  o.type = 'sine';            // Type of sound wave.
  o.frequency.value = freq;   // Frequency of the wave (pitch).
  o.connect(g);               // Connect oscillator to gain node.
  g.connect(ac.destination);  // Connect gain node to output (speakers).

  // Ramp up the volume to avoid a "click" sound.
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.01);
  o.start();

  // Schedule the sound to stop after the specified duration.
  setTimeout(() => {
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.01);
    o.stop(ac.currentTime + 0.04);
    ac.close(); // Clean up the AudioContext.
  }, durationSec * 1000);
}

// Toggles fullscreen mode for the browser window.
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
// Allows an element's text to be edited inline by replacing it with an input field.
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

    // Saves the new text or reverts to the old text if the input is empty.
    function save() {
      const newText = input.value.trim();
      if (newText) {
        element.textContent = newText;
        saveToLocalStorage();
      } else {
        element.textContent = currentText;
      }
    }

    // Save on blur (losing focus) or when Enter is pressed.
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

/** --------------------------
 *    SETTINGS MODAL FUNCTIONS
 * --------------------------- */
// Opens the settings modal and pre-fills it with current values.
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const durationInput = document.getElementById('examDuration');
  const rulesInput = document.getElementById('examRules');
  // Pre-fill current settings
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

// Parses a string like "30" or "1:30" into a total number of minutes.
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

// Validates and saves the new settings from the modal.
function saveSettings() {
  const durationInput = document.getElementById('examDuration');
  const rulesInput = document.getElementById('examRules');
  
  const duration = parseDurationInput(durationInput.value);
  if (duration === null) {
    alert('Please enter a valid time in format "minutes" or "minutes:seconds" (e.g., "30" or "30:00" or "0:30")');
    return;
  }
  
  // Update configuration, state, and UI.
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

// Reset button
resetBtn.addEventListener('click', reset);
fsBtn.addEventListener('click', toggleFullscreen);
clockEl.addEventListener('dblclick', openSettingsModal);

// Make elements editable
makeEditable(examTitle);
makeEditable(subtitle);

/** --------------------------
 *      INITIALIZATION
 * --------------------------- */
// Runs when the page content is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  initializeTimer();
  
  // Initialize and update current date/time every second
  updateCurrentDateTime();
  setInterval(updateCurrentDateTime, 1000);

  // Set current year in footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
});