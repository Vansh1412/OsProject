// ===== THREAD POOL SIMULATION ENGINE =====

// Global State
const state = {
  running: false, paused: false,
  threads: [], tasks: [], completedTasks: [], taskIdCounter: 0,
  totalCompleted: 0, totalFailed: 0,
  autoTaskTimer: null, simInterval: null,
  startTime: null, metrics: [],
  filter: 'all', syncMode: 'unsafe'
};

// ===== PARTICLE CANVAS =====
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], connections = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = canvas.parentElement.clientHeight || window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.vx = (Math.random() - .5) * .6; this.vy = (Math.random() - .5) * .6;
      this.r = Math.random() * 2 + 1;
      this.type = Math.random() > .5 ? 'thread' : 'task';
      this.color = this.type === 'thread' ? '#06b6d4' : '#8b5cf6';
      this.alpha = Math.random() * .6 + .2;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + Math.round(this.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
      if (this.type === 'thread') {
        ctx.shadowColor = this.color; ctx.shadowBlur = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      }
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const alpha = (1 - dist / 120) * .15;
          ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
          ctx.lineWidth = .5; ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,14,26,0)';
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
})();

// ===== NAVBAR ACTIVE TRACKING =====
window.addEventListener('scroll', () => {
  const sections = ['hero', 'concepts', 'simulator', 'dashboard', 'lifecycle', 'concurrency', 'comparison', 'code', 'architecture', 'monitor'];
  let current = 'hero';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
});

// ===== NAV HELPERS =====
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('navLinks').classList.remove('open');
}
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ===== CONCEPT CARDS =====
function toggleConcept(card) {
  const wasOpen = card.classList.contains('open');
  document.querySelectorAll('.concept-card').forEach(c => {
    c.classList.remove('open');
    const t = c.querySelector('.concept-toggle');
    if (t) t.textContent = 'Click to expand ▼';
  });
  if (!wasOpen) {
    card.classList.add('open');
    const t = card.querySelector('.concept-toggle');
    if (t) t.textContent = 'Click to collapse ▲';
  }
}

// ===== SLIDER HELPERS =====
function updateSlider(input, valId, val) {
  document.getElementById(valId).textContent = val;
}

// ===== THREAD POOL CORE =====
function getConfig() {
  return {
    threads: parseInt(document.getElementById('threadCount').value),
    queueCap: parseInt(document.getElementById('queueCap').value),
    taskDur: parseInt(document.getElementById('taskDur').value),
    arrivalRate: parseInt(document.getElementById('arrivalRate').value),
    syncLock: document.getElementById('syncLock').checked,
    failSim: document.getElementById('failSim').checked,
    autoTask: document.getElementById('autoTask').checked
  };
}

function createWorkers(n) {
  state.threads = [];
  const container = document.getElementById('workersContainer');
  container.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const t = { id: i, status: 'idle', task: null, progress: 0, tasksDone: 0, execTime: 0, mem: (Math.random() * 20 + 10).toFixed(1) };
    state.threads.push(t);
    container.appendChild(buildWorkerNode(t));
  }
}

function buildWorkerNode(t) {
  const div = document.createElement('div');
  div.className = 'worker-node idle';
  div.id = `worker-${t.id}`;
  div.innerHTML = `
    <div class="worker-header">
      <span class="worker-id">TH-${String(t.id).padStart(3,'0')}</span>
      <span class="worker-status idle" id="ws-${t.id}">Idle</span>
    </div>
    <div class="worker-task" id="wt-${t.id}">Waiting for task...</div>
    <div class="worker-progress"><div class="worker-progress-fill" id="wp-${t.id}" style="width:0%"></div></div>
    <div class="worker-meta">
      <span id="wm-${t.id}">Tasks: 0</span>
      <span id="wmem-${t.id}">${t.mem}MB</span>
    </div>`;
  return div;
}

