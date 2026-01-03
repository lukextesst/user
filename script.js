// ============================================
// TURNSTILE CALLBACKS - DEVEM ESTAR NO ESCOPO GLOBAL ANTES DO DOM CARREGAR
// ============================================
window._turnstileToken = null;
window._turnstileVerifiedAt = null;
window._turnstileReady = false;

window.onTurnstileSuccess = function (token) {
    console.log('[Turnstile] ✅ Verification successful, token received');
    window._turnstileToken = token;
    window._turnstileVerifiedAt = Date.now();

    // Habilita os botões imediatamente
    ['btnMethod1', 'btnMethod2', 'btnMethod3'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('disabled');
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.cursor = 'pointer';
        }
    });

    // Atualiza o hint
    const hint = document.getElementById('turnstileHint');
    if (hint) {
        hint.textContent = '✅ Verificado! Selecione um método abaixo';
        hint.style.color = '#4CAF50';
    }

    // Sincroniza com appState quando disponível
    if (window._syncTurnstileState) {
        window._syncTurnstileState(token);
    }
};

window.onTurnstileError = function () {
    console.error('[Turnstile] ❌ Verification failed');
    window._turnstileToken = null;
    alert('Erro na verificação Cloudflare. Recarregue a página.');
};

window.onTurnstileExpired = function () {
    console.warn('[Turnstile] ⚠️ Token expired');
    window._turnstileToken = null;

    // Desabilita os botões
    ['btnMethod1', 'btnMethod2', 'btnMethod3'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        }
    });

    // Reseta o hint
    const hint = document.getElementById('turnstileHint');
    if (hint) {
        hint.textContent = 'Complete a verificação acima para desbloquear os métodos';
        hint.style.color = '#888';
    }

    // Reseta o widget
    if (window.turnstile) {
        const widget = document.querySelector('.cf-turnstile');
        if (widget) window.turnstile.reset(widget);
    }
};

