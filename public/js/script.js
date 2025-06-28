"use strict";

// =========================
// Settings
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

let numbersLabel;
let additionalNumbersLabel;
let generateButton;
let noConsecutiveNumbersCheckbox;
let enforceOddEvenCheckbox;
let mainCountInput;
let flashContainer;
let settingsSummary;
let bonusCountInput;
let mainTotalInput;
let bonusTotalInput;

// =========================
// Utility Functions
// =========================

const isEven = (n) => n % 2 === 0;
const isOdd = (n) => !isEven(n);
const generateRandomNumber = (max) => Math.floor(Math.random() * max) + 1;

function countByCondition(arr, conditionFunc) {
  return arr.filter(conditionFunc).length;
}

function showFlash(message, type = "info") {
  if (!flashContainer) return;

  flashContainer.innerHTML = ""; // Clear previous message
  const flash = document.createElement("div");
  flash.className = `flash ${type}`;
  flash.textContent = message;
  flashContainer.appendChild(flash);
}

function updateSummary() {
  const count = SETTINGS.MAIN_COUNT;
  const mainRange = SETTINGS.MAIN_TOTAL;
  const oddEven = enforceOddEvenCheckbox?.checked;
  const noConsecutive = noConsecutiveNumbersCheckbox?.checked;
  const bonusCount = SETTINGS.BONUS_COUNT ?? 1;
  const bonusRange = SETTINGS.BONUS_TOTAL ?? 0;

  const parts = [
    `🎯 ${count} numbers from 1–${mainRange}`,
    bonusCount > 0 ? `🎁 ${bonusCount} bonus from 1–${bonusRange}` : null,
    oddEven ? "⚖️ balanced odd/even" : "♾️ any mix",
    noConsecutive ? "🚫 no consecutives" : "🔗 consecutives allowed",
  ].filter(Boolean);

  settingsSummary.innerText = parts.join(", ");
}

// =========================
// Validation Logic
// =========================

function isConsecutive(num, selected) {
  return selected.includes(num - 1) || selected.includes(num + 1);
}

function isValidNumber(num, selected, settings) {
  if (selected.includes(num)) return false;

  const enforceOddEven = enforceOddEvenCheckbox?.checked ?? true;
  if (enforceOddEven) {
    if (
      isEven(num) &&
      countByCondition(selected, isEven) >= settings.EVEN_COUNT
    )
      return false;
    if (isOdd(num) && countByCondition(selected, isOdd) >= settings.ODD_COUNT)
      return false;
  }

  if (num === 1 && selected.includes(2)) return false;
  if (num === settings.MAIN_TOTAL && selected.includes(num - 1)) return false;

  const noConsecutive = noConsecutiveNumbersCheckbox?.checked ?? true;
  if (noConsecutive && isConsecutive(num, selected)) return false;

  return true;
}