function updateWorkerUI(t) {
  const node = document.getElementById(`worker-${t.id}`);
  if (!node) return;
  node.className = `worker-node ${t.status}`;
  const ws = document.getElementById(`ws-${t.id}`);
  if (ws) { ws.className = `worker-status ${t.status}`; ws.textContent = t.status.charAt(0).toUpperCase() + t.status.slice(1); }
  const wt = document.getElementById(`wt-${t.id}`);
  if (wt) wt.textContent = t.task ? `Task #${t.task.id} (${t.task.priority})` : 'Waiting for task...';
  const wp = document.getElementById(`wp-${t.id}`);
  if (wp) wp.style.width = `${t.progress}%`;
  const wm = document.getElementById(`wm-${t.id}`);
  if (wm) wm.textContent = `Tasks: ${t.tasksDone}`;
}

function addTaskToQueue(priority) {
  const cfg = getConfig();
  if (state.tasks.filter(t => t.status === 'waiting').length >= cfg.queueCap) {
    logActivity('Queue full! Task rejected.', 'warning');
    return false;
  }
  const task = {
    id: ++state.taskIdCounter, status: 'waiting',
    priority: priority || document.getElementById('taskPriority').value,
    duration: cfg.taskDur + (Math.random() - .5) * cfg.taskDur * .3,
    addedAt: Date.now(), startedAt: null, completedAt: null
  };
  if (cfg.failSim && Math.random() < .1) task.willFail = true;
  state.tasks.push(task);
  renderQueue();
  logActivity(`Task #${task.id} [${task.priority}] added to queue`, 'task');
  return true;
}

function renderQueue() {
  const container = document.getElementById('queueContainer');
  const emptyMsg = document.getElementById('queueEmptyMsg');
  const waiting = state.tasks.filter(t => t.status === 'waiting');
  if (waiting.length === 0) {
    emptyMsg.style.display = '';
    const oldNodes = container.querySelectorAll('.task-node');
    oldNodes.forEach(n => n.remove());
  } else {
    emptyMsg.style.display = 'none';
    const existing = new Set(Array.from(container.querySelectorAll('.task-node')).map(n => n.dataset.id));
    waiting.forEach(t => {
      if (!existing.has(String(t.id))) {
        const div = document.createElement('div');
        div.className = `task-node waiting ${t.priority === 'high' ? 'high' : ''}`;
        div.dataset.id = t.id;
        div.innerHTML = `<div class="task-dot"></div>T${t.id}`;
        div.title = `Priority: ${t.priority} | Est: ${Math.round(t.duration)}ms`;
        container.appendChild(div);
      }
    });
    existing.forEach(id => {
      if (!waiting.find(t => t.id === parseInt(id))) {
        const n = container.querySelector(`[data-id="${id}"]`);
        if (n) n.remove();
      }
    });
  }
}

function assignTasksToThreads() {
  const idleThreads = state.threads.filter(t => t.status === 'idle');
  const waitingTasks = state.tasks.filter(t => t.status === 'waiting').sort((a, b) => {
    const prio = { high: 0, normal: 1, low: 2 };
    return prio[a.priority] - prio[b.priority];
  });

  idleThreads.forEach(thread => {
    const task = waitingTasks.shift();
    if (!task) return;
    task.status = 'running';
    task.startedAt = Date.now();
    thread.status = 'busy';
    thread.task = task;
    thread.progress = 0;
    thread.progressInterval = setInterval(() => {
      const elapsed = Date.now() - task.startedAt;
      thread.progress = Math.min(100, (elapsed / task.duration) * 100);
      updateWorkerUI(thread);
      if (thread.progress >= 100) {
        clearInterval(thread.progressInterval);
        completeTask(thread, task);
      }
    }, 50);
    removeTaskFromQueue(task.id);
    updateWorkerUI(thread);
    logActivity(`Thread TH-${String(thread.id).padStart(3,'0')} picked up Task #${task.id}`, 'info');
  });
}

function removeTaskFromQueue(taskId) {
  const node = document.getElementById('queueContainer')?.querySelector(`[data-id="${taskId}"]`);
  if (node) { node.style.animation = 'none'; node.style.opacity = '.3'; setTimeout(() => node.remove(), 200); }
}

