/* ============================================================
   HUB MODULE — Controller (hub.js)
   YT Toolbox | Tela de seleção pós-login
   ============================================================ */

'use strict';

/* ----------------------------------------------------------
   REDE NEURAL — reutiliza a mesma engine do login
   (copiada para ser independente do login.js)
   ---------------------------------------------------------- */
const NeuralNet = (() => {

    const canvas = document.getElementById('hubCanvas');
    const ctx = canvas.getContext('2d');

    const CFG = {
        particleCount: 70,
        maxDist: 160,
        mouseRadius: 200,
        mouseForce: 0.018,
        speed: 0.45,
        nodeRadius: 2.0,
        mouseNodeSize: 5,
    };

    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let isDark = false;

    function getColors() {
        return isDark
            ? { node: 'rgba(50,205,50,', line: 'rgba(50,205,50,', mouse: 'rgba(80,240,80,' }
            : { node: 'rgba(40,167,69,', line: 'rgba(40,167,69,', mouse: 'rgba(30,140,55,' };
    }

    class Particle {
        constructor() { this.reset(true); }

        reset(rand) {
            this.x = rand ? Math.random() * canvas.width : (Math.random() < .5 ? 0 : canvas.width);
            this.y = rand ? Math.random() * canvas.height : (Math.random() < .5 ? 0 : canvas.height);
            const angle = Math.random() * Math.PI * 2;
            const spd = (Math.random() * .6 + .3) * CFG.speed;
            this.vx = Math.cos(angle) * spd;
            this.vy = Math.sin(angle) * spd;
            this.r = Math.random() * 1.2 + CFG.nodeRadius * .6;
        }

        update() {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CFG.mouseRadius && dist > 1) {
                this.vx += (dx / dist) * CFG.mouseForce;
                this.vy += (dy / dist) * CFG.mouseForce;
            }

            this.vx *= .990; this.vy *= .990;

            const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (spd < .12) {
                this.vx += (Math.random() - .5) * .07;
                this.vy += (Math.random() - .5) * .07;
            }

            this.x += this.vx; this.y += this.vy;

            if (this.x < 0) { this.x = 0; this.vx *= -1; }
            if (this.x > canvas.width) { this.x = canvas.width; this.vx *= -1; }
            if (this.y < 0) { this.y = 0; this.vy *= -1; }
            if (this.y > canvas.height) { this.y = canvas.height; this.vy *= -1; }
        }

        draw(c) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = c.node + '.7)';
            ctx.fill();
        }
    }

    function drawConnections(c) {
        const nodes = [...particles, { x: mouse.x, y: mouse.y }];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < CFG.maxDist) {
                    const alpha = (1 - d / CFG.maxDist) * .50;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = c.line + alpha + ')';
                    ctx.lineWidth = (1 - d / CFG.maxDist) * 1.3;
                    ctx.stroke();
                }
            }
        }
    }

    function drawMouseNode(c) {
        if (mouse.x < 0) return;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, CFG.mouseNodeSize, 0, Math.PI * 2);
        ctx.fillStyle = c.mouse + '.9)';
        ctx.shadowColor = c.mouse + '.55)';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const c = getColors();
        drawConnections(c);
        particles.forEach(p => { p.update(); p.draw(c); });
        drawMouseNode(c);
        requestAnimationFrame(loop);
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function init() {
        resize();
        particles = Array.from({ length: CFG.particleCount }, () => new Particle());

        // Observa mudança de tema
        new MutationObserver(() => {
            isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('touchmove', e => {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }, { passive: true });
        window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

        loop();
    }

    return { init };

})();


/* ----------------------------------------------------------
   HUB UI — Controller principal
   ---------------------------------------------------------- */
const HubUI = (() => {

    const STORAGE_KEYS = {
        SESSION: 'yt_session_v1',
        USERS: 'yt_users_v1',
        THEME: 'theme',
    };

    const $ = id => document.getElementById(id);

    const els = {
        themeToggle: $('hubThemeToggle'),
        logoutBtn: $('hubLogout'),
        userBadge: $('hubUserBadge'),
        cardSoon: $('cardBancoIdeias'),
        toast: $('hubToast'),
    };

    /* --- Toast --- */
    function toast(msg, duration = 2000) {
        els.toast.textContent = msg;
        els.toast.setAttribute('data-show', 'true');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => els.toast.removeAttribute('data-show'), duration);
    }

    /* --- Tema --- */
    function loadTheme() {
        const t = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
        document.documentElement.setAttribute('data-theme', t);
    }

    function toggleTheme() {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEYS.THEME, next);
    }

    /* --- Mostra o nome do usuário logado no badge --- */
    function loadUserBadge() {
        const email = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (!email) return;

        try {
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
            const user = users.find(u => u.email === email);
            const nome = user?.nome || email.split('@')[0];
            // Exibe as iniciais + nome truncado
            const initials = nome.charAt(0).toUpperCase();
            els.userBadge.textContent = `${initials} ${nome.split(' ')[0]}`;
        } catch {
            els.userBadge.textContent = '👤';
        }
    }

    /* --- Logout --- */
    function logout() {
        if (confirm('Deseja sair da sua conta?')) {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            window.location.replace('login.html');
        }
    }

    /* --- Card "em breve" --- */
    function handleSoonCard(e) {
        e.preventDefault();
        toast('🚧 Banco de Ideias em desenvolvimento — em breve!', 2200);

        // Efeito de shake rápido no card
        els.cardSoon.classList.add('hub-card-shake');
        setTimeout(() => els.cardSoon.classList.remove('hub-card-shake'), 500);
    }

    /* --- Inicializa --- */
    function init() {
        loadTheme();
        loadUserBadge();

        els.themeToggle.addEventListener('click', toggleTheme);
        els.logoutBtn.addEventListener('click', logout);

        // Card "em breve" — bloqueia clique/enter e dá feedback
        els.cardSoon.addEventListener('click', handleSoonCard);
        els.cardSoon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') handleSoonCard(e);
        });
    }

    return { init };

})();


/* ----------------------------------------------------------
   INICIALIZAÇÃO
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    NeuralNet.init();
    HubUI.init();
});
