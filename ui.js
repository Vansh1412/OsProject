// ===== UI ENHANCEMENTS & ANIMATIONS =====

// Smooth scroll-triggered entrance animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.concept-card, .chart-card, .insight-card, .comparison-panel').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// ===== HERO ANIMATED THREAD FLOW =====
(function initHeroViz() {
    const viz = document.getElementById('heroViz');
    if (!viz) return;

    const threadCount = 6;
    const taskCount = 8;
    const threads = [], tasks = [];

    for (let i = 0; i < threadCount; i++) {
        const div = document.createElement('div');
        div.style.cssText = `
      position:absolute; width:44px; height:44px; border-radius:50%;
      border:2px solid #06b6d4; background:rgba(6,182,212,0.1);
      display:flex; align-items:center; justify-content:center;
      font-size:10px; font-family:'JetBrains Mono',monospace; color:#06b6d4;
      box-shadow: 0 0 16px rgba(6,182,212,0.3);
      transition: all 0.5s;
    `;
        div.textContent = `T${i}`;
        viz.appendChild(div);
        threads.push(div);
    }

    for (let i = 0; i < taskCount; i++) {
        const div = document.createElement('div');
        div.style.cssText = `
      position:absolute; width:34px; height:34px; border-radius:8px;
      border:1px solid #8b5cf6; background:rgba(139,92,246,0.1);
      display:flex; align-items:center; justify-content:center;
      font-size:9px; font-family:'JetBrains Mono',monospace; color:#8b5cf6;
    `;
        div.textContent = `J${i}`;
        viz.appendChild(div);
        tasks.push(div);
    }

    function placeElements() {
        const w = viz.offsetWidth || 300, h = viz.offsetHeight || 500;
        threads.forEach((t, i) => {
            t.style.left = (w * 0.2 + Math.sin(i * 1.1) * w * 0.15) + 'px';
            t.style.top = (h * 0.1 + (i / threadCount) * h * 0.8) + 'px';
        });
        tasks.forEach((t, i) => {
            t.style.left = (w * 0.55 + Math.cos(i * 0.9) * w * 0.2) + 'px';
            t.style.top = (h * 0.05 + (i / taskCount) * h * 0.9) + 'px';
        });
    }

    placeElements();
    window.addEventListener('resize', placeElements);

    let angle = 0;
    setInterval(() => {
        angle += 0.015;
        const w = viz.offsetWidth || 300, h = viz.offsetHeight || 500;
        threads.forEach((t, i) => {
            const ox = Math.sin(angle + i * 1.1) * w * 0.12;
            const oy = Math.cos(angle * 0.7 + i * 0.8) * h * 0.06;
            t.style.transform = `translate(${ox}px, ${oy}px)`;
        });
        tasks.forEach((t, i) => {
            const ox = Math.cos(angle * 1.2 + i * 0.9) * w * 0.08;
            const oy = Math.sin(angle * 0.9 + i * 1.1) * h * 0.05;
            t.style.transform = `translate(${ox}px, ${oy}px)`;
        });
    }, 50);
})();

// ===== HERO STATS COUNTER ANIMATION =====
function animateCounter(el, target, duration = 1500) {
    let start = 0, startTime = null;
    function step(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const val = Math.round(progress * target);
        el.textContent = val;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ===== TOOLTIPS =====
document.querySelectorAll('[data-tooltip]').forEach(el => {
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.textContent = el.dataset.tooltip;
    tip.style.cssText = `
    position:absolute; background:#1a2440; border:1px solid rgba(6,182,212,0.3);
    color:#e2e8f0; padding:6px 10px; border-radius:6px; font-size:0.75rem;
    pointer-events:none; opacity:0; transition:.2s; z-index:100; white-space:nowrap;
    transform:translateY(-8px);
  `;
    el.style.position = 'relative';
    el.appendChild(tip);
    el.addEventListener('mouseenter', () => { tip.style.opacity = '1'; tip.style.transform = 'translateY(-4px)'; });
    el.addEventListener('mouseleave', () => { tip.style.opacity = '0'; tip.style.transform = 'translateY(-8px)'; });
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'Space' || e.key === 's') { e.preventDefault(); if (!state.running) startSimulation(); else pauseSimulation(); }
    if (e.key === 'r' || e.key === 'R') resetSimulation();
    if (e.key === 't') addManualTask();
    if (e.key === 'a') animateArchitecture();
    if (e.key === 'l') animateLifecycle();
});

// ===== GLOW EFFECT ON ACTIVE WORKERS =====
setInterval(() => {
    if (!state.running) return;
    state.threads.forEach(t => {
        const node = document.getElementById(`worker-${t.id}`);
        if (node && t.status === 'busy') {
            node.style.boxShadow = `0 0 ${15 + Math.random() * 15}px rgba(6,182,212,${0.2 + Math.random() * 0.2})`;
        } else if (node) {
            node.style.boxShadow = '';
        }
    });
}, 300);

// ===== NOTIFICATION TOAST =====
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; padding:12px 20px;
    background:var(--bg-800); border:1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#06b6d4'};
    border-radius:8px; color:${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#06b6d4'};
    font-size:0.85rem; z-index:2000; animation:slideUp 0.3s ease-out;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
    font-family:'Inter',sans-serif;
  `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== PRINT KEYBOARD HINT =====
setTimeout(() => {
    showToast('💡 Press Space to start/pause, T to add task, R to reset', 'info');
}, 2500);

// ===== CANVAS RESPONSIVE =====
window.addEventListener('resize', () => {
    const canvas = document.getElementById('archCanvas');
    if (!canvas) return;
    const maxW = canvas.parentElement.clientWidth - 80;
    if (maxW < 900) { canvas.width = maxW; canvas.height = Math.round(maxW * 0.44); }
    else { canvas.width = 900; canvas.height = 400; }
    drawArchitectureStatic?.();
});

// ===== ANIMATE SECTION NUMBERS =====
const heroObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            animateCounter(document.getElementById('heroThreadCount'), 8, 2000);
            animateCounter(document.getElementById('heroTasksDone'), 1247, 2000);
            heroObs.unobserve(e.target);
        }
    });
}, { threshold: .5 });
const hero = document.getElementById('hero');
if (hero) heroObs.observe(hero);

// ===== PRISM highlight re-run for dynamically shown panels =====
document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => setTimeout(() => Prism.highlightAll(), 50));
});
