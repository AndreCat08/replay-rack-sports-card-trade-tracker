import { STORAGE_KEY, parseStoredTrades, calculateSummary, sanitizeTrade } from './store.js';
import { renderSummary, renderTradeList } from './render.js';

/** @type {import('./types.js').Trade[]} */
let trades = [];

const loadingBanner = document.getElementById('loadingBanner');
const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');
const errorDismiss = document.getElementById('errorDismiss');
const summaryContainer = document.getElementById('summaryBar');
const tradeListContainer = document.getElementById('tradeList');
const tradeForm = /** @type {HTMLFormElement} */ (document.getElementById('tradeForm'));

/**
 * Surfaces error banner persistently
 * @param {string} msg
 */
function showError(msg) {
  if (errorMessage && errorBanner) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
  }
}

function clearError() {
  if (errorBanner) {
    errorBanner.classList.add('hidden');
  }
}

errorDismiss?.addEventListener('click', clearError);

/**
 * Persists trades to localStorage
 * @param {import('./types.js').Trade[]} nextTrades
 * @returns {boolean}
 */
function saveState(nextTrades) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrades));
    return true;
  } catch (err) {
    showError('Storage save failed. No changes were made.');
    return false;
  }
}

/**
 * Refresh UI views
 */
function updateViews() {
  const summary = calculateSummary(trades);
  if (summaryContainer) {
    renderSummary(summaryContainer, summary);
  }
  if (tradeListContainer) {
    renderTradeList(tradeListContainer, trades, handleDelete);
  }
}

/**
 * Handle deletion of a trade
 * @param {string} id
 */
function handleDelete(id) {
  const nextTrades = trades.filter(t => t.id !== id);
  if (!saveState(nextTrades)) return;
  trades = nextTrades;
  updateViews();
}

/**
 * Setup form handling
 */
function setupForm() {
  const dateInput = /** @type {HTMLInputElement} */ (document.getElementById('dateInput'));
  if (dateInput && !dateInput.value) {
    const today = new Date();
    dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  tradeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const fd = new FormData(tradeForm);
    const rawEntry = {
      id: crypto.randomUUID(),
      player: String(fd.get('player') || '').trim(),
      sport: String(fd.get('sport') || '').trim(),
      year: Number(fd.get('year')),
      condition: String(fd.get('condition') || '').trim(),
      partner: String(fd.get('partner') || '').trim(),
      direction: String(fd.get('direction') || '').trim(),
      date: String(fd.get('date') || '').trim(),
      createdAt: Date.now()
    };

    const sanitized = sanitizeTrade(rawEntry);
    if (!sanitized) {
      showError('Please check form fields. All fields are required and must be valid.');
      return;
    }

    const nextTrades = [sanitized, ...trades];
    if (!saveState(nextTrades)) return;
    trades = nextTrades;
    updateViews();

    const currentDate = dateInput ? dateInput.value : '';
    tradeForm.reset();
    if (dateInput) dateInput.value = currentDate;
    document.getElementById('playerInput')?.focus();
  });
}

/**
 * Initialize application state and UI
 */
export function initApp() {
  if (loadingBanner) {
    loadingBanner.classList.remove('hidden');
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = parseStoredTrades(raw);
    trades = parsed.trades;

    if (parsed.error) {
      showError(parsed.error);
    } else if (parsed.corruptCount > 0) {
      showError(`Notice: ${parsed.corruptCount} unreadable trade(s) skipped from storage.`);
    }
  } catch (err) {
    showError('Unable to read localStorage. Persistence may be disabled in private mode.');
  } finally {
    if (loadingBanner) {
      loadingBanner.classList.add('hidden');
    }
  }

  setupForm();
  updateViews();
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