function completeTask(thread, task) {
  const failed = task.willFail;
  task.status = failed ? 'failed' : 'completed';
  task.completedAt = Date.now();
  thread.status = 'completed';
  thread.task = null;
  thread.progress = 0;
  thread.tasksDone++;
  if (failed) { state.totalFailed++; logActivity(`Task #${task.id} FAILED on TH-${String(thread.id).padStart(3,'0')}`, 'error'); }
  else { state.totalCompleted++; logActivity(`Task #${task.id} completed by TH-${String(thread.id).padStart(3,'0')} ✓`, 'success'); }
  state.completedTasks.push(task);
  updateWorkerUI(thread);
  renderCompleted();
  setTimeout(() => {
    thread.status = 'idle';
    updateWorkerUI(thread);
    updateMonitorTable();
  }, 400);
  updateMetrics();
}

function renderCompleted() {
  const container = document.getElementById('completedContainer');
  const emptyMsg = container.querySelector('.queue-empty-msg');
  if (emptyMsg) emptyMsg.remove();
  const last = state.completedTasks.slice(-15);
  container.innerHTML = '';
  last.forEach(t => {
    const div = document.createElement('div');
    div.className = `task-node ${t.status}`;
    div.textContent = `T${t.id} ${t.status === 'completed' ? '✓' : '✗'}`;
    container.appendChild(div);
  });
}

function logActivity(msg, type = 'info') {
  const log = document.getElementById('activityLog');
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.textContent = `[${ts}] ${msg}`;
  log.prepend(div);
  while (log.children.length > 100) log.removeChild(log.lastChild);
}

function clearLog() { document.getElementById('activityLog').innerHTML = ''; }

function updateMetrics() {
  const busy = state.threads.filter(t => t.status === 'busy').length;
  const idle = state.threads.filter(t => t.status === 'idle').length;
  const qLen = state.tasks.filter(t => t.status === 'waiting').length;
  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 1;
  const throughput = (state.totalCompleted / elapsed).toFixed(2);

  document.getElementById('simThreadsBusy').textContent = busy;
  document.getElementById('simThreadsIdle').textContent = idle;
  document.getElementById('simQueueLen').textContent = qLen;
  document.getElementById('simCompleted').textContent = state.totalCompleted;
  document.getElementById('simFailed').textContent = state.totalFailed;
  document.getElementById('simThroughput').textContent = throughput;

  // Hero stats
  document.getElementById('heroThreadCount').textContent = busy;
  document.getElementById('heroTasksDone').textContent = state.totalCompleted;
  document.getElementById('heroCpu').textContent = state.threads.length ? Math.round((busy / state.threads.length) * 100) + '%' : '0%';
  document.getElementById('heroQueueLen').textContent = qLen;

  updateMonitorTable();
}

// ===== SIMULATION CONTROLS =====
let autoTaskTimer = null;

function startSimulation() {
  if (state.running && !state.paused) return;
  state.running = true; state.paused = false;
  state.startTime = state.startTime || Date.now();
  const cfg = getConfig();
  createWorkers(cfg.threads);
  document.getElementById('startBtn').disabled = true;
  document.getElementById('pauseBtn').disabled = false;
  logActivity('🚀 Simulation started', 'success');
  scheduleAutoTask();
  state.simInterval = setInterval(() => {
    if (!state.paused) { assignTasksToThreads(); updateMetrics(); updateCharts(); }
  }, 200);
}

function scheduleAutoTask() {
  if (autoTaskTimer) clearTimeout(autoTaskTimer);
  if (!state.running || state.paused || !document.getElementById('autoTask').checked) return;
  const cfg = getConfig();
  const delay = 1000 / cfg.arrivalRate;
  autoTaskTimer = setTimeout(() => {
    if (state.running && !state.paused) addTaskToQueue();
    scheduleAutoTask();
  }, delay);
}

function toggleAutoTask() { if (state.running) scheduleAutoTask(); }

