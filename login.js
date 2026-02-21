/* ============================================================
   LOGIN MODULE — Controller (login.js)
   YT Toolbox | Autenticação local via localStorage
   Estrutura modular seguindo princípios SOLID:
     - NeuralNet     → canvas de rede neural interativa (background)
     - LoginStorage  → camada de dados (acesso ao localStorage)
     - LoginAuth     → lógica de negócio (validação, autenticação)
     - LoginUI       → camada de apresentação (DOM, telas, feedback)
   ============================================================ */

'use strict';

/* ----------------------------------------------------------
   REDE NEURAL — NeuralNet
   Canvas animado de partículas conectadas que reagem ao mouse.
   ---------------------------------------------------------- */
const NeuralNet = (() => {

    const canvas = document.getElementById('neuralCanvas');
    const ctx = canvas.getContext('2d');

    /* --- Configurações ajustáveis --- */
    const CFG = {
        particleCount: 90,     // número de nós
        maxDist: 150,    // distância máxima para traçar conexão (px)
        mouseRadius: 180,    // raio de influência do cursor
        mouseForce: 0.022,  // força de atração ao cursor
        speed: 0.55,   // velocidade base das partículas
        nodeRadius: 2.2,    // raio de cada nó (px)
        mouseNodeSize: 5,      // raio do nó do cursor
    };

    let particles = [];
    let mouse = { x: -9999, y: -9999 };   // cursor fora da tela inicialmente
    let isDark = false;
    let raf = null;

    /* --- Cores adaptadas ao tema --- */
    function getColors() {
        if (isDark) {
            return {
                node: 'rgba(50, 205, 50,',   // verde vibrante dark
                line: 'rgba(50, 205, 50,',
                mouse: 'rgba(80, 240, 80,',
            };
        }
        return {
            node: 'rgba(40, 167, 69,',     // verde brand light
            line: 'rgba(40, 167, 69,',
            mouse: 'rgba(30, 140, 55,',
        };
    }

    /* --- Uma partícula da rede --- */
    class Particle {
        constructor() { this.reset(true); }

        reset(randomPos = false) {
            this.x = randomPos ? Math.random() * canvas.width : Math.random() < .5 ? 0 : canvas.width;
            this.y = randomPos ? Math.random() * canvas.height : Math.random() < .5 ? 0 : canvas.height;
            // Velocidade com direção aleatória
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 0.6 + 0.3) * CFG.speed;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.r = Math.random() * 1.2 + CFG.nodeRadius * .6;
        }

        update() {
            // Atração suave ao cursor
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CFG.mouseRadius && dist > 1) {
                this.vx += (dx / dist) * CFG.mouseForce;
                this.vy += (dy / dist) * CFG.mouseForce;
            }

            // Amortecimento para não acelerar indefinidamente
            this.vx *= 0.988;
            this.vy *= 0.988;

            // Velocidade mínima para não parar
            const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (spd < 0.15) {
                this.vx += (Math.random() - .5) * 0.08;
                this.vy += (Math.random() - .5) * 0.08;
            }

            this.x += this.vx;
            this.y += this.vy;

            // Rebate suavemente nas bordas
            if (this.x < 0) { this.x = 0; this.vx *= -1; }
            if (this.x > canvas.width) { this.x = canvas.width; this.vx *= -1; }
            if (this.y < 0) { this.y = 0; this.vy *= -1; }
            if (this.y > canvas.height) { this.y = canvas.height; this.vy *= -1; }
        }

        draw(colors) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = colors.node + '0.75)';
            ctx.fill();
        }
    }

    /* --- Desenha conexões entre partículas próximas --- */
    function drawConnections(colors) {
        // Inclui o cursor como um nó extra para conexões
        const nodes = [...particles, { x: mouse.x, y: mouse.y }];

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CFG.maxDist) {
                    // Opacidade diminui com a distância
                    const alpha = (1 - dist / CFG.maxDist) * 0.55;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = colors.line + alpha + ')';
                    ctx.lineWidth = (1 - dist / CFG.maxDist) * 1.2;
                    ctx.stroke();
                }
            }
        }
    }

    /* --- Nó do cursor --- */
    function drawMouseNode(colors) {
        if (mouse.x < 0) return;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, CFG.mouseNodeSize, 0, Math.PI * 2);
        ctx.fillStyle = colors.mouse + '0.9)';
        ctx.shadowColor = colors.mouse + '0.6)';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /* --- Loop principal de animação --- */
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colors = getColors();

        drawConnections(colors);
        particles.forEach(p => { p.update(); p.draw(colors); });
        drawMouseNode(colors);

        raf = requestAnimationFrame(loop);
    }

    /* --- Redimensiona o canvas ao tamanho da janela --- */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /* --- Cria as partículas iniciais --- */
    function createParticles() {
        particles = Array.from({ length: CFG.particleCount }, () => new Particle());
    }

    /* --- Detecta mudanças de tema --- */
    function watchTheme() {
        const observer = new MutationObserver(() => {
            isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        // Leitura inicial
        isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    }

    /* --- Inicializa a engine --- */
    function init() {
        resize();
        createParticles();
        watchTheme();

        window.addEventListener('resize', () => { resize(); });

        // Rastreia o cursor
        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        // Toque em mobile
        window.addEventListener('touchmove', e => {
            const t = e.touches[0];
            mouse.x = t.clientX;
            mouse.y = t.clientY;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            mouse.x = -9999;
            mouse.y = -9999;
        });

        loop();
    }

    return { init };

})();

