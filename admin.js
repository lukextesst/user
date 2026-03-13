// ==================== CONFIGURATION ====================
const BACKEND_URL = "https://dev.crewcore.online";
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const GENERATION_COOLDOWN = 30 * 1000; // 30 seconds between generations
// VULN-A5: Client-side lockout removed — server handles brute force protection
const MAX_STANDARD_KEYS = 5;
const MAX_PREMIUM_KEYS = 1;
const FETCH_TIMEOUT_MS = 15000; // 15s fetch timeout
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000; // Auto-refresh keys every 60s

// ==================== STATE ====================
// VULN-A1 FIX: Store session TOKEN (not password) in sessionStorage
function getAdminToken() { return sessionStorage.getItem('_at') || ''; }
function setAdminToken(v) { if (v) sessionStorage.setItem('_at', v); else sessionStorage.removeItem('_at'); }
let lastGenerationTime = 0;
let inactivityTimer = null;
let sessionCountdown = null;
let remainingSeconds = 15 * 60;
let currentConfirmCallback = null;
let autoRefreshTimer = null;
let _lastActivityReset = 0; // Throttle activity listener
let _lastDeleteTime = 0; // Cooldown between deletes
const DELETE_COOLDOWN = 3000; // 3s between deletes
// VULN-A7 FIX: AbortController for activity listeners (prevents accumulation)
let activityAbortController = null;

// ==================== DOM ELEMENTS ====================
const $ = (id) => document.getElementById(id);

const elements = {
  loginModal: $('loginModal'),
  loginForm: $('loginForm'),
  loginError: $('loginError'),
  adminSecret: $('adminSecret'),
  btnLogin: $('btnLogin'),
  adminPanel: $('adminPanel'),
  btnLogout: $('btnLogout'),
  themeToggle: $('themeToggle'),
  timerDisplay: $('timerDisplay'),
  keyCount: $('keyCount'),
  premiumType: $('premiumType'),
  premiumCount: $('premiumCount'),
  customDateGroup: $('customDateGroup'),
  customDate: $('customDate'),
  btnGenerate: $('btnGenerate'),
  btnGeneratePremium: $('btnGeneratePremium'),
  btnViewKeys: $('btnViewKeys'),
  btnDeleteKey: $('btnDeleteKey'),
  deleteKeyInput: $('deleteKeyInput'),
  availableKeysList: $('availableKeysList'),
  usedKeysList: $('usedKeysList'),
  availableCount: $('availableCount'),
  usedCount: $('usedCount'),
  statusOutput: $('statusOutput'),
  confirmModal: $('confirmModal'),
  confirmIcon: $('confirmIcon'),
  confirmTitle: $('confirmTitle'),
  confirmMessage: $('confirmMessage'),
  confirmCancel: $('confirmCancel'),
  confirmYes: $('confirmYes'),
  toast: $('toast'),
  toastIcon: $('toastIcon'),
  toastMessage: $('toastMessage'),
  toastClose: $('toastClose'),
  statAvailable: $('statAvailable'),
  statUsed: $('statUsed'),
  statPremium: $('statPremium'),
  statTotal: $('statTotal'),
  currentYear: $('currentYear'),
  keySearchInput: $('keySearchInput')
};