function pauseSimulation() {
  state.paused = !state.paused;
  const btn = document.getElementById('pauseBtn');
  btn.innerHTML = state.paused
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Resume'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause';
  document.getElementById('startBtn').disabled = !state.paused;
  if (!state.paused) scheduleAutoTask();
  logActivity(state.paused ? '⏸ Simulation paused' : '▶ Simulation resumed', 'info');
}

function resetSimulation() {
  state.running = false; state.paused = false;
  clearInterval(state.simInterval); clearTimeout(autoTaskTimer);
  state.threads.forEach(t => clearInterval(t.progressInterval));
  state.threads = []; state.tasks = []; state.completedTasks = [];
  state.totalCompleted = 0; state.totalFailed = 0;
  state.taskIdCounter = 0; state.startTime = null;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('pauseBtn').disabled = true;
  document.getElementById('pauseBtn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause';
  document.getElementById('workersContainer').innerHTML = '';
  document.getElementById('queueContainer').innerHTML = '<div class="queue-empty-msg" id="queueEmptyMsg">Queue is empty — tasks will appear here</div>';
  document.getElementById('completedContainer').innerHTML = '<div class="queue-empty-msg">Completed tasks will appear here</div>';
  document.getElementById('monitorBody').innerHTML = '';
  updateMetrics();
  logActivity('🔄 Simulation reset', 'warning');
  resetCharts();
}

function addManualTask() {
  if (!state.running) { logActivity('Start simulation first!', 'warning'); return; }
  addTaskToQueue();
}

function updatePool() {
  if (state.running) {
    const n = parseInt(document.getElementById('threadCount').value);
    const diff = n - state.threads.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const t = { id: state.threads.length, status: 'idle', task: null, progress: 0, tasksDone: 0, mem: (Math.random() * 20 + 10).toFixed(1) };
        state.threads.push(t);
        document.getElementById('workersContainer').appendChild(buildWorkerNode(t));
      }
    } else if (diff < 0) {
      for (let i = 0; i > diff; i--) {
        const t = state.threads.pop();
        if (t) { const n = document.getElementById(`worker-${t.id}`); if (n) n.remove(); }
      }
    }
  }
}

