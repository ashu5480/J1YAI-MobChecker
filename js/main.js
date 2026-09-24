'use strict';

/* ============================================================
   1. HELPERS + CIRCUIT CANVAS BACKGROUND
   ============================================================ */
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = window.matchMedia('(hover: none)').matches;

/* ---------- WhatsApp helpers ---------- */
const WA_NUMBER = '919971955493';
const WA_BASE = 'https://wa.me/' + WA_NUMBER;
const WA_DEFAULT_MSG = 'Hi MobChecker, I need help with my mobile phone. I would like to know about the repair service.';
function waUrl(msg) {
  return WA_BASE + '?text=' + encodeURIComponent(msg || WA_DEFAULT_MSG);
}

function initCircuit() {
  const canvas = $('#circuitCanvas');
  if (!canvas || prefersReduced) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const nodes = [];
  const HUES = ['99, 102, 241', '34, 211, 238', '167, 139, 250'];
  const pulses = [];

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    nodes.length = 0;
    const count = Math.min(64, Math.max(24, Math.floor((w * h) / 26000)));
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .22,
        vy: (Math.random() - .5) * .22,
        r: Math.random() * 1.5 + .7,
        hue: HUES[i % HUES.length]
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const LINE = 150, LINK = 280;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
      if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINE * LINE) {
          const alpha = (1 - Math.sqrt(d2) / LINE) * .6;
          ctx.strokeStyle = 'rgba(' + a.hue + ',' + alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(' + a.hue + ',.75)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      // occasional bright electron
      if (Math.random() < .004) pulses.push({ x: a.x, y: a.y, r: 1.2, life: 1 });
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.x += (Math.random() - .5) * 2.4;
      p.y += (Math.random() - .5) * 2.4;
      p.life -= .03;
      if (p.life <= 0) { pulses.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(255,255,255,' + p.life * .8 + ')';
      ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (1 - p.life) * 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(step);
}
initCircuit();

/* ============================================================
   2. NAV, ANCHORS, REVEAL, TILT, TIMELINE, MARQUEE
   ============================================================ */

function initNav() {
  const nav = $('#navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const hamb = $('#hamburger');
  const links = $('#navLinks');
  if (!hamb || !links) return;
  const closeMenu = () => {
    links.classList.remove('open');
    hamb.classList.remove('active');
    hamb.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };
  hamb.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = links.classList.toggle('open');
    hamb.classList.toggle('active', open);
    hamb.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  $$('a', links).forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (links.classList.contains('open') && !links.contains(e.target) && !hamb.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

function initAnchors() {
  const nav = $('#navbar');
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const navH = nav ? nav.getBoundingClientRect().height : 74;
      const y = target.getBoundingClientRect().top + window.scrollY - navH + 2;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
}

function initReveal() {
  const els = $$('[data-reveal]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window) || prefersReduced) {
    els.forEach((el) => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); io.unobserve(entry.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
}

function initTilt() {
  const visual = $('#heroVisual');
  const tilt = $('#phoneTilt');
  if (!visual || !tilt || isCoarse || prefersReduced) return;
  const max = 10;
  visual.addEventListener('pointermove', (e) => {
    const r = visual.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5;
    const py = (e.clientY - r.top) / r.height - .5;
    tilt.style.transform = 'rotateY(' + (px * max * 1.2).toFixed(2) + 'deg) rotateX(' + (-py * max).toFixed(2) + 'deg)';
  });
  visual.addEventListener('pointerleave', () => { tilt.style.transform = 'rotateY(0deg) rotateX(0deg)'; });
}

function initTimeline() {
  const tl = $('#timeline');
  const fill = $('#timelineFill');
  if (!tl || !fill) return;
  const update = () => {
    const r = tl.getBoundingClientRect();
    const wh = window.innerHeight;
    const progress = Math.min(Math.max((wh - r.top) / (r.height + wh * .4), 0), 1);
    fill.style.height = (progress * 100) + '%';
  };
  const io = new IntersectionObserver((entries) => {
    if (entries.some((en) => en.isIntersecting)) {
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      io.disconnect();
    }
  }, { threshold: 0 });
  io.observe(tl);
  update();
}

function initMarquee() {
  const inner = $('.brand-track-inner');
  if (!inner || prefersReduced) return;
  inner.innerHTML += inner.innerHTML; // duplicate once for a seamless -50% loop
}

function initWhatsApp() {
  $$('.wa-link').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') a.setAttribute('href', waUrl(WA_DEFAULT_MSG));
  });
}

function initBooking() {
  const modal = $('#bookingModal');
  const form = $('#bookingForm');
  if (!modal || !form) return;
  const closeBtn = $('#bookingClose');
  const openModal = () => {
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(() => { const f = form.querySelector('input'); if (f) f.focus(); }, 60);
  };
  const closeModal = () => {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  };
  $$('[data-open-booking]').forEach((btn) => btn.addEventListener('click', openModal));
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    const lines = [
      'Hi MobChecker, I would like to book a repair.',
      'Name: ' + (fd.get('name') || ''),
      'Phone: ' + (fd.get('phone') || ''),
      'Device: ' + (fd.get('device') || ''),
      'Problem: ' + (fd.get('problem') || ''),
      'Service: ' + (fd.get('mode') || ''),
      'Address: ' + (fd.get('address') || '-'),
      'Preferred time: ' + (fd.get('time') || 'Any')
    ];
    const msg = lines.join('\n');
    const win = window.open(waUrl(msg), '_blank', 'noopener');
    if (!win) window.location.href = waUrl(msg);
    closeModal();
    form.reset();
  });
}

/* ============================================================
   3. REPAIR CHECKER WIZARD + INIT
   ============================================================ */

const SERVICE_MAP = {
  'Broken Screen': 'Screen Replacement',
  'Battery Problem': 'Battery Replacement',
  'Charging Issue': 'Charging Port Repair',
  'Water Damage': 'Water Damage Repair',
  'Speaker / Mic Issue': 'Speaker & Mic Repair',
  'Camera Issue': 'Camera Repair',
  'Software Problem': 'Software & Performance',
  'Other Issue': 'Complete Diagnostics & Repair'
};

const SERVICE_DESC = {
  'Screen Replacement': 'Cracked or damaged display replacement, restored with a high-quality panel.',
  'Battery Replacement': 'Restore battery performance and charging life with a quality replacement.',
  'Charging Port Repair': 'Fix charging and connectivity problems at the port and cable level.',
  'Water Damage Repair': 'Professional inspection, cleaning and repair for liquid-damaged devices.',
  'Speaker & Mic Repair': 'Fix sound, microphone and call-quality issues across your device.',
  'Camera Repair': 'Diagnose and repair blurry, failed or damaged cameras.',
  'Software & Performance': 'Troubleshooting, software issues and performance problems — resolved.',
  'Complete Diagnostics & Repair': 'Tell us the symptoms on a call — we will diagnose and fix the issue.'
};

const WA_PROBLEM = {
  'Broken Screen': 'a broken screen',
  'Battery Problem': 'a battery problem',
  'Charging Issue': 'a charging problem',
  'Water Damage': 'water damage',
  'Speaker / Mic Issue': 'a speaker or mic issue',
  'Camera Issue': 'a camera problem',
  'Software Problem': 'a software problem',
  'Other Issue': 'a few other issues'
};

function initChecker() {
  const steps = $$('.cs-step');
  const line1 = $('#csLineFill1');
  const line2 = $('#csLineFill2');
  const panels = {
    device: $('#panel-device'),
    problem: $('#panel-problem'),
    result: $('#panel-result')
  };
  const deviceOpts = $('#deviceOptions');
  const problemOpts = $('#problemOptions');
  const order = ['device', 'problem', 'service'];
  let device = null;
  let problem = null;

  function go(key) {
    const curIdx = order.indexOf(key);
    Object.keys(panels).forEach((k) => panels[k].classList.toggle('active', k === key));
    steps.forEach((s) => {
      const idx = order.indexOf(s.dataset.key);
      s.classList.toggle('active', idx === curIdx);
      s.classList.toggle('done', idx < curIdx);
    });
    line1.style.width = curIdx >= 1 ? '100%' : '0%';
    line2.style.width = curIdx >= 2 ? '100%' : '0%';
  }

  function resetSelection(container) {
    $$('.option-chip', container).forEach((c) => c.classList.remove('selected'));
  }

  function renderResult() {
    const service = SERVICE_MAP[problem] || 'Complete Diagnostics & Repair';
    $('#resultService').textContent = service;
    $('#resultDesc').textContent = SERVICE_DESC[service];
    $('#resultDevice').textContent = device;
    $('#resultProblem').textContent = problem;

    const fig = $('#resultFigure');
    fig.innerHTML = '';
    const selected = problemOpts.querySelector('.option-chip.selected .oc-icon');
    if (selected) {
      const clone = selected.cloneNode(true);
      clone.classList.remove('oc-icon');
      fig.appendChild(clone);
    }
    // replay the pop animation
    fig.classList.remove('result-figure');
    void fig.offsetWidth;
    fig.classList.add('result-figure');

    const waBtn = $('#resultWa');
    if (waBtn) {
      const isIphone = String(device).toLowerCase() === 'iphone';
      const deviceName = device === 'Other' ? 'a device' : (isIphone ? 'an iPhone' : 'a ' + device);
      const problemPhrase = WA_PROBLEM[problem] || 'a problem';
      const msg = 'Hi MobChecker, I have ' + deviceName + (device === 'Other' ? '' : ' phone') + ' with ' + problemPhrase + '. I would like to know about the repair.';
      waBtn.setAttribute('href', waUrl(msg));
      waBtn.setAttribute('aria-label', 'Send details about your ' + device + ' repair on WhatsApp');
    }
  }

  deviceOpts.addEventListener('click', (e) => {
    const chip = e.target.closest('.option-chip');
    if (!chip) return;
    resetSelection(deviceOpts);
    chip.classList.add('selected');
    device = chip.dataset.value;
    setTimeout(() => go('problem'), 200);
  });

  problemOpts.addEventListener('click', (e) => {
    const chip = e.target.closest('.option-chip');
    if (!chip) return;
    resetSelection(problemOpts);
    chip.classList.add('selected');
    problem = chip.dataset.value;
    renderResult();
    setTimeout(() => go('service'), 200);
  });

  $$('.ck-back, .ck-restart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.goto || 'device';
      go(target);
      if (btn.classList.contains('ck-restart')) {
        resetSelection(deviceOpts);
        resetSelection(problemOpts);
        device = null;
        problem = null;
      }
    });
  });
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  initNav();
  initAnchors();
  initReveal();
  initTilt();
  initTimeline();
  initMarquee();
  initWhatsApp();
  initBooking();
  initChecker();
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  document.body.classList.add('ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

