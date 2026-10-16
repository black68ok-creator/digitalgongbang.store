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

  /* ---------- sawdust particles ---------- */
  const cv = $('#sawdust');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H, parts = [], mouse = { x: -999, y: -999 }, visible = true;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener('resize', resize);
    const C = ['227,154,92', '242,196,109', '180,101,47', '243,235,222'];
    const spawn = (x, y, burst) => ({
      x: x ?? Math.random() * W, y: y ?? Math.random() * H,
      vx: (Math.random() - .5) * (burst ? 2.4 : .3), vy: burst ? (Math.random() - .8) * 2.2 : Math.random() * .35 + .05,
      r: Math.random() * 2 + .6, w: Math.random() * 4 + 1, rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .05,
      a: burst ? 1 : Math.random() * .5 + .15, life: burst ? 90 : Infinity, c: C[Math.random() * C.length | 0]
    });
    const base = innerWidth < 700 ? 45 : 120;
    for (let i = 0; i < base; i++) parts.push(spawn());
    const host = cv.parentElement;
    host.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      if (!reduce && parts.length < base + 220) for (let i = 0; i < 2; i++) parts.push(spawn(mouse.x, mouse.y, true));
    });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(cv);
    const tick = () => {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        parts = parts.filter(p => p.life > 0);
        for (const p of parts) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 14000 && p.life === Infinity) { const f = 1 - d2 / 14000; p.vx += dx * .0009 * f; p.vy += dy * .0009 * f; }
          p.vy += p.life === Infinity ? .0015 : .05; p.vx *= .985; p.vy *= .985;
          if (p.life === Infinity) p.vy = Math.min(Math.max(p.vy, .04), .8);
          p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          if (p.life !== Infinity) { p.life--; p.a = p.life / 90; }
          if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
          if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.fillRect(-p.w / 2, -p.r / 2, p.w, p.r); ctx.restore();
        }
      }
      if (!reduce) requestAnimationFrame(tick);
    };
    tick();
  }

  /* ---------- cursor ---------- */
  if (fine && !reduce) {
    const dot = $('.cursor'), ring = $('.cursor-ring'), label = $('.cursor-label');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
    (function loop() {
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      label.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    $$('a,button').forEach(el => {
      el.addEventListener('pointerenter', () => ring.classList.add('hover'));
      el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
    });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { ring.classList.add('view'); label.textContent = el.dataset.cursor; label.classList.add('on'); });
      el.addEventListener('pointerleave', () => { ring.classList.remove('view'); label.classList.remove('on'); });
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