// ============================================
// MAIN APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const CONFIG = {
        // URL da API já definida para produção
        API_BASE_URL: 'https://keygenx-1.onrender.com',
        REQUEST_TIMEOUT: 15000, // 15 segundos timeout para requests
        // === SISTEMA DE 2 PASSOS (2026) ===
        SHORTENER_URLS: {
            step1: 'https://link-target.net/63830/among-us-modmenu-key1',  // Linkvertise
            step2: 'https://link-hub.net/63830/tQtGDD3vTskf'              // DirectLink
        },
        MAX_KEY_LIMIT: 5,
        COOLDOWN_DURATION: 30000,
        SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 horas em ms
        // === ANTI-BYPASS: Storage keys ===
        TWOSTEP_SESSION_KEY: 'crewTwoStepSession',       // session_id atual
        TWOSTEP_STEP1_TOKEN_KEY: 'crewStep1Token',       // token após step1
        TWOSTEP_CURRENT_STEP_KEY: 'crewCurrentStep',     // 1 ou 2
        BYPASS_PROOF_TOKEN_KEY: 'miraHqProofToken',      // proof_token após challenge
        BYPASS_STARTED_AT_KEY: 'miraHqBypassStartedAt',  // timestamp de início
        // Configuração dos Retornos
        RETURN_CONFIG: {
            step1: { action: 'complete_step1', status: 'success' },
            step2: { action: 'complete_step2', status: 'success' }
        }
    };

    const elements = {
        btnOpenMethodMenu: document.getElementById('btnOpenMethodMenu'),
        // === Two-Step Modal Elements (2026) ===
        twoStepModal: document.getElementById('twoStepModal'),
        closeTwoStepModal: document.getElementById('closeTwoStepModal'),
        stepCard1: document.getElementById('stepCard1'),
        stepCard2: document.getElementById('stepCard2'),
        btnStep1: document.getElementById('btnStep1'),
        btnStep2: document.getElementById('btnStep2'),
        step1Status: document.getElementById('step1Status'),
        step2Status: document.getElementById('step2Status'),
        step2LockedOverlay: document.getElementById('step2LockedOverlay'),
        stepIndicator1: document.getElementById('stepIndicator1'),
        stepIndicator2: document.getElementById('stepIndicator2'),
        twoStepTurnstile: document.getElementById('twoStepTurnstile'),
        twoStepTurnstileHint: document.getElementById('twoStepTurnstileHint'),
        // === Standard Elements ===
        btnView: document.getElementById('viewKeysBtn'),
        keyContainerEl: document.getElementById('keyContainer'),
        keyValueEl: document.getElementById('keyValue'),
        messageEl: document.getElementById('message'),
        keysListUl: document.getElementById('keysList'),
        starfieldCanvas: document.getElementById('starfield-canvas'),
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
        userContent: document.getElementById('userContent'),
        helpButton: document.getElementById('helpButton'),
        tutorialModal: document.getElementById('tutorialModal'),
        closeTutorialModal: document.getElementById('closeTutorialModal'),
        accessGrantedOverlay: document.getElementById('accessGrantedOverlay'),
        // === Challenge Modal Elements ===
        challengeModal: document.getElementById('challengeModal'),
        challengeQuestion: document.getElementById('challengeQuestion'),
        challengeOptions: document.getElementById('challengeOptions'),
        challengeTimer: document.getElementById('challengeTimer'),
        challengeAttempts: document.getElementById('challengeAttempts'),
        closeChallengeModal: document.getElementById('closeChallengeModal')
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
        currentLanguage: navigator.language.startsWith('pt') ? 'pt' : 'en',
        turnstileToken: window._turnstileToken || null,
        turnstileVerifiedAt: window._turnstileVerifiedAt || null,
        // === TWO-STEP STATE (2026) ===
        currentStep: 0,                    // 0 = not started, 1 = step1, 2 = step2
        step1Token: null,                  // Token received after completing step1
        step2SessionId: null,              // Session ID for step2
        twoStepSessionId: null,            // Current session ID
        // === CHALLENGE STATE ===
        currentChallenge: null,
        challengeTimerInterval: null,
        proofToken: null
    };

    // Sincroniza o token global com o appState
    window._syncTurnstileState = function (token) {
        appState.turnstileToken = token;
        appState.turnstileVerifiedAt = Date.now();
        console.log('[Turnstile] State synced with appState');
    };

    // Se já foi verificado antes do DOM carregar, sincroniza
    if (window._turnstileToken) {
        appState.turnstileToken = window._turnstileToken;
        appState.turnstileVerifiedAt = window._turnstileVerifiedAt;
        console.log('[Turnstile] Pre-existing token synced');
    }

    function enableMethodButtons() {
        ['btnMethod1', 'btnMethod2', 'btnMethod3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        });
    }

    function disableMethodButtons() {
        ['btnMethod1', 'btnMethod2', 'btnMethod3'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
            }
        });
    }

    const translations = {
        en: {
            main_title: 'Access Terminal - MIRA HQ',
            main_subtitle: '🧑‍🚀 Crewmate, request your Access ID or check the current cycle logs. Stay alert!',
            status_online: 'MIRA HQ System Online',
            login_discord: 'Login with Discord',
            login_discord_subtitle: 'Fast and secure',
            auth_section_subtitle: 'Authenticate to generate your access key',
            auth_section_hint: '🔒 No write permissions requested',
            cooldown_title: '⚠️ SYSTEM IN COOLDOWN',
            cooldown_subtitle: 'Wait for new request',
            key_limit_text: 'You have {count} active ID(s) (maximum: {max} per Discord account)',
            key_limit_helper: '💡 Use an ID to free up space for new ones.',
            generate_button: '🚀 START TASK',
            generate_button_hint: 'Generate your mod key here',
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
            member_since_days: '{days} days',
            server_required_msg_title: '🎮 You must join our Discord server to generate keys!',
            server_required_msg_btn: '🚀 Join Server',
            server_required_msg_desc: 'After joining, refresh the page and login again.',
            auth_connecting: '🔄 Connecting to Discord...',
            auth_error: '❌ Error connecting to Discord',
            auth_verifying: '🔐 Verifying authentication...',
            auth_failed: '❌ Authentication failed',
            logout_success: '👋 Logout successful',
            processing_auth: 'AUTHENTICATING...',
            connecting_server: '🛰️ Connecting to server...',
            key_valid: '✅ Valid Access ID!',
            first_access: 'First Access!',
            veteran_crewmate: 'Veteran Crewmate!',
            security_expert: 'Security Expert!',
            emergency_error: '🚫 EMERGENCY: {error}',
            consulting_log: 'Consulting ID Log...',
            log_loaded: 'Report loaded.',
            no_id_found: 'No ID found.',
            wait_cooldown: '⏱️ WAIT: System in cooldown.',
            limit_reached: '⚠️ LIMIT REACHED: Max 5 IDs.',
            starting_verification: '⏳ Starting verification...',
            redirecting_portal: '⏳ Redirecting to portal...',
            unknown_error: 'Unknown error.',
            verification_complete: '✅ Verification complete! Requesting ID...',
            system_ready: '✅ System ready!',
            select_method_title: 'Select Method',
            select_method_desc: 'Choose one of the options below to start verification:',
            method_1: 'Method 1 (Recommended)',
            method_1_desc: 'Faster and more stable',
            method_2: 'Method 2',
            method_2_desc: 'Quick alternative',
            method_3: 'Method 3',
            method_3_desc: 'Alternative server',
            tutorial_title: 'How to Activate',
            step_1_title: 'Open Among Us',
            step_1_desc: 'Start the game with the mod installed.',
            step_2_title: 'Press F1',
            step_2_desc: 'In the main menu or lobby, press F1 to open the panel.',
            step_3_title: 'Paste Key',
            step_3_desc: 'Copy the key generated here and paste it into the mod activation field.',
            help_button_title: 'How to use?',
            view_keys_title: 'Consult Active Crewmate IDs',
            download_badge: '📡 DOWNLOAD STATION',
            download_title: 'CrewCore Mod Menu',
            version_latest: '✅ Latest version',
            download_hint: '🔒 Secure download via Cloudflare',
            download_client_title: 'Download Client',
            download_client_subtitle: 'Mod V6 • Game v17.1.0',
            download_now: 'Download Now',
            platform_steam: 'Steam',
            platform_epic: 'Epic Games',
            turnstile_hint: 'Complete the verification above to unlock the methods',
            turnstile_success: '✅ Verified! Select a method below',
            // === DOWNLOAD TURNSTILE ===
            download_turnstile_hint: '🔒 Complete the verification to unlock download',
            download_turnstile_success: '✅ Verified! Select platform below',
            download_turnstile_error: '❌ Verification failed. Try reloading the page.',
            download_turnstile_expired: '⚠️ Verification expired. Complete again.',
            download_turnstile_required: '🔒 Complete Cloudflare verification first!',
            // === ANTI-BYPASS CHALLENGE ===
            challenge_title: '🔐 Security Verification',
            challenge_subtitle: 'Complete the challenge to prove you are human',
            challenge_timeout: 'Time remaining:',
            challenge_attempts: 'Attempts:',
            challenge_solving: 'Verifying answer...',
            challenge_success: '✅ Challenge completed!',
            challenge_wrong: '❌ Oops! Wrong answer. Try again.',
            challenge_expired: '⏰ Time expired. No problem, start over!',
            challenge_blocked: '🚫 Bypass attempt detected! Wait 1 minute.',
            challenge_bypass_detected: '⚠️ Bypass detected! You must complete the shortener correctly.',
            verification_processing: '⏳ Processing return...',
            challenge_hint: '⚠️ Complete to receive your key',
            // === PREMIUM ===
            premium_title: 'Skip verification',
            plan_popular: 'POPULAR',
            plan_best: 'BEST VALUE',
            plan_48h_name: '48 Hours',
            plan_monthly_name: '30 Days',
            feature_no_verification: 'No verification',
            feature_unlimited: 'Unlimited uses',
            feature_instant: 'Instant activation',
            feature_priority: 'Priority support',
            feature_updates: 'Early access',
            buy_now: 'Buy',
            secure_payment: 'Secure payment via Stripe',
            premium_active_title: '⭐ PREMIUM ACTIVE',
            premium_active_text: 'You have active {type} access!',
            premium_active_sub: 'Your key is unique and can be used unlimited times until it expires.',
            premium_keys_title: '⭐ Your Premium Keys',
            // Plan Details (hover)
            detail_no_verification: '✓ No verification',
            detail_unlimited_keys: '✓ Unlimited uses',
            detail_expires_48h: '⏱️ Expires in 48 hours',
            detail_7days_access: '⏱️ 7 days of access',
            detail_30days_access: '⏱️ 30 days of access',
            detail_90days_access: '⏱️ 90 days of access',
            detail_1year_access: '⏱️ 1 full year',
            detail_never_expires: '♾️ NEVER expires',
            detail_auto_renew: '🔄 Auto-renews',
            detail_renew_3months: '🔄 Renews every 3 months',
            detail_renew_yearly: '🔄 Renews annually',
            detail_priority_support: '⚡ Priority support',
            detail_vip_support: '⚡ VIP support',
            detail_pay_once: '🎁 Pay once only',
            detail_save_28: '💰 28% savings',
            detail_save_20: '💰 20% savings',
            detail_save_50: '💰 50% savings',
            premium_features_shared: '✓ No verification • Unlimited uses • Priority support',
            // Plan Names
            plan_48h: '48h',
            plan_7days: '7 Days',
            plan_30days: '30 Days',
            plan_90days: '90 Days',
            plan_365days: '365 Days',
            plan_lifetime: 'Lifetime',
            plan_forever: 'Forever!',
            plan_per_month: '~$2.50/month',
            verifying_payment: 'Verifying payment...',
            // New Year
            newyear_premium_badge: '🎆 2026 PREMIUM',
            newyear_footer: '© 2026 CrewCore • The Year of Victory starts now 🎆',
            newyear_banner_text: '🎆 2026: Your Year of Victory 🎆',
            // Premium Success Modal
            premium_payment_confirmed: 'Payment Confirmed!',
            premium_key_ready: 'Your Premium key is ready!',
            premium_your_key: '⭐ YOUR PREMIUM KEY',
            premium_copy_key: '📋 COPY KEY',
            premium_how_to_use: '📖 How to use:',
            premium_step_1: 'Open Among Us with the mod installed',
            premium_step_2: 'Press <strong>F1</strong> in the main menu',
            premium_step_3: 'Paste the key in the activation field',
            premium_step_4: 'Enjoy Premium access for 48h! 🚀',
            // === PREMIUM USER PANEL ===
            premium_panel_badge: '👑 PREMIUM ACTIVE',
            premium_panel_title: 'Manage Premium Key',
            premium_label_key: '🔑 Key:',
            premium_label_plan: '📦 Plan:',
            premium_label_expires: '⏱️ Expires:',
            premium_hwid_bound: 'Bound',
            premium_hwid_unbound: 'Not bound',
            premium_reset_hwid: 'Reset HWID',
            premium_reset_cooldown: '1x per day',
            premium_panel_hint: 'Use reset to switch devices. Available 1x every 24h.',
            premium_available_in: 'Available in {hours}h',
            // Delete Key
            delete_key_button: '🗑️',
            delete_key_confirm: 'Are you sure you want to delete this key?',
            delete_key_deleting: '🗑️ Deleting...',
            delete_key_success: '✅ Key deleted successfully!',
            delete_key_error: '❌ Error deleting key',
            session_expired: 'Session expired. Please login again.',
            // Footer
            footer_made_with: 'Made with <span class="footer-heart">❤️</span> by <a href="https://discord.gg/ucm7pKGrVv" target="_blank">CrewCore Team</a>'
        },
        pt: {
            main_title: 'Terminal de Acesso - MIRA HQ',
            main_subtitle: '🧑‍🚀 Tripulante, requisite sua Identificação de Acesso ou verifique os registros do ciclo atual. Mantenha-se alerta!',
            status_online: 'Sistema MIRA HQ Online',
            login_discord: 'Entrar com Discord',
            login_discord_subtitle: 'Rápido e seguro',
            auth_section_subtitle: 'Autentique-se para gerar sua key de acesso',
            auth_section_hint: '🔒 Nenhuma permissão de escrita é solicitada',
            cooldown_title: '⚠️ SISTEMA EM COOLDOWN',
            cooldown_subtitle: 'Aguarde para nova solicitação',
            key_limit_text: 'Você possui {count} ID{s} ativa{s} (máximo: {max} por conta Discord)',
            key_limit_helper: '💡 Use uma ID para liberar espaço para novas.',
            generate_button: '🚀 START TASK',
            generate_button_hint: 'Gere sua key do mod aqui',
            view_keys_button: '🛰️ LOG DE SISTEMA',
            key_label: 'ID de Tripulante Designada:',
            copy_button: '📋 Copiar ID',
            generated_at: '📅 Gerada em:',
            key_type: '🔑 Tipo: Acesso MIRA HQ',
            key_status: '⏱️ Status: Ativa',
            records_title: 'Registros de IDs - Ciclo Atual',
            no_records: 'Nenhum registro de ID neste terminal para o ciclo atual.',
            support_button: '🆘 Suporte',
            translate_button: '🇺🇸 Translate to English',
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
            member_since_days: '{days} dias',
            server_required_msg_title: '🎮 Você precisa entrar no nosso servidor Discord para gerar keys!',
            server_required_msg_btn: '🚀 Entrar no Servidor',
            server_required_msg_desc: 'Depois de entrar, atualize a página e faça login novamente.',
            auth_connecting: '🔄 Conectando com Discord...',
            auth_error: '❌ Erro ao conectar com Discord',
            auth_verifying: '🔐 Verificando autenticação...',
            auth_failed: '❌ Falha na autenticação',
            logout_success: '👋 Logout realizado com sucesso',
            processing_auth: 'AUTENTICANDO...',
            connecting_server: '🛰️ Conectando com o servidor...',
            key_valid: '✅ ID de Acesso Válida!',
            first_access: 'Primeiro Acesso!',
            veteran_crewmate: 'Tripulante Veterano!',
            security_expert: 'Especialista em Segurança!',
            emergency_error: '🚫 EMERGÊNCIA: {error}',
            consulting_log: 'Consulting Log de IDs...',
            log_loaded: 'Relatório carregado.',
            no_id_found: 'Nenhuma ID encontrada.',
            wait_cooldown: '⏱️ AGUARDE: Sistema em cooldown.',
            limit_reached: '⚠️ LIMITE ATINGIDO: Máximo de 5 IDs.',
            starting_verification: '⏳ Iniciando verificação...',
            redirecting_portal: '⏳ Redirecionando para o portal...',
            unknown_error: 'Erro desconhecido.',
            verification_complete: '✅ Verificação completa! Solicitando ID...',
            system_ready: '✅ Sistema pronto!',
            select_method_title: 'Selecione o Método',
            select_method_desc: 'Escolha uma das opções abaixo para iniciar a verificação:',
            method_1: 'Método 1 (Recomendado)',
            method_1_desc: 'Mais rápido e estável',
            method_2: 'Método 2',
            method_2_desc: 'Alternativa rápida',
            method_3: 'Método 3',
            method_3_desc: 'Servidor alternativo',
            tutorial_title: 'Como Ativar o Mod',
            step_1_title: 'Abra o Among Us',
            step_1_desc: 'Inicie o jogo com o mod instalado.',
            step_2_title: 'Aperte F1',
            step_2_desc: 'No menu principal ou lobby, pressione a tecla F1 para abrir o painel.',
            step_3_title: 'Cole a Key',
            step_3_desc: 'Copie a key gerada aqui e cole no campo de ativação do mod.',
            help_button_title: 'Como usar?',
            view_keys_title: 'Consultar IDs de Tripulantes Ativos',
            download_badge: '📡 ESTAÇÃO DE DOWNLOAD',
            download_title: 'CrewCore Mod Menu',
            version_latest: '✅ Última versão',
            download_hint: '🔒 Download seguro via Cloudflare',
            download_now: 'Baixar Agora',
            platform_steam: 'Steam',
            platform_epic: 'Epic Games',
            turnstile_hint: 'Complete a verificação acima para desbloquear os métodos',
            turnstile_success: '✅ Verificado! Selecione um método abaixo',
            // === DOWNLOAD TURNSTILE ===
            download_turnstile_hint: '🔒 Complete a verificação para liberar o download',
            download_turnstile_success: '✅ Verificado! Selecione a plataforma abaixo',
            download_turnstile_error: '❌ Erro na verificação. Tente recarregar a página.',
            download_turnstile_expired: '⚠️ Verificação expirada. Complete novamente.',
            download_turnstile_required: '🔒 Complete a verificação Cloudflare primeiro!',
            // === ANTI-BYPASS CHALLENGE ===
            challenge_title: '🔐 Verificação de Segurança',
            challenge_subtitle: 'Complete o desafio para provar que você é humano',
            challenge_timeout: 'Tempo restante:',
            challenge_attempts: 'Tentativas:',
            challenge_solving: 'Verificando resposta...',
            challenge_success: '✅ Desafio completo!',
            challenge_wrong: '❌ Ops! Resposta errada. Tente novamente.',
            challenge_expired: '⏰ Tempo expirado. Sem problemas, comece novamente!',
            challenge_blocked: '🚫 Tentativa de bypass detectada! Aguarde 1 minuto.',
            challenge_bypass_detected: '⚠️ Bypass detectado! Você deve completar o encurtador corretamente.',
            verification_processing: '⏳ Processando retorno...',
            challenge_hint: '⚠️ Complete para receber sua key',
            // === PREMIUM ===
            premium_title: 'Pule a verificação',
            plan_popular: 'POPULAR',
            plan_best: 'MELHOR VALOR',
            plan_48h_name: '48 Horas',
            plan_monthly_name: '30 Dias',
            feature_no_verification: 'Sem verificação',
            feature_unlimited: 'Uso ilimitado',
            feature_instant: 'Ativação instantânea',
            feature_priority: 'Suporte prioritário',
            feature_updates: 'Acesso antecipado',
            buy_now: 'Comprar',
            secure_payment: 'Pagamento seguro via Stripe',
            premium_active_title: '⭐ PREMIUM ATIVO',
            premium_active_text: 'Você possui acesso {type} ativo!',
            premium_active_sub: 'Sua key é única e pode ser usada ilimitadamente até expirar.',
            premium_keys_title: '⭐ Suas Keys Premium',
            // Plan Details (hover)
            detail_no_verification: '✓ Sem verificação',
            detail_unlimited_keys: '✓ Uso ilimitado',
            detail_expires_48h: '⏱️ Expira em 48 horas',
            detail_7days_access: '⏱️ 7 dias de acesso',
            detail_30days_access: '⏱️ 30 dias de acesso',
            detail_90days_access: '⏱️ 90 dias de acesso',
            detail_1year_access: '⏱️ 1 ano completo',
            detail_never_expires: '♾️ NUNCA expira',
            detail_auto_renew: '🔄 Renova automático',
            detail_renew_3months: '🔄 Renova a cada 3 meses',
            detail_renew_yearly: '🔄 Renova anualmente',
            detail_priority_support: '⚡ Suporte prioritário',
            detail_vip_support: '⚡ Suporte VIP',
            detail_pay_once: '🎁 Pague uma vez só',
            detail_save_28: '💰 28% economia',
            detail_save_20: '💰 20% economia',
            detail_save_50: '💰 50% economia',
            premium_features_shared: '✓ Sem verificação • Uso ilimitado • Suporte prioritário',
            // Plan Names
            plan_48h: '48h',
            plan_7days: '7 Dias',
            plan_30days: '30 Dias',
            plan_90days: '90 Dias',
            plan_365days: '365 Dias',
            plan_lifetime: 'Lifetime',
            plan_forever: 'Para sempre!',
            plan_per_month: '~R$12/mês',
            verifying_payment: 'Verificando pagamento...',
            // New Year
            newyear_premium_badge: '🎆 2026 PREMIUM',
            newyear_footer: '© 2026 CrewCore • O Ano da Vitória começa agora 🎆',
            newyear_banner_text: '🎆 2026: Seu Ano de Vitória 🎆',
            // Premium Success Modal
            premium_payment_confirmed: 'Pagamento Confirmado!',
            premium_key_ready: 'Sua chave Premium está pronta!',
            premium_your_key: '⭐ SUA CHAVE PREMIUM',
            premium_copy_key: '📋 COPIAR CHAVE',
            premium_how_to_use: '📖 Como usar:',
            premium_step_1: 'Abra o Among Us com o mod instalado',
            premium_step_2: 'Pressione <strong>F1</strong> no menu principal',
            premium_step_3: 'Cole a chave no campo de ativação',
            premium_step_4: 'Aproveite o acesso Premium por 48h! 🚀',
            // === PREMIUM USER PANEL ===
            premium_panel_badge: '👑 PREMIUM ATIVO',
            premium_panel_title: 'Gerenciar Key Premium',
            premium_label_key: '🔑 Key:',
            premium_label_plan: '📦 Plano:',
            premium_label_expires: '⏱️ Expira:',
            premium_hwid_bound: 'Vinculado',
            premium_hwid_unbound: 'Não vinculado',
            premium_reset_hwid: 'Resetar HWID',
            premium_reset_cooldown: '1x por dia',
            premium_panel_hint: 'Use o reset para mudar de dispositivo. Disponível 1x a cada 24h.',
            premium_available_in: 'Disponível em {hours}h',
            // Delete Key
            delete_key_button: '🗑️',
            delete_key_confirm: 'Tem certeza que deseja excluir esta key?',
            delete_key_deleting: '🗑️ Excluindo...',
            delete_key_success: '✅ Key excluída com sucesso!',
            delete_key_error: '❌ Erro ao excluir key',
            session_expired: 'Sessão expirada. Faça login novamente.',
            // Footer
            footer_made_with: 'Feito com <span class="footer-heart">❤️</span> por <a href="https://discord.gg/ucm7pKGrVv" target="_blank">CrewCore Team</a>',
            download_client_title: 'Obter Cliente',
            download_client_subtitle: 'Mod V6 • Game v17.1.0',
        }
    };

    // ==========================================
    // NEW YEAR 2026 VISUAL EFFECTS
    // ==========================================
    function initNewYearEffects() {
        // 1. Champagne Bubbles
        const bubbleContainer = document.getElementById('champagneBubbles');
        if (bubbleContainer) {
            const createBubble = () => {
                const bubble = document.createElement('div');
                bubble.classList.add('c-bubble');

                // Random properties
                const size = Math.random() * 6 + 2; // 2px to 8px
                const left = Math.random() * 100; // 0% to 100%
                const duration = Math.random() * 4 + 4; // 4s to 8s
                const wobble = (Math.random() - 0.5) * 50 + 'px'; // -25px to 25px
                const delay = Math.random() * 5;

                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${left}%`;
                bubble.style.setProperty('--wobble', wobble);
                bubble.style.animationDuration = `${duration}s`;
                bubble.style.animationDelay = `${delay}s`;

                bubbleContainer.appendChild(bubble);

                // Remove after animation
                setTimeout(() => {
                    bubble.remove();
                }, (duration + delay) * 1000);
            };

            // Spawn initial batch
            for (let i = 0; i < 30; i++) createBubble();
            // Continuous spawn
            setInterval(createBubble, 300);
        }

        // 2. Button Interactive Effects & Magnetic Pull
        const mainBtn = document.getElementById('btnOpenMethodMenu');
        if (mainBtn) {
            // Magnetic Effect Variables
            const magnetStrength = 0.4; // How strong the pull is
            const magnetRange = 100; // Pixels
            let btnRect = mainBtn.getBoundingClientRect();

            // Re-calculate rect on scroll/resize
            window.addEventListener('scroll', () => { btnRect = mainBtn.getBoundingClientRect(); });
            window.addEventListener('resize', () => { btnRect = mainBtn.getBoundingClientRect(); });

            document.addEventListener('mousemove', (e) => {
                // Accessibility: Disable if reduced motion is preferred
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

                // Return if button is hidden or disabled to save perf
                if (mainBtn.offsetParent === null) return;

                const dx = e.clientX - (btnRect.left + btnRect.width / 2);
                const dy = e.clientY - (btnRect.top + btnRect.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < magnetRange) {
                    const tx = dx * magnetStrength;
                    const ty = dy * magnetStrength;
                    mainBtn.style.transform = `translate(${tx}px, ${ty}px) scale(1.05)`;

                    // Sound: Low Sci-Fi Hum on enter
                    if (!mainBtn.hasMagnetSoundPlayed && appState.soundEnabled) {
                        playSound(100, 150, 'triangle'); // Low hum
                        mainBtn.hasMagnetSoundPlayed = true;
                    }

                    // Throttle confetti inside the magnetic field
                    if (dist < 40 && Math.random() > 0.92) {
                        if (window.confetti) {
                            const xRatio = (e.clientX - btnRect.left) / btnRect.width;
                            const yRatio = (e.clientY - btnRect.top) / btnRect.height;
                            window.confetti({
                                particleCount: 2,
                                spread: 20,
                                origin: {
                                    x: (btnRect.left + btnRect.width * xRatio) / window.innerWidth,
                                    y: (btnRect.top + btnRect.height * yRatio) / window.innerHeight
                                },
                                colors: ['#FFD700', '#FFF8DC'],
                                scalar: 0.4,
                                gravity: 0.8,
                                ticks: 30,
                                disableForReducedMotion: true
                            });
                        }
                    }
                } else {
                    mainBtn.style.transform = 'translate(0, 0) scale(1)';
                    mainBtn.hasMagnetSoundPlayed = false;
                }
            });
        }

        // 3. Holographic 3D Tilt (Optimized with Caching & rAF)
        const cards = document.querySelectorAll('.premium-plan');
        if (cards.length > 0) {
            let cardRects = [];
            let isAnimating = false;
            let mouseX = 0;
            let mouseY = 0;

            // Cache Rects to avoid layout thrashing
            const updateCardRects = () => {
                cardRects = Array.from(cards).map(card => ({
                    element: card,
                    rect: card.getBoundingClientRect()
                }));
            };

            // Update rects on load, scroll, resize
            updateCardRects();
            window.addEventListener('scroll', updateCardRects, { passive: true });
            window.addEventListener('resize', updateCardRects, { passive: true });

            // Animation Loop
            const animateCards = () => {
                if (!isAnimating) return;

                // Accessibility: Stop if reduced motion is preferred
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    isAnimating = false;
                    return;
                }

                cardRects.forEach(({ element, rect }) => {
                    const x = mouseX - rect.left;
                    const y = mouseY - rect.top;

                    // Check bounds with some padding
                    if (x > -50 && x < rect.width + 50 && y > -50 && y < rect.height + 50) {
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;

                        // Calculate rotation (Limit to ±10deg)
                        const rotateX = ((y - centerY) / centerY) * -10;
                        const rotateY = ((x - centerX) / centerX) * 10;

                        element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

                        // Update shine position CSS vars
                        const shineX = ((x / rect.width) * 100).toFixed(1) + '%';
                        const shineY = ((y / rect.height) * 100).toFixed(1) + '%';

                        element.style.setProperty('--shine-x', shineX);
                        element.style.setProperty('--shine-y', shineY);
                    } else {
                        // Reset if active local style exists
                        if (element.style.transform) {
                            element.style.transform = '';
                        }
                    }
                });

                requestAnimationFrame(animateCards);
            };

            // Mouse Listener just updates coordinates and starts loop
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;

                if (!isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(animateCards);
                }

                // Optional: Stop animation if no mouse movement for a while (debounce or specific logic),
                // but for now, constant rAF when mouse moves is standard for this effect.
                // To save battery, we could use a timeout to set isAnimating = false.
                clearTimeout(window.hoverTimeout);
                window.hoverTimeout = setTimeout(() => { isAnimating = false; }, 500);
            }, { passive: true });
        }
    }

    // Initialize effects
    initNewYearEffects();

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
            this.handleCallbackFromURL();
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

            if (elements.helpButton) elements.helpButton.addEventListener('click', () => { elements.tutorialModal.style.display = 'block'; });
            if (elements.closeTutorialModal) elements.closeTutorialModal.addEventListener('click', () => { elements.tutorialModal.style.display = 'none'; });
            window.addEventListener('click', (e) => { if (e.target === elements.tutorialModal) elements.tutorialModal.style.display = 'none'; });
        }

        async startAuth() {
            try {
                showUIMessage(translations[appState.currentLanguage].auth_connecting, 'info');
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/discord`);
                const data = await response.json();
                if (data.status === 'success') window.location.href = data.auth_url;
            } catch (error) {
                showUIMessage(translations[appState.currentLanguage].auth_error, 'error');
            }
        }

        async handleCallbackFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            if (code && state) {
                try {
                    showUIMessage(translations[appState.currentLanguage].auth_verifying, 'info');
                    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/discord/callback`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, state })
                    });
                    const data = await response.json();
                    if (data.status === 'success') await this.handleAuthSuccess(data);
                    else if (data.status === 'server_required') this.handleServerRequired(data);
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (error) {
                    showUIMessage(translations[appState.currentLanguage].auth_failed, 'error');
                }
            }
        }

        async handleAuthSuccess(data) {
            this.sessionId = data.session_id;
            this.userData = data.user;
            this.isAuthenticated = true;
            this.sessionExpiresAt = Date.now() + CONFIG.SESSION_DURATION_MS;

            localStorage.setItem('crewbot_session', this.sessionId);
            localStorage.setItem('crewbot_user', JSON.stringify(this.userData));
            localStorage.setItem('crewbot_session_expires', this.sessionExpiresAt.toString());

            await this.loadUserStats();
            this.updateUI();
            showUIMessage(data.message, 'success');
            if (appState.soundEnabled) playSoundSequence([{ freq: 523, duration: 100, type: 'sine' }, { freq: 659, duration: 100, type: 'sine' }, { freq: 784, duration: 200, type: 'sine' }]);
            await fetchUserKeyList();
        }

        handleServerRequired(data) {
            const lang = appState.currentLanguage;
            showUIMessage(data.message, 'error', 10000);
            elements.authSection.innerHTML = `
              <div class="server-required-message">
                <p>${translations[lang].server_required_msg_title}</p>
                <a href="${data.discord_invite}" target="_blank" class="server-invite-btn">${translations[lang].server_required_msg_btn}</a>
                <p style="margin-top: 0.5rem; font-size: 0.9em;">${translations[lang].server_required_msg_desc}</p>
              </div>`;
        }

        async validateSession() {
            if (!this.sessionId) return false;
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/me`, { headers: { 'X-Session-ID': this.sessionId } });
                if (response.status === 401) {
                    console.warn('Sessão expirada (401) no validateSession. Realizando logout...');
                    await this.logout();
                    return false;
                }
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        this.userData = data.user;
                        this.updateUI();
                        return true;
                    }
                }
            } catch (error) { console.error('Erro ao validar sessão:', error); }
            return false;
        }

        async loadUserStats() {
            if (!this.sessionId) return;
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/user-stats`, { headers: { 'X-Session-ID': this.sessionId } });
                if (response.status === 401) {
                    console.warn('Sessão expirada (401) no loadUserStats. Realizando logout...');
                    await this.logout();
                    return;
                }
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

        hideUserModal() {
            if (elements.userProfileModal) elements.userProfileModal.style.display = 'none';
        }

        updateModal() {
            if (!this.userData || !this.userStats) return;

            const userId = this.userData.id || this.userData.userId;
            const avatarUrl = this.getAvatarUrl(userId, this.userData.avatar, 128);
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

            // Animação de atualização nos stats
            const animateStat = (el, value) => {
                el.textContent = value;
                el.classList.add('updating');
                setTimeout(() => el.classList.remove('updating'), 500);
            };
            animateStat(elements.statKeysToday, this.userStats.keys_today);
            animateStat(elements.statTotalKeys, this.userStats.keys_total);
            animateStat(elements.statActiveKeys, this.userStats.keys_active);

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
            if (this.isLoggingOut) return; // Prevent recursive logout
            this.isLoggingOut = true;
            this.isAuthenticated = false; // Immediately mark as not authenticated

            if (this.sessionId) {
                try {
                    // Fire and forget logout to avoid blocking UI
                    fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: this.sessionId })
                    }).catch(e => console.warn('Logout request failed:', e));
                } catch (error) { console.error('Erro no logout:', error); }
            }

            ['crewbot_session', 'crewbot_user', 'crewbot_stats', 'crewbot_session_expires'].forEach(k => localStorage.removeItem(k));
            // Limpa também dados de bypass pendentes
            clearBypassStorage();
            Object.assign(this, { sessionId: null, userData: null, userStats: null, isAuthenticated: false, sessionExpiresAt: 0 });

            this.updateUI();
            this.hideUserModal();
            showUIMessage(translations[appState.currentLanguage].logout_success, 'info');

            // Ensure we don't fetch keys after logout
            appState.userKeys = [];
            renderKeysList();
            updateKeyLimitDisplay();

            this.isLoggingOut = false;
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
                const userId = this.userData.id || this.userData.userId;
                const avatarUrl = this.getAvatarUrl(userId, this.userData.avatar, 40);
                elements.userAvatarHeader.src = avatarUrl;
                elements.userNameHeader.textContent = this.userData.global_name || this.userData.username;
                elements.userDiscriminatorHeader.textContent = `@${this.userData.username}`;
                this.updateGenerateButton(this.userStats ? this.userStats.is_server_member : false);
            }
        }

        updateGenerateButton(isServerMember) {
            // Update all 3 method buttons
            if (elements.btnOpenMethodMenu) {
                const btn = elements.btnOpenMethodMenu;
                const lang = appState.currentLanguage; // Define lang here
                if (isServerMember && this.isAuthenticated) {
                    btn.disabled = false;
                    btn.title = 'Iniciar Task';
                } else {
                    btn.disabled = true;
                    if (!this.isAuthenticated) {
                        btn.title = 'Faça login com Discord para gerar keys';
                    } else {
                        btn.title = 'Entre no servidor Discord para gerar keys';
                    }
                }
            }
            // applyTranslation(lang); // This should not be here, it's called globally
        }

        getAuthHeaders() {
            return this.sessionId ? { 'X-Session-ID': this.sessionId } : {};
        }

        async refreshStats() {
            await this.loadUserStats();
            this.updateUI();
        }
    }

    const discordAuth = new DiscordAuthSystem();

    // sanitizeInput removido pois textContent já é seguro e isso causava escape duplo.

    function validateKey(key) { return typeof key === 'string' && /^[A-Z0-9-]{19}$/.test(key); }
    function validateToken(token) { return typeof token === 'string' && /^[a-zA-Z0-9\-_]{20,}$/.test(token); }

    function initAudioContext() {
        if (!appState.audioContext && appState.soundEnabled) {
            try { appState.audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.error("Audio Context not supported"); }
        }
    }

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
        } catch (e) { console.error("Error playing sound", e); }
    }

    function playSoundSequence(sequence) {
        if (!appState.soundEnabled || !Array.isArray(sequence)) return;
        sequence.forEach((note, index) => {
            if (note && typeof note.freq === 'number') setTimeout(() => playSound(note.freq, note.duration, note.type), index * 150);
        });
    }

    function updateSoundToggle() {
        // elements.soundToggle.textContent = appState.soundEnabled ? '🔊' : '🔇';
        // elements.soundToggle.classList.toggle('active', appState.soundEnabled);
        localStorage.setItem('soundEnabled', appState.soundEnabled.toString());
    }

    function setButtonLoading(button, isLoading) {
        if (!button) return;
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
    }

    // setAllMethodsLoading removed as we now use the main button loading state or modal logic


    function showUIMessage(text, type = 'info', duration = 4500) {
        // Sanitiza texto para prevenir XSS
        const sanitizedText = text.replace(/[<>]/g, '').slice(0, 200);
        elements.messageEl.textContent = sanitizedText;
        elements.messageEl.className = `message visible show ${type}`;
        // Announce to screen readers
        elements.messageEl.setAttribute('role', 'alert');
        elements.messageEl.setAttribute('aria-live', 'polite');
        if (elements.messageEl.timeoutId) clearTimeout(elements.messageEl.timeoutId);
        if (duration > 0) elements.messageEl.timeoutId = setTimeout(() => {
            elements.messageEl.classList.remove('show');
            setTimeout(() => { elements.messageEl.className = 'message'; }, 300);
        }, duration);
    }

    function updateKeyLimitDisplay() {
        const keysUsed = appState.userKeys.length;
        const lang = appState.currentLanguage;

        const limitText = translations[lang].key_limit_text
            .replace('{count}', keysUsed)
            .replace('{max}', CONFIG.MAX_KEY_LIMIT)
            .replace('{s}', keysUsed !== 1 ? 's' : '');
        elements.keyLimitText.textContent = limitText;
        elements.keyLimitHelper.textContent = translations[lang].key_limit_helper;

        elements.keyLimitInfo.className = 'key-limit-info';
        if (keysUsed >= CONFIG.MAX_KEY_LIMIT) elements.keyLimitInfo.classList.add('key-limit-full');
        else if (keysUsed >= CONFIG.MAX_KEY_LIMIT - 2) elements.keyLimitInfo.classList.add('key-limit-warning');

        elements.keyLimitSection.style.display = 'block';
    }

    function renderKeysList() {
        elements.keysListUl.innerHTML = '';
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
                li.className = 'key-item';
                li.innerHTML = `
                    <span class="key-value">${key}</span>
                    <button class="key-delete-btn" title="${translations[appState.currentLanguage].delete_key_confirm}" data-key="${key}">
                        ${translations[appState.currentLanguage].delete_key_button}
                    </button>
                `;
                // Add click listener for delete button
                const deleteBtn = li.querySelector('.key-delete-btn');
                deleteBtn.addEventListener('click', () => handleDeleteKey(key));
                elements.keysListUl.appendChild(li);
            }
        });
    }

    // === DELETE KEY FUNCTION (SECURE) ===
    async function handleDeleteKey(key) {
        const lang = appState.currentLanguage;

        // Confirmation dialog
        if (!confirm(translations[lang].delete_key_confirm)) {
            return;
        }

        try {
            showUIMessage(translations[lang].delete_key_deleting, 'info', 0);
            const headers = discordAuth.getAuthHeaders();
            const response = await fetch(`${CONFIG.API_BASE_URL}/delete_key?key=${encodeURIComponent(key)}`, {
                method: 'DELETE',
                headers
            });

            if (response.status === 401) {
                showUIMessage(translations[lang].session_expired, 'error');
                await discordAuth.logout();
                return;
            }

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // Remove from local state and re-render
                appState.userKeys = appState.userKeys.filter(k => k !== key);
                renderKeysList();
                updateKeyLimitDisplay();
                await discordAuth.refreshStats();
                showUIMessage(translations[lang].delete_key_success, 'success');
                if (appState.soundEnabled) playSound(440, 150, 'sine');
            } else {
                showUIMessage(data.message || translations[lang].delete_key_error, 'error');
                if (appState.soundEnabled) playSound(200, 300, 'sawtooth');
            }
        } catch (error) {
            console.error('[DeleteKey] Error:', error);
            showUIMessage(translations[lang].delete_key_error, 'error');
            if (appState.soundEnabled) playSound(200, 300, 'sawtooth');
        }
    }

    function createConfetti(x, y) {
        const colors = ['#ffcb74', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            colors: colors,
            disableForReducedMotion: true
        });
    }

    function triggerConfetti() {
        const duration = 2000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ffcb74', '#e74c3c', '#3498db']
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ffcb74', '#e74c3c', '#3498db']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    function typeWriterEffect(text, element, speed = 40) {
        element.textContent = '';
        element.classList.add('typing-cursor');
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                // Randomize speed slightly for realism
                setTimeout(type, speed + Math.random() * 30);
            } else {
                element.classList.remove('typing-cursor');
            }
        }
        type();
    }

    function showAccessGranted() {
        const overlay = elements.accessGrantedOverlay;
        if (!overlay) return;
        overlay.classList.add('show');
        // Play a heavy "access granted" sound if enabled
        if (appState.soundEnabled) {
            playSoundSequence([
                { freq: 150, duration: 100, type: 'sawtooth' },
                { freq: 150, duration: 100, type: 'sawtooth' },
                { freq: 400, duration: 400, type: 'square' }
            ]);
        }
        // Fade out mais rápido para mostrar a key sendo escrita
        setTimeout(() => {
            overlay.classList.add('fading');
        }, 1200);
        setTimeout(() => {
            overlay.classList.remove('show', 'fading');
        }, 1800);
    }

    async function copyToClipboard() {
        const keyValue = elements.keyValueEl.textContent?.trim();
        if (!keyValue || keyValue.includes('...') || keyValue.includes('AUTENTICANDO') || !validateKey(keyValue)) return;
        try {
            await navigator.clipboard.writeText(keyValue);
            const copyButtonSpan = elements.copyButton.querySelector('span');
            if (copyButtonSpan) copyButtonSpan.textContent = translations[appState.currentLanguage].copied_text;
            elements.copyButton.classList.add('copied');
            if (appState.soundEnabled) playSoundSequence([{ freq: 800, duration: 100, type: 'sine' }, { freq: 1000, duration: 150, type: 'sine' }]);

            const rect = elements.copyButton.getBoundingClientRect();
            createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

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
        elements.achievementPopup.textContent = `🏆 ${text.slice(0, 100)}`;
        elements.achievementPopup.classList.add('show');
        setTimeout(() => {
            elements.achievementPopup.classList.remove('show');
        }, 3000);
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
        if (elements.btnOpenMethodMenu) elements.btnOpenMethodMenu.disabled = true;

        let remaining = Math.max(0, seconds);
        elements.cooldownTime.textContent = `${remaining}s`;

        appState.cooldownTimer = setInterval(() => {
            remaining--;
            elements.cooldownTime.textContent = `${remaining}s`;
            if (remaining <= 0) {
                clearInterval(appState.cooldownTimer);
                appState.isInCooldown = false;
                elements.cooldownSection.style.display = 'none';
                if (elements.btnOpenMethodMenu) elements.btnOpenMethodMenu.disabled = false;
                if (appState.soundEnabled) playSoundSequence([{ freq: 440, duration: 100, type: 'sine' }, { freq: 554, duration: 100, type: 'sine' }, { freq: 659, duration: 200, type: 'sine' }]);
                showUIMessage(translations[appState.currentLanguage].system_ready, 'success');
            }
        }, 1000);
    }

    async function generateNewKey() {
        if (appState.isProcessing) return;
        appState.isProcessing = true;

        try {
            initAudioContext();
            if (appState.soundEnabled) playSoundSequence([{ freq: 800, duration: 100, type: 'square' }, { freq: 600, duration: 100, type: 'square' }, { freq: 400, duration: 150, type: 'square' }]);

            setButtonLoading(elements.btnOpenMethodMenu, true);
            elements.keyContainerEl.classList.remove('visible');
            elements.keyActions.style.display = 'none';
            elements.keyMetadata.style.display = 'none';
            elements.keyValueEl.textContent = translations[appState.currentLanguage].processing_auth;
            elements.keyValueEl.classList.add('processing');

            // === ANTI-BYPASS: Usa proof_token em vez de verification_token ===
            const proofToken = appState.proofToken || localStorage.getItem(CONFIG.BYPASS_PROOF_TOKEN_KEY);
            if (!proofToken || !validateToken(proofToken)) {
                throw new Error('Token de prova ausente. Complete a verificação primeiro.');
            }

            showUIMessage(translations[appState.currentLanguage].connecting_server, 'info', 0);
            const headers = { 'X-Proof-Token': proofToken, ...discordAuth.getAuthHeaders() };
            const response = await fetch(`${CONFIG.API_BASE_URL}/generate_key`, { method: 'GET', headers });

            if (response.status === 401) {
                showUIMessage('Sessão expirada. Faça login novamente.', 'error');
                await discordAuth.logout();
                return;
            }

            const data = await response.json();

            elements.keyValueEl.classList.remove('processing');

            // === ANTI-BYPASS: Limpa proof token após uso ===
            clearBypassStorage();

            if (response.ok && data.status === 'success' && validateKey(data.key)) {
                // Visual Dopamine Sequence
                showAccessGranted();
                triggerConfetti();

                elements.keyContainerEl.classList.add('visible', 'success');
                elements.keyContainerEl.classList.add('pop-in');

                // Remove success class after animation
                setTimeout(() => elements.keyContainerEl.classList.remove('success'), 600);

                // Delay showing the key to sync with overlay fade out
                setTimeout(() => {
                    typeWriterEffect(data.key, elements.keyValueEl);
                }, 1300);

                elements.keyActions.style.display = 'flex';
                elements.keyMetadata.style.display = 'block';
                elements.keyTimestamp.textContent = new Date().toLocaleString('pt-BR');

                // Adiciona animação de pulso ao botão de copiar para chamar atenção
                if (elements.copyButton) {
                    elements.copyButton.classList.add('pulse-hint');
                    setTimeout(() => elements.copyButton.classList.remove('pulse-hint'), 4500);
                }

                appState.keyGenerationCount++;
                appState.lastKeyGenerationTime = Date.now();
                localStorage.setItem('keyGenerationCount', appState.keyGenerationCount.toString());
                localStorage.setItem('lastKeyGenerationTime', appState.lastKeyGenerationTime.toString());

                if (appState.soundEnabled) playSoundSequence([{ freq: 523, duration: 150, type: 'sine' }, { freq: 659, duration: 150, type: 'sine' }, { freq: 784, duration: 200, type: 'sine' }, { freq: 1047, duration: 250, type: 'sine' }]);
                showUIMessage(translations[appState.currentLanguage].key_valid, 'success');

                if (appState.keyGenerationCount === 1) showAchievement(translations[appState.currentLanguage].first_access);
                else if (appState.keyGenerationCount === 5) showAchievement(translations[appState.currentLanguage].veteran_crewmate);
                else if (appState.keyGenerationCount === 10) showAchievement(translations[appState.currentLanguage].security_expert);

                await fetchUserKeyList();
                await discordAuth.refreshStats();
                startCooldown(CONFIG.COOLDOWN_DURATION / 1000);
            } else {
                const errorMessage = data?.message || 'ERRO: Solicitação Negada.';

                // Se for erro de "muito rápido" (400) ou rate limit (429), tenta novamente após um delay curto
                if (response.status === 400 && errorMessage.includes('rápida')) {
                    showUIMessage('Verificando segurança... aguarde.', 'info', 2000);
                    setTimeout(() => generateNewKey(), 2500); // Tenta de novo em 2.5s
                    return;
                }

                if (response.status === 429) startCooldown(60);
                showUIMessage(errorMessage, 'error');
                if (appState.soundEnabled) playSound(200, 500, 'sawtooth');
            }
        } catch (error) {
            elements.keyValueEl.classList.remove('processing');
            clearBypassStorage();
            showUIMessage(translations[appState.currentLanguage].emergency_error.replace('{error}', error.message), 'error');
            if (appState.soundEnabled) playSound(150, 800, 'sawtooth');
        } finally {
            setButtonLoading(elements.btnOpenMethodMenu, false);
            appState.isProcessing = false;
        }
    }

    async function fetchUserKeyList() {
        // Don't fetch if not authenticated or if logging out
        if (!discordAuth.isAuthenticated || !discordAuth.sessionId || discordAuth.isLoggingOut) {
            console.log('[fetchUserKeyList] User not authenticated or logging out, skipping');
            return;
        }

        try {
            setButtonLoading(elements.btnView, true);
            showUIMessage(translations[appState.currentLanguage].consulting_log, 'info', 0);
            const headers = discordAuth.getAuthHeaders();
            const response = await fetch(`${CONFIG.API_BASE_URL}/user_keys`, { headers });

            if (response.status === 401) {
                console.warn('Sessão expirada (401) no fetchUserKeyList. Realizando logout...');
                await discordAuth.logout();
                return;
            }

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                appState.userKeys = data.keys || [];
                renderKeysList();
                updateKeyLimitDisplay();
                showUIMessage(appState.userKeys.length > 0 ? translations[appState.currentLanguage].log_loaded : translations[appState.currentLanguage].no_id_found, 'info', 3000);
            } else {
                throw new Error(data.message || `FALHA ${response.status}.`);
            }
        } catch (error) {
            showUIMessage(`❌ ${error.message}`, 'error');
        } finally {
            setButtonLoading(elements.btnView, false);
        }
    }

    // Busca status premium do usuário e keys premium
    async function fetchUserPremiumStatus() {
        if (!discordAuth.isAuthenticated || !discordAuth.sessionId) return;

        try {
            const headers = discordAuth.getAuthHeaders();
            const response = await fetch(`${CONFIG.API_BASE_URL}/user_premium_keys`, { headers });

            if (response.status === 401) return;

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                appState.userPremiumKeys = data.premium_keys || [];
                appState.hasActivePremium = data.has_active_premium || false;
                appState.activePremiumType = data.active_key_type || null;

                // Se usuário é premium ativo, esconde a seção de upsell e mostra badge
                const premiumSection = document.getElementById('premiumSection');
                if (premiumSection) {
                    if (appState.hasActivePremium) {
                        // Substitui conteúdo por status premium (com suporte a tradução)
                        const lang = appState.currentLanguage || 'pt';
                        const t = translations[lang];
                        premiumSection.innerHTML = `
                            <div class="premium-active-banner">
                                <span class="premium-badge-large">${t.premium_active_title}</span>
                                <p class="premium-status-text">
                                    ${t.premium_active_text.replace('{type}', `<strong>${appState.activePremiumType?.toUpperCase()}</strong>`)}
                                </p>
                                <p class="premium-status-sub">${t.premium_active_sub}</p>
                            </div>
                        `;
                        premiumSection.style.display = 'block';
                    } else {
                        // Mostra seção de upsell normalmente
                        premiumSection.style.display = 'block';
                    }
                }

                // Adiciona keys premium à lista de exibição
                renderPremiumKeysList();
            }
        } catch (error) {
            console.error('Erro ao verificar status premium:', error);
        }
    }

    // Renderiza keys premium na lista (exclui expiradas)
    function renderPremiumKeysList() {
        // Filtra apenas keys que NÃO estão expiradas
        const activeKeys = (appState.userPremiumKeys || []).filter(k => k.status !== 'expired');
        if (activeKeys.length === 0) {
            // Remove seção se não houver keys ativas
            const existingSection = document.getElementById('premiumKeysSection');
            if (existingSection) existingSection.remove();
            return;
        }

        // Adiciona seção de keys premium acima das standard
        const lang = appState.currentLanguage || 'pt';
        const t = translations[lang];
        let premiumSection = document.getElementById('premiumKeysSection');
        if (!premiumSection) {
            premiumSection = document.createElement('section');
            premiumSection.id = 'premiumKeysSection';
            premiumSection.className = 'keys-list-section premium-keys-section';
            premiumSection.innerHTML = `<h2>${t.premium_keys_title}</h2><ul id="premiumKeysList"></ul>`;

            // Insere antes da seção de keys normais
            const standardSection = document.querySelector('.keys-list-section');
            if (standardSection) {
                standardSection.parentNode.insertBefore(premiumSection, standardSection);
            }
        }

        const listEl = document.getElementById('premiumKeysList');
        if (listEl) {
            listEl.innerHTML = '';
            activeKeys.forEach(key => {
                const li = document.createElement('li');
                li.className = 'premium-key-item';

                const statusBadge = key.status === 'active'
                    ? `<span class="key-status active">✅ ${key.time_remaining || 'Ativo'}</span>`
                    : key.status === 'unused'
                        ? '<span class="key-status unused">🔑 Não usada</span>'
                        : '<span class="key-status expired">❌ Expirada</span>';

                li.innerHTML = `
                    <span class="premium-key-value">${key.key}</span>
                    <span class="premium-key-type">${key.type?.toUpperCase()}</span>
                    ${statusBadge}
                `;
                listEl.appendChild(li);
            });
        }
    }

    // ==================== SISTEMA DE 2 PASSOS (2026) ====================
    // PASSO 1: Linkvertise → valida hash → libera Passo 2
    // PASSO 2: DirectLink → challenge → key
    // =====================================================================

    // Estado do Two-Step
    const twoStepState = {
        step: parseInt(localStorage.getItem(CONFIG.TWOSTEP_CURRENT_STEP_KEY)) || 0,
        sessionId: localStorage.getItem(CONFIG.TWOSTEP_SESSION_KEY) || null,
        step1Token: localStorage.getItem(CONFIG.TWOSTEP_STEP1_TOKEN_KEY) || null
    };

    // Abre modal de 2 passos
    function openTwoStepModal() {
        if (!elements.twoStepModal) return;

        // Sincroniza estado visual
        updateTwoStepUI();

        // Renderiza Turnstile no modal
        if (window.turnstile && elements.twoStepTurnstile && !elements.twoStepTurnstile.hasChildNodes()) {
            window.turnstile.render(elements.twoStepTurnstile, {
                sitekey: window.TURNSTILE_SITE_KEY || '0x4AAAAAAAyJMvlWdQ3PY34K',
                theme: 'dark',
                callback: function (token) {
                    appState.turnstileToken = token;
                    appState.turnstileVerifiedAt = Date.now();
                    enableStepButtons();
                    if (elements.twoStepTurnstileHint) {
                        elements.twoStepTurnstileHint.textContent = '✅ Verificado!';
                        elements.twoStepTurnstileHint.style.color = '#00ff88';
                    }
                }
            });
        }

        elements.twoStepModal.style.display = 'block';
    }

    // Atualiza UI dos passos
    function updateTwoStepUI() {
        const step1Complete = !!twoStepState.step1Token;

        // Step 1 Card
        if (elements.stepCard1) {
            elements.stepCard1.classList.remove('current', 'completed', 'locked');
            if (step1Complete) {
                elements.stepCard1.classList.add('completed');
                if (elements.step1Status) elements.step1Status.textContent = '✅';
            } else {
                elements.stepCard1.classList.add('current');
                if (elements.step1Status) elements.step1Status.textContent = '⏳';
            }
        }

        // Step 2 Card
        if (elements.stepCard2) {
            elements.stepCard2.classList.remove('current', 'completed', 'locked');
            if (step1Complete) {
                elements.stepCard2.classList.add('current');
                if (elements.step2Status) elements.step2Status.textContent = '⏳';
                if (elements.step2LockedOverlay) elements.step2LockedOverlay.style.display = 'none';
                if (elements.btnStep2) elements.btnStep2.disabled = !appState.turnstileToken;
            } else {
                elements.stepCard2.classList.add('locked');
                if (elements.step2Status) elements.step2Status.textContent = '🔒';
                if (elements.step2LockedOverlay) elements.step2LockedOverlay.style.display = 'flex';
                if (elements.btnStep2) elements.btnStep2.disabled = true;
            }
        }

        // Step Indicators
        if (elements.stepIndicator1) {
            elements.stepIndicator1.classList.toggle('completed', step1Complete);
        }
        if (elements.stepIndicator2) {
            elements.stepIndicator2.classList.toggle('active', step1Complete);
        }
    }

    // Habilita botões após Turnstile
    function enableStepButtons() {
        const step1Complete = !!twoStepState.step1Token;
        if (elements.btnStep1) elements.btnStep1.disabled = step1Complete;
        if (elements.btnStep2) elements.btnStep2.disabled = !step1Complete;
    }

    // PASSO 1: Iniciar verificação
    async function startStep1() {
        if (appState.isProcessing) return;
        if (!appState.turnstileToken) {
            showUIMessage('Complete o captcha primeiro.', 'error');
            return;
        }

        const tokenAge = Date.now() - (appState.turnstileVerifiedAt || 0);
        if (tokenAge > 4 * 60 * 1000) {
            showUIMessage('Captcha expirado. Complete novamente.', 'error');
            if (window.turnstile && elements.twoStepTurnstile) {
                window.turnstile.reset(elements.twoStepTurnstile);
            }
            return;
        }

        appState.isProcessing = true;
        if (elements.btnStep1) setButtonLoading(elements.btnStep1, true);

        try {
            const lang = appState.currentLanguage;
            showUIMessage(translations[lang].starting_verification, 'info', 0);

            const response = await fetch(`${CONFIG.API_BASE_URL}/initiate-step1`, {
                method: 'GET',
                headers: {
                    'X-Turnstile-Token': appState.turnstileToken
                }
            });
            const data = await response.json();

            if (response.status === 429) {
                showUIMessage(translations[lang].challenge_blocked || 'Muitas tentativas. Aguarde.', 'error', 15000);
                appState.isProcessing = false;
                if (elements.btnStep1) setButtonLoading(elements.btnStep1, false);
                return;
            }

            if (response.ok && data.status === 'success' && data.session_id) {
                // Salva sessão
                localStorage.setItem(CONFIG.TWOSTEP_SESSION_KEY, data.session_id);
                localStorage.setItem(CONFIG.TWOSTEP_CURRENT_STEP_KEY, '1');
                localStorage.setItem(CONFIG.BYPASS_STARTED_AT_KEY, Date.now().toString());
                twoStepState.sessionId = data.session_id;
                twoStepState.step = 1;

                showUIMessage(translations[lang].redirecting_portal || 'Redirecionando...', 'info', 3000);

                // Redireciona para Linkvertise
                setTimeout(() => {
                    window.location.href = CONFIG.SHORTENER_URLS.step1;
                }, 1500);
            } else {
                throw new Error(data.message || 'Erro ao iniciar verificação');
            }
        } catch (error) {
            showUIMessage(`❌ ${error.message}`, 'error');
            appState.isProcessing = false;
            if (elements.btnStep1) setButtonLoading(elements.btnStep1, false);
        }
    }

    // PASSO 2: Iniciar verificação (só após step1 validado)
    async function startStep2() {
        if (appState.isProcessing) return;
        if (!twoStepState.step1Token) {
            showUIMessage('Complete o Passo 1 primeiro!', 'error');
            return;
        }

        appState.isProcessing = true;
        if (elements.btnStep2) setButtonLoading(elements.btnStep2, true);

        try {
            const lang = appState.currentLanguage;
            showUIMessage(translations[lang].starting_verification || 'Iniciando...', 'info', 0);

            const response = await fetch(`${CONFIG.API_BASE_URL}/initiate-step2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step1_token: twoStepState.step1Token })
            });
            const data = await response.json();

            if (!response.ok) {
                if (data.message?.includes('expirado')) {
                    // Token expirou, resetar
                    clearTwoStepStorage();
                    showUIMessage('Sessão expirada. Comece novamente.', 'error');
                    updateTwoStepUI();
                } else {
                    throw new Error(data.message || 'Erro ao iniciar Passo 2');
                }
                appState.isProcessing = false;
                if (elements.btnStep2) setButtonLoading(elements.btnStep2, false);
                return;
            }

            if (data.status === 'success' && data.session_id) {
                localStorage.setItem(CONFIG.TWOSTEP_SESSION_KEY, data.session_id);
                localStorage.setItem(CONFIG.TWOSTEP_CURRENT_STEP_KEY, '2');
                twoStepState.sessionId = data.session_id;
                twoStepState.step = 2;

                showUIMessage(translations[lang].redirecting_portal || 'Redirecionando...', 'info', 3000);

                setTimeout(() => {
                    window.location.href = CONFIG.SHORTENER_URLS.step2;
                }, 1500);
            }
        } catch (error) {
            showUIMessage(`❌ ${error.message}`, 'error');
            appState.isProcessing = false;
            if (elements.btnStep2) setButtonLoading(elements.btnStep2, false);
        }
    }

    // Verifica retorno do encurtador (Step 1 ou Step 2)
    async function checkAndProcessShortenerReturn() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const action = urlParams.get('action');
            const status = urlParams.get('status');
            const linkvertiseHash = urlParams.get('hash');
            const sessionId = localStorage.getItem(CONFIG.TWOSTEP_SESSION_KEY);
            const currentStep = parseInt(localStorage.getItem(CONFIG.TWOSTEP_CURRENT_STEP_KEY)) || 0;

            if (!sessionId || !currentStep) return;

            // Verifica retorno do STEP 1
            if (action === CONFIG.RETURN_CONFIG.step1.action && status === CONFIG.RETURN_CONFIG.step1.status && currentStep === 1) {
                await handleStep1Return(sessionId, linkvertiseHash);
            }
            // Verifica retorno do STEP 2
            else if (action === CONFIG.RETURN_CONFIG.step2.action && status === CONFIG.RETURN_CONFIG.step2.status && currentStep === 2) {
                await handleStep2Return(sessionId, linkvertiseHash);
            }
        } catch (e) {
            console.error('[2-Step] Error in checkAndProcessShortenerReturn:', e);
        }
    }

    // Processa retorno do Passo 1
    async function handleStep1Return(sessionId, linkvertiseHash) {
        const lang = appState.currentLanguage;
        showUIMessage(translations[lang].verification_processing || 'Processando...', 'info', 0);
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/verify-step1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    linkvertise_hash: linkvertiseHash || null
                })
            });
            const data = await response.json();

            if (data.bypass_detected) {
                showUIMessage(translations[lang].challenge_bypass_detected || 'Bypass detectado!', 'error', 10000);
                clearTwoStepStorage();
                return;
            }

            if (!response.ok) {
                showUIMessage(data.message || 'Erro na verificação.', 'error');
                clearTwoStepStorage();
                return;
            }

            if (data.status === 'success' && data.step1_token) {
                // PASSO 1 COMPLETO!
                localStorage.setItem(CONFIG.TWOSTEP_STEP1_TOKEN_KEY, data.step1_token);
                twoStepState.step1Token = data.step1_token;
                twoStepState.step = 1;

                showUIMessage('✅ Passo 1 concluído! Passo 2 liberado.', 'success', 5000);
                if (appState.soundEnabled) playSoundSequence([
                    { freq: 523, duration: 100, type: 'sine' },
                    { freq: 659, duration: 100, type: 'sine' },
                    { freq: 784, duration: 150, type: 'sine' }
                ]);

                // Atualiza UI e abre modal para Step 2
                updateTwoStepUI();
                setTimeout(() => openTwoStepModal(), 1000);
            }
        } catch (error) {
            console.error('[2-Step] Erro no verify-step1:', error);
            showUIMessage('Erro ao verificar. Tente novamente.', 'error');
            clearTwoStepStorage();
        }
    }

    // Processa retorno do Passo 2 (mostra challenge)
    async function handleStep2Return(sessionId, linkvertiseHash) {
        const lang = appState.currentLanguage;
        showUIMessage(translations[lang].verification_processing || 'Processando...', 'info', 0);
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/verify-step2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    linkvertise_hash: linkvertiseHash || null
                })
            });
            const data = await response.json();

            if (data.bypass_detected) {
                showUIMessage(translations[lang].challenge_bypass_detected || 'Bypass detectado!', 'error', 10000);
                clearTwoStepStorage();
                return;
            }

            if (!response.ok) {
                showUIMessage(data.message || 'Erro na verificação.', 'error');
                clearTwoStepStorage();
                return;
            }

            // Recebeu challenge
            if (data.status === 'success' && data.challenge) {
                appState.currentChallenge = {
                    ...data.challenge,
                    sessionId: sessionId,
                    timeout: data.timeout_seconds || 180,
                    isTwoStep: true  // Flag para usar rota correta
                };
                showChallengeModal(data.challenge, data.timeout_seconds);
            }
        } catch (error) {
            console.error('[2-Step] Erro no verify-step2:', error);
            showUIMessage('Erro ao verificar. Tente novamente.', 'error');
            clearTwoStepStorage();
        }
    }

    // Limpa storage do sistema 2 passos
    function clearTwoStepStorage() {
        localStorage.removeItem(CONFIG.TWOSTEP_SESSION_KEY);
        localStorage.removeItem(CONFIG.TWOSTEP_STEP1_TOKEN_KEY);
        localStorage.removeItem(CONFIG.TWOSTEP_CURRENT_STEP_KEY);
        localStorage.removeItem(CONFIG.BYPASS_STARTED_AT_KEY);
        localStorage.removeItem(CONFIG.BYPASS_PROOF_TOKEN_KEY);
        twoStepState.step = 0;
        twoStepState.sessionId = null;
        twoStepState.step1Token = null;
        appState.currentChallenge = null;
        appState.proofToken = null;
        if (appState.challengeTimerInterval) {
            clearInterval(appState.challengeTimerInterval);
            appState.challengeTimerInterval = null;
        }
    }

    // Manter compatibilidade com clearBypassStorage
    function clearBypassStorage() {
        clearTwoStepStorage();
    }

    // === ANTI-BYPASS: Mostra modal do challenge ===
    function showChallengeModal(challenge, timeoutSeconds = 120) {
        const lang = appState.currentLanguage;

        // Cria modal dinamicamente se não existir
        let modal = elements.challengeModal;
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'challengeModal';
            modal.className = 'modal challenge-modal';
            modal.innerHTML = `
                <div class="modal-content challenge-modal-content">
                    <div class="challenge-header">
                        <h2 data-translate-key="challenge_title">${translations[lang].challenge_title}</h2>
                        <p data-translate-key="challenge_subtitle">${translations[lang].challenge_subtitle}</p>
                    </div>
                    <div class="challenge-timer">
                        <span data-translate-key="challenge_timeout">${translations[lang].challenge_timeout}</span>
                        <span id="challengeTimer">${timeoutSeconds}s</span>
                    </div>
                    <div class="challenge-body">
                        <div class="challenge-question" id="challengeQuestion"></div>
                        <div class="challenge-options" id="challengeOptions"></div>
                    </div>
                    <div class="challenge-footer">
                        <span id="challengeAttempts"></span>
                        <p class="challenge-hint" id="challengeHint">${translations[lang].challenge_hint}</p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            elements.challengeModal = modal;
            elements.challengeQuestion = document.getElementById('challengeQuestion');
            elements.challengeOptions = document.getElementById('challengeOptions');
            elements.challengeTimer = document.getElementById('challengeTimer');
            elements.challengeAttempts = document.getElementById('challengeAttempts');

            // Impede fechar clicando fora (evita perder progresso)
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    // Shake animation para indicar que não pode fechar
                    modal.querySelector('.challenge-modal-content').classList.add('shake');
                    setTimeout(() => {
                        modal.querySelector('.challenge-modal-content').classList.remove('shake');
                    }, 500);
                }
            });
        }

        // Atualiza conteúdo do challenge
        renderChallenge(challenge);

        // Inicia timer
        let remaining = timeoutSeconds;
        elements.challengeTimer.textContent = `${remaining}s`;

        if (appState.challengeTimerInterval) clearInterval(appState.challengeTimerInterval);
        appState.challengeTimerInterval = setInterval(() => {
            remaining--;
            if (elements.challengeTimer) elements.challengeTimer.textContent = `${remaining}s`;

            if (remaining <= 0) {
                clearInterval(appState.challengeTimerInterval);
                hideChallengeModal();
                showUIMessage(translations[lang].challenge_expired, 'error');
                clearBypassStorage();
            }
        }, 1000);

        // Mostra modal
        modal.style.display = 'block';
        if (appState.soundEnabled) playSoundSequence([
            { freq: 440, duration: 100, type: 'sine' },
            { freq: 550, duration: 100, type: 'sine' },
            { freq: 660, duration: 150, type: 'sine' }
        ]);
    }

    // === ANTI-BYPASS: Renderiza o challenge ===
    function renderChallenge(challenge, attemptsRemaining = 5) {
        const lang = appState.currentLanguage;

        // Select question based on language
        const questionText = lang === 'en' ? (challenge.question_en || challenge.question) : challenge.question;

        // Split question into instruction and visual parts using || separator
        // Format: "Instruction text||Visual content (emojis)"
        const parts = questionText.split('||');
        const instructionText = parts[0] || questionText;
        const visualContent = parts[1] || '';

        // Question - instruction and visual content separated for clarity
        if (elements.challengeQuestion) {
            elements.challengeQuestion.innerHTML = `
                <div class="challenge-instruction" style="font-size: 1.2em; margin-bottom: 1rem; font-weight: 600;">${instructionText}</div>
                ${visualContent ? `<div class="challenge-visual" style="font-size: 3em; letter-spacing: 0.2em;">${visualContent}</div>` : ''}
            `;
        }

        // Options
        if (elements.challengeOptions) {
            elements.challengeOptions.innerHTML = '';

            if (challenge.type === 'color') {
                // Color buttons - círculos coloridos
                challenge.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'challenge-option challenge-color-option';
                    btn.style.setProperty('background', opt.hex, 'important');
                    btn.title = opt.name || '';
                    btn.dataset.answer = opt.code;
                    btn.onclick = () => submitChallengeAnswer(opt.code);
                    elements.challengeOptions.appendChild(btn);
                });
            } else if (challenge.type === 'visual_pattern' || challenge.type === 'emoji_simple') {
                // Emoji buttons - grandes e clicáveis
                challenge.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'challenge-option challenge-emoji-option';
                    btn.textContent = opt;
                    btn.onclick = () => submitChallengeAnswer(opt);
                    elements.challengeOptions.appendChild(btn);
                });
            } else {
                // Number/text buttons
                challenge.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'challenge-option';
                    btn.textContent = opt;
                    btn.onclick = () => submitChallengeAnswer(opt);
                    elements.challengeOptions.appendChild(btn);
                });
            }
        }

        // Attempts
        if (elements.challengeAttempts) {
            elements.challengeAttempts.textContent = `${translations[lang].challenge_attempts} ${attemptsRemaining}/5`;
        }
    }

    // === ANTI-BYPASS: Envia resposta do challenge ===
    async function submitChallengeAnswer(answer) {
        const lang = appState.currentLanguage;

        if (!appState.currentChallenge) {
            showUIMessage('Erro: Challenge não encontrado.', 'error');
            return;
        }

        // Desabilita botões enquanto processa
        const optionButtons = elements.challengeOptions?.querySelectorAll('button');
        optionButtons?.forEach(btn => btn.disabled = true);

        showUIMessage(translations[lang].challenge_solving, 'info', 0);

        try {
            // Determina a rota correta baseado no fluxo
            const endpoint = appState.currentChallenge.isTwoStep
                ? '/solve-challenge-step2'
                : '/solve-challenge';

            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: appState.currentChallenge.sessionId,
                    challenge_id: appState.currentChallenge.id,
                    answer: String(answer)
                })
            });

            const data = await response.json();

            // Handle bypass detection
            if (data.bypass_detected) {
                hideChallengeModal();
                showUIMessage(translations[lang].challenge_bypass_detected, 'error', 10000);
                clearBypassStorage();
                return;
            }

            // Handle blocked
            if (response.status === 429) {
                hideChallengeModal();
                showUIMessage(translations[lang].challenge_blocked, 'error', 15000);
                clearBypassStorage();
                return;
            }

            // Handle wrong answer with new challenge
            if (data.new_challenge) {
                showUIMessage(translations[lang].challenge_wrong, 'error', 2000);
                if (appState.soundEnabled) playSound(200, 200, 'sawtooth');

                // Atualiza challenge
                appState.currentChallenge = {
                    ...data.new_challenge,
                    sessionId: appState.currentChallenge.sessionId,
                    timeout: appState.currentChallenge.timeout
                };
                renderChallenge(data.new_challenge, data.attempts_remaining);
                return;
            }

            // Handle need to restart
            if (data.restart_required) {
                hideChallengeModal();
                showUIMessage(data.message || 'Muitas tentativas. Inicie novamente.', 'error');
                clearBypassStorage();
                return;
            }

            // Handle other errors
            if (!response.ok) {
                hideChallengeModal();
                showUIMessage(data.message || 'Erro ao verificar resposta.', 'error');
                clearBypassStorage();
                return;
            }

            // === SUCCESS: Challenge resolvido! ===
            if (data.status === 'success' && data.proof_token) {
                hideChallengeModal();
                showUIMessage(translations[lang].challenge_success, 'success');
                if (appState.soundEnabled) playSoundSequence([
                    { freq: 523, duration: 100, type: 'sine' },
                    { freq: 659, duration: 100, type: 'sine' },
                    { freq: 784, duration: 200, type: 'sine' }
                ]);

                // Salva proof token e gera key
                appState.proofToken = data.proof_token;
                localStorage.setItem(CONFIG.BYPASS_PROOF_TOKEN_KEY, data.proof_token);

                // Limpa session (não precisa mais)
                localStorage.removeItem(CONFIG.BYPASS_SESSION_KEY);

                // Gera a key!
                setTimeout(() => generateNewKey(), 500);
            }
        } catch (error) {
            console.error('[Anti-Bypass] Erro ao submeter challenge:', error);
            showUIMessage('Erro de conexão. Tente novamente.', 'error');
            optionButtons?.forEach(btn => btn.disabled = false);
        }
    }

    // === ANTI-BYPASS: Esconde modal do challenge ===
    function hideChallengeModal() {
        if (elements.challengeModal) {
            elements.challengeModal.style.display = 'none';
        }
        if (appState.challengeTimerInterval) {
            clearInterval(appState.challengeTimerInterval);
            appState.challengeTimerInterval = null;
        }
    }

    function openDiscordWidget() {
        elements.discordWidgetContainer.classList.add('active');
        elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (appState.soundEnabled) playSoundSequence([{ freq: 523, duration: 100, type: 'sine' }, { freq: 659, duration: 100, type: 'sine' }]);
    }

    function closeDiscordWidget() {
        elements.discordWidgetContainer.classList.remove('active');
        elements.overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (appState.soundEnabled) playSound(400, 100, 'sine');
    }

    function applyTranslation(lang) {
        if (!translations[lang]) return;
        // Keys that contain HTML and need innerHTML instead of textContent
        const htmlKeys = ['footer_made_with'];

        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.getAttribute('data-translate-key');
            if (translations[lang][key]) {
                // Use innerHTML for keys that contain HTML tags
                if (htmlKeys.includes(key)) {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
                // Atualiza também o data-text para efeitos de glitch/css
                if (el.hasAttribute('data-text')) {
                    el.setAttribute('data-text', translations[lang][key]);
                }
            }
        });
        document.querySelectorAll('[data-translate-title]').forEach(el => {
            const key = el.getAttribute('data-translate-title');
            if (translations[lang][key]) {
                el.title = translations[lang][key];
            }
        });
        document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
        appState.currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);

        discordAuth.updateModal();
        renderKeysList();
        if (discordAuth.isAuthenticated) discordAuth.updateGenerateButton(discordAuth.userStats ? discordAuth.userStats.is_server_member : false);
        if (discordAuth.isAuthenticated) updateKeyLimitDisplay();

        // Atualiza preços baseado no novo idioma (BRL/USD)
        updatePremiumPrices();
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
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5,
                    alpha: Math.random() * 0.5 + 0.5,
                    dx: (Math.random() - 0.5) * 0.1,
                    dy: (Math.random() - 0.5) * 0.1,
                    alphaChange: (Math.random() - 0.5) * 0.01
                });
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
        // Initialize AudioContext on first user interaction to comply with browser policies
        const initAudio = () => {
            initAudioContext();
            if (appState.audioContext && appState.audioContext.state === 'suspended') {
                appState.audioContext.resume();
            }
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);

        if (elements.copyButton) elements.copyButton.addEventListener('click', copyToClipboard);
        // Permitir clicar diretamente na key para copiar
        if (elements.keyValueEl) {
            elements.keyValueEl.style.cursor = 'pointer';
            elements.keyValueEl.addEventListener('click', copyToClipboard);
        }

        // === TWO-STEP MODAL LOGIC (2026) ===
        window._twoStepTurnstileRendered = false;

        if (elements.btnOpenMethodMenu) {
            elements.btnOpenMethodMenu.addEventListener('click', () => {
                openTwoStepModal();
            });
        }

        // Close two-step modal
        if (elements.closeTwoStepModal) {
            elements.closeTwoStepModal.addEventListener('click', () => {
                if (elements.twoStepModal) elements.twoStepModal.style.display = 'none';
            });
        }
        if (elements.twoStepModal) {
            window.addEventListener('click', (e) => {
                if (e.target === elements.twoStepModal) elements.twoStepModal.style.display = 'none';
            });
        }

        // Step Buttons in Modal
        if (elements.btnStep1) {
            elements.btnStep1.addEventListener('click', () => {
                startStep1();
            });
        }
        if (elements.btnStep2) {
            elements.btnStep2.addEventListener('click', () => {
                startStep2();
            });
        }

        if (elements.btnView) elements.btnView.addEventListener('click', () => { if (appState.soundEnabled) playSound(500, 100, 'square'); fetchUserKeyList(); });
        if (elements.translateButton) elements.translateButton.addEventListener('click', toggleTranslation);
        if (elements.supportButton) elements.supportButton.addEventListener('click', openDiscordWidget);
        const downloadModBtn = document.getElementById('downloadModBtn');
        if (downloadModBtn) {
            downloadModBtn.addEventListener('click', () => {
                if (appState.soundEnabled) playSoundSequence([{ freq: 600, duration: 100, type: 'sine' }, { freq: 800, duration: 150, type: 'sine' }]);
            });
        }
        if (elements.closeWidget) elements.closeWidget.addEventListener('click', closeDiscordWidget);
        if (elements.overlay) elements.overlay.addEventListener('click', closeDiscordWidget);
        if (elements.discordWidgetContainer) {
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.discordWidgetContainer.classList.contains('active')) closeDiscordWidget(); });
        }
        window.addEventListener('beforeunload', () => { if (appState.cooldownTimer) clearInterval(appState.cooldownTimer); });
    }

    function setupSessionWatcher() {
        const checkSession = async () => {
            if (discordAuth.isAuthenticated && discordAuth.isSessionExpired()) {
                console.log('Sessão expirada, fazendo logout...');
                await discordAuth.logout();
            }
        };

        // Check every minute
        setInterval(checkSession, 60000);

        // Check immediately when user returns to tab
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkSession();
        });
        window.addEventListener('focus', checkSession);
    }

    function initializeApp() {
        appState.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        appState.keyGenerationCount = parseInt(localStorage.getItem('keyGenerationCount') || '0');
        appState.lastKeyGenerationTime = parseInt(localStorage.getItem('lastKeyGenerationTime') || '0');

        // Sistema de detecção de idioma automático
        const preferredLang = localStorage.getItem('preferredLanguage');
        let targetLang;

        if (preferredLang && translations[preferredLang]) {
            // Usuário já escolheu um idioma antes
            targetLang = preferredLang;
        } else {
            // Detecta idioma do navegador
            const browserLang = navigator.language || navigator.userLanguage;
            // Se for português (pt, pt-BR, pt-PT), usa PT. Caso contrário, usa EN
            targetLang = browserLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
            console.log(`[i18n] Browser language: ${browserLang} → Using: ${targetLang.toUpperCase()}`);
        }

        // Aplica tradução (mesmo se for PT, para garantir consistência)
        applyTranslation(targetLang);
    }

    initializeApp();
    updateSoundToggle();
    setupCanvasStarfield();
    setupEventListeners();
    discordAuth.init().then(() => {
        checkAndProcessShortenerReturn();
        if (discordAuth.isAuthenticated) {
            checkCooldownOnLoad();
            // Busca status premium (verifica se já é premium e atualiza UI)
            fetchUserPremiumStatus();
        }
    });
    setupSessionWatcher();

    // ==================== STRIPE PREMIUM CHECKOUT ====================
    const premiumSection = document.getElementById('premiumSection');
    const premiumSuccessModal = document.getElementById('premiumSuccessModal');
    const premiumLoadingModal = document.getElementById('premiumLoadingModal');
    const closePremiumModal = document.getElementById('closePremiumModal');
    const premiumCopyBtn = document.getElementById('premiumCopyBtn');

    // Função para mostrar seção premium após login
    function showPremiumSection() {
        if (premiumSection && discordAuth.isAuthenticated) {
            premiumSection.style.display = 'block';
            updatePremiumPrices();
        }
    }

    // Atualiza preços baseado no idioma (BRL ou USD)
    function updatePremiumPrices() {
        const isEnglish = appState.currentLanguage === 'en';
        const priceElements = document.querySelectorAll('.plan-price-value');

        priceElements.forEach(el => {
            const brl = parseFloat(el.dataset.priceBrl);
            const usd = parseFloat(el.dataset.priceUsd);
            const currency = el.querySelector('.currency');

            // Skip elements without valid price data or missing currency child
            if (isNaN(brl) || isNaN(usd)) return;

            if (currency) {
                // Element has a .currency child span - update it
                if (isEnglish) {
                    currency.textContent = '$';
                    if (el.childNodes.length > 0) {
                        el.childNodes[el.childNodes.length - 1].textContent = ` ${usd.toFixed(2)}`;
                    }
                } else {
                    currency.textContent = 'R$';
                    if (el.childNodes.length > 0) {
                        el.childNodes[el.childNodes.length - 1].textContent = ` ${brl.toFixed(2).replace('.', ',')}`;
                    }
                }
            } else {
                // Element doesn't have .currency child - update full text content
                if (isEnglish) {
                    el.textContent = `$ ${usd.toFixed(2)}`;
                } else {
                    el.textContent = `R$ ${brl.toFixed(2).replace('.', ',')}`;
                }
            }
        });
    }

    // Observer para mostrar premium quando usuário logar
    const authObserver = new MutationObserver(() => {
        if (discordAuth.isAuthenticated) {
            showPremiumSection();
        }
    });
    if (elements.userContent) {
        authObserver.observe(elements.userContent, { attributes: true, attributeFilter: ['style'] });
    }

    // Botões de compra (múltiplos planos)
    document.querySelectorAll('.plan-buy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const priceId = btn.dataset.priceId;
            if (!priceId || priceId.includes('AQUI')) {
                showUIMessage('⚠️ Plano em breve!', 'info');
                return;
            }

            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>⏳</span>';

            try {
                // Pega dados do usuário logado para associar à key premium
                const discordUsername = discordAuth.userData?.username || null;
                const discordUserId = discordAuth.userData?.id || discordAuth.userData?.userId || null;

                const response = await fetch(`${CONFIG.API_BASE_URL}/stripe/create-checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        price_id: priceId,
                        discord_username: discordUsername,
                        discord_user_id: discordUserId
                    })
                });

                const data = await response.json();

                if (data.status === 'success' && data.checkout_url) {
                    window.location.href = data.checkout_url;
                } else {
                    throw new Error(data.message || 'Erro ao criar checkout');
                }
            } catch (error) {
                console.error('Erro no checkout:', error);
                showUIMessage('❌ Erro ao iniciar pagamento.', 'error');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    });

    // Atualiza preços imediatamente após carregar a página
    updatePremiumPrices();

    // Atualiza preços quando idioma mudar (após applyTranslation)
    // Guarda referência à função original de tradução
    const originalApplyTranslation = applyTranslation;
    // Sobrescreve para adicionar atualização de preços
    window.applyTranslation = function (lang) {
        originalApplyTranslation(lang);
        updatePremiumPrices();
    };

    // Fechar modal premium
    if (closePremiumModal) {
        closePremiumModal.addEventListener('click', () => {
            premiumSuccessModal.style.display = 'none';
            // Limpa URL
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    // Copiar key premium
    if (premiumCopyBtn) {
        premiumCopyBtn.addEventListener('click', () => {
            const key = document.getElementById('premiumKeyValue').textContent;
            navigator.clipboard.writeText(key).then(() => {
                premiumCopyBtn.textContent = '✅ COPIADO!';
                premiumCopyBtn.classList.add('copied');
                setTimeout(() => {
                    premiumCopyBtn.textContent = '📋 COPIAR CHAVE';
                    premiumCopyBtn.classList.remove('copied');
                }, 2000);
            });
        });
    }

    // Verificar se veio de um checkout do Stripe
    async function checkStripePayment() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) return;

        // Mostra loading
        if (premiumLoadingModal) premiumLoadingModal.style.display = 'flex';

        let attempts = 0;
        const maxAttempts = 15;

        async function tryVerify() {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/stripe/verify-payment?session_id=${sessionId}`);
                const data = await response.json();

                if (data.status === 'success' && data.key) {
                    // Sucesso! Mostra a key
                    if (premiumLoadingModal) premiumLoadingModal.style.display = 'none';
                    if (premiumSuccessModal) {
                        document.getElementById('premiumKeyValue').textContent = data.key;
                        document.getElementById('premiumKeyType').textContent = `Premium ${data.hours}h`;
                        premiumSuccessModal.style.display = 'flex';
                    }
                    // Limpa URL mantendo a key visível
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else if (data.status === 'processing' || data.status === 'pending') {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(tryVerify, 2000);
                    } else {
                        if (premiumLoadingModal) premiumLoadingModal.style.display = 'none';
                        showMessage('⏳ Pagamento em processamento. Atualize a página em alguns minutos.', 'info');
                    }
                } else {
                    if (premiumLoadingModal) premiumLoadingModal.style.display = 'none';
                    showMessage(data.message || '❌ Erro ao verificar pagamento.', 'error');
                }
            } catch (error) {
                console.error('Erro ao verificar pagamento:', error);
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryVerify, 2000);
                } else {
                    if (premiumLoadingModal) premiumLoadingModal.style.display = 'none';
                    showMessage('❌ Erro de conexão. Tente atualizar a página.', 'error');
                }
            }
        }

        tryVerify();
    }

    // Verifica pagamento ao carregar a página
    checkStripePayment();

    setTimeout(() => {
        if (appState.soundEnabled) {
            playSoundSequence([{ freq: 220, duration: 100, type: 'sine' }, { freq: 277, duration: 100, type: 'sine' }, { freq: 330, duration: 100, type: 'sine' }, { freq: 440, duration: 200, type: 'sine' }]);
        }
    }, 1000);
});

// ==================== DOWNLOAD TURNSTILE CALLBACKS ====================
window._downloadTurnstileToken = null;
window._downloadTurnstileVerifiedAt = null;

window.onDownloadTurnstileSuccess = function (token) {
    console.log('[Download Turnstile] ✅ Verification successful');
    window._downloadTurnstileToken = token;
    window._downloadTurnstileVerifiedAt = Date.now();

    // Enable download buttons
    const steamBtn = document.getElementById('downloadSteamBtn');
    const epicBtn = document.getElementById('downloadEpicBtn');

    if (steamBtn) {
        steamBtn.disabled = false;
        steamBtn.style.opacity = '1';
        steamBtn.style.pointerEvents = 'auto';
    }
    if (epicBtn) {
        epicBtn.disabled = false;
        epicBtn.style.opacity = '1';
        epicBtn.style.pointerEvents = 'auto';
    }

    // Update hint
    const hint = document.getElementById('downloadTurnstileHint');
    if (hint) {
        hint.textContent = '✅ Verificado! Selecione a plataforma abaixo';
        hint.style.color = '#4CAF50';
    }
};

window.onDownloadTurnstileError = function () {
    console.error('[Download Turnstile] ❌ Verification failed');
    window._downloadTurnstileToken = null;

    const hint = document.getElementById('downloadTurnstileHint');
    if (hint) {
        hint.textContent = '❌ Erro na verificação. Tente recarregar a página.';
        hint.style.color = '#f44336';
    }
};

window.onDownloadTurnstileExpired = function () {
    console.warn('[Download Turnstile] ⚠️ Token expired');
    window._downloadTurnstileToken = null;

    // Disable download buttons
    const steamBtn = document.getElementById('downloadSteamBtn');
    const epicBtn = document.getElementById('downloadEpicBtn');

    if (steamBtn) {
        steamBtn.disabled = true;
        steamBtn.style.opacity = '0.5';
        steamBtn.style.pointerEvents = 'none';
    }
    if (epicBtn) {
        epicBtn.disabled = true;
        epicBtn.style.opacity = '0.5';
        epicBtn.style.pointerEvents = 'none';
    }

    // Reset hint
    const hint = document.getElementById('downloadTurnstileHint');
    if (hint) {
        hint.textContent = '⚠️ Verificação expirada. Complete novamente.';
        hint.style.color = '#ff9800';
    }

    // Reset the widget
    if (window.turnstile) {
        const widget = document.getElementById('downloadTurnstile');
        if (widget) window.turnstile.reset(widget);
    }
};

// ==================== DIRECT DOWNLOAD HANDLER ====================
// Downloads with Turnstile verification for anti-bot protection
async function handleDownload(platform) {
    const btn = document.getElementById(platform === 'steam' ? 'downloadSteamBtn' : 'downloadEpicBtn');
    const originalContent = btn ? btn.innerHTML : '';

    // === ANTI-BOT: Require Turnstile token ===
    if (!window._downloadTurnstileToken) {
        if (typeof showUIMessage === 'function') {
            showUIMessage('🔒 Complete a verificação Cloudflare primeiro!', 'error');
        } else {
            alert('🔒 Complete a verificação Cloudflare primeiro!');
        }
        return;
    }

    // Mapeamento de plataforma para arquivo no R2
    const DOWNLOAD_FILES = {
        'steam': 'V6-Steam.zip',
        'epic': 'V6-EpicGames.zip',
        'epicgames': 'V6-EpicGames.zip'
    };

    const fileName = DOWNLOAD_FILES[platform];
    if (!fileName) {
        console.error('Platform inválida:', platform);
        if (typeof showUIMessage === 'function') {
            showUIMessage('❌ Plataforma inválida', 'error');
        }
        return;
    }

    try {
        // Show loading state
        if (btn) {
            btn.disabled = true;
            btn.classList.add('loading');
            const arrowEl = btn.querySelector('.platform-arrow');
            if (arrowEl) arrowEl.textContent = '⏳';
        }

        // === ANTI-BOT: Verify token on server before allowing download ===
        const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://keygenx-1.onrender.com';
        const verifyResponse = await fetch(`${apiUrl}/api/download/${platform}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Turnstile-Token': window._downloadTurnstileToken
            }
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.status !== 'success') {
            throw new Error(verifyData.message || 'Verificação falhou');
        }

        // Use signed URL from server (more secure) or direct R2 link
        const downloadUrl = verifyData.url || `https://mira.crewcore.online/${fileName}`;
        window.location.href = downloadUrl;

        console.log(`📥 [Download] Starting download for ${platform}: ${fileName}`);

        // Reset button state after a short delay
        setTimeout(() => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('loading');
                const arrowEl = btn.querySelector('.platform-arrow');
                if (arrowEl) arrowEl.textContent = '⬇';
            }
        }, 2000);

    } catch (error) {
        console.error('Download error:', error);

        // Reset button and show error
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('loading');
            const arrowEl = btn.querySelector('.platform-arrow');
            if (arrowEl) arrowEl.textContent = '❌';

            // Restore arrow after 2s
            setTimeout(() => {
                if (arrowEl) arrowEl.textContent = '⬇';
            }, 2000);
        }

        // Show error message
        if (typeof showUIMessage === 'function') {
            showUIMessage(`❌ ${error.message || 'Erro ao iniciar download'}`, 'error');
        } else {
            alert(`❌ ${error.message || 'Erro ao iniciar download'}`);
        }
    }
}

