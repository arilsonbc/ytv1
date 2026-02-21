/* ============================================================
   LANDING PAGE — YT Toolbox  |  landing.js
   - Typewriter effect no título hero
   - Canvas de partículas interativas
   - Navbar scroll effect
   - Animações de entrada via Intersection Observer
   ============================================================ */

'use strict';

/* ============================================================
   0. TYPEWRITER + REVEAL SEQUENCE
   O título digita primeiro; ao terminar, todos os elementos
   com [data-reveal] entram com slide-up fade-in escalonado.
   ============================================================ */
(function initTypewriter() {
    const line1El = document.getElementById('typeLine1');
    const line2El = document.getElementById('typeLine2');
    const cursor1El = document.getElementById('typeCursor1');
    const cursor2El = document.getElementById('typeCursor2');

    if (!line1El || !line2El) return;

    const LINE1 = 'O estúdio completo para';
    const LINE2 = 'criadores do YouTube!';

    const SPEED_NORMAL = 48;   // ms por caractere — linha 1
    const SPEED_FAST = 30;   // ms por caractere — linha 2
    const REVEAL_STEP = 120;  // ms entre cada elemento que entra depois

    /** Digita texto caractere por caractere, resolve ao terminar */
    function typeText(el, text, speed) {
        return new Promise(resolve => {
            let i = 0;
            function tick() {
                if (i < text.length) {
                    el.textContent += text[i++];
                    setTimeout(tick, speed + Math.random() * 18);
                } else {
                    resolve();
                }
            }
            tick();
        });
    }

    /**
     * Revela todos os elementos [data-reveal] em ordem crescente,
     * com um pequeno atraso escalonado entre cada um.
     * Retorna o tempo total estimado para os elementos terminarem de animar.
     */
    function revealAll() {
        const items = [...document.querySelectorAll('[data-reveal]')]
            .sort((a, b) => +a.dataset.reveal - +b.dataset.reveal);

        items.forEach((el, idx) => {
            setTimeout(() => {
                el.classList.remove('lp-pending');
                el.classList.add('lp-revealed');
            }, idx * REVEAL_STEP);
        });

        // Retorna o tempo total até o último item terminar de animar
        // (último delay + duração da transição 1150ms)
        return (items.length - 1) * REVEAL_STEP + 1150;
    }

    /** Sequência principal */
    async function run() {
        // Bloqueia scroll durante a intro
        document.body.style.overflow = 'hidden';

        // Linha 1 — cursor ativo
        cursor1El.classList.remove('lp-type-cursor--hide');
        cursor2El.classList.add('lp-type-cursor--hide');
        await typeText(line1El, LINE1, SPEED_NORMAL);

        // Passa cursor para linha 2
        cursor1El.classList.add('lp-type-cursor--hide');
        cursor2El.classList.remove('lp-type-cursor--hide');

        // Pausa dramática
        await new Promise(r => setTimeout(r, 200));

        // Linha 2
        await typeText(line2El, LINE2, SPEED_FAST);

        // Cursor pisca brevemente e some
        await new Promise(r => setTimeout(r, 300));
        cursor2El.classList.add('lp-type-cursor--hide');

        // Dispara reveal sequence de todos os outros elementos
        await new Promise(r => setTimeout(r, 30));
        const revealDuration = revealAll();

        // Aguarda todos os elementos terminarem de animar, depois libera scroll
        await new Promise(r => setTimeout(r, revealDuration));
        document.body.style.overflow = '';

    }

    run();
})();

/* ============================================================
   1. CANVAS DE PARTÍCULAS
   ============================================================ */
