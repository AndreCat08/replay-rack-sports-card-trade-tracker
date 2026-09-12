/**
 * Safe text node helper to structurally prevent XSS
 * @param {string} tag
 * @param {Record<string, string>} [attrs]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else {
      el.setAttribute(key, val);
    }
  }
  if (text) {
    el.textContent = text;
  }
  return el;
}

/**
 * Renders the summary bar
 * @param {HTMLElement} container
 * @param {import('./types.js').TradeSummary} summary
 */
export function renderSummary(container, summary) {
  container.replaceChildren();

  const cards = [
    { label: 'Total Trades', val: summary.total, badgeClass: 'stat-total' },
    { label: 'Cards Sent', val: summary.sent, badgeClass: 'stat-sent' },
    { label: 'Cards Received', val: summary.received, badgeClass: 'stat-received' }
  ];

  for (const card of cards) {
    const item = createElement('div', { className: `summary-card ${card.badgeClass}` });
    const label = createElement('span', { className: 'summary-label' }, card.label);
    const value = createElement('span', { className: 'summary-val' }, String(card.val));
    item.append(label, value);
    container.appendChild(item);
  }
}

/**
 * Renders trade list in binder style
 * @param {HTMLElement} container
 * @param {import('./types.js').Trade[]} trades
 * @param {(id: string) => void} onDelete
 */
export function renderTradeList(container, trades, onDelete) {
  container.replaceChildren();

  if (trades.length === 0) {
    const empty = createElement('div', { className: 'empty-state' });
    const title = createElement('h3', { className: 'empty-title' }, 'Binder is Empty');
    const desc = createElement('p', { className: 'empty-desc' }, 'No trades logged yet. Fill out the form above to record your first card deal.');
    const cta = createElement('button', { className: 'btn btn-primary cta-btn', type: 'button' }, '+ Log First Trade');
    cta.addEventListener('click', () => {
      const input = document.getElementById('playerInput');
      input?.focus();
    });
    empty.append(title, desc, cta);
    container.appendChild(empty);
    return;
  }

  for (const trade of trades) {
    const card = createElement('article', { className: `trade-card ${trade.direction.toLowerCase()}`, 'data-id': trade.id });

    // Header strip
    const header = createElement('div', { className: 'card-header' });
    const dirBadge = createElement('span', { className: `badge badge-${trade.direction.toLowerCase()}` }, trade.direction);
    const dateBadge = createElement('time', { className: 'card-date' }, trade.date);
    header.append(dirBadge, dateBadge);

    // Player & Sport
    const mainInfo = createElement('div', { className: 'card-main' });
    const playerName = createElement('h3', { className: 'player-name' }, trade.player);
    const metaInfo = createElement('div', { className: 'card-meta' });
    const sportTag = createElement('span', { className: 'card-tag' }, trade.sport);
    const yearTag = createElement('span', { className: 'card-tag' }, String(trade.year));
    const condTag = createElement('span', { className: `card-tag condition-${trade.condition.toLowerCase().replace(/\s+/g, '-')}` }, trade.condition);
    metaInfo.append(sportTag, yearTag, condTag);
    mainInfo.append(playerName, metaInfo);

    // Partner Deal details
    const dealInfo = createElement('div', { className: 'deal-info' });
    const dealLabel = createElement('span', { className: 'deal-label' }, trade.direction === 'Sent' ? 'Sent to:' : 'Received from:');
    const partnerName = createElement('strong', { className: 'deal-partner' }, trade.partner);
    dealInfo.append(dealLabel, partnerName);

    // Action / Delete with 2-step confirmation
    const actions = createElement('div', { className: 'card-actions' });
    const delBtn = createElement('button', { className: 'btn btn-danger-ghost btn-sm', type: 'button', 'aria-label': `Delete trade for ${trade.player}` }, 'Delete');

    let confirmTimer = null;
    delBtn.addEventListener('click', () => {
      if (delBtn.getAttribute('data-confirming') === 'true') {
        clearTimeout(confirmTimer);
        onDelete(trade.id);
      } else {
        delBtn.setAttribute('data-confirming', 'true');
        delBtn.textContent = 'Confirm?';
        delBtn.classList.add('btn-danger');
        delBtn.classList.remove('btn-danger-ghost');

        confirmTimer = setTimeout(() => {
          delBtn.removeAttribute('data-confirming');
          delBtn.textContent = 'Delete';
          delBtn.classList.remove('btn-danger');
          delBtn.classList.add('btn-danger-ghost');
        }, 3000);
      }
    });

    actions.appendChild(delBtn);

    card.append(header, mainInfo, dealInfo, actions);
    container.appendChild(card);
  }
}