// ===== MONITOR TABLE =====
function updateMonitorTable() {
  const body = document.getElementById('monitorBody');
  if (!body) return;
  body.innerHTML = '';
  const filterVal = state.filter;
  let shown = 0;
  state.threads.forEach(t => {
    if (filterVal !== 'all' && t.status !== filterVal) return;
    shown++;
    const tr = document.createElement('tr');
    const cpu = t.status === 'busy' ? Math.round(Math.random() * 30 + 60) : Math.round(Math.random() * 5);
    tr.innerHTML = `
      <td>TH-${String(t.id).padStart(3,'0')}</td>
      <td><span class="thread-status-badge ${t.status}">${t.status}</span></td>
      <td>${t.task ? `Task #${t.task.id}` : '—'}</td>
      <td>${t.task ? Math.round(Date.now() - t.task.startedAt) + 'ms' : '—'}</td>
      <td>${t.tasksDone}</td>
      <td>${cpu}%<div class="cpu-bar"><div class="cpu-bar-fill" style="width:${cpu}%"></div></div></td>
      <td>${t.mem}MB</td>
      <td>${t.task ? t.task.priority : '—'}</td>`;
    body.appendChild(tr);
  });
  const footer = document.getElementById('monitorFooter');
  if (footer) footer.textContent = `Showing ${shown} threads — ${state.totalCompleted} tasks completed`;
}

function filterThreads(filter, btn) {
  state.filter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateMonitorTable();
}

function searchThreads(val) {
  const rows = document.querySelectorAll('#monitorBody tr');
  rows.forEach(row => {
    row.style.display = row.cells[0]?.textContent.toLowerCase().includes(val.toLowerCase()) ? '' : 'none';
  });
}

// ===== LIFECYCLE ANIMATION =====
const lcStages = ['Created', 'Idle', 'Assigned', 'Executing', 'Completed', 'Reused'];
const lcColors = ['#64748b', '#64748b', '#f59e0b', '#06b6d4', '#10b981', '#8b5cf6'];
let lcAnimTimer = null;

function animateLifecycle() {
  resetLifecycle();
  let step = 0;
  const fill = document.getElementById('lcFill');
  const status = document.getElementById('lcStatus');
  function nextStep() {
    if (step > 5) return;
    document.querySelectorAll('.lc-stage').forEach((s, i) => s.classList.toggle('active', i === step));
    document.querySelectorAll('.lc-arrow').forEach((a, i) => a.classList.toggle('active', i === step));
    if (fill) fill.style.width = `${(step / 5) * 100}%`;
    if (status) status.textContent = `Stage ${step + 1}/6: Thread ${lcStages[step]}`;
    step++;
    if (step <= 5) lcAnimTimer = setTimeout(nextStep, 1200);
  }
  nextStep();
}

function resetLifecycle() {
  clearTimeout(lcAnimTimer);
  document.querySelectorAll('.lc-stage').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.lc-arrow').forEach(a => a.classList.remove('active'));
  const fill = document.getElementById('lcFill');
  const status = document.getElementById('lcStatus');
  if (fill) fill.style.width = '0%';
  if (status) status.textContent = 'Click "Animate Lifecycle" to begin';
}

// ===== CONCURRENCY DEMO =====
let concurrencyMode = 'unsafe';
function setConcurrencyMode(mode) {
  concurrencyMode = mode;
  const noSyncBtn = document.getElementById('noSyncBtn');
  const syncBtn = document.getElementById('syncBtn');
  const explan = document.getElementById('syncExplan');
  noSyncBtn.className = 'sync-mode-btn' + (mode === 'unsafe' ? ' active' : '');
  syncBtn.className = 'sync-mode-btn' + (mode === 'safe' ? ' safe-active' : '');
  explan.innerHTML = mode === 'unsafe'
    ? `<div class="danger-box"><strong>⚠ Race Condition Active!</strong><p>Multiple threads accessing shared counter without locking. Final value will be wrong due to lost updates!</p></div>`
    : `<div class="safe-box"><strong>🔒 Mutex Lock Active</strong><p>Threads acquire mutex before accessing counter. Guaranteed correct result even with concurrent access.</p></div>`;
}

function runConcurrencyDemo() {
  const counterEl = document.getElementById('concurrencyCounter');
  const statusEl = document.getElementById('counterStatus');
  const logBody = document.getElementById('cvLogBody');
  const cvValue = document.getElementById('cvValue');
  const cvLock = document.getElementById('cvLock');
  const cvResource = document.getElementById('cvResource');
  logBody.innerHTML = '';
  counterEl.textContent = '0'; cvValue.textContent = '0';
  statusEl.textContent = 'Running...';

  // Build thread nodes
  const cvThreads = document.getElementById('cvThreads');
  cvThreads.innerHTML = '';
  const numThreads = 4;
  const threadEls = [];
  for (let i = 0; i < numThreads; i++) {
    const div = document.createElement('div');
    div.className = 'cv-thread';
    div.innerHTML = `<div class="cv-thread-name">Thread-${i}</div><div class="cv-thread-op" id="cvop-${i}">Waiting...</div>`;
    cvThreads.appendChild(div); threadEls.push(div);
  }

  let sharedCounter = 0; let expected = 0; let ops = 0; const totalOps = 1000;
  const opsPerThread = totalOps / numThreads;
  const safe = concurrencyMode === 'safe';
  let mutex = false;

  function log(msg, type) {
    const div = document.createElement('div');
    div.className = `cv-log-entry ${type}`;
    div.textContent = msg;
    logBody.prepend(div);
    while (logBody.children.length > 50) logBody.removeChild(logBody.lastChild);
  }

  async function runThread(id, ops) {
    for (let i = 0; i < ops; i++) {
      if (safe) {
        while (mutex) await sleep(1);
        mutex = true;
        cvLock.textContent = `🔒 Locked by Thread-${id}`;
        cvResource.style.borderColor = '#10b981';
        threadEls[id].className = 'cv-thread locked';
        document.getElementById(`cvop-${id}`).textContent = `Read: ${sharedCounter}`;
        await sleep(2);
        sharedCounter++;
        expected++;
        cvValue.textContent = sharedCounter;
        counterEl.textContent = sharedCounter;
        document.getElementById(`cvop-${id}`).textContent = `Write: ${sharedCounter}`;
        await sleep(2);
        mutex = false;
        cvLock.textContent = '🔓 Unlocked';
        cvResource.style.borderColor = '';
        threadEls[id].className = 'cv-thread';
      } else {
        threadEls[id].className = 'cv-thread accessing';
        cvResource.style.borderColor = '#ef4444';
        document.getElementById(`cvop-${id}`).textContent = `Read: ${sharedCounter}`;
        const readVal = sharedCounter;
        await sleep(Math.random() * 3);
        sharedCounter = readVal + 1;
        expected++;
        cvValue.textContent = sharedCounter;
        counterEl.textContent = sharedCounter;
        document.getElementById(`cvop-${id}`).textContent = `Write: ${sharedCounter}`;
        threadEls[id].className = 'cv-thread';
        if (expected - sharedCounter > 2) log(`⚠ Thread-${id}: Data corruption detected! Expected ${expected}, got ${sharedCounter}`, 'danger');
      }
      if (i % 100 === 0) log(`Thread-${id}: ${i} operations done`, safe ? 'safe' : 'info');
    }
    threadEls[id].className = 'cv-thread';
    document.getElementById(`cvop-${id}`).textContent = 'Done ✓';
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  Promise.all(Array.from({ length: numThreads }, (_, i) => runThread(i, opsPerThread))).then(() => {
    statusEl.textContent = safe ? '✓ Correct result!' : `⚠ Result: ${sharedCounter} (expected ${expected} — ${expected - sharedCounter} lost updates)`;
    statusEl.style.color = safe ? '#10b981' : '#ef4444';
    log(safe ? `✓ Final: ${sharedCounter}/${expected} (100% accurate)` : `⚠ Final: ${sharedCounter}/${expected} (${Math.round(sharedCounter/expected*100)}% accurate)`, safe ? 'safe' : 'danger');
    cvResource.style.borderColor = '';
    cvLock.textContent = '🔓 Unlocked';
  });
}

// ===== CODE TABS =====
function switchCodeTab(lang, btn) {
  document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.code-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`code-${lang}`).classList.add('active');
}

function switchTopic(lang, topic, btn) {
  const panel = document.getElementById(`code-${lang}`);
  panel.querySelectorAll('.topic-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
} // Topic switching simplified; full impl would swap inner code blocks

function copyCode(btn) {
  const code = btn.nextElementSibling?.querySelector('code');
  if (code) {
    navigator.clipboard.writeText(code.textContent);
    btn.textContent = 'Copied!';
    btn.style.color = '#10b981';
    setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 2000);
  }
}

// ===== ARCHITECTURE DIAGRAM =====
function animateArchitecture() {
  const canvas = document.getElementById('archCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const nodes = [
    { label: 'Client\nRequests', x: 80, y: 200, color: '#06b6d4', r: 40 },
    { label: 'Task\nQueue', x: 250, y: 200, color: '#8b5cf6', r: 40 },
    { label: 'Pool\nManager', x: 430, y: 200, color: '#f59e0b', r: 40 },
    { label: 'Worker 1', x: 620, y: 80, color: '#10b981', r: 32 },
    { label: 'Worker 2', x: 620, y: 180, color: '#10b981', r: 32 },
    { label: 'Worker 3', x: 620, y: 280, color: '#10b981', r: 32 },
    { label: 'Completed\nTasks', x: 820, y: 200, color: '#f59e0b', r: 40 },
  ];

  const edges = [
    [0, 1, '#06b6d4'], [1, 2, '#8b5cf6'],
    [2, 3, '#10b981'], [2, 4, '#10b981'], [2, 5, '#10b981'],
    [3, 6, '#f59e0b'], [4, 6, '#f59e0b'], [5, 6, '#f59e0b'],
  ];

  let packets = [];
  let frameId;
  const SPEED = 0.015;

  function drawNode(n) {
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = n.color + '22'; ctx.fill();
    ctx.strokeStyle = n.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowColor = n.color; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#e2e8f0'; ctx.font = '12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    n.label.split('\n').forEach((line, i, arr) => ctx.fillText(line, n.x, n.y + (i - (arr.length - 1) / 2) * 15));
  }

  function drawEdge(e) {
    const a = nodes[e[0]], b = nodes[e[1]];
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = e[2] + '44'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function launchPacket(edgeIdx) {
    packets.push({ edge: edgeIdx, t: 0, color: edges[edgeIdx][2] });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    edges.forEach(e => drawEdge(e));
    nodes.forEach(n => drawNode(n));

    packets = packets.filter(p => {
      p.t += SPEED;
      if (p.t >= 1) return false;
      const a = nodes[edges[p.edge][0]], b = nodes[edges[p.edge][1]];
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      return true;
    });
    frameId = requestAnimationFrame(tick);
  }

  cancelAnimationFrame(frameId);
  packets = [];
  tick();
  let eIdx = 0;
  const launch = () => {
    launchPacket(eIdx % edges.length);
    eIdx++;
    if (eIdx < edges.length * 3) setTimeout(launch, 400);
  };
  launch();
}

// ===== PERFORMANCE COMPARISON BARS ANIMATION =====
function animateComparisonBars() {
  document.querySelectorAll('.perf-bar').forEach(bar => {
    const w = bar.style.width;
    bar.style.width = '0%';
    requestAnimationFrame(() => { bar.style.transition = 'width 1.2s ease-out'; bar.style.width = w; });
  });
}

// Trigger bar animation on scroll into view
const compObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateComparisonBars(); compObs.unobserve(e.target); } });
}, { threshold: .3 });
const compSection = document.getElementById('comparison');
if (compSection) compObs.observe(compSection);

// Initialize UI
window.addEventListener('DOMContentLoaded', () => {
  createWorkers(4);
  updateMonitorTable();
  initCharts();
  drawArchitectureStatic();
  Prism.highlightAll();
});

function drawArchitectureStatic() {
  const canvas = document.getElementById('archCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const nodes = [
    { label: 'Client\nRequests', x: 80, y: 200, color: '#06b6d4', r: 40 },
    { label: 'Task\nQueue', x: 250, y: 200, color: '#8b5cf6', r: 40 },
    { label: 'Pool\nManager', x: 430, y: 200, color: '#f59e0b', r: 40 },
    { label: 'Worker 1', x: 620, y: 80, color: '#10b981', r: 32 },
    { label: 'Worker 2', x: 620, y: 200, color: '#10b981', r: 32 },
    { label: 'Worker 3', x: 620, y: 320, color: '#10b981', r: 32 },
    { label: 'Completed\nTasks', x: 820, y: 200, color: '#f59e0b', r: 40 },
  ];
  const edges = [[0,1,'#06b6d4'],[1,2,'#8b5cf6'],[2,3,'#10b981'],[2,4,'#10b981'],[2,5,'#10b981'],[3,6,'#f59e0b'],[4,6,'#f59e0b'],[5,6,'#f59e0b']];
  ctx.clearRect(0, 0, W, H);
  edges.forEach(e => {
    const a = nodes[e[0]], b = nodes[e[1]];
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = e[2] + '55'; ctx.lineWidth = 1.5; ctx.stroke();
  });
  nodes.forEach(n => {
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = n.color + '22'; ctx.fill();
    ctx.strokeStyle = n.color; ctx.lineWidth = 2;
    ctx.shadowColor = n.color; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#e2e8f0'; ctx.font = '12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    n.label.split('\n').forEach((line, i, arr) => ctx.fillText(line, n.x, n.y + (i - (arr.length - 1) / 2) * 15));
  });
}