// ==================== DOWNLOAD MODAL FUNCTIONS ====================
// Track if download turnstile has been rendered
window._downloadTurnstileRendered = false;

function openDownloadModal() {
    const overlay = document.getElementById('downloadModalOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // === FIX: Render Turnstile widget manually when modal opens ===
        // Widgets inside hidden elements don't auto-render
        if (window.turnstile && !window._downloadTurnstileRendered) {
            const container = document.getElementById('downloadTurnstile');
            if (container) {
                // Clear any existing widget
                container.innerHTML = '';

                // Render the widget
                window.turnstile.render(container, {
                    sitekey: '0x4AAAAAACCiV6dd05O6ZjAs',
                    callback: window.onDownloadTurnstileSuccess,
                    'error-callback': window.onDownloadTurnstileError,
                    'expired-callback': window.onDownloadTurnstileExpired,
                    theme: 'dark',
                    retry: 'auto',
                    'retry-interval': 3000
                });

                window._downloadTurnstileRendered = true;
                console.log('[Download Turnstile] Widget rendered manually');
            }
        } else if (window._downloadTurnstileToken) {
            // If already verified, ensure buttons are enabled
            const steamBtn = document.getElementById('downloadSteamBtn');
            const epicBtn = document.getElementById('downloadEpicBtn');
            if (steamBtn) steamBtn.disabled = false;
            if (epicBtn) epicBtn.disabled = false;
        }
    }
}