// ==================== UTILITIES ====================
let _toastTimeout = null;
function showToast(message, type = 'info') {
  const icons = { success: '\u2705', error: '\u274C', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };
  elements.toastIcon.textContent = icons[type] || icons.info;
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast show ${type}`;

  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 4000);
}

function dismissToast() {
  if (_toastTimeout) clearTimeout(_toastTimeout);
  elements.toast.classList.remove('show');
}

// SEC-2 FIX: Fetch with AbortController timeout
function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function showStatus(message, type = '') {
  elements.statusOutput.textContent = message;
  elements.statusOutput.className = `status-output ${type}`;
}

function setLoading(button, loading) {
  const originalContent = button.dataset.originalContent || button.innerHTML;

  if (loading) {
    button.dataset.originalContent = button.innerHTML;
    button.innerHTML = '<span class="spinner"></span>';
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalContent || originalContent;
    button.disabled = false;
  }
}

function showConfirm(title, message, icon, callback) {
  elements.confirmIcon.textContent = icon;
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  currentConfirmCallback = callback;
  // SEC-5 FIX: Always reset confirmYes text before showing
  elements.confirmYes.textContent = 'Confirmar';
  elements.confirmModal.classList.add('show');
}

function hideConfirm() {
  elements.confirmModal.classList.remove('show');
  currentConfirmCallback = null;
  // SEC-5 FIX: Reset button text on close
  elements.confirmYes.textContent = 'Confirmar';
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ==================== SESSION MANAGEMENT ====================
function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (!getAdminToken()) return;

  remainingSeconds = 15 * 60;
  updateTimerDisplay();

  inactivityTimer = setTimeout(() => {
    handleLogout();
    showToast('Sess\u00E3o encerrada por inatividade', 'warning');
  }, INACTIVITY_TIMEOUT);
}

function startSessionCountdown() {
  if (sessionCountdown) clearInterval(sessionCountdown);
  remainingSeconds = 15 * 60;

  sessionCountdown = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(sessionCountdown);
    }
  }, 1000);
}

function updateTimerDisplay() {
  elements.timerDisplay.textContent = formatTimer(remainingSeconds);

  // SEC-6 FIX: Reset color when timer is healthy, change when low
  const timerEl = elements.timerDisplay.parentElement;
  if (remainingSeconds <= 60) {
    timerEl.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    timerEl.style.color = 'var(--danger)';
  } else if (remainingSeconds <= 180) {
    timerEl.style.borderColor = 'rgba(251, 191, 36, 0.3)';
    timerEl.style.color = 'var(--warning)';
  } else {
    timerEl.style.borderColor = 'rgba(251, 191, 36, 0.3)';
    timerEl.style.color = 'var(--warning)';
  }
}

// ==================== AUTHENTICATION ====================
// VULN-A7 FIX: Setup activity listeners with AbortController (prevents accumulation)
function setupActivityListeners() {
  if (activityAbortController) activityAbortController.abort();
  activityAbortController = new AbortController();

  const throttledReset = () => {
    const t = Date.now();
    if (t - _lastActivityReset < 5000) return;
    _lastActivityReset = t;
    resetInactivityTimer();
    startSessionCountdown();
  };
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
    document.addEventListener(event, throttledReset, {
      passive: true,
      signal: activityAbortController.signal
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();

  const secret = elements.adminSecret.value.trim();
  if (!secret || secret.length < 6) {
    elements.loginError.textContent = 'Digite a senha de administrador (m\u00EDnimo 6 caracteres).';
    elements.loginError.style.display = 'block';
    return;
  }

  setLoading(elements.btnLogin, true);
  elements.loginError.style.display = 'none';

  try {
    // Quick health check to differentiate "server down" from "server slow"
    try {
      await fetchWithTimeout(`${BACKEND_URL}/health`, {}, 5000);
    } catch (_hErr) {
      elements.loginError.textContent = 'Servidor offline ou inacess\u00EDvel. Verifique se o Node.js est\u00E1 rodando no VPS (pm2 status).';
      elements.loginError.style.display = 'block';
      setLoading(elements.btnLogin, false);
      return;
    }

    // VULN-A1 FIX: Send password ONCE to /admin/login, get session token back
    const response = await fetchWithTimeout(`${BACKEND_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret })
    });

    const data = await response.json();

    // VULN-A5 FIX: Use server response for lockout instead of client-side tracking
    if (response.status === 429) {
      elements.loginError.textContent = `\uD83D\uDD12 ${data.message || 'Muitas tentativas. Aguarde.'}`;
      elements.loginError.style.display = 'block';
      setLoading(elements.btnLogin, false);
      return;
    }

    if (data.status === 'success' && data.token) {
      setAdminToken(data.token);
      elements.adminSecret.value = ''; // Clear from DOM immediately
      elements.loginModal.style.display = 'none';
      elements.adminPanel.style.display = 'block';
      showToast('Login realizado com sucesso!', 'success');

      resetInactivityTimer();
      startSessionCountdown();
      startAutoRefresh();
      setupActivityListeners();
      loadKeys();
    } else {
      elements.loginError.textContent = data.message || 'Senha incorreta.';
      elements.loginError.style.display = 'block';
    }
  } catch (error) {
    // SEC-7 FIX: Don't leak error details
    const msg = error.name === 'AbortError' ? 'Timeout: servidor n\u00E3o respondeu.' : 'Erro de conex\u00E3o com o servidor.';
    elements.loginError.textContent = msg;
    elements.loginError.style.display = 'block';
  }

  setLoading(elements.btnLogin, false);
}

