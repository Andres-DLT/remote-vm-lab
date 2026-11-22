const state = {
  activeTab: 'dashboard',
  vmStatus: 'ONLINE',
  cpu: 24,
  ram: 42,
  latency: 18,
  activeAgents: 2,
  logs: [
    { time: '16:50:01', text: 'VM node initialized (Codespaces / Remote Container)', type: 'info' },
    { time: '16:50:02', text: 'Mobile preview listening on 0.0.0.0:5173', type: 'cmd' },
    { time: '16:50:04', text: 'Health check passed: all services nominal.', type: 'info' }
  ],
  services: [
    { name: 'vm-gateway', status: 'running', port: 5173 },
    { name: 'agent-runner', status: 'running', port: 3000 },
    { name: 'telemetry-collector', status: 'running', port: 9090 }
  ],
  notes: localStorage.getItem('remote_vm_lab_notes') || 'Ideas para probar on-the-go desde el celular:\n- [ ] Agregar endpoint de webhooks\n- [ ] Conectar métricas reales del contenedor'
};

function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

function addLog(text, type = 'info') {
  state.logs.push({ time: nowTime(), text, type });
  if (state.logs.length > 40) state.logs.shift();
  render();
}

function runQuickCommand(cmd) {
  addLog(`$ ${cmd}`, 'cmd');
  if (cmd === 'status') {
    addLog(`VM ${state.vmStatus} | CPU: ${state.cpu}% | RAM: ${state.ram}% | Latency: ${state.latency}ms`);
  } else if (cmd === 'healthcheck') {
    state.latency = Math.max(11, Math.min(45, state.latency + (Math.random() > 0.5 ? -3 : 3)));
    addLog(`Health check OK — 3/3 servicios activos (${state.latency}ms)`);
  } else if (cmd === 'spike') {
    state.cpu = Math.min(96, state.cpu + 35);
    state.ram = Math.min(92, state.ram + 18);
    addLog('Simulando pico de carga en la VM remota...');
  } else if (cmd === 'cool') {
    state.cpu = 18;
    state.ram = 36;
    addLog('Recursos liberados y caché limpiada.');
  } else if (cmd === 'clear') {
    state.logs = [];
    render();
  } else {
    addLog(`Ejecutado en sandbox: "${cmd}" → exit code 0`);
  }
}

function renderDashboardTab() {
  return `
    <div class="grid-metrics">
      <div class="card">
        <div class="metric-label"><span>CPU Load</span><span>vCPU x4</span></div>
        <div class="metric-value">${state.cpu}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${state.cpu}%"></div></div>
      </div>
      <div class="card">
        <div class="metric-label"><span>Memoria RAM</span><span>8 GB</span></div>
        <div class="metric-value">${state.ram}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${state.ram}%"></div></div>
      </div>
      <div class="card">
        <div class="metric-label"><span>Latencia Red</span><span>Edge</span></div>
        <div class="metric-value">${state.latency} ms</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, state.latency)}%"></div></div>
      </div>
      <div class="card">
        <div class="metric-label"><span>Servicios</span><span>Activos</span></div>
        <div class="metric-value">${state.services.filter(s => s.status === 'running').length}/${state.services.length}</div>
        <div class="progress-bar"><div class="progress-fill" style="width: 100%"></div></div>
      </div>
    </div>

    <div class="section-title">Acciones Rápidas (Touch)</div>
    <div class="actions-grid">
      <button class="btn-action primary" data-cmd="healthcheck">⚡ Health Check</button>
      <button class="btn-action" data-cmd="status">📊 Ver Estado VM</button>
      <button class="btn-action" data-cmd="spike">🔥 Simular Carga</button>
      <button class="btn-action" data-cmd="cool">🧹 Liberar RAM</button>
    </div>

    <div class="section-title">Consola Rápida Mobile</div>
    <div class="terminal-card">
      <div class="pills-row">
        <button class="pill" data-cmd="status">status</button>
        <button class="pill" data-cmd="healthcheck">healthcheck</button>
        <button class="pill" data-cmd="uname -a">uname -a</button>
        <button class="pill" data-cmd="git status">git status</button>
        <button class="pill" data-cmd="clear">clear</button>
      </div>
      <div class="terminal-output" id="terminal-output">
        ${state.logs
          .map(
            l =>
              `<div class="log-line"><span class="log-time">[${l.time}]</span><span class="${
                l.type === 'cmd' ? 'log-cmd' : ''
              }">${l.text}</span></div>`
          )
          .join('')}
      </div>
      <form class="terminal-input-row" id="cmd-form">
        <input
          type="text"
          class="terminal-input"
          id="cmd-input"
          placeholder="Escribe un comando rápido..."
          autocomplete="off"
        />
        <button type="submit" class="btn-send">Run</button>
      </form>
    </div>
  `;
}

function renderServicesTab() {
  return `
    <div class="section-title">Servicios del Nodo Remoto</div>
    ${state.services
      .map(
        (s, idx) => `
      <div class="card" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; font-size: 0.95rem;">${s.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Puerto: ${s.port} • Estado: ${s.status.toUpperCase()}</div>
        </div>
        <button class="btn-action" data-toggle-service="${idx}" style="padding: 8px 14px;">
          ${s.status === 'running' ? 'Reiniciar' : 'Iniciar'}
        </button>
      </div>
    `
      )
      .join('')}
  `;
}

function renderNotesTab() {
  return `
    <div class="section-title">Notas On-The-Go (Guardado Local)</div>
    <textarea class="notes-area" id="notes-input" placeholder="Apunta ideas o tareas desde tu celular...">${state.notes}</textarea>
    <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 8px;">
      Se guarda automáticamente en tu navegador móvil mientras editas.
    </div>
  `;
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container">
      <header class="topbar">
        <div class="brand">
          <span class="status-dot ${state.cpu > 80 ? 'warning' : ''}"></span>
          <div>
            <div class="brand-title">Remote VM Lab</div>
            <div class="brand-sub">Mobile Cloud Workspace</div>
          </div>
        </div>
        <span class="badge">${state.vmStatus}</span>
      </header>

      ${state.activeTab === 'dashboard' ? renderDashboardTab() : ''}
      ${state.activeTab === 'services' ? renderServicesTab() : ''}
      ${state.activeTab === 'notes' ? renderNotesTab() : ''}
    </div>

    <nav class="bottom-nav">
      <button class="nav-item ${state.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
        <span>📱 Dashboard</span>
      </button>
      <button class="nav-item ${state.activeTab === 'services' ? 'active' : ''}" data-tab="services">
        <span>⚙️ Servicios</span>
      </button>
      <button class="nav-item ${state.activeTab === 'notes' ? 'active' : ''}" data-tab="notes">
        <span>📝 Notas</span>
      </button>
    </nav>
  `;

  const out = document.getElementById('terminal-output');
  if (out) out.scrollTop = out.scrollHeight;

  document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => runQuickCommand(btn.getAttribute('data-cmd')));
  });

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.getAttribute('data-tab');
      render();
    });
  });

  document.querySelectorAll('[data-toggle-service]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-toggle-service'));
      const svc = state.services[idx];
      addLog(`Servicio ${svc.name} (:${svc.port}) reiniciado.`);
    });
  });

  const form = document.getElementById('cmd-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('cmd-input');
      const val = input.value.trim();
      if (val) {
        runQuickCommand(val);
        input.value = '';
      }
    });
  }

  const notesInput = document.getElementById('notes-input');
  if (notesInput) {
    notesInput.addEventListener('input', e => {
      state.notes = e.target.value;
      localStorage.setItem('remote_vm_lab_notes', state.notes);
    });
  }
}

render();