function closeDownloadModal(event) {
    // If called with event, only close if clicking the overlay itself
    if (event && event.target !== event.currentTarget) return;

    const overlay = document.getElementById('downloadModalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDownloadModal();
});

// ==================== PREMIUM USER PANEL ====================
const premiumPanelElements = {
    panel: document.getElementById('premiumUserPanel'),
    activeKey: document.getElementById('premiumActiveKey'),
    planType: document.getElementById('premiumPlanType'),
    expiresAt: document.getElementById('premiumExpiresAt'),
    hwidStatus: document.getElementById('premiumHwidStatus'),
    resetBtn: document.getElementById('resetHwidBtn'),
    cooldownText: document.getElementById('hwidResetCooldown'),
    hint: document.getElementById('premiumPanelHint')
};

let currentPremiumKey = null;

async function loadPremiumPanel() {
    if (!premiumPanelElements.panel) return;

    try {
        const sessionId = localStorage.getItem('crewbot_session');
        if (!sessionId) {
            premiumPanelElements.panel.style.display = 'none';
            return;
        }

        const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://keygenx-1.onrender.com';
        const response = await fetch(`${apiUrl}/user_premium_keys`, {
            headers: { 'X-Session-ID': sessionId }
        });

        if (!response.ok) {
            premiumPanelElements.panel.style.display = 'none';
            return;
        }

        const data = await response.json();

        if (!data.has_active_premium || !data.premium_keys || data.premium_keys.length === 0) {
            premiumPanelElements.panel.style.display = 'none';
            return;
        }

        const activeKey = data.premium_keys.find(k => k.status === 'active');
        if (!activeKey) {
            premiumPanelElements.panel.style.display = 'none';
            return;
        }

        currentPremiumKey = activeKey.key;
        if (premiumPanelElements.activeKey) premiumPanelElements.activeKey.textContent = activeKey.key;
        if (premiumPanelElements.planType) premiumPanelElements.planType.textContent = getPlanDisplayName(activeKey.type);
        if (premiumPanelElements.expiresAt) premiumPanelElements.expiresAt.textContent = activeKey.time_remaining || 'Lifetime';

        await updateKeyStatus(activeKey.key);
        premiumPanelElements.panel.style.display = 'block';


    } catch (error) {
        console.error('[PremiumPanel] Error:', error);
        premiumPanelElements.panel.style.display = 'none';
    }
}