// =========================
// Generator Functions
// =========================
function generateValidMainNumbers(settings) {
  const total = settings.MAIN_TOTAL;
  const count = settings.MAIN_COUNT;

  // Optimization: full set — skip validation, just return sorted 1..N
  if (count === total) {
    showFlash("🧠 All available numbers selected — constraints skipped.");
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const selected = [];
  const maxAttempts = 5000;
  let attempts = 0;

  while (selected.length < count && attempts < maxAttempts) {
    const rand = generateRandomNumber(total);
    if (isValidNumber(rand, selected, settings)) {
      selected.push(rand);
    }
    attempts++;
  }

  if (selected.length < count) {
    showFlash(
      "⚠️ Couldn't generate enough valid numbers. Try reducing constraints.",
      "warning"
    );
  }

  return selected.sort((a, b) => a - b);
}

// =========================
// UI Logic
// =========================

function updateDisplay(mainNumbers, bonusNumbers) {
  numbersLabel.innerText = mainNumbers.join(" ");
  additionalNumbersLabel.innerText =
    bonusNumbers.length > 0 ? `Bonus: ${bonusNumbers.join(" ")}` : "";

  updateSummary();
}

function generate() {
  // Main total
  let mainTotal = parseInt(mainTotalInput.value, 10);
  if (isNaN(mainTotal) || mainTotal <= 0) {
    mainTotal = 48;
    mainTotalInput.value = 48;
    showFlash("⚠️ Invalid main range. Defaulting to 48.", "warning");
  }
  SETTINGS.MAIN_TOTAL = mainTotal;

  // Clear old flash messages
  flashContainer.innerHTML = "";

  // Main numbers
  let mainCount = parseInt(mainCountInput.value, 10);
  if (isNaN(mainCount) || mainCount <= 0) {
    mainCount = 6;
    mainCountInput.value = 6;
    showFlash("⚠️ Invalid number entered. Defaulting to 6.");
  }
  if (mainCount > mainTotal) {
    mainCount = mainTotal;
    mainCountInput.value = mainTotal;
    showFlash(
      `⚠️ Too many numbers requested. Limited to ${mainTotal}.`,
      "warning"
    );
  }
  SETTINGS.MAIN_COUNT = mainCount;

  // Bonus total
  let bonusTotal = parseInt(bonusTotalInput.value, 10);
  if (isNaN(bonusTotal) || bonusTotal <= 0) {
    bonusTotal = 5;
    bonusTotalInput.value = 5;
    showFlash("⚠️ Invalid bonus range. Defaulting to 5.", "warning");
  }
  SETTINGS.BONUS_TOTAL = bonusTotal;

  // Bonus numbers
  let bonusCount = parseInt(bonusCountInput.value, 10);
  if (isNaN(bonusCount) || bonusCount < 0) {
    bonusCount = 1;
    bonusCountInput.value = 1;
    showFlash("⚠️ Invalid bonus count. Defaulting to 1.", "warning");
  } else if (bonusCount > bonusTotal) {
    bonusCount = bonusTotal;
    bonusCountInput.value = bonusTotal;
    showFlash(
      `⚠️ Requested too many bonus numbers. Limited to ${bonusTotal}.`,
      "warning"
    );
  }
  SETTINGS.BONUS_COUNT = bonusCount;

  // --- Odd/Even Handling (always allowed) ---
  const enforceOddEven = enforceOddEvenCheckbox?.checked ?? true;
  if (enforceOddEvenCheckbox) {
    const odd = Math.floor(mainCount / 2);
    const even = mainCount - odd;
    SETTINGS.ODD_COUNT = odd;
    SETTINGS.EVEN_COUNT = even;
  }

  // --- Consecutive Number Logic ---
  const maxAvoidable = Math.floor((SETTINGS.MAIN_TOTAL + 1) / 2);
  // Explanation:
  // It's only possible to avoid consecutive numbers if we leave at least one gap between each.
  // Max count = ceil(total / 2) for fully non-consecutive set.
  if (mainCount > maxAvoidable) {
    noConsecutiveNumbersCheckbox.checked = false;
    showFlash(
      "ℹ️ Too many numbers to avoid consecutives — allowing consecutive numbers."
    );
  } else {
    noConsecutiveNumbersCheckbox.disabled = false;
  }

  const mainNumbers = generateValidMainNumbers(SETTINGS);

  let bonusNumbers = [];

  if (SETTINGS.BONUS_COUNT === SETTINGS.BONUS_TOTAL) {
    bonusNumbers = Array.from(
      { length: SETTINGS.BONUS_TOTAL },
      (_, i) => i + 1
    );
    showFlash("🧠 All bonus numbers selected — skipping random generation.");
  } else {
    while (bonusNumbers.length < SETTINGS.BONUS_COUNT) {
      const rand = generateRandomNumber(SETTINGS.BONUS_TOTAL);
      if (!bonusNumbers.includes(rand)) {
        bonusNumbers.push(rand);
      }
    }
    bonusNumbers.sort((a, b) => a - b);
  }

  updateDisplay(mainNumbers, bonusNumbers);
}

// =========================
// Initialization
// =========================

document.addEventListener("DOMContentLoaded", () => {
  numbersLabel = document.getElementById("numbersLabel");
  additionalNumbersLabel = document.getElementById("additionalNumbersLabel");
  generateButton = document.getElementById("generateButton");
  noConsecutiveNumbersCheckbox = document.getElementById(
    "noConsecutiveNumbersCheckbox"
  );
  enforceOddEvenCheckbox = document.getElementById("enforceOddEvenCheckbox");
  mainCountInput = document.getElementById("mainCountInput");
  flashContainer = document.getElementById("flashContainer");
  settingsSummary = document.getElementById("settingsSummary");
  bonusCountInput = document.getElementById("bonusCountInput");
  mainTotalInput = document.getElementById("mainTotalInput");
  bonusTotalInput = document.getElementById("bonusTotalInput");

  document.getElementById("numbersForm").addEventListener("submit", (e) => {
    e.preventDefault(); // Stop the page from reloading
    generate(); // Trigger the same logic as the button
  });

  generateButton.addEventListener("click", generate);
  generate(); // Initial draw
});
