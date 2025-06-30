
"use strict";

// =========================
// Configuration
// =========================

const SETTINGS = {
  MAIN_TOTAL: 48,
  MAIN_COUNT: 6,
  BONUS_TOTAL: 5,
  BONUS_COUNT: 1,
  ODD_COUNT: 3,
  EVEN_COUNT: 3,
  FLASH_TIMEOUT_MS: 7000
};

// =========================
// DOM Elements
// =========================

let elements = {};
function cacheDOM() {
  elements = {
    numbersLabel: document.getElementById("numbersLabel"),
    additionalNumbersLabel: document.getElementById("additionalNumbersLabel"),
    generateButton: document.getElementById("generateButton"),
    resetButton: document.getElementById("resetButton"),
    noConsecutiveCheckbox: document.getElementById("noConsecutiveNumbersCheckbox"),
    oddEvenCheckbox: document.getElementById("enforceOddEvenCheckbox"),
    mainCountInput: document.getElementById("mainCountInput"),
    mainTotalInput: document.getElementById("mainTotalInput"),
    bonusCountInput: document.getElementById("bonusCountInput"),
    bonusTotalInput: document.getElementById("bonusTotalInput"),
    flashContainer: document.getElementById("flashContainer"),
    settingsSummary: document.getElementById("settingsSummary"),
  };
}

// =========================
// Utility Functions
// =========================

const isEven = (n) => n % 2 === 0;
const isOdd = (n) => !isEven(n);
const generateRandom = (max) => Math.floor(Math.random() * max) + 1;
const countMatching = (arr, fn) => arr.filter(fn).length;

function isConsecutive(num, set) {
  return set.includes(num - 1) || set.includes(num + 1);
}

function showFlash(msg, type = "info", timeout = SETTINGS.FLASH_TIMEOUT_MS) {
  if (!elements.flashContainer) return

  const div = document.createElement("div");
  div.className = `flash ${type}`;
  div.textContent = msg;

  elements.flashContainer.appendChild(div);

  // Auto-remove after timeout
  setTimeout(() => {
    div.classList.add("removing");
    setTimeout(() => div.remove(), 1000); // match transition
  }, timeout);
}

function updateSummary() {
  const parts = [
    `🎯 ${SETTINGS.MAIN_COUNT} numbers from 1–${SETTINGS.MAIN_TOTAL}`,
    SETTINGS.BONUS_COUNT > 0 ? `🎁 ${SETTINGS.BONUS_COUNT} bonus from 1–${SETTINGS.BONUS_TOTAL}` : null,
    elements.oddEvenCheckbox.checked ? "⚖️ balanced odd/even" : "♾️ any mix",
    elements.noConsecutiveCheckbox.checked ? "🚫 no consecutives" : "🔗 consecutives allowed",
  ].filter(Boolean);

  elements.settingsSummary.innerText = parts.join(", ");
}

function resetFormToDefaults() {
  elements.mainTotalInput.value = 48;
  elements.mainCountInput.value = 6;
  elements.bonusTotalInput.value = 5;
  elements.bonusCountInput.value = 1;
  elements.oddEvenCheckbox.checked = true;
  elements.noConsecutiveCheckbox.checked = true;
  elements.numbersLabel.innerText = "";
  elements.additionalNumbersLabel.innerText = "";
  elements.flashContainer.innerHTML = "";
  updateSummary();
}

// =========================
// Core Logic
// =========================

function isValidMainNumber(num, selected) {
  if (selected.includes(num)) return false;

  if (elements.oddEvenCheckbox.checked) {
    if (isEven(num) && countMatching(selected, isEven) >= SETTINGS.EVEN_COUNT) return false;
    if (isOdd(num) && countMatching(selected, isOdd) >= SETTINGS.ODD_COUNT) return false;
  }

  if (num === 1 && selected.includes(2)) return false;
  if (num === SETTINGS.MAIN_TOTAL && selected.includes(num - 1)) return false;
  if (elements.noConsecutiveCheckbox.checked && isConsecutive(num, selected)) return false;

  return true;
}