function getPlanDisplayName(type) {
    const names = {
        'daily': '⭐ 48 Horas',
        'weekly': '⭐ 7 Dias',
        'monthly': '⭐ 30 Dias',
        'quarterly': '⭐ 90 Dias',
        'yearly': '⭐ 365 Dias',
        'lifetime': '👑 Lifetime'
    };
    return names[type] || '⭐ Premium';
}

async function updateKeyStatus(key) {
    try {
        const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://keygenx-1.onrender.com';
        const response = await fetch(`${apiUrl}/key-status?key=${encodeURIComponent(key)}`);
        const data = await response.json();

        if (data.status === 'success') {
            if (premiumPanelElements.hwidStatus) {
                premiumPanelElements.hwidStatus.textContent = data.hwid_bound ? '🔒 Vinculado' : '🔓 Não vinculado';
            }

            if (data.can_reset_hwid) {
                if (premiumPanelElements.cooldownText) premiumPanelElements.cooldownText.textContent = '1x por dia';
                if (premiumPanelElements.resetBtn) premiumPanelElements.resetBtn.disabled = false;
            } else {
                const nextReset = new Date(data.next_reset_at);
                const hoursRemaining = Math.ceil((nextReset - new Date()) / (1000 * 60 * 60));
                if (premiumPanelElements.cooldownText) premiumPanelElements.cooldownText.textContent = `Disponível em ${hoursRemaining}h`;
                if (premiumPanelElements.resetBtn) premiumPanelElements.resetBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error('[KeyStatus] Error:', error);
    }
}


async function resetHwid() {
    if (!currentPremiumKey || !premiumPanelElements.resetBtn) return;

    const originalContent = premiumPanelElements.resetBtn.innerHTML;

    try {
        premiumPanelElements.resetBtn.disabled = true;
        premiumPanelElements.resetBtn.innerHTML = '<span class="spinner"></span> Resetando...';

        const sessionId = localStorage.getItem('crewbot_session');
        if (!sessionId) throw new Error('Sessão expirada.');

        const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://keygenx-1.onrender.com';
        const response = await fetch(`${apiUrl}/premium/reset-hwid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
            body: JSON.stringify({ key: currentPremiumKey })
        });

        const data = await response.json();

        if (data.status === 'success') {
            if (typeof showUIMessage === 'function') showUIMessage('✅ ' + data.message, 'success');
            if (premiumPanelElements.hwidStatus) premiumPanelElements.hwidStatus.textContent = '🔓 Não vinculado';
            if (data.next_reset_at) {
                const hoursRemaining = Math.ceil((new Date(data.next_reset_at) - new Date()) / (1000 * 60 * 60));
                if (premiumPanelElements.cooldownText) premiumPanelElements.cooldownText.textContent = `Disponível em ${hoursRemaining}h`;
                if (premiumPanelElements.resetBtn) premiumPanelElements.resetBtn.disabled = true;
            }
        } else {
            if (typeof showUIMessage === 'function') showUIMessage('❌ ' + data.message, 'error');
            if (data.next_reset_at) {
                const hoursRemaining = Math.ceil((new Date(data.next_reset_at) - new Date()) / (1000 * 60 * 60));
                if (premiumPanelElements.cooldownText) premiumPanelElements.cooldownText.textContent = `Disponível em ${hoursRemaining}h`;
            }
        }
    } catch (error) {
        console.error('[ResetHwid] Error:', error);
        if (typeof showUIMessage === 'function') showUIMessage('❌ Erro ao resetar HWID', 'error');
    } finally {
        if (premiumPanelElements.resetBtn) premiumPanelElements.resetBtn.innerHTML = originalContent;
    }
}


if (premiumPanelElements.resetBtn) {
    premiumPanelElements.resetBtn.addEventListener('click', resetHwid);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadPremiumPanel, 1500));
