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
 * Persists current trades to localStorage
 */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch (err) {
    showError('Storage save failed. Quota may be exceeded or access blocked.');
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
  trades = trades.filter(t => t.id !== id);
  saveState();
  updateViews();
}

/**
 * Setup form handling
 */
function setupForm() {
  // Pre-fill today's date in input
  const dateInput = /** @type {HTMLInputElement} */ (document.getElementById('dateInput'));
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  tradeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const fd = new FormData(tradeForm);
    const rawEntry = {
      id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
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

    trades.unshift(sanitized);
    saveState();
    updateViews();

    // Reset fields except date
    const currentDate = dateInput ? dateInput.value : '';
    tradeForm.reset();
    if (dateInput) dateInput.value = currentDate;
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

    if (parsed.corruptCount > 0) {
      showError(`Notice: ${parsed.corruptCount} unreadable trade(s) skipped from storage.`);
    } else if (parsed.error) {
      showError(parsed.error);
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
