/* AI목수 · 디지털공방 — shared interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const hasGsap = !!window.gsap && !reduce;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  const page = document.body.dataset.page;

  /* ---------- words for scrub text ---------- */
  $$('[data-words]').forEach(el => {
    const hl = new RegExp(el.dataset.words || '^$');
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w${hl.test(w) ? ' hl' : ''}">${w}</span>`).join(' ');
  });

  /* ---------- header: hide on scroll down ---------- */
  const hdr = $('.hdr');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('scrolled', y > 40);
    hdr.classList.toggle('hide', y > 300 && y > lastY && !document.body.classList.contains('nav-open'));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  const burger = $('.burger'), mnav = $('.mnav');
  if (burger) burger.addEventListener('click', () => {
    const open = mnav.classList.toggle('open');
    document.body.classList.toggle('nav-open', open);
    burger.textContent = open ? '닫기' : '메뉴';
    burger.setAttribute('aria-expanded', open);
  });
  $$('.mnav a').forEach(a => a.addEventListener('click', () => {
    mnav.classList.remove('open'); document.body.classList.remove('nav-open'); burger.textContent = '메뉴';
  }));

  /* ---------- copy email ---------- */
  const toast = $('.toast');
  $$('[data-copy]').forEach(b => b.addEventListener('click', async e => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(b.dataset.copy); toast.textContent = '메일 주소를 복사했어요 — ' + b.dataset.copy; }
    catch (err) { toast.textContent = b.dataset.copy; }
    toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 2400);
  }));

  /* ---------- Seoul clock ---------- */
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
    const t = () => clock.textContent = fmt.format(new Date());
    t(); setInterval(t, 15000);
  }

  /* ---------- code flow field (water-like) + code trail ---------- */
  const flow = document.createElement('canvas');
  flow.id = 'codeflow'; flow.setAttribute('aria-hidden', 'true');
  document.body.prepend(flow);
  {
    const ctx = flow.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const small = innerWidth < 760;
    const CELL = small ? 18 : 16;
    const GLYPHS = '01{}[]()<>/=;:+-*_.#$&|!?~木手秀AIconstletfnasyncawaitreturn=>'.split('');
    const WORDS = ['const', 'AI', '=>', '{ }', 'await', '木手', 'fn()', '</>', 'build', '秀', 'mockup', 'ship'];
    let W, H, cols, rows, grid, t = 0, last = 0, hidden = false;
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, on: false };
    const ripples = [], trail = [];
    const rnd = a => a[Math.random() * a.length | 0];
    const resize = () => {
      W = innerWidth; H = innerHeight;
      flow.width = W * dpr; flow.height = H * dpr; flow.style.width = W + 'px'; flow.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL) + 2; rows = Math.ceil(H / CELL) + 2;
      grid = Array.from({ length: cols * rows }, () => ({ c: rnd(GLYPHS), k: Math.random() }));
    };
    resize(); addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => hidden = document.hidden);

    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && !e.isPrimary) return;
      mouse.on = true;
      mouse.vx = e.clientX - (mouse.x < -999 ? e.clientX : mouse.x);
      mouse.vy = e.clientY - (mouse.y < -999 ? e.clientY : mouse.y);
      mouse.x = e.clientX; mouse.y = e.clientY;
      const sp = Math.hypot(mouse.vx, mouse.vy);
      const n = Math.min(4, 1 + sp / 14 | 0);
      for (let i = 0; i < n && !reduce; i++) {
        trail.push({ x: mouse.x - mouse.vx * i / n, y: mouse.y - mouse.vy * i / n,
          vx: mouse.vx * .08 + (Math.random() - .5) * .8, vy: mouse.vy * .08 + (Math.random() - .5) * .8 + .25,
          c: Math.random() < .12 ? rnd(WORDS) : rnd(GLYPHS), life: 1, s: 11 + Math.random() * 5 });
      }
      if (trail.length > 260) trail.splice(0, trail.length - 260);
      if (sp > 18 && (!ripples.length || t - ripples[ripples.length - 1].t > .12)) ripples.push({ x: mouse.x, y: mouse.y, t, a: Math.min(1, sp / 60) });
    }, { passive: true });
    addEventListener('pointerdown', e => ripples.push({ x: e.clientX, y: e.clientY, t, a: 1.4 }));
    document.addEventListener('pointerleave', () => { mouse.on = false; mouse.x = mouse.y = -9999; });

    const draw = now => {
      const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
      if (!hidden) {
        t += dt;
        ctx.clearRect(0, 0, W, H);
        ctx.font = `${CELL - 4}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        // current: the whole field drifts down-right like water, with scroll adding push
        const sy = scrollY * .15;
        const ox = (t * 10) % CELL, oy = (t * 22 + sy) % CELL;
        const shiftC = Math.floor(t * 10 / CELL), shiftR = Math.floor((t * 22 + sy) / CELL);
        for (let r = -1; r < rows - 1; r++) {
          for (let c = -1; c < cols - 1; c++) {
            const gx = c * CELL + ox, gy = r * CELL + oy;
            // flowing wave field
            let v = Math.sin(gx * .012 + t * .9) + Math.sin(gy * .017 - t * 1.2) + Math.sin((gx + gy) * .008 + t * .6) + Math.sin(Math.hypot(gx - W * .7, gy - H * .3) * .015 - t * 1.5) * .7;
            v = (v + 3.7) / 7.4; // 0..1
            // ripples
            let rip = 0, dx = 0, dy = 0;
            for (let i = 0; i < ripples.length; i++) {
              const p = ripples[i], age = t - p.t, d = Math.hypot(gx - p.x, gy - p.y), front = age * 260;
              const band = Math.exp(-((d - front) ** 2) / 900) * Math.exp(-age * 1.6) * p.a;
              rip += band; if (d > 0) { dx += (gx - p.x) / d * band * 6; dy += (gy - p.y) / d * band * 6; }
            }
            // mouse glow
            let glow = 0;
            if (mouse.on) { const d = Math.hypot(gx - mouse.x, gy - mouse.y); glow = Math.max(0, 1 - d / 170); glow *= glow; }
            const b = Math.pow(v, 3) * .5 + rip * .9 + glow * .9;
            if (b < .06) continue;
            const idx = (((r - shiftR) % rows + rows) % rows) * cols + (((c - shiftC) % cols + cols) % cols);
            const cell = grid[idx];
            if (Math.random() < .002 + glow * .05 + rip * .08) cell.c = rnd(GLYPHS);
            const a = Math.min(.85, b * (.35 + cell.k * .25));
            const hot = glow + rip;
            ctx.fillStyle = hot > .35 ? `rgba(242,196,109,${a})` : `rgba(227,154,92,${a * .75})`;
            ctx.fillText(cell.c, gx + dx + (glow ? (gx - mouse.x) * glow * .12 : 0), gy + dy + (glow ? (gy - mouse.y) * glow * .12 : 0));
          }
        }
        while (ripples.length && t - ripples[0].t > 2.5) ripples.shift();
        // code trail flowing off the pointer
        for (let i = trail.length - 1; i >= 0; i--) {
          const p = trail[i];
          p.vx *= .96; p.vy = p.vy * .96 + .05;
          p.vx += Math.sin(p.y * .03 + t * 3) * .05;
          p.x += p.vx; p.y += p.vy; p.life -= dt * .9;
          if (p.life <= 0) { trail.splice(i, 1); continue; }
          ctx.font = `${p.s}px "IBM Plex Mono", monospace`;
          ctx.fillStyle = `rgba(243,235,222,${p.life * .9})`;
          ctx.fillText(p.c, p.x, p.y);
        }
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------- hover label (VIEW / READ / PLAY) ---------- */
  if (fine && !reduce) {
    const label = $('.cursor-label');
    let mx = 0, my = 0, lx = 0, ly = 0;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      lx += (mx - lx) * .2; ly += (my - ly) * .2;
      if (label) label.style.transform = `translate(${lx + 18}px,${ly + 18}px)`;
      requestAnimationFrame(loop);
    })();
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; label.classList.add('on'); });
      el.addEventListener('pointerleave', () => label.classList.remove('on'));
    });
    /* magnetic */
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    /* bento spotlight */
    $$('.cell').forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  /* ---------- page transition (curtain) ---------- */
  const curtain = $('.curtain');
  const internal = a => a.host === location.host && /\.html$|\/$/.test(a.pathname) && !a.hash && a.target !== '_blank';
  $$('a[href]').forEach(a => a.addEventListener('click', e => {
    if (!internal(a) || e.metaKey || e.ctrlKey || a.pathname === location.pathname) return;
    if (!hasGsap) return;
    e.preventDefault();
    store.set('curtain', '1');
    gsap.set(curtain, { transformOrigin: 'bottom' });
    gsap.timeline({ onComplete: () => { location.href = a.href; } })
      .to(curtain, { scaleY: 1, duration: .7, ease: 'expo.inOut' })
      .to('.curtain span', { opacity: 1, duration: .25 }, '-=.25');
  }));
  addEventListener('pageshow', e => { if (e.persisted && curtain) { curtain.style.transform = 'scaleY(0)'; } });

  /* ---------- no animation fallback ---------- */
  const loader = $('.loader');
  if (!hasGsap) {
    if (loader) loader.remove();
    document.body.classList.remove('loading');
    $$('.w').forEach(w => w.style.opacity = 1);
    $$('.step').forEach(s => s.classList.add('on'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -40, duration: 1.4 }); }
    }));
  }

  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* ---------- intro sequence ---------- */
  const intro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero .line>span, .a-hero .line>span', { yPercent: 110, rotate: 3, duration: 1.4, stagger: .09 })
      .from('[data-intro]', { y: 24, opacity: 0, duration: 1, stagger: .08 }, '-=1')
      .from('.hdr', { yPercent: -100, duration: 1, clearProps: 'transform' }, '-=1.1');
    if ($('.a-hero .bg-han')) gsap.from('.a-hero .bg-han', { opacity: 0, x: 80, duration: 2, ease: 'power3.out' });
  };

  const fromCurtain = store.get('curtain') === '1';
  store.set('curtain', '0');
  if (fromCurtain && curtain) {
    gsap.set(curtain, { scaleY: 1, transformOrigin: 'top' });
    gsap.set('.curtain span', { opacity: 1 });
  }

  const start = () => {
    if (fromCurtain && curtain) {
      gsap.timeline().to('.curtain span', { opacity: 0, duration: .2 })
        .to(curtain, { scaleY: 0, duration: .8, ease: 'expo.inOut' }).add(intro, '-=.4');
    } else intro();
  };

  if (loader && !store.get('seenLoader') && !fromCurtain) {
    store.set('seenLoader', '1');
    const n = { v: 0 }, count = $('.loader .count');
    gsap.timeline({ onComplete: () => { loader.remove(); document.body.classList.remove('loading'); ScrollTrigger.refresh(); } })
      .to(n, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => count.textContent = String(Math.round(n.v)).padStart(3, '0') })
      .to('.loader .bar', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
      .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' })
      .add(intro, '-=.5');
  } else {
    if (loader) loader.remove();
    document.body.classList.remove('loading');
    start();
  }

  /* hero parallax out */
  if ($('.hero-inner')) gsap.to('.hero-inner', { yPercent: -12, opacity: .25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* marquee: scroll-velocity driven */
  $$('.marquee-track').forEach(track => {
    const dir = track.dataset.dir === 'right' ? 1 : -1;
    let x = 0, speed = 1, half = 0;
    const measure = () => half = track.scrollWidth / 2;
    measure(); addEventListener('resize', measure);
    ScrollTrigger.create({ onUpdate: s => { speed = 1 + Math.min(Math.abs(s.getVelocity()) / 300, 6); } });
    gsap.ticker.add(() => {
      x += dir * .6 * speed; speed += (1 - speed) * .05;
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = `translateX(${x}px)`;
    });
  });

  /* section titles: line reveal */
  $$('.sec-title, .reveal-lines').forEach(el => {
    gsap.from($$('.line>span', el), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  /* generic reveal */
  $$('[data-reveal]').forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-stagger]').forEach(el => gsap.from(el.children, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 85%' } }));

  /* word scrub */
  $$('[data-words]').forEach(el => gsap.to($$('.w', el), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } }));

  /* ---------- horizontal works ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    const track = $('.works-track');
    if (!track) return;
    const dist = () => track.scrollWidth - innerWidth;
    const tw = gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.works', pin: '.works-pin', start: 'top top', end: () => '+=' + dist(), scrub: .8, invalidateOnRefresh: true,
        onUpdate: s => {
          const n = $$('.work').length, i = Math.min(n, Math.floor(s.progress * n) + 1);
          const c = $('.works-count b'); if (c) c.textContent = String(i).padStart(2, '0');
          gsap.set('.works-progress i', { scaleX: s.progress });
        } } });
    $$('.work .inner').forEach(el => gsap.fromTo(el, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: el.closest('.work'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } }));
  });
  mm.add('(max-width: 960px)', () => {
    $$('.work').forEach(w => gsap.from(w, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: w, start: 'top 88%' } }));
  });

  /* ---------- process steps ---------- */
  const big = $('.process-sticky .big b');
  $$('.step').forEach((s, i) => ScrollTrigger.create({
    trigger: s, start: 'top 60%', end: 'bottom 60%',
    onToggle: self => { if (self.isActive) { $$('.step').forEach(x => x.classList.remove('on')); s.classList.add('on'); if (big) big.textContent = String(i + 1).padStart(2, '0'); } }
  }));

  /* ---------- about page ---------- */
  $$('.chapter .hanja').forEach(el => gsap.from(el, { scale: .85, filter: 'blur(12px)', opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
  $$('.visual').forEach(v => {
    const paths = $$('.draw', v);
    if (!paths.length) return;
    paths.forEach(p => { const L = p.getTotalLength ? p.getTotalLength() : 600; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.to(paths, { strokeDashoffset: 0, ease: 'none', stagger: .05, scrollTrigger: { trigger: v, start: 'top 80%', end: 'center 45%', scrub: 1 } });
    gsap.from($$('.fade-in', v), { opacity: 0, stagger: .1, scrollTrigger: { trigger: v, start: 'center 60%' } });
  });
  if ($('.big-su')) {
    gsap.from('.big-su', { scale: .4, opacity: 0, rotate: -10, ease: 'back.out(1.6)', duration: 1.4, scrollTrigger: { trigger: '.ch3 .visual', start: 'top 75%' } });
    gsap.to('.big-su', { textShadow: '0 0 70px rgba(242,196,109,.8), 0 0 160px rgba(227,154,92,.55)', repeat: -1, yoyo: true, duration: 2, ease: 'sine.inOut' });
  }

  /* contact big title */
  if ($('.contact h2')) gsap.from('.contact h2 .line>span', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.contact h2', start: 'top 85%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
