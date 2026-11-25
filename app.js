/* ── Interactive Constellation Particles ── */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
const mouse = { x: null, y: null, radius: 130 };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const spotlight = document.getElementById('cursor-spotlight');
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (spotlight) {
    spotlight.style.left = e.clientX + 'px';
    spotlight.style.top = e.clientY + 'px';
  }
});

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.8 + 0.5;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.alpha = Math.random() * 0.45 + 0.15;
    const r = Math.random();
    this.color = r > 0.65 ? '#00f5ff' : r > 0.4 ? '#bf5af2' : r > 0.2 ? '#30d158' : '#ffd60a';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (mouse.x !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius && dist > 0) {
        const force = (mouse.radius - dist) / mouse.radius;
        this.x += (dx / dist) * force * 1.2;
        this.y += (dy / dist) * force * 1.2;
      }
    }
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const particles = Array.from({ length: 85 }, () => new Particle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < particles.length; i++) {
    const p1 = particles[i];
    p1.update();
    p1.draw();
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (dist < 115) {
        ctx.save();
        ctx.globalAlpha = (1 - dist / 115) * 0.11;
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ── Glow Card Mouse Tracking ── */
document.querySelectorAll('.glow-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});

/* ── Typed Text Loop ── */
const phrases = [
  '.NET 10 Backend Architect',
  'Clean Architecture Engineer',
  'SignalR Real-Time Developer',
  'Flutter & AI Builder',
  'Business Dev & PR Lead',
  'PostgreSQL & Docker Dev'
];
let phraseIdx = 0;
let charIdx = 0;
let deleting = false;
const typedEl = document.getElementById('typed-text');

function typeLoop() {
  if (!typedEl) return;
  const cur = phrases[phraseIdx];
  if (!deleting) {
    typedEl.textContent = cur.slice(0, charIdx + 1);
    charIdx++;
    if (charIdx === cur.length) {
      deleting = true;
      setTimeout(typeLoop, 1700);
      return;
    }
  } else {
    typedEl.textContent = cur.slice(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }
  }
  setTimeout(typeLoop, deleting ? 45 : 75);
}
typeLoop();

/* ── Scroll Reveal, Navbar & Progress ── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), idx * 65);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  const progress = document.getElementById('scroll-progress');
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (progress && docHeight > 0) {
    progress.style.width = `${Math.min(100, (scrollTop / docHeight) * 100)}%`;
  }
  if (nav) {
    nav.classList.toggle('scrolled', scrollTop > 40);
  }
});

/* ── Mobile Menu ── */
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
document.querySelectorAll('.nav-links a').forEach((a) => {
  a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
});

/* ── Project Category Filter ── */
function filterProjects(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.project-card').forEach((card) => {
    const cats = (card.dataset.cat || '').split(' ');
    const show = cat === 'all' || cats.includes(cat);
    card.style.display = show ? 'flex' : 'none';
  });
}

/* ── Experience Tabs ── */
function switchTab(type, btn) {
  document.querySelectorAll('.exp-tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.timeline-pane').forEach((p) => p.classList.remove('active'));
  btn.classList.add('active');
  const pane = document.getElementById('pane-' + type);
  pane.classList.add('active');
  pane.querySelectorAll('.reveal:not(.visible)').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 90);
  });
}