(function initParticles() {
    const canvas = document.getElementById('lpCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles, mouse;

    const CONFIG = {
        count: 90,
        maxDist: 130,
        speed: 0.35,
        baseRadius: 1.4,
        color: '127,255,0',           // lime-green
        lineOpacityMax: 0.12,
        dotOpacityMin: 0.25,
        dotOpacityMax: 0.55,
        mouseRadius: 160,
        mouseForce: 0.018,
    };

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createParticle() {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.2 + Math.random() * 0.6) * CONFIG.speed;
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: CONFIG.baseRadius + Math.random() * 1.2,
            opacity: CONFIG.dotOpacityMin + Math.random() * (CONFIG.dotOpacityMax - CONFIG.dotOpacityMin),
        };
    }

    function init() {
        resize();
        mouse = { x: W / 2, y: H / 2 };
        particles = Array.from({ length: CONFIG.count }, createParticle);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Atualizar e desenhar partículas
        particles.forEach(p => {
            // Mover
            p.x += p.vx;
            p.y += p.vy;

            // Influência do mouse
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < CONFIG.mouseRadius) {
                const force = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
                p.vx += dx * force;
                p.vy += dy * force;
            }

            // Damping e wrap
            p.vx *= 0.995;
            p.vy *= 0.995;
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;

            // Ponto
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${CONFIG.color},${p.opacity})`;
            ctx.fill();
        });

        // Linhas entre partículas próximas
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i];
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d = Math.hypot(dx, dy);
                if (d < CONFIG.maxDist) {
                    const alpha = (1 - d / CONFIG.maxDist) * CONFIG.lineOpacityMax;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(${CONFIG.color},${alpha})`;
                    ctx.lineWidth = .7;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    // Eventos
    window.addEventListener('resize', () => { resize(); });
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('touchmove', e => {
        if (e.touches[0]) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    init();
    draw();
})();

/* ============================================================
   2. NAVBAR — efeito de blur/fundo ao rolar a página
   ============================================================ */
(function initNavScroll() {
    const nav = document.getElementById('lpNav');
    if (!nav) return;

    function onScroll() {
        if (window.scrollY > 30) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Check initial state
})();

/* ============================================================
   3. INTERSECTION OBSERVER — zoom-in repetível na seção de features
   O efeito se repete toda vez que o elemento entra/sai do viewport.
   ============================================================ */
(function initScrollReveal() {

    /* --- Features: zoom-in de baixo, repete sempre --- */
    const featureTargets = [
        ...document.querySelectorAll('.lp-section-header, .lp-feature-card'),
    ];

    // Guarda o índice de cada elemento para manter o stagger consistente
    featureTargets.forEach((el, i) => {
        el.dataset.revealIndex = i;
        // Estado inicial: oculto e reduzido
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px) scale(0.82)';
        el.style.transition = 'none';
    });

    const FEAT_DURATION = '0.75s';
    const FEAT_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
    const FEAT_STAGGER = 0.08; // segundos entre cada card

    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            const idx = +el.dataset.revealIndex;
            const delay = `${idx * FEAT_STAGGER}s`;

            if (entry.isIntersecting) {
                // Ativa a transição e anima para o estado visível
                el.style.transition = [
                    `opacity  ${FEAT_DURATION} ${delay} ${FEAT_EASING}`,
                    `transform ${FEAT_DURATION} ${delay} ${FEAT_EASING}`,
                ].join(', ');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0) scale(1)';

                // Se este elemento for o header da seção, ativa o rabisco
                if (el.classList.contains('lp-section-header')) {
                    el.classList.remove('lp-scribble-reset');
                    el.classList.add('lp-scribble-draw');
                }
            } else {
                // Saiu do viewport: reseta SEM transição (instantâneo)
                el.style.transition = 'none';
                el.style.opacity = '0';
                el.style.transform = 'translateY(50px) scale(0.82)';

                // Reseta o rabisco para que redesenhe na próxima visita
                if (el.classList.contains('lp-section-header')) {
                    el.classList.remove('lp-scribble-draw');
                    el.classList.add('lp-scribble-reset');
                }
            }
        });
    }, { threshold: 0.10 });

    featureTargets.forEach(el => featureObserver.observe(el));

    /* --- CTA final: fade-up repetível --- */
    const ctaTargets = [...document.querySelectorAll('.lp-cta-card')];

    ctaTargets.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'none';
    });

    const CTA_TRANSITION = 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)';

    const ctaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            if (entry.isIntersecting) {
                el.style.transition = CTA_TRANSITION;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            } else {
                el.style.transition = 'none';
                el.style.opacity = '0';
                el.style.transform = 'translateY(40px)';
            }
        });
    }, { threshold: 0.15 });

    ctaTargets.forEach(el => ctaObserver.observe(el));
})();

/* ============================================================
   4. BOTÃO "CRIAR CONTA" — fallback para browsers sem @property
   (Compatibilidade com browsers que não suportam conic-gradient + @property)
   ============================================================ */
(function initButtonFallback() {
    // Detecta suporte a CSS @property
    const supportsProperty = CSS && typeof CSS.registerProperty === 'function';

    if (!supportsProperty) {
        // Aplica animação JS como fallback
        const lights = document.querySelectorAll('.lp-btn-signup-light');
        let angle = 0;

        lights.forEach(el => {
            function animate() {
                angle = (angle + 2) % 360;
                el.style.background = `conic-gradient(
                    from ${angle}deg,
                    transparent 0%,
                    transparent 60%,
                    rgba(255,255,255,.9) 72%,
                    rgba(200,255,80,1) 78%,
                    rgba(255,255,255,.9) 84%,
                    transparent 96%,
                    transparent 100%
                )`;
                requestAnimationFrame(animate);
            }
            animate();
        });
    }
})();

/* ============================================================
   5. NAVEGAÇÃO SUAVE — links internos da landing page
   ============================================================ */
(function initSmoothNav() {
    // Ao clicar em "Criar conta", redireciona para login.html e abre a tela de criação
    const signupButtons = document.querySelectorAll('[href="login.html#criar"]');
    signupButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Salva intenção no sessionStorage para login.js detectar
            try {
                sessionStorage.setItem('lp_goto', 'criar');
            } catch (_) { /* silencioso */ }
            window.location.href = 'login.html';
        });
    });
})();