/* ----------------------------------------------------------
   CAMADA DE DADOS — LoginStorage
   Responsável apenas por ler/gravar no localStorage.
   ---------------------------------------------------------- */
const LoginStorage = (() => {

    // Chaves do localStorage
    const KEYS = {
        USERS: 'yt_users_v1',   // lista de usuários cadastrados
        SESSION: 'yt_session_v1', // sessão ativa (email do usuário logado)
        THEME: 'theme',         // tema (claro/escuro)
    };

    /** Retorna a lista de usuários cadastrados */
    function getUsers() {
        try { return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'); }
        catch { return []; }
    }

    /** Salva a lista de usuários */
    function saveUsers(users) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    /** Retorna a sessão ativa ou null */
    function getSession() {
        return localStorage.getItem(KEYS.SESSION) || null;
    }

    /** Inicia uma sessão para o e-mail informado */
    function setSession(email) {
        localStorage.setItem(KEYS.SESSION, email);
    }

    /** Encerra a sessão atual */
    function clearSession() {
        localStorage.removeItem(KEYS.SESSION);
    }

    /** Retorna o tema salvo */
    function getTheme() {
        return localStorage.getItem(KEYS.THEME) || 'light';
    }

    /** Salva o tema */
    function setTheme(theme) {
        localStorage.setItem(KEYS.THEME, theme);
    }

    return { getUsers, saveUsers, getSession, setSession, clearSession, getTheme, setTheme };

})();


/* ----------------------------------------------------------
   CAMADA DE NEGÓCIO — LoginAuth
   Responsável por validações e regras de autenticação.
   Não acessa o DOM — recebe e retorna dados puros.
   ---------------------------------------------------------- */
const LoginAuth = (() => {

    /** Valida formato de e-mail */
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    /**
     * Tenta autenticar um usuário.
     * @returns {{ ok: boolean, error?: string }}
     */
    function login(email, password) {
        if (!email || !password) return { ok: false, error: 'Preencha todos os campos.' };
        if (!isValidEmail(email)) return { ok: false, error: 'E-mail inválido.' };

        const users = LoginStorage.getUsers();
        const user = users.find(u => u.email === email.trim().toLowerCase());

        if (!user) return { ok: false, error: 'E-mail não cadastrado.' };
        if (user.password !== password) return { ok: false, error: 'Senha incorreta.' };

        LoginStorage.setSession(user.email);
        return { ok: true };
    }

    /**
     * Cadastra um novo usuário.
     * @returns {{ ok: boolean, error?: string }}
     */
    function register(nome, email, password, confirm) {
        if (!nome || !email || !password || !confirm)
            return { ok: false, error: 'Preencha todos os campos.' };

        if (!isValidEmail(email))
            return { ok: false, error: 'E-mail inválido.' };

        if (password.length < 6)
            return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' };

        if (password !== confirm)
            return { ok: false, error: 'As senhas não coincidem.' };

        const users = LoginStorage.getUsers();
        if (users.find(u => u.email === email.trim().toLowerCase()))
            return { ok: false, error: 'Este e-mail já está cadastrado.' };

        // Salva o novo usuário (senha em texto — demo local; não use em produção real)
        users.push({ nome: nome.trim(), email: email.trim().toLowerCase(), password, createdAt: Date.now() });
        LoginStorage.saveUsers(users);
        LoginStorage.setSession(email.trim().toLowerCase());
        return { ok: true };
    }

    /**
     * Simula o envio de e-mail de recuperação.
     * @returns {{ ok: boolean, error?: string }}
     */
    function requestRecovery(email) {
        if (!isValidEmail(email)) return { ok: false, error: 'E-mail inválido.' };

        const users = LoginStorage.getUsers();
        if (!users.find(u => u.email === email.trim().toLowerCase()))
            return { ok: false, error: 'Nenhuma conta encontrada com este e-mail.' };

        // Simulação — em produção real, chamaria um backend/API aqui
        return { ok: true };
    }

    /** Verifica se há uma sessão ativa e redireciona para o hub */
    function checkSessionAndRedirect() {
        if (LoginStorage.getSession()) {
            window.location.replace('hub.html');
        }
    }

    return { login, register, requestRecovery, checkSessionAndRedirect, isValidEmail };

})();


/* ----------------------------------------------------------
   CAMADA DE APRESENTAÇÃO — LoginUI
   Gerencia todas as interações com o DOM.
   ---------------------------------------------------------- */
const LoginUI = (() => {

    /* --- Seletores de elementos --- */
    const $ = id => document.getElementById(id);

    const els = {
        // Telas
        screenLogin: $('screenLogin'),
        screenEsqueci: $('screenEsqueci'),
        screenCriar: $('screenCriar'),

        // Tema
        themeToggle: $('loginThemeToggle'),

        // --- Tela LOGIN ---
        formLogin: $('formLogin'),
        loginEmail: $('loginEmail'),
        loginEmailError: $('loginEmailError'),
        loginPassword: $('loginPassword'),
        loginPassError: $('loginPassError'),
        loginAlert: $('loginAlert'),
        btnEntrar: $('btnEntrar'),
        btnEntrarIcon: $('btnEntrarIcon'),
        btnEntrarText: $('btnEntrarText'),
        btnToggleEye: $('btnToggleEye'),
        btnIrEsqueci: $('btnIrEsqueci'),
        btnIrCriarConta: $('btnIrCriarConta'),

        // --- Tela ESQUECI ---
        formEsqueci: $('formEsqueci'),
        esqueciEmail: $('esqueciEmail'),
        esqueciEmailError: $('esqueciEmailError'),
        esqueciAlert: $('esqueciAlert'),
        btnVoltarLogin: $('btnVoltarLogin'),

        // --- Tela CRIAR ---
        formCriar: $('formCriar'),
        criarNome: $('criarNome'),
        criarNomeError: $('criarNomeError'),
        criarEmail: $('criarEmail'),
        criarEmailError: $('criarEmailError'),
        criarPassword: $('criarPassword'),
        criarPassError: $('criarPassError'),
        criarConfirm: $('criarConfirm'),
        criarConfirmError: $('criarConfirmError'),
        criarAlert: $('criarAlert'),
        btnVoltarLoginDeCriar: $('btnVoltarLoginDeCriar'),

        // Toast
        toast: $('loginToast'),
    };

    /* --- Toast --- */
    function toast(msg, duration = 1800) {
        els.toast.textContent = msg;
        els.toast.setAttribute('data-show', 'true');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => els.toast.removeAttribute('data-show'), duration);
    }

    /* --- Alerta no card --- */
    function setAlert(el, msg, type = 'error') {
        if (!msg) {
            el.removeAttribute('data-type');
            el.textContent = '';
            return;
        }
        el.setAttribute('data-type', type);
        el.textContent = msg;
    }

    /* --- Erro inline no campo --- */
    function setFieldError(input, errorEl, msg) {
        errorEl.textContent = msg || '';
        input.classList.toggle('input-error', !!msg);
    }

    /* --- Limpa todos os erros de um formulário --- */
    function clearFormState(alertEl, fieldPairs) {
        setAlert(alertEl, '');
        fieldPairs.forEach(([input, errEl]) => setFieldError(input, errEl, ''));
    }

    /* --- Navegação entre telas --- */
    function showScreen(screenId) {
        [els.screenLogin, els.screenEsqueci, els.screenCriar].forEach(s => {
            s.hidden = (s.id !== screenId);
        });
        // Foca no primeiro input visível
        const firstInput = els[screenId === 'screenLogin' ? 'loginEmail' :
            screenId === 'screenEsqueci' ? 'esqueciEmail' : 'criarNome'];
        setTimeout(() => firstInput?.focus(), 80);
    }

    /* --- Estado de loading no botão de login --- */
    function setLoginLoading(loading) {
        els.btnEntrar.disabled = loading;
        els.btnEntrarIcon.textContent = loading ? '⏳' : '⚡';
        els.btnEntrarText.textContent = loading ? 'Entrando...' : 'Entrar';
    }

    /* --- Tema --- */
    function loadTheme() {
        document.documentElement.setAttribute('data-theme', LoginStorage.getTheme());
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        LoginStorage.setTheme(next);
    }

    /* --- Mostrar/ocultar senha --- */
    function togglePasswordVisibility() {
        const isPassword = els.loginPassword.type === 'password';
        els.loginPassword.type = isPassword ? 'text' : 'password';
        els.btnToggleEye.title = isPassword ? 'Ocultar senha' : 'Mostrar senha';
        els.btnToggleEye.style.opacity = isPassword ? '1' : '.6';
    }

    /* -----------------------------------------------
       HANDLERS DE FORMULÁRIO
    ----------------------------------------------- */

    /** Submit: Login */
    async function handleLogin(e) {
        e.preventDefault();
        clearFormState(els.loginAlert, [
            [els.loginEmail, els.loginEmailError],
            [els.loginPassword, els.loginPassError],
        ]);

        const email = els.loginEmail.value.trim();
        const password = els.loginPassword.value;

        // Validação prévia inline
        let hasError = false;
        if (!email) {
            setFieldError(els.loginEmail, els.loginEmailError, 'Informe seu e-mail.');
            hasError = true;
        } else if (!LoginAuth.isValidEmail(email)) {
            setFieldError(els.loginEmail, els.loginEmailError, 'E-mail inválido.');
            hasError = true;
        }
        if (!password) {
            setFieldError(els.loginPassword, els.loginPassError, 'Informe sua senha.');
            hasError = true;
        }
        if (hasError) return;

        setLoginLoading(true);
        // Pequeno delay para feedback visual (simula chamada assíncrona)
        await new Promise(r => setTimeout(r, 420));

        const result = LoginAuth.login(email, password);

        if (result.ok) {
            toast('Login realizado! Redirecionando… ✅');
            setTimeout(() => window.location.replace('hub.html'), 700);
        } else {
            setLoginLoading(false);
            setAlert(els.loginAlert, result.error || 'Erro ao entrar.');
        }
    }

    /** Submit: Esqueci minha senha */
    function handleEsqueci(e) {
        e.preventDefault();
        clearFormState(els.esqueciAlert, [[els.esqueciEmail, els.esqueciEmailError]]);

        const email = els.esqueciEmail.value.trim();

        if (!email || !LoginAuth.isValidEmail(email)) {
            setFieldError(els.esqueciEmail, els.esqueciEmailError, 'Informe um e-mail válido.');
            return;
        }

        const result = LoginAuth.requestRecovery(email);

        if (result.ok) {
            setAlert(els.esqueciAlert,
                '✅ E-mail de recuperação enviado! (Demo: nenhum e-mail real é enviado — verifique sua conta local.)',
                'success'
            );
            els.esqueciEmail.value = '';
        } else {
            setAlert(els.esqueciAlert, result.error);
        }
    }

    /** Submit: Criar conta */
    async function handleCriar(e) {
        e.preventDefault();
        clearFormState(els.criarAlert, [
            [els.criarNome, els.criarNomeError],
            [els.criarEmail, els.criarEmailError],
            [els.criarPassword, els.criarPassError],
            [els.criarConfirm, els.criarConfirmError],
        ]);

        const nome = els.criarNome.value.trim();
        const email = els.criarEmail.value.trim();
        const password = els.criarPassword.value;
        const confirm = els.criarConfirm.value;

        // Validações inline
        let hasError = false;
        if (!nome) { setFieldError(els.criarNome, els.criarNomeError, 'Informe seu nome.'); hasError = true; }
        if (!email) { setFieldError(els.criarEmail, els.criarEmailError, 'Informe seu e-mail.'); hasError = true; }
        else if (!LoginAuth.isValidEmail(email)) { setFieldError(els.criarEmail, els.criarEmailError, 'E-mail inválido.'); hasError = true; }
        if (!password) { setFieldError(els.criarPassword, els.criarPassError, 'Informe uma senha.'); hasError = true; }
        else if (password.length < 6) { setFieldError(els.criarPassword, els.criarPassError, 'Mínimo 6 caracteres.'); hasError = true; }
        if (!confirm) { setFieldError(els.criarConfirm, els.criarConfirmError, 'Confirme sua senha.'); hasError = true; }
        else if (password !== confirm) { setFieldError(els.criarConfirm, els.criarConfirmError, 'As senhas não coincidem.'); hasError = true; }
        if (hasError) return;

        await new Promise(r => setTimeout(r, 380));

        const result = LoginAuth.register(nome, email, password, confirm);

        if (result.ok) {
            toast('Conta criada! Entrando… ✅');
            setTimeout(() => window.location.replace('hub.html'), 700);
        } else {
            setAlert(els.criarAlert, result.error);
        }
    }

    /* --- Inicializa todos os event listeners --- */
    function init() {
        loadTheme();

        // Verifica sessão ativa → redireciona automaticamente
        LoginAuth.checkSessionAndRedirect();

        // Se o usuário veio da landing page clicando em "Criar conta", abre direto essa tela
        try {
            if (sessionStorage.getItem('lp_goto') === 'criar') {
                sessionStorage.removeItem('lp_goto');
                showScreen('screenCriar');
            }
        } catch (_) { /* silencioso — sessionStorage pode estar bloqueado */ }

        // Tema
        els.themeToggle.addEventListener('click', toggleTheme);

        // Mostrar/ocultar senha
        els.btnToggleEye.addEventListener('click', togglePasswordVisibility);

        // Submit dos formulários
        els.formLogin.addEventListener('submit', handleLogin);
        els.formEsqueci.addEventListener('submit', handleEsqueci);
        els.formCriar.addEventListener('submit', handleCriar);

        // Navegação entre telas
        els.btnIrEsqueci.addEventListener('click', () => showScreen('screenEsqueci'));
        els.btnIrCriarConta.addEventListener('click', () => showScreen('screenCriar'));
        els.btnVoltarLogin.addEventListener('click', () => showScreen('screenLogin'));
        els.btnVoltarLoginDeCriar.addEventListener('click', () => showScreen('screenLogin'));

        // Limpa erros ao digitar
        [
            [els.loginEmail, els.loginEmailError],
            [els.loginPassword, els.loginPassError],
            [els.esqueciEmail, els.esqueciEmailError],
            [els.criarNome, els.criarNomeError],
            [els.criarEmail, els.criarEmailError],
            [els.criarPassword, els.criarPassError],
            [els.criarConfirm, els.criarConfirmError],
        ].forEach(([input, errEl]) => {
            input.addEventListener('input', () => {
                setFieldError(input, errEl, '');
            });
        });

        // Atalho: Enter nos campos navega para o próximo
        els.loginEmail.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); els.loginPassword.focus(); }
        });
    }

    return { init };

})();

/* ----------------------------------------------------------
   INICIALIZAÇÃO
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    NeuralNet.init();   // ← inicia o canvas de rede neural
    LoginUI.init();     // ← inicia a lógica de autenticação
});
