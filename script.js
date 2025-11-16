document.addEventListener('DOMContentLoaded', () => {
    const CONFIG = {
        API_BASE_URL: 'https://keygen2.onrender.com',
        SHORTENER_URL: 'https://link-target.net/63830/dfTOvKegYIZo',
        MAX_KEY_LIMIT: 5,
        COOLDOWN_DURATION: 30000,
        RETURN_ACTION_PARAM: 'action',
        RETURN_ACTION_VALUE: 'generate_from_shortener',
        RETURN_STATUS_PARAM: 'status',
        RETURN_STATUS_VALUE: 'completed',
        FLOW_TOKEN_PARAM: 'flow_token'
    };

    const elements = {
        btnGen: document.getElementById('generateBtn'),
        btnView: document.getElementById('viewKeysBtn'),
        keyContainerEl: document.getElementById('keyContainer'),
        keyValueEl: document.getElementById('keyValue'),
        messageEl: document.getElementById('message'),
        keysListUl: document.getElementById('keysList'),
        starfieldCanvas: document.getElementById('starfield-canvas'),
        soundToggle: document.getElementById('soundToggle'),
        copyButton: document.getElementById('copyButton'),
        keyActions: document.getElementById('keyActions'),
        keyMetadata: document.getElementById('keyMetadata'),
        keyTimestamp: document.getElementById('keyTimestamp'),
        cooldownSection: document.getElementById('cooldownSection'),
        cooldownTime: document.getElementById('cooldownTime'),
        progressBar: document.getElementById('progressBar'),
        progressFill: document.getElementById('progressFill'),
        achievementPopup: document.getElementById('achievementPopup'),
        keyLimitSection: document.getElementById('keyLimitSection'),
        keyLimitInfo: document.getElementById('keyLimitInfo'),
        keyLimitText: document.getElementById('keyLimitText'),
        keyLimitHelper: document.getElementById('keyLimitHelper'),
        translateButton: document.getElementById('translateButton'),
        supportButton: document.getElementById('supportButton'),
        discordWidgetContainer: document.getElementById('discordWidgetContainer'),
        overlay: document.getElementById('overlay'),
        closeWidget: document.getElementById('closeWidget'),
        discordAuthBtn: document.getElementById('discordAuthBtn'),
        userProfileModal: document.getElementById('userProfileModal'),
        modalUserAvatar: document.getElementById('modalUserAvatar'),
        modalUserName: document.getElementById('modalUserName'),
        modalUserDiscriminator: document.getElementById('modalUserDiscriminator'),
        modalServerStatus: document.getElementById('modalServerStatus'),
        statKeysToday: document.getElementById('statKeysToday'),
        statTotalKeys: document.getElementById('statTotalKeys'),
        statActiveKeys: document.getElementById('statActiveKeys'),
        statMemberSince: document.getElementById('statMemberSince'),
        modalGenerateBtn: document.getElementById('modalGenerateBtn'),
        modalLogoutBtn: document.getElementById('modalLogoutBtn'),
        userProfileHeader: document.getElementById('userProfileHeader'),
        userAvatarHeader: document.getElementById('userAvatarHeader'),
        userNameHeader: document.getElementById('userNameHeader'),
        userDiscriminatorHeader: document.getElementById('userDiscriminatorHeader'),
        authSection: document.getElementById('authSection'),
        userContent: document.getElementById('userContent')
    };

    const appState = {
        userKeys: [],
        soundEnabled: false,
        cooldownTimer: null,
        keyGenerationCount: 0,
        lastKeyGenerationTime: 0,
        isInCooldown: false,
        audioContext: null,
        isProcessing: false,
        currentLanguage: 'pt'
    };
    
    const translations = {
        en: {
            main_title: 'Access Terminal - MIRA HQ',
            main_subtitle: '🧑‍🚀 Crewmate, request your Access ID or check the current cycle logs. Stay alert!',
            status_online: 'MIRA HQ System Online',
            login_discord: '🎮 Login with Discord',
            cooldown_title: '⚠️ SYSTEM IN COOLDOWN',
            cooldown_subtitle: 'Wait for new request',
            key_limit_text: 'You have {count} active ID(s) (maximum: {max} per crewmate)',
            key_limit_helper: '💡 Use your IDs in the Among Us mod to free up space',
            generate_button: '⚠️ START TASK: REGISTRATION',
            view_keys_button: '🛰️ SYSTEM LOG',
            key_label: 'Assigned Crewmate ID:',
            copy_button: '📋 Copy ID',
            generated_at: '📅 Generated at:',
            key_type: '🔑 Type: MIRA HQ Access',
            key_status: '⏱️ Status: Active',
            records_title: 'ID Records - Current Cycle',
            no_records: 'No ID records in this terminal for the current cycle.',
            support_button: '🆘 Support',
            translate_button: '🇧🇷 Back to Portuguese',
            widget_title: 'Support - Discord',
            stat_keys_today: 'Keys Today',
            stat_total_keys: 'Total Keys',
            stat_active_keys: 'Active Keys',
            stat_member_since: 'Member since',
            modal_generate_button: '🚀 Generate New Key',
            modal_logout_button: '🚪 Logout',
            server_verified: '✅ IN SERVER',
            server_missing: '❌ NOT IN SERVER',
            login_required_button: '🔐 LOGIN REQUIRED',
            server_required_button: '🎮 SERVER NOT VERIFIED',
            copied_text: '✅ Copied!',
            member_since_now: 'Today',
            member_since_day: '1 day',
            member_since_days: '{days} days'
        },
        pt: {
            main_title: 'Terminal de Acesso - MIRA HQ',
            main_subtitle: '🧑‍🚀 Tripulante, requisite sua Identificação de Acesso ou verifique os registros do ciclo atual. Mantenha-se alerta!',
            status_online: 'Sistema MIRA HQ Online',
            login_discord: '🎮 Entrar com Discord',
            cooldown_title: '⚠️ SISTEMA EM COOLDOWN',
            cooldown_subtitle: 'Aguarde para nova solicitação',
            key_limit_text: 'Você possui {count} ID{s} ativa{s} (máximo: {max} por tripulante)',
            key_limit_helper: '💡 Use suas IDs no mod Among Us para liberar espaço para novas.',
            generate_button: '⚠️ INICIAR TASK: REGISTRO',
            view_keys_button: '🛰️ LOG DE SISTEMA',
            key_label: 'ID de Tripulante Designada:',
            copy_button: '📋 Copiar ID',
            generated_at: '📅 Gerada em:',
            key_type: '🔑 Tipo: Acesso MIRA HQ',
            key_status: '⏱️ Status: Ativa',
            records_title: 'Registros de IDs - Ciclo Atual',
            no_records: 'Nenhum registro de ID neste terminal para o ciclo atual.',
            support_button: '🆘 Suporte',
            translate_button: '🌐 Translate Page',
            widget_title: 'Suporte - Discord',
            stat_keys_today: 'Keys Hoje',
            stat_total_keys: 'Total Keys',
            stat_active_keys: 'Keys Ativas',
            stat_member_since: 'Membro desde',
            modal_generate_button: '🚀 Gerar Nova Key',
            modal_logout_button: '🚪 Sair',
            server_verified: '✅ NO SERVIDOR',
            server_missing: '❌ FORA DO SERVIDOR',
            login_required_button: '🔐 LOGIN REQUERIDO',
            server_required_button: '🎮 SERVIDOR NÃO VERIFICADO',
            copied_text: '✅ Copiado!',
            member_since_now: 'Hoje',
            member_since_day: '1 dia',
            member_since_days: '{days} dias'
        }
    };
    
    class DiscordAuthSystem {
        constructor() {
            this.sessionId = localStorage.getItem('crewbot_session');
            this.userData = JSON.parse(localStorage.getItem('crewbot_user') || 'null');
            this.userStats = JSON.parse(localStorage.getItem('crewbot_stats') || 'null');
            this.isAuthenticated = !!this.sessionId;
            this.sessionExpiresAt = parseInt(localStorage.getItem('crewbot_session_expires') || '0');
        }

        async init() {
            this.setupEventListeners();
            this.setupModal();
            
            if (this.isSessionExpired()) {
                await this.logout();
            } else if (this.sessionId) {
                const isValid = await this.validateSession();
                if (isValid) {
                    await this.loadUserStats();
                }
            }
            this.updateUI();
            checkAndProcessReturn();
        }

        isSessionExpired() {
            return Date.now() > this.sessionExpiresAt;
        }

        setupEventListeners() {
            if (elements.discordAuthBtn) elements.discordAuthBtn.addEventListener('click', () => this.startAuth());
            if (elements.userProfileHeader) elements.userProfileHeader.addEventListener('click', () => this.showUserModal());
        }

        setupModal() {
            const closeBtn = document.querySelector('.close-modal');
            if (closeBtn) closeBtn.addEventListener('click', () => this.hideUserModal());
            if (elements.userProfileModal) elements.userProfileModal.addEventListener('click', (e) => { if (e.target === elements.userProfileModal) this.hideUserModal(); });
            if (elements.modalGenerateBtn) elements.modalGenerateBtn.addEventListener('click', () => { this.hideUserModal(); initiateShortenerRedirect(); });
            if (elements.modalLogoutBtn) elements.modalLogoutBtn.addEventListener('click', () => { this.hideUserModal(); this.logout(); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.userProfileModal.style.display === 'block') this.hideUserModal(); });
        }

        async startAuth() {
            try {
                showUIMessage('🔄 Conectando com Discord...', 'info');
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/discord`);
                const data = await response.json();
                if (data.status === 'success') window.location.href = data.auth_url;
            } catch (error) { showUIMessage('❌ Erro ao conectar com Discord', 'error'); }
        }

        async handleCallbackFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            if (code && state) {
                try {
                    showUIMessage('🔐 Verificando autenticação...', 'info');
                    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/discord/callback`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, state })
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        const cleanUrl = window.location.href.split('?')[0];
                        window.history.replaceState({}, document.title, cleanUrl);
                        await this.handleAuthSuccess(data);
                    } else if (data.status === 'server_required') this.handleServerRequired(data);
                } catch (error) { showUIMessage('❌ Falha na autenticação', 'error'); }
            }
        }

        async handleAuthSuccess(data) {
            this.sessionId = data.session_id;
            this.userData = data.user;
            this.isAuthenticated = true;
            this.sessionExpiresAt = Date.now() + (CONFIG.SESSION_DURATION_SEC * 1000);

            localStorage.setItem('crewbot_session', this.sessionId);
            localStorage.setItem('crewbot_user', JSON.stringify(this.userData));
            localStorage.setItem('crewbot_session_expires', this.sessionExpiresAt.toString());

            await this.loadUserStats();
            this.updateUI();
            showUIMessage(data.message, 'success');
            if (appState.soundEnabled) playSoundSequence([{freq: 523, duration: 100, type: 'sine'}, {freq: 659, duration: 100, type: 'sine'}, {freq: 784, duration: 200, type: 'sine'}]);
            await fetchUserKeyList();
        }

        handleServerRequired(data) {
            showUIMessage(data.message, 'error', 10000);
            elements.authSection.innerHTML = `
              <div class="server-required-message">
                <p>🎮 Você precisa entrar no nosso servidor Discord para gerar keys!</p>
                <a href="${data.discord_invite}" target="_blank" class="server-invite-btn">🚀 Entrar no Servidor</a>
                <p style="margin-top: 0.5rem; font-size: 0.9em;">Depois de entrar, atualize a página e faça login novamente.</p>
              </div>`;
        }

        async validateSession() {
            if (!this.sessionId) return false;
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/me`, { headers: { 'X-Session-ID': this.sessionId } });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') { this.userData = data.user; return true; }
                }
                await this.logout();
                return false;
            } catch (error) { console.error('Erro ao validar sessão:', error); return false; }
        }

        async loadUserStats() {
            if (!this.sessionId) return;
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/user-stats`, { headers: { 'X-Session-ID': this.sessionId } });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        this.userStats = data.stats;
                        localStorage.setItem('crewbot_stats', JSON.stringify(this.userStats));
                        this.updateModal();
                    }
                }
            } catch (error) { console.error('Erro ao carregar estatísticas:', error); }
        }

        showUserModal() {
            if (elements.userProfileModal) {
                this.updateModal();
                elements.userProfileModal.style.display = 'block';
                if (appState.soundEnabled) playSound(600, 100, 'sine');
            }
        }

        hideUserModal() { if (elements.userProfileModal) elements.userProfileModal.style.display = 'none'; }

        updateModal() {
            if (!this.userData || !this.userStats) return;
            const avatarUrl = this.getAvatarUrl(this.userData.id, this.userData.avatar, 128);
            elements.modalUserAvatar.src = avatarUrl;
            elements.modalUserName.textContent = this.userData.global_name || this.userData.username;
            elements.modalUserDiscriminator.textContent = `@${this.userData.username}`;
            const lang = appState.currentLanguage;
            if (this.userStats.is_server_member) {
                elements.modalServerStatus.textContent = translations[lang].server_verified;
                elements.modalServerStatus.className = 'server-badge verified';
            } else {
                elements.modalServerStatus.textContent = translations[lang].server_missing;
                elements.modalServerStatus.className = 'server-badge missing';
            }
            elements.statKeysToday.textContent = this.userStats.keys_today;
            elements.statTotalKeys.textContent = this.userStats.keys_total;
            elements.statActiveKeys.textContent = this.userStats.keys_active;
            let memberText = 'N/A';
            if (this.userStats.member_since) {
                const memberSince = new Date(this.userStats.member_since);
                const now = new Date();
                const diffTime = now.getTime() - memberSince.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 1) memberText = translations[lang].member_since_now;
                else if (diffDays === 1) memberText = translations[lang].member_since_day;
                else memberText = translations[lang].member_since_days.replace('{days}', diffDays);
            }
            elements.statMemberSince.textContent = memberText;
            elements.modalGenerateBtn.disabled = !this.userStats.is_server_member;
        }

        async logout() {
            if (this.sessionId) {
                try {
                    await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: this.sessionId }) });
                } catch (error) { console.error('Erro no logout:', error); }
            }
            ['crewbot_session', 'crewbot_user', 'crewbot_stats', 'crewbot_session_expires'].forEach(k => localStorage.removeItem(k));
            Object.assign(this, { sessionId: null, userData: null, userStats: null, isAuthenticated: false, sessionExpiresAt: 0 });
            this.updateUI();
            this.hideUserModal();
            showUIMessage('👋 Logout realizado com sucesso', 'info');
            await fetchUserKeyList();
        }

        getAvatarUrl(userId, avatarHash, size = 64) {
            if (!avatarHash) return `https://cdn.discordapp.com/embed/avatars/${(userId >> 22) % 6}.png`;
            return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=${size}`;
        }

        updateUI() {
            const isAuthenticated = this.isAuthenticated && this.userData;
            elements.authSection.style.display = isAuthenticated ? 'none' : 'block';
            elements.userContent.style.display = isAuthenticated ? 'block' : 'none';
            elements.userProfileHeader.style.display = isAuthenticated ? 'flex' : 'none';

            if (isAuthenticated) {
                const avatarUrl = this.getAvatarUrl(this.userData.id, this.userData.avatar, 40);
                elements.userAvatarHeader.src = avatarUrl;
                elements.userNameHeader.textContent = this.userData.global_name || this.userData.username;
                elements.userDiscriminatorHeader.textContent = `@${this.userData.username}`;
                this.updateGenerateButton(this.userStats ? this.userStats.is_server_member : false);
            } else { this.updateGenerateButton(false); }
        }

        updateGenerateButton(isServerMember) {
            if (!elements.btnGen) return;
            const lang = appState.currentLanguage;
            const buttonTextEl = elements.btnGen.querySelector('.button-text');
            if (isServerMember && this.isAuthenticated) {
                elements.btnGen.disabled = false;
                elements.btnGen.title = 'Gerar nova ID de Acesso';
                if(buttonTextEl) buttonTextEl.setAttribute('data-translate-key', 'generate_button');
            } else {
                elements.btnGen.disabled = true;
                if (!this.isAuthenticated) {
                    elements.btnGen.title = 'Faça login com Discord para gerar keys';
                    if(buttonTextEl) buttonTextEl.setAttribute('data-translate-key', 'login_required_button');
                } else {
                    elements.btnGen.title = 'Entre no servidor Discord para gerar keys';
                    if(buttonTextEl) buttonTextEl.setAttribute('data-translate-key', 'server_required_button');
                }
            }
            applyTranslation(lang);
        }
        getAuthHeaders() { return this.sessionId ? { 'X-Session-ID': this.sessionId } : {}; }
        async refreshStats() { await this.loadUserStats(); this.updateUI(); }
    }

    const discordAuth = new DiscordAuthSystem();

    function sanitizeInput(input) { const div = document.createElement('div'); div.textContent = input; return div.innerHTML; }
    function validateKey(key) { return typeof key === 'string' && /^[A-Z0-9-]{19}$/.test(key); }

    function initAudioContext() { if (!appState.audioContext && appState.soundEnabled) { try { appState.audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { console.error("Audio Context not supported"); } } }
    function playSound(frequency, duration = 100, type = 'sine') {
        if (!appState.soundEnabled || !appState.audioContext || frequency < 80 || frequency > 2000) return;
        try {
            const oscillator = appState.audioContext.createOscillator();
            const gainNode = appState.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(appState.audioContext.destination);
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            const now = appState.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + (duration / 1000));
            oscillator.start(now);
            oscillator.stop(now + (duration / 1000));
        } catch(e) { console.error("Error playing sound", e); }
    }
    function playSoundSequence(sequence) {
        if (!appState.soundEnabled || !Array.isArray(sequence)) return;
        sequence.forEach((note, index) => { if (note && typeof note.freq === 'number') setTimeout(() => playSound(note.freq, note.duration, note.type), index * 150); });
    }
    function updateSoundToggle() {
        elements.soundToggle.textContent = appState.soundEnabled ? '🔊' : '🔇';
        elements.soundToggle.classList.toggle('active', appState.soundEnabled);
        localStorage.setItem('soundEnabled', appState.soundEnabled.toString());
    }
    function setButtonLoading(button, isLoading) {
        if (!button) return;
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
    }
    function showUIMessage(text, type = 'info', duration = 4500) {
        elements.messageEl.textContent = sanitizeInput(text.slice(0, 200));
        elements.messageEl.className = `message visible ${type}`;
        if (elements.messageEl.timeoutId) clearTimeout(elements.messageEl.timeoutId);
        if (duration > 0) elements.messageEl.timeoutId = setTimeout(() => { elements.messageEl.className = 'message'; }, duration);
    }

    function updateKeyLimitDisplay() {
        if (!discordAuth.isAuthenticated) {
             elements.keyLimitSection.style.display = 'none';
             return;
        }
        const keysUsed = appState.userKeys.length;
        const lang = appState.currentLanguage;
        const limitText = translations[lang].key_limit_text.replace('{count}', keysUsed).replace('{max}', CONFIG.MAX_KEY_LIMIT).replace('{s}', keysUsed !== 1 ? 's' : '');
        elements.keyLimitText.textContent = limitText;
        elements.keyLimitHelper.textContent = translations[lang].key_limit_helper;
        elements.keyLimitInfo.className = 'key-limit-info';
        if (keysUsed >= CONFIG.MAX_KEY_LIMIT) elements.keyLimitInfo.classList.add('key-limit-full');
        else if (keysUsed >= CONFIG.MAX_KEY_LIMIT - 2) elements.keyLimitInfo.classList.add('key-limit-warning');
        elements.keyLimitSection.style.display = 'block';
    }

    function renderKeysList() {
        elements.keysListUl.innerHTML = '';
        if (!discordAuth.isAuthenticated) return;
        if (appState.userKeys.length === 0) {
            const li = document.createElement('li');
            li.textContent = translations[appState.currentLanguage].no_records;
            li.className = 'no-keys';
            elements.keysListUl.appendChild(li);
            return;
        }
        appState.userKeys.forEach(key => {
            if (validateKey(key)) {
                const li = document.createElement('li');
                li.textContent = sanitizeInput(key);
                elements.keysListUl.appendChild(li);
            }
        });
    }

    async function copyToClipboard() {
        const keyValue = elements.keyValueEl.textContent;
        if (!keyValue || keyValue.includes('...') || !validateKey(keyValue)) return;
        try {
            await navigator.clipboard.writeText(keyValue);
            const copyButtonSpan = elements.copyButton.querySelector('span');
            if (copyButtonSpan) copyButtonSpan.textContent = translations[appState.currentLanguage].copied_text;
            elements.copyButton.classList.add('copied');
            if (appState.soundEnabled) playSoundSequence([{freq: 800, duration: 100, type: 'sine'}, {freq: 1000, duration: 150, type: 'sine'}]);
            setTimeout(() => {
                if (copyButtonSpan) copyButtonSpan.textContent = translations[appState.currentLanguage].copy_button;
                elements.copyButton.classList.remove('copied');
            }, 2000);
        } catch (err) {
            showUIMessage('❌ Erro ao copiar.', 'error');
            if (appState.soundEnabled) playSound(200, 200, 'sawtooth');
        }
    }
    
    function showAchievement(text) {
        if (!elements.achievementPopup) return;
        elements.achievementPopup.textContent = `🏆 ${sanitizeInput(text.slice(0, 100))}`;
        elements.achievementPopup.classList.add('show');
        setTimeout(() => { elements.achievementPopup.classList.remove('show'); }, 3000);
    }
    function checkCooldownOnLoad() {
        const timeSince = Date.now() - appState.lastKeyGenerationTime;
        if (timeSince < CONFIG.COOLDOWN_DURATION && timeSince > 0) {
            const remaining = Math.ceil((CONFIG.COOLDOWN_DURATION - timeSince) / 1000);
            if (remaining > 0) startCooldown(remaining);
        }
    }
    function startCooldown(seconds = 30) {
        if (appState.cooldownTimer) clearInterval(appState.cooldownTimer);
        appState.isInCooldown = true;
        elements.cooldownSection.style.display = 'block';
        elements.btnGen.disabled = true;
        let remaining = Math.max(0, seconds);
        elements.cooldownTime.textContent = `${remaining}s`;
        appState.cooldownTimer = setInterval(() => {
            remaining--;
            elements.cooldownTime.textContent = `${remaining}s`;
            if (remaining <= 0) {
                clearInterval(appState.cooldownTimer);
                appState.isInCooldown = false;
                elements.cooldownSection.style.display = 'none';
                discordAuth.updateGenerateButton(discordAuth.userStats.is_server_member);
                if (appState.soundEnabled) playSoundSequence([{freq: 440, duration: 100, type: 'sine'},{freq: 554, duration: 100, type: 'sine'},{freq: 659, duration: 200, type: 'sine'}]);
                showUIMessage('✅ Sistema pronto!', 'success');
            }
        }, 1000);
    }

    async function generateNewKey(flowToken) {
        if (appState.isProcessing) return;
        appState.isProcessing = true;
        
        try {
            initAudioContext();
            setButtonLoading(elements.btnGen, true);
            elements.keyContainerEl.classList.remove('visible');
            elements.keyActions.style.display = 'none';
            elements.keyMetadata.style.display = 'none';
            elements.keyValueEl.textContent = 'AUTENTICANDO...';
            elements.keyValueEl.classList.add('processing');

            if (!flowToken) throw new Error('Falha na verificação de segurança (token de fluxo ausente).');
            
            showUIMessage('🛰️ Conectando com o servidor...', 'info', 0);
            const response = await fetch(`${CONFIG.API_BASE_URL}/generate_key`, { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    ...discordAuth.getAuthHeaders()
                },
                body: JSON.stringify({ flow_token: flowToken })
            });
            const data = await response.json();
            elements.keyValueEl.classList.remove('processing');

            if (response.ok && data.status === 'success' && validateKey(data.key)) {
                elements.keyValueEl.textContent = sanitizeInput(data.key);
                elements.keyContainerEl.classList.add('visible');
                elements.keyActions.style.display = 'flex';
                elements.keyMetadata.style.display = 'block';
                elements.keyTimestamp.textContent = new Date().toLocaleString('pt-BR');
                
                appState.keyGenerationCount++;
                appState.lastKeyGenerationTime = Date.now();
                localStorage.setItem('keyGenerationCount', appState.keyGenerationCount.toString());
                localStorage.setItem('lastKeyGenerationTime', appState.lastKeyGenerationTime.toString());
                
                if (appState.soundEnabled) playSoundSequence([{freq: 523, duration: 150, type: 'sine'},{freq: 659, duration: 150, type: 'sine'},{freq: 784, duration: 200, type: 'sine'},{freq: 1047, duration: 250, type: 'sine'}]);
                showUIMessage('✅ ID de Acesso Válida!', 'success');
                
                if (appState.keyGenerationCount === 1) showAchievement('Primeiro Acesso!');
                else if (appState.keyGenerationCount === 5) showAchievement('Tripulante Veterano!');
                else if (appState.keyGenerationCount === 10) showAchievement('Especialista em Segurança!');
                
                await fetchUserKeyList();
                await discordAuth.refreshStats();
                startCooldown(CONFIG.COOLDOWN_DURATION / 1000);
            } else {
                const errorMessage = data?.message || 'ERRO: Solicitação Negada.';
                if (response.status === 429) startCooldown(60);
                showUIMessage(errorMessage, 'error');
                if (appState.soundEnabled) playSound(200, 500, 'sawtooth');
            }
        } catch (error) {
            elements.keyValueEl.classList.remove('processing');
            showUIMessage(`🚫 EMERGÊNCIA: ${error.message}`, 'error');
            if (appState.soundEnabled) playSound(150, 800, 'sawtooth');
        } finally {
            appState.isProcessing = false;
            setButtonLoading(elements.btnGen, false);
            if (!appState.isInCooldown) {
                 discordAuth.updateGenerateButton(discordAuth.userStats.is_server_member);
            }
        }
    }

    async function fetchUserKeyList() {
        if (!discordAuth.isAuthenticated) {
            appState.userKeys = [];
            renderKeysList();
            updateKeyLimitDisplay();
            return;
        }
        try {
            setButtonLoading(elements.btnView, true);
            showUIMessage('Consultando Log de IDs...', 'info', 0);
            const response = await fetch(`${CONFIG.API_BASE_URL}/user_keys`, { headers: discordAuth.getAuthHeaders() });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                appState.userKeys = data.keys || [];
                renderKeysList();
                updateKeyLimitDisplay();
                showUIMessage(appState.userKeys.length > 0 ? 'Relatório carregado.' : 'Nenhuma ID encontrada.', 'info', 3000);
            } else { throw new Error(data.message || `FALHA ${response.status}.`); }
        } catch (error) { showUIMessage(`❌ ${error.message}`, 'error'); }
        finally { setButtonLoading(elements.btnView, false); }
    }

    async function initiateShortenerRedirect() {
        if (appState.isInCooldown || (elements.btnGen && elements.btnGen.disabled) || appState.isProcessing) {
            showUIMessage('⏱️ AGUARDE: Sistema em cooldown.', 'error');
            if (appState.soundEnabled) playSound(200, 300, 'sawtooth');
            return;
        }
        if (appState.userKeys.length >= CONFIG.MAX_KEY_LIMIT) {
            showUIMessage('⚠️ LIMITE ATINGIDO: Máximo de 5 IDs.', 'error');
            if (appState.soundEnabled) playSound(200, 500, 'sawtooth');
            return;
        }
        appState.isProcessing = true;
        try {
            if (appState.soundEnabled) playSound(600, 100, 'square');
            setButtonLoading(elements.btnGen, true);
            showUIMessage('⏳ Iniciando verificação de segurança...', 'info', 0);
            const response = await fetch(`${CONFIG.API_BASE_URL}/start-generation-flow`, { headers: discordAuth.getAuthHeaders() });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                showUIMessage('⏳ Redirecionando para o portal...', 'info', 5000);
                setTimeout(() => { window.location.href = CONFIG.SHORTENER_URL; }, 1500);
            } else { throw new Error(data.message || 'Erro desconhecido.'); }
        } catch (error) {
            showUIMessage(`❌ Falha ao iniciar: ${error.message}`, 'error');
            setButtonLoading(elements.btnGen, false);
            appState.isProcessing = false;
        }
    }
    
    function checkAndProcessReturn() {
        discordAuth.handleCallbackFromURL().then(() => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const flowToken = urlParams.get(CONFIG.FLOW_TOKEN_PARAM);
                const action = urlParams.get(CONFIG.RETURN_ACTION_PARAM);
                const status = urlParams.get(CONFIG.RETURN_STATUS_PARAM);
    
                if (action === CONFIG.RETURN_ACTION_VALUE && status === CONFIG.RETURN_STATUS_VALUE) {
                    const cleanUrl = window.location.href.split('?')[0];
                    window.history.replaceState({}, document.title, cleanUrl);
                    showUIMessage('✅ Verificação completa! Solicitando ID...', 'success');
                    generateNewKey(flowToken);
                }
            } catch(e) { /* Ignore errors */ }
        });
    }

    function openDiscordWidget() {
        elements.discordWidgetContainer.classList.add('active');
        elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (appState.soundEnabled) playSoundSequence([{freq: 523, duration: 100, type: 'sine'},{freq: 659, duration: 100, type: 'sine'}]);
    }
    function closeDiscordWidget() {
        elements.discordWidgetContainer.classList.remove('active');
        elements.overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (appState.soundEnabled) playSound(400, 100, 'sine');
    }

    function applyTranslation(lang) {
        if (!translations[lang]) return;
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.getAttribute('data-translate-key');
            if (translations[lang][key]) { el.textContent = translations[lang][key]; }
        });
        document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
        appState.currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        if(discordAuth.isAuthenticated) {
            discordAuth.updateModal();
            renderKeysList();
            updateKeyLimitDisplay();
        }
    }
    function toggleTranslation() {
        const newLang = appState.currentLanguage === 'pt' ? 'en' : 'pt';
        applyTranslation(newLang);
    }
    
    function setupCanvasStarfield() {
        const canvas = elements.starfieldCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let stars = [];
        const numStars = Math.min(250, Math.floor((window.innerWidth * window.innerHeight) / 8000));
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            for (let i = 0; i < numStars; i++) {
                stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5, alpha: Math.random() * 0.5 + 0.5, dx: (Math.random() - 0.5) * 0.1, dy: (Math.random() - 0.5) * 0.1, alphaChange: (Math.random() - 0.5) * 0.01 });
            }
        }
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(star => {
                star.x += star.dx;
                star.y += star.dy;
                star.alpha += star.alphaChange;
                if (star.alpha <= 0.1 || star.alpha >= 1) star.alphaChange *= -1;
                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();
            });
            requestAnimationFrame(animate);
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();
    }

    function setupEventListeners() {
        elements.soundToggle.addEventListener('click', () => {
            appState.soundEnabled = !appState.soundEnabled;
            updateSoundToggle();
            initAudioContext();
            if (appState.soundEnabled) playSoundSequence([{freq: 440, duration: 100, type: 'sine'},{freq: 554, duration: 100, type: 'sine'}]);
        });
        elements.copyButton.addEventListener('click', copyToClipboard);
        elements.btnGen.addEventListener('click', initiateShortenerRedirect);
        elements.btnView.addEventListener('click', () => { if (appState.soundEnabled) playSound(500, 100, 'square'); fetchUserKeyList(); });
        elements.translateButton.addEventListener('click', toggleTranslation);
        elements.supportButton.addEventListener('click', openDiscordWidget);
        elements.closeWidget.addEventListener('click', closeDiscordWidget);
        elements.overlay.addEventListener('click', closeDiscordWidget);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.discordWidgetContainer.classList.contains('active')) closeDiscordWidget(); });
        window.addEventListener('beforeunload', () => { if (appState.cooldownTimer) clearInterval(appState.cooldownTimer); });
    }

    function setupSessionWatcher() {
        setInterval(async () => {
            if (discordAuth.isAuthenticated && discordAuth.isSessionExpired()) {
                console.log('Sessão expirada, fazendo logout...');
                await discordAuth.logout();
            }
        }, 60000);
    }

    function initializeApp() {
        appState.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        appState.keyGenerationCount = parseInt(localStorage.getItem('keyGenerationCount') || '0');
        appState.lastKeyGenerationTime = parseInt(localStorage.getItem('lastKeyGenerationTime') || '0');
        const preferredLang = localStorage.getItem('preferredLanguage');
        if (preferredLang && translations[preferredLang]) {
            applyTranslation(preferredLang);
        }
    }

    initializeApp();
    updateSoundToggle();
    setupCanvasStarfield();
    setupEventListeners();
    discordAuth.init();
    setupSessionWatcher();
    
    setTimeout(() => {
        if (appState.soundEnabled) {
            playSoundSequence([{freq: 220, duration: 100, type: 'sine'}, {freq: 277, duration: 100, type: 'sine'}, {freq: 330, duration: 100, type: 'sine'}, {freq: 440, duration: 200, type: 'sine'}]);
        }
    }, 1000);
});