function generateMainNumbers() {
  if (SETTINGS.MAIN_COUNT === SETTINGS.MAIN_TOTAL) {
    showFlash("🧠 All available numbers selected — constraints skipped.");
    return Array.from({ length: SETTINGS.MAIN_TOTAL }, (_, i) => i + 1);
  }

  const result = [];
  let attempts = 0;
  const maxAttempts = 5000;

  while (result.length < SETTINGS.MAIN_COUNT && attempts < maxAttempts) {
    const num = generateRandom(SETTINGS.MAIN_TOTAL);
    if (isValidMainNumber(num, result)) result.push(num);
    attempts++;
  }

  if (result.length < SETTINGS.MAIN_COUNT) {
    showFlash("⚠️ Couldn't generate enough valid numbers. Try reducing constraints.", "warning");
  }

  return result.sort((a, b) => a - b);
}

function generateBonusNumbers() {
  const result = [];
  if (SETTINGS.BONUS_COUNT === SETTINGS.BONUS_TOTAL) {
    showFlash("🧠 All bonus numbers selected — skipping random generation.");
    return Array.from({ length: SETTINGS.BONUS_TOTAL }, (_, i) => i + 1);
  }

  while (result.length < SETTINGS.BONUS_COUNT) {
    const num = generateRandom(SETTINGS.BONUS_TOTAL);
    if (!result.includes(num)) result.push(num);
  }

  return result.sort((a, b) => a - b);
}

// =========================
// Input Handling & Validation
// =========================

function sanitizeInputs() {
  elements.flashContainer.innerHTML = "";

  SETTINGS.MAIN_TOTAL = parseAndValidateInput(elements.mainTotalInput, 48, 1, Infinity, "main range");
  SETTINGS.MAIN_COUNT = parseAndValidateInput(elements.mainCountInput, 6, 1, SETTINGS.MAIN_TOTAL, "main numbers");
  SETTINGS.BONUS_TOTAL = parseAndValidateInput(elements.bonusTotalInput, 5, 1, Infinity, "bonus range");
  SETTINGS.BONUS_COUNT = parseAndValidateInput(elements.bonusCountInput, 1, 0, SETTINGS.BONUS_TOTAL, "bonus numbers");

  SETTINGS.ODD_COUNT = Math.floor(SETTINGS.MAIN_COUNT / 2);
  SETTINGS.EVEN_COUNT = SETTINGS.MAIN_COUNT - SETTINGS.ODD_COUNT;

  const maxAvoidable = Math.floor((SETTINGS.MAIN_TOTAL + 1) / 2);
  if (SETTINGS.MAIN_COUNT > maxAvoidable) {
    elements.noConsecutiveCheckbox.checked = false;
    showFlash("ℹ️ Too many numbers to avoid consecutives — allowing consecutive numbers.");
  } else {
    elements.noConsecutiveCheckbox.disabled = false;
  }
}

/**
 * Parses and validates a number input element.
 * If the input is invalid (NaN, too low, or too high), it resets the value
 * and shows a warning flash message.
 *
 * @param {HTMLElement} inputEl - The <input> element to validate.
 * @param {number} defaultValue - Fallback to use if input is invalid.
 * @param {number} min - Minimum acceptable value (default: 1).
 * @param {number} max - Maximum acceptable value (default: Infinity).
 * @param {string} label - Label used in flash message.
 * @returns {number} - A valid number after validation.
 */
function parseAndValidateInput(inputEl, defaultValue, min = 1, max = Infinity, label = "value") {
  // Convert string to integer using base 10 (decimal)
  let value = parseInt(inputEl.value, 10);

  if (isNaN(value) || value < min) {
    // If input is not a number or too small
    value = defaultValue;
    inputEl.value = defaultValue;
    showFlash(`⚠️ Invalid ${label}. Defaulting to ${defaultValue}.`, "warning");
  } else if (value > max) {
    // If input is too large
    value = max;
    inputEl.value = max;
    showFlash(`⚠️ Too many ${label}. Limited to ${max}.`, "warning");
  }

  return value;
}

// =========================
// Generation Flow
// =========================

function generate() {
  sanitizeInputs();
  const main = generateMainNumbers();
  const bonus = generateBonusNumbers();
  updateDisplay(main, bonus);
}

function updateDisplay(main, bonus) {
  elements.numbersLabel.innerText = main.join(" ");
  elements.additionalNumbersLabel.innerText = bonus.length ? `Bonus: ${bonus.join(" ")}` : "";
  updateSummary();
}

// =========================
// Init
// =========================

document.addEventListener("DOMContentLoaded", () => {
  cacheDOM();

  document.getElementById("numbersForm").addEventListener("submit", (e) => {
    e.preventDefault();
    generate();
  });

  elements.generateButton.addEventListener("click", generate);
  elements.resetButton.addEventListener("click", resetFormToDefaults);

  generate();
});
