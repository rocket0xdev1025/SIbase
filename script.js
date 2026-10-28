/* ===== CONFIG: fill these in at launch ===== */
const CONFIG = {
  CA: '0xc5cda8b71e207e58ff78794d3a5cba36d14b3d21',          // EVM contract address on Base, e.g. 0x1234...abcd
  X: 'https://x.com/BaseSICoin',
  TELEGRAM: 'https://t.me/SI_base',
  CHAIN: 'base'
};
/* ========================================== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const validCA = /^0x[a-fA-F0-9]{40}$/.test(CONFIG.CA);
  const caOrTBA = validCA ? CONFIG.CA : '0xc5cda8b71e207e58ff78794d3a5cba36d14b3d21';
  const LINKS = {
    buy: `https://app.uniswap.org/swap?chain=${CONFIG.CHAIN}&outputCurrency=${caOrTBA}`,
    chart: `https://dexscreener.com/${CONFIG.CHAIN}/${caOrTBA}`,
    x: CONFIG.X,
    telegram: CONFIG.TELEGRAM
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none), (pointer: coarse)').matches || innerWidth < 768;

  /* links */
  $$('[data-link]').forEach(a => {
    const url = LINKS[a.dataset.link];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.classList.remove('is-disabled'); a.removeAttribute('aria-disabled'); }
    else { a.removeAttribute('href'); a.classList.add('is-disabled'); a.setAttribute('aria-disabled', 'true'); a.setAttribute('role', 'link'); }
  });
  const short = validCA ? CONFIG.CA.slice(0, 6) + '...' + CONFIG.CA.slice(-4) : '0xc5cda8b71e207e58ff78794d3a5cba36d14b3d21';
  $$('[data-ca]').forEach(e => e.textContent = caOrTBA);
  $$('[data-ca-short]').forEach(e => e.textContent = short);

  /* toast + copy */
  const toast = $('.toast'); let tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); }
  function fallbackCopy(t) { const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;left:-9999px'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok; }
  async function copy(t) { try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; } } catch (e) {} return fallbackCopy(t); }
  $$('[data-copy-ca]').forEach(b => b.addEventListener('click', async () => {
    const ok = await copy(caOrTBA);
    const lab = b.querySelector('span'); const old = lab ? lab.textContent : '';
    b.classList.add('is-copied'); if (lab) lab.textContent = 'Copied';
    say(ok ? (validCA ? 'Contract address copied' : 'Copied: CA is 0xc5cda8b71e207e58ff78794d3a5cba36d14b3d21 until launch') : 'Copy failed, select the address manually');
    setTimeout(() => { b.classList.remove('is-copied'); if (lab) lab.textContent = old; }, 1800);
  }));

  /* chart */
  if (validCA) {
    const box = $('[data-chart]'); $('[data-chart-overlay]').remove();
    const f = document.createElement('iframe');
    f.src = `https://dexscreener.com/${CONFIG.CHAIN}/${CONFIG.CA}?embed=1&theme=dark&trades=0&info=0`;
    f.title = '$SI live chart on DexScreener'; f.loading = 'lazy'; box.appendChild(f);
  }

  /* lightbox */
  const cards = $$('.gcard'), lb = $('.lightbox'), lbImg = $('img', lb); let idx = 0, lastFocus;
  function show(i) { idx = (i + cards.length) % cards.length; lbImg.src = cards[idx].dataset.full; lbImg.alt = cards[idx].dataset.alt; }
  function open(i) { lastFocus = document.activeElement; show(i); lb.hidden = false; $('.lb-close').focus(); document.body.style.overflow = 'hidden'; }
  function close() { lb.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
  cards.forEach((c, i) => c.addEventListener('click', () => open(i)));
  $('.lb-close').onclick = close; $('.lb-prev').onclick = () => show(idx - 1); $('.lb-next').onclick = () => show(idx + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(idx + 1); else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'Tab') { const f = $$('button', lb); const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });

  /* star rain canvas (fixed, non-interactive) */
  if (!reduce) {
    const cv = $('#rain'), cx = cv.getContext('2d'); let W, H, stars = [];
    const N = touch ? 40 : 90;
    function size() { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); }
    function mk(y) { return { x: Math.random() * W, y: y ?? Math.random() * H, v: .3 + Math.random() * 1.2, r: Math.random() * 1.4 + .3, l: 6 + Math.random() * 18, o: Math.random() < .2 }; }
    size(); addEventListener('resize', size); for (let i = 0; i < N; i++) stars.push(mk());
    (function tick() {
      cx.clearRect(0, 0, W, H);
      for (const s of stars) { s.y += s.v; s.x -= s.v * .25; if (s.y > H + 20) Object.assign(s, mk(-20));
        const g = cx.createLinearGradient(s.x, s.y, s.x + s.l * .25, s.y - s.l); const c = s.o ? '255,180,107' : '160,215,255';
        g.addColorStop(0, `rgba(${c},.9)`); g.addColorStop(1, `rgba(${c},0)`);
        cx.strokeStyle = g; cx.lineWidth = s.r; cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.x + s.l * .25, s.y - s.l); cx.stroke(); }
      requestAnimationFrame(tick);
    })();
  }

  /* split text (letters for headings, words for .words) */
  function splitLetters(el) {
    const words = el.textContent.trim().split(/\s+/); el.setAttribute('aria-label', el.textContent.trim()); el.textContent = '';
    words.forEach((w, i) => { const wd = document.createElement('span'); wd.className = 'wd'; wd.setAttribute('aria-hidden', 'true');
      for (const c of w) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wd.appendChild(s); }
      el.appendChild(wd); if (i < words.length - 1) el.appendChild(document.createTextNode(' ')); });
  }
  function splitWords(el) { const t = el.textContent.trim(); el.innerHTML = t.split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); }

  /* meter text update */
  const stages = [['HUMAN', 100], ['GENIUS', 160], ['AGI', 1000], ['ASI', 5000], ['SUPER', 9001]];
  function meterSet(p) {
    const fill = $('.meter-fill'); fill.style.width = (4 + p * 95.5) + '%';
    const si = Math.min(4, Math.floor(p * 5)); const iq = Math.round(100 + (9001 - 100) * Math.pow(p, 2.2));
    $('[data-iq]').textContent = 'IQ ' + iq; $('[data-stage]').textContent = stages[si][0];
    $$('.boot li').forEach((li, i) => li.style.opacity = p >= i / 6 ? 1 : .12);
  }

  /* motion */
  function initMotion() {
    const G = window.gsap, ST = window.ScrollTrigger;
    if (!G || !ST || reduce) { meterSet(reduce ? 1 : 1); return; }
    G.registerPlugin(ST);
    document.documentElement.classList.add('anim');
    let lenis = null;
    if (!touch && window.Lenis) { try { lenis = new Lenis({ lerp: .1 }); lenis.on('scroll', ST.update); G.ticker.add(t => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -100 }); } })); } catch (e) { lenis = null; } }
    const k = touch ? .5 : 1;
    $$('h2.split').forEach(splitLetters); $$('.words').forEach(splitWords);
    $$('.rv').forEach(el => G.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
    G.utils.toArray('.hero .rv').forEach((el, i) => G.to(el, { opacity: 1, y: 0, duration: .9, delay: .1 + i * .08, ease: 'power3.out', overwrite: true }));
    $$('h2.split').forEach(h => G.from($$('.ch', h), { yPercent: 110, opacity: 0, rotate: 8, stagger: .025, duration: .7, ease: 'back.out(1.6)', scrollTrigger: { trigger: h, start: 'top 88%' } }));
    $$('.words').forEach(p => G.from($$('.w', p), { opacity: .08, stagger: .05, scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 50%', scrub: true } }));
    $$('.clip-reveal').forEach(f => G.to(f, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: f, start: 'top 80%' } }));
    // hero layered parallax + outlined word slide
    G.to('.l-streaks', { xPercent: -6 * k, yPercent: 8 * k, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.l-base', { scale: 1.04, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.fromTo('[data-slide]', { xPercent: 5 }, { xPercent: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (!touch) G.to('.hero-frame', { scale: .92, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.join-bg', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.join', start: 'top bottom', end: 'bottom top', scrub: true } });
    // signature scene: intelligence meter
    meterSet(0);
    const meterST = { trigger: '.meter-scene', start: touch ? 'top 70%' : 'top top', end: touch ? 'bottom 40%' : '+=1600', scrub: .6, pin: touch ? false : '.meter-pin', onUpdate: s => meterSet(s.progress) };
    ST.create(meterST);
    G.to('.meter-core', { rotate: 360 * k, scale: 1.15, ease: 'none', scrollTrigger: { ...meterST, pin: false, onUpdate: null } });
    // sideways gallery (desktop only)
    const mm = G.matchMedia();
    mm.add('(min-width: 900px) and (hover: hover)', () => {
      const sec = $('.gallery-sec'); sec.classList.add('gal-h'); const track = $('.gal-track');
      const dist = () => track.scrollWidth - innerWidth + 80;
      const tw = G.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: '.gal-pin', scrub: .8, invalidateOnRefresh: true } });
      return () => { sec.classList.remove('gal-h'); G.set(track, { clearProps: 'x' }); };
    });
    ST.refresh();
  }
  if (document.readyState === 'complete') initMotion(); else addEventListener('load', initMotion);
})();
