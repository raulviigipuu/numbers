
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

function showFlash(msg, type = "info") {
  if (!elements.flashContainer) return;
  elements.flashContainer.innerHTML = "";
  const div = document.createElement("div");
  div.className = `flash ${type}`;
  div.textContent = msg;
  elements.flashContainer.appendChild(div);
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

  let mainTotal = parseInt(elements.mainTotalInput.value, 10);
  if (isNaN(mainTotal) || mainTotal <= 0) {
    mainTotal = 48;
    elements.mainTotalInput.value = 48;
    showFlash("⚠️ Invalid main range. Defaulting to 48.", "warning");
  }
  SETTINGS.MAIN_TOTAL = mainTotal;

  let mainCount = parseInt(elements.mainCountInput.value, 10);
  if (isNaN(mainCount) || mainCount <= 0) {
    mainCount = 6;
    elements.mainCountInput.value = 6;
    showFlash("⚠️ Invalid number entered. Defaulting to 6.");
  } else if (mainCount > mainTotal) {
    mainCount = mainTotal;
    elements.mainCountInput.value = mainTotal;
    showFlash(`⚠️ Too many numbers requested. Limited to ${mainTotal}.`, "warning");
  }
  SETTINGS.MAIN_COUNT = mainCount;

  let bonusTotal = parseInt(elements.bonusTotalInput.value, 10);
  if (isNaN(bonusTotal) || bonusTotal <= 0) {
    bonusTotal = 5;
    elements.bonusTotalInput.value = 5;
    showFlash("⚠️ Invalid bonus range. Defaulting to 5.", "warning");
  }
  SETTINGS.BONUS_TOTAL = bonusTotal;

  let bonusCount = parseInt(elements.bonusCountInput.value, 10);
  if (isNaN(bonusCount) || bonusCount < 0) {
    bonusCount = 1;
    elements.bonusCountInput.value = 1;
    showFlash("⚠️ Invalid bonus count. Defaulting to 1.", "warning");
  } else if (bonusCount > bonusTotal) {
    bonusCount = bonusTotal;
    elements.bonusCountInput.value = bonusTotal;
    showFlash(`⚠️ Too many bonus numbers requested. Limited to ${bonusTotal}.`, "warning");
  }
  SETTINGS.BONUS_COUNT = bonusCount;

  // Configure odd/even ratio
  SETTINGS.ODD_COUNT = Math.floor(mainCount / 2);
  SETTINGS.EVEN_COUNT = mainCount - SETTINGS.ODD_COUNT;

  // Consecutive limit check
  const maxAvoidable = Math.floor((SETTINGS.MAIN_TOTAL + 1) / 2);
  if (mainCount > maxAvoidable) {
    elements.noConsecutiveCheckbox.checked = false;
    showFlash("ℹ️ Too many numbers to avoid consecutives — allowing consecutive numbers.");
  } else {
    elements.noConsecutiveCheckbox.disabled = false;
  }
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
  generate();
});
