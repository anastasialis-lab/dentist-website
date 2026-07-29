/* =============================================================
   U&S DENTAL CLINIC — interactions
   Header · mobile nav · scroll reveal · stagger · parallax
   counters · price tabs · FAQ · active nav · FAB
   ============================================================= */
(() => {
    'use strict';

    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------
       HEADER — стан при скролі
       --------------------------------------------------------- */
    const header = $('#header');
    const fab = $('#fab');

    /* ---------------------------------------------------------
       МОБІЛЬНЕ МЕНЮ
       --------------------------------------------------------- */
    const burger = $('#burger');
    const nav = $('#nav');
    const backdrop = $('#navBackdrop');

    const setMenu = (open) => {
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
        nav.classList.toggle('is-open', open);
        backdrop.hidden = false;
        backdrop.classList.toggle('is-shown', open);
        document.body.classList.toggle('is-locked', open);
    };

    burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    backdrop.addEventListener('click', () => setMenu(false));
    $$('.nav a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
    });

    // Меню — тільки для мобільних; при поверненні на десктоп скидаємо стан
    const mqDesktop = window.matchMedia('(min-width: 961px)');
    mqDesktop.addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    /* ---------------------------------------------------------
       SCROLL REVEAL + STAGGER
       --------------------------------------------------------- */
    // Дітям контейнера з data-stagger призначаємо каскадну затримку
    $$('[data-stagger]').forEach(group => {
        const step = parseInt(group.dataset.stagger, 10) || 90;
        $$('[data-reveal]', group).forEach((el, i) => {
            if (!el.style.getPropertyValue('--reveal-delay')) {
                el.style.setProperty('--reveal-delay', `${i * step}ms`);
            }
        });
    });

    const revealables = $$('[data-reveal]');

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealables.forEach(el => el.classList.add('is-in'));
    } else {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        revealables.forEach(el => io.observe(el));

        // Hero показуємо одразу — без очікування скролу
        requestAnimationFrame(() => {
            $$('.hero [data-reveal]').forEach(el => {
                el.classList.add('is-in');
                io.unobserve(el);
            });
            $('.hero')?.classList.add('is-ready');
        });
    }

    /* ---------------------------------------------------------
       ЛІЧИЛЬНИКИ
       --------------------------------------------------------- */
    const animateCount = (el) => {
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals, 10) || 0;
        const duration = 1500;
        const start = performance.now();
        const fmt = (v) => decimals
            ? v.toFixed(decimals)
            : Math.round(v).toLocaleString('uk-UA');

        if (reduceMotion) { el.textContent = fmt(target); return; }

        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(target * eased);
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const counters = $$('[data-count]');
    if (counters.length) {
        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCount);
        } else {
            const cio = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    animateCount(entry.target);
                    cio.unobserve(entry.target);
                });
            }, { threshold: 0.6 });
            counters.forEach(el => cio.observe(el));
        }
    }

    /* ---------------------------------------------------------
       PARALLAX (rAF, тільки для видимих елементів)
       --------------------------------------------------------- */
    const parallaxItems = reduceMotion ? [] : $$('[data-parallax]').map(el => ({
        el,
        speed: parseFloat(el.dataset.parallax) || 0,
        visible: false
    }));

    if (parallaxItems.length && 'IntersectionObserver' in window) {
        const pio = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = parallaxItems.find(i => i.el === entry.target);
                if (item) item.visible = entry.isIntersecting;
            });
        }, { rootMargin: '15% 0px' });
        parallaxItems.forEach(i => pio.observe(i.el));
    } else {
        parallaxItems.forEach(i => { i.visible = true; });
    }

    /* ---------------------------------------------------------
       АКТИВНИЙ ПУНКТ НАВІГАЦІЇ
       --------------------------------------------------------- */
    const navLinks = $$('.nav__link');
    const sections = navLinks
        .map(link => {
            const id = link.getAttribute('href');
            return id && id.startsWith('#') ? { link, el: $(id) } : null;
        })
        .filter(s => s && s.el);

    /* ---------------------------------------------------------
       ЄДИНИЙ SCROLL-ЦИКЛ
       --------------------------------------------------------- */
    let ticking = false;

    const onFrame = () => {
        const y = window.scrollY;

        header.classList.toggle('is-stuck', y > 12);
        fab?.classList.toggle('is-shown', y > 620);

        // Parallax
        const vh = window.innerHeight;
        parallaxItems.forEach(({ el, speed, visible }) => {
            if (!visible) return;
            const rect = el.getBoundingClientRect();
            const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
            el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
        });

        // Активна секція
        const probe = y + window.innerHeight * 0.32;
        let current = null;
        sections.forEach(s => {
            if (s.el.offsetTop <= probe) current = s;
        });
        navLinks.forEach(l => l.classList.remove('is-active'));
        if (current) current.link.classList.add('is-active');

        ticking = false;
    };

    const requestFrame = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(onFrame);
    };

    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame, { passive: true });
    requestFrame();

    /* ---------------------------------------------------------
       ПРАЙС — ТАБИ
       --------------------------------------------------------- */
    const tabs = $$('.tab');
    const panels = $$('.panel');

    const activateTab = (tab) => {
        const panel = $(`#${tab.getAttribute('aria-controls')}`);
        if (!panel) return;

        tabs.forEach(t => {
            t.classList.remove('is-active');
            t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => {
            p.classList.remove('is-active');
            p.hidden = true;
        });

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        panel.hidden = false;
        panel.classList.add('is-active');
    };

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activateTab(tab));
        tab.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
            next.focus();
            activateTab(next);
        });
    });

    /* ---------------------------------------------------------
       FAQ — АКОРДЕОН
       --------------------------------------------------------- */
    $$('.faq__q').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq__item');
            const isOpen = item.classList.contains('is-open');

            $$('.faq__item').forEach(other => {
                other.classList.remove('is-open');
                $('.faq__q', other)?.setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                item.classList.add('is-open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
})();