function handleLogout() {
  // VULN-A1 FIX: Invalidate session on server before clearing local state
  const token = getAdminToken();
  if (token) {
    fetchWithTimeout(`${BACKEND_URL}/admin/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {}); // Best-effort, don't block logout
  }
  setAdminToken('');
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (sessionCountdown) clearInterval(sessionCountdown);
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  // VULN-A7 FIX: Remove activity listeners on logout
  if (activityAbortController) { activityAbortController.abort(); activityAbortController = null; }

  elements.adminPanel.style.display = 'none';
  elements.loginModal.style.display = 'flex';
  elements.adminSecret.value = '';
  elements.loginError.style.display = 'none';

  showToast('Voc\u00EA foi desconectado.', 'info');
}

// Auto-refresh keys while panel is open
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    if (getAdminToken() && !document.hidden) loadKeys();
  }, AUTO_REFRESH_INTERVAL_MS);
}

// ==================== API CALLS ====================
async function apiCall(endpoint, method = 'GET', body = null, button = null) {
  const token = getAdminToken();
  if (!token) {
    handleLogout();
    return null;
  }

  if (button) setLoading(button, true);
  showStatus('\u23F3 Processando...', '');

  try {
    // VULN-A1 FIX: Send Bearer token instead of raw password
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetchWithTimeout(`${BACKEND_URL}/${endpoint}`, options);
    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      handleLogout();
      showToast('Sess\u00E3o expirada. Fa\u00E7a login novamente.', 'error');
      return null;
    }

    if (data.status === 'success') {
      showStatus(`\u2705 ${data.message || 'Opera\u00E7\u00E3o conclu\u00EDda!'}`, 'success');
    } else {
      showStatus(`\u274C ${data.message || 'Erro na opera\u00E7\u00E3o.'}`, 'error');
    }

    return data;
  } catch (error) {
    // SEC-7 FIX: Generic error message, no stack leak
    const msg = error.name === 'AbortError' ? 'Timeout: servidor n\u00E3o respondeu.' : 'Erro de conex\u00E3o.';
    showStatus(`\u274C ${msg}`, 'error');
    return null;
  } finally {
    if (button) setLoading(button, false);
  }
}

// ==================== KEY OPERATIONS ====================
async function loadKeys() {
  const data = await apiCall('admin/keys', 'GET', null, elements.btnViewKeys);

  if (!data || data.status !== 'success' || !data.data) {
    return;
  }

  const { available_keys = [], used_keys = [] } = data.data;

  // Update stats
  const premiumCount = available_keys.filter(k => k.startsWith('P-')).length +
    used_keys.filter(k => k.includes('(') && k.includes('active')).length;

  elements.statAvailable.textContent = available_keys.length;
  elements.statUsed.textContent = used_keys.length;
  elements.statPremium.textContent = premiumCount;
  elements.statTotal.textContent = available_keys.length + used_keys.length;

  // Update counts
  elements.availableCount.textContent = available_keys.length;
  elements.usedCount.textContent = used_keys.length;

  // Render available keys
  if (available_keys.length > 0) {
    elements.availableKeysList.innerHTML = available_keys.map((key, index) => {
      const isPremium = key.startsWith('P-') || key.includes('(');
      // SECURITY: Use data attributes instead of inline onclick to prevent XSS
      return `
        <div class="key-item ${isPremium ? 'premium' : ''}">
          <span class="key-value">${escapeHtml(key)}</span>
          <div class="key-actions">
            <button class="key-btn copy-key-btn" data-key="${encodeURIComponent(key)}" title="Copiar">\uD83D\uDCCB</button>
            <button class="key-btn delete delete-key-btn" data-key="${encodeURIComponent(key.split(' ')[0])}" title="Excluir">\uD83D\uDDD1\uFE0F</button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    elements.availableKeysList.innerHTML = `
      <div class="keys-empty">
        <div class="keys-empty-icon">\uD83D\uDCED</div>
        <div>Nenhuma chave dispon\u00EDvel</div>
      </div>
    `;
  }

  if (used_keys.length > 0) {
    elements.usedKeysList.innerHTML = used_keys.map(key => {
      const rawKey = key.split(' ')[0];
      return `
      <div class="key-item">
        <span class="key-value">${escapeHtml(key)}</span>
        <div class="key-actions">
          <button class="key-btn copy-key-btn" data-key="${encodeURIComponent(key)}" title="Copiar">\uD83D\uDCCB</button>
          <button class="key-btn delete delete-key-btn" data-key="${encodeURIComponent(rawKey)}" title="Excluir">\uD83D\uDDD1\uFE0F</button>
        </div>
      </div>
    `;
    }).join('');
  } else {
    elements.usedKeysList.innerHTML = `
      <div class="keys-empty">
        <div class="keys-empty-icon">\uD83D\uDCED</div>
        <div>Nenhuma chave usada</div>
      </div>
    `;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyKey(key) {
  // Extract just the key part if it has extra info
  // SECURITY: Decode URI component since we encode in data attributes
  const decodedKey = decodeURIComponent(key);
  const cleanKey = decodedKey.split(' ')[0];
  navigator.clipboard.writeText(cleanKey).then(() => {
    showToast('Chave copiada!', 'success');
  }).catch(() => {
    showToast('Erro ao copiar.', 'error');
  });
}

async function generateStandardKeys() {
  // RATE LIMITING: Check cooldown
  const now = Date.now();
  if (now - lastGenerationTime < GENERATION_COOLDOWN) {
    const remaining = Math.ceil((GENERATION_COOLDOWN - (now - lastGenerationTime)) / 1000);
    showToast(`\u23F3 Aguarde ${remaining}s antes de gerar mais keys.`, 'warning');
    return;
  }

  const count = parseInt(elements.keyCount.value);
  if (isNaN(count) || count < 1 || count > MAX_STANDARD_KEYS) {
    showToast(`Quantidade inv\u00E1lida (1-${MAX_STANDARD_KEYS})`, 'error');
    return;
  }

  const data = await apiCall('admin/keys/generate', 'POST', { count }, elements.btnGenerate);

  if (data && data.status === 'success') {
    lastGenerationTime = Date.now();
    localStorage.setItem('admin_gen_cooldown', lastGenerationTime.toString());
    showToast(`${data.keys?.length || count} chaves geradas!`, 'success');

    // BUG FIX: Show generated standard keys (same UX as premium)
    if (data.keys && data.keys.length > 0) {
      showConfirm('\uD83D\uDD11 Keys Standard Geradas',
        `${data.keys.join('\n')}`,
        '\u2705',
        () => {
          navigator.clipboard.writeText(data.keys.join('\n'));
          showToast('Todas as keys copiadas!', 'success');
        });
      elements.confirmYes.textContent = 'Copiar Todas';
    }

    loadKeys();
  }
}

async function generatePremiumKeys() {
  // RATE LIMITING: Check cooldown
  const now = Date.now();
  if (now - lastGenerationTime < GENERATION_COOLDOWN) {
    const remaining = Math.ceil((GENERATION_COOLDOWN - (now - lastGenerationTime)) / 1000);
    showToast(`\u23F3 Aguarde ${remaining}s antes de gerar mais keys.`, 'warning');
    return;
  }

  // SECURITY: Force only 1 premium key at a time
  const count = MAX_PREMIUM_KEYS; // Always 1
  const type = elements.premiumType.value;

  if (isNaN(count) || count < 1 || count > MAX_PREMIUM_KEYS) {
    showToast(`Quantidade inv\u00E1lida (m\u00E1x ${MAX_PREMIUM_KEYS})`, 'error');
    return;
  }

  let expires_at = null;
  if (type === 'custom') {
    const rawDate = elements.customDate.value;
    if (!rawDate) {
      showToast('Selecione uma data de expira\u00E7\u00E3o', 'error');
      return;
    }
    expires_at = new Date(rawDate).toISOString();
  }

  const data = await apiCall('admin/keys/generate-premium', 'POST',
    { count, type, expires_at }, elements.btnGeneratePremium);

  if (data && data.status === 'success') {
    showToast(`${data.keys?.length || count} chaves Premium geradas!`, 'success');

    // Show generated keys in a nice alert
    if (data.keys && data.keys.length > 0) {
      showConfirm('\uD83D\uDC51 Keys Premium Geradas',
        `${data.keys.join('\n')}`,
        '\u2705',
        () => {
          navigator.clipboard.writeText(data.keys.join('\n'));
          showToast('Todas as keys copiadas!', 'success');
        });
      elements.confirmYes.textContent = 'Copiar Todas';
    }

    lastGenerationTime = Date.now();
    localStorage.setItem('admin_gen_cooldown', lastGenerationTime.toString());
    loadKeys();
  }
}

function deleteKey(key) {
  // RATE LIMIT: Client-side cooldown between deletes
  const now = Date.now();
  if (now - _lastDeleteTime < DELETE_COOLDOWN) {
    const remaining = Math.ceil((DELETE_COOLDOWN - (now - _lastDeleteTime)) / 1000);
    showToast(`\u23F3 Aguarde ${remaining}s antes de excluir outra key.`, 'warning');
    return;
  }

  // SECURITY: Decode URI component since we encode in data attributes
  const decodedKey = decodeURIComponent(key);
  showConfirm(
    'Excluir Chave',
    `Tem certeza que deseja excluir a chave "${decodedKey}"?`,
    '\uD83D\uDDD1\uFE0F',
    async () => {
      const data = await apiCall(`admin/keys/${encodeURIComponent(decodedKey)}`, 'DELETE', null, elements.btnDeleteKey);
      if (data && data.status === 'success') {
        _lastDeleteTime = Date.now(); // Update cooldown after successful delete
        showToast('Chave exclu\u00EDda!', 'success');
        loadKeys();
      }
      hideConfirm();
    }
  );
}

function deleteSpecificKey() {
  const key = elements.deleteKeyInput.value.trim();
  if (!key) {
    showToast('Digite a chave para excluir', 'error');
    return;
  }
  deleteKey(key);
}

// ==================== SEARCH FILTER ====================
function filterKeys(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#keysContainer .key-item').forEach(item => {
    const keyText = item.querySelector('.key-value')?.textContent?.toLowerCase() || '';
    item.style.display = keyText.includes(q) ? '' : 'none';
  });
}

// ==================== THEME ====================
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  elements.themeToggle.textContent = isLight ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

function applyTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    elements.themeToggle.textContent = '\u2600\uFE0F';
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Set current year
  elements.currentYear.textContent = new Date().getFullYear();

  // Apply saved theme
  applyTheme();

  // SEC-8 FIX: Persist generation cooldown across refreshes
  const storedCooldown = localStorage.getItem('admin_gen_cooldown');
  if (storedCooldown) {
    const cd = parseInt(storedCooldown);
    if (cd > Date.now() - GENERATION_COOLDOWN) lastGenerationTime = cd;
    else localStorage.removeItem('admin_gen_cooldown');
  }

  // VULN-A5 FIX: Client-side lockout removed — server handles brute force protection

  // Event listeners
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.btnLogout.addEventListener('click', handleLogout);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.btnGenerate.addEventListener('click', generateStandardKeys);
  elements.btnGeneratePremium.addEventListener('click', generatePremiumKeys);
  elements.btnViewKeys.addEventListener('click', loadKeys);
  elements.btnDeleteKey.addEventListener('click', deleteSpecificKey);
  elements.toastClose.addEventListener('click', dismissToast);

  // Search filter for keys
  elements.keySearchInput.addEventListener('input', (e) => filterKeys(e.target.value));

  // EVENT DELEGATION: Handle key button clicks securely (prevents XSS via inline handlers)
  document.getElementById('keysContainer').addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-key-btn');
    const deleteBtn = e.target.closest('.delete-key-btn');

    if (copyBtn) {
      copyKey(copyBtn.dataset.key);
    } else if (deleteBtn) {
      deleteKey(deleteBtn.dataset.key);
    }
  });

  elements.confirmCancel.addEventListener('click', hideConfirm);
  elements.confirmYes.addEventListener('click', () => {
    if (currentConfirmCallback) currentConfirmCallback();
  });

  // V3 FIX: Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.confirmModal.classList.contains('show')) hideConfirm();
    }
  });

  // Premium type change
  elements.premiumType.addEventListener('change', () => {
    elements.customDateGroup.style.display =
      elements.premiumType.value === 'custom' ? 'block' : 'none';
  });

  // Focus on password field
  elements.adminSecret.focus();

  // HTTPS warning
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    showToast('\u26A0\uFE0F Use HTTPS para maior seguran\u00E7a!', 'warning');
  }

  // Restore session if tab was refreshed (sessionStorage survives refresh)
  if (getAdminToken()) {
    elements.loginModal.style.display = 'none';
    elements.adminPanel.style.display = 'block';
    resetInactivityTimer();
    startSessionCountdown();
    startAutoRefresh();
    setupActivityListeners();
    loadKeys();
  }
});
