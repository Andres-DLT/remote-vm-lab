const vmState = {
  activeTab: 'dashboard',
  vmStatus: 'ONLINE',
  cpu: 24,
  ram: 42,
  latency: 18,
  logs: [
    { time: '16:50:01', text: 'VM node initialized (Codespaces / Remote Container)', type: 'info' },
    { time: '16:50:02', text: 'Mobile preview listening on 0.0.0.0:5173', type: 'cmd' },
    { time: '16:50:04', text: 'Health check passed: all services nominal.', type: 'info' }
  ],
  services: [
    { name: 'vm-gateway', status: 'running', port: 5173 },
    { name: 'agent-runner', status: 'running', port: 3000 },
    { name: 'telemetry-collector', status: 'running', port: 9090 },
    { name: 'sobel-ascii-studio', status: 'running', port: 5173 }
  ],
  notes:
    (typeof localStorage !== 'undefined' && localStorage.getItem('remote_vm_lab_notes')) ||
    'Ideas para probar on-the-go desde el celular:\n- [ ] Agregar endpoint de webhooks\n- [ ] Conectar métricas reales del contenedor'
};

function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

function renderDashboardTab() {
  return `
    <div class="vm-grid-metrics">
      <div class="vm-card">
        <div class="vm-metric-label"><span>CPU Load</span><span>vCPU x4</span></div>
        <div class="vm-metric-value">${vmState.cpu}%</div>
        <div class="vm-progress-bar"><div class="vm-progress-fill" style="width: ${vmState.cpu}%"></div></div>
      </div>
      <div class="vm-card">
        <div class="vm-metric-label"><span>Memoria RAM</span><span>8 GB</span></div>
        <div class="vm-metric-value">${vmState.ram}%</div>
        <div class="vm-progress-bar"><div class="vm-progress-fill" style="width: ${vmState.ram}%"></div></div>
      </div>
      <div class="vm-card">
        <div class="vm-metric-label"><span>Latencia Red</span><span>Edge</span></div>
        <div class="vm-metric-value">${vmState.latency} ms</div>
        <div class="vm-progress-bar"><div class="vm-progress-fill" style="width: ${Math.min(100, vmState.latency)}%"></div></div>
      </div>
      <div class="vm-card">
        <div class="vm-metric-label"><span>Servicios</span><span>Activos</span></div>
        <div class="vm-metric-value">${vmState.services.filter(s => s.status === 'running').length}/${vmState.services.length}</div>
        <div class="vm-progress-bar"><div class="vm-progress-fill" style="width: 100%"></div></div>
      </div>
    </div>

    <div class="vm-section-title">Acciones Rápidas (Touch)</div>
    <div class="vm-actions-grid">
      <button type="button" class="vm-btn-action primary" data-vm-cmd="healthcheck">⚡ Health Check</button>
      <button type="button" class="vm-btn-action" data-vm-cmd="status">📊 Ver Estado VM</button>
      <button type="button" class="vm-btn-action" data-vm-cmd="spike">🔥 Simular Carga</button>
      <button type="button" class="vm-btn-action" data-vm-cmd="cool">🧹 Liberar RAM</button>
    </div>

    <div class="vm-section-title">Consola Rápida Mobile</div>
    <div class="vm-terminal-card">
      <div class="vm-pills-row">
        <button type="button" class="vm-pill" data-vm-cmd="status">status</button>
        <button type="button" class="vm-pill" data-vm-cmd="healthcheck">healthcheck</button>
        <button type="button" class="vm-pill" data-vm-cmd="python3 ave_del_paraiso_sobel.py --static">sobel --static</button>
        <button type="button" class="vm-pill" data-vm-cmd="uname -a">uname -a</button>
        <button type="button" class="vm-pill" data-vm-cmd="clear">clear</button>
      </div>
      <div class="vm-terminal-output" id="vm-terminal-output">
        ${vmState.logs
          .map(
            l =>
              `<div class="vm-log-line"><span class="vm-log-time">[${l.time}]</span><span class="${
                l.type === 'cmd' ? 'vm-log-cmd' : ''
              }">${l.text}</span></div>`
          )
          .join('')}
      </div>
      <form class="vm-terminal-input-row" id="vm-cmd-form">
        <input
          type="text"
          class="vm-terminal-input"
          id="vm-cmd-input"
          placeholder="Escribe un comando rápido..."
          autocomplete="off"
        />
        <button type="submit" class="vm-btn-send">Run</button>
      </form>
    </div>
  `;
}

function renderServicesTab() {
  return `
    <div class="vm-section-title">Servicios del Nodo Remoto</div>
    ${vmState.services
      .map(
        (s, idx) => `
      <div class="vm-card" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; font-size: 0.95rem;">${s.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">Puerto: ${s.port} • Estado: ${s.status.toUpperCase()}</div>
        </div>
        <button type="button" class="vm-btn-action" data-vm-toggle-service="${idx}" style="padding: 8px 14px;">
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
    <div class="vm-section-title">Notas On-The-Go (Guardado Local)</div>
    <textarea class="vm-notes-area" id="vm-notes-input" placeholder="Apunta ideas o tareas desde tu celular...">${vmState.notes}</textarea>
    <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 8px;">
      Se guarda automáticamente en tu navegador móvil mientras editas.
    </div>
  `;
}

export function renderVmDashboard(container) {
  if (!container) return;

  const addLog = (text, type = 'info') => {
    vmState.logs.push({ time: nowTime(), text, type });
    if (vmState.logs.length > 40) vmState.logs.shift();
    renderVmDashboard(container);
  };

  const runQuickCommand = cmd => {
    vmState.logs.push({ time: nowTime(), text: `$ ${cmd}`, type: 'cmd' });
    if (cmd === 'status') {
      addLog(`VM ${vmState.vmStatus} | CPU: ${vmState.cpu}% | RAM: ${vmState.ram}% | Latency: ${vmState.latency}ms`);
    } else if (cmd === 'healthcheck') {
      vmState.latency = Math.max(11, Math.min(45, vmState.latency + (Math.random() > 0.5 ? -3 : 3)));
      addLog(`Health check OK — ${vmState.services.length}/${vmState.services.length} servicios activos (${vmState.latency}ms)`);
    } else if (cmd === 'spike') {
      vmState.cpu = Math.min(96, vmState.cpu + 35);
      vmState.ram = Math.min(92, vmState.ram + 18);
      addLog('Simulando pico de carga en la VM remota...');
    } else if (cmd === 'cool') {
      vmState.cpu = 18;
      vmState.ram = 36;
      addLog('Recursos liberados y caché limpiada.');
    } else if (cmd === 'clear') {
      vmState.logs = [];
      renderVmDashboard(container);
    } else {
      addLog(`Ejecutado en sandbox: "${cmd}" → exit code 0`);
    }
  };

  container.innerHTML = `
    <div class="vm-dashboard-wrap">
      <header class="vm-topbar">
        <div class="vm-brand">
          <span class="vm-status-dot ${vmState.cpu > 80 ? 'warning' : ''}"></span>
          <div>
            <div class="vm-brand-title">Remote VM Lab — Mobile Dashboard</div>
            <div class="vm-brand-sub">Panel original restaurado en #/vm-lab</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="vm-badge">${vmState.vmStatus}</span>
          <a href="#/" class="btn btn-primary" style="text-decoration:none;">🌺 Volver al Estudio cv2.Sobel</a>
        </div>
      </header>

      <div class="vm-tabs-bar">
        <button type="button" class="vm-tab-btn ${vmState.activeTab === 'dashboard' ? 'active' : ''}" data-vm-tab="dashboard">
          📱 Dashboard
        </button>
        <button type="button" class="vm-tab-btn ${vmState.activeTab === 'services' ? 'active' : ''}" data-vm-tab="services">
          ⚙️ Servicios (${vmState.services.length})
        </button>
        <button type="button" class="vm-tab-btn ${vmState.activeTab === 'notes' ? 'active' : ''}" data-vm-tab="notes">
          📝 Notas
        </button>
      </div>

      ${vmState.activeTab === 'dashboard' ? renderDashboardTab() : ''}
      ${vmState.activeTab === 'services' ? renderServicesTab() : ''}
      ${vmState.activeTab === 'notes' ? renderNotesTab() : ''}
    </div>
  `;

  const out = container.querySelector('#vm-terminal-output');
  if (out) out.scrollTop = out.scrollHeight;

  container.querySelectorAll('[data-vm-cmd]').forEach(btn => {
    btn.addEventListener('click', () => runQuickCommand(btn.getAttribute('data-vm-cmd')));
  });

  container.querySelectorAll('[data-vm-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      vmState.activeTab = btn.getAttribute('data-vm-tab');
      renderVmDashboard(container);
    });
  });

  container.querySelectorAll('[data-vm-toggle-service]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-vm-toggle-service'));
      const svc = vmState.services[idx];
      addLog(`Servicio ${svc.name} (:${svc.port}) reiniciado.`);
    });
  });

  const form = container.querySelector('#vm-cmd-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = container.querySelector('#vm-cmd-input');
      const val = input.value.trim();
      if (val) {
        runQuickCommand(val);
        input.value = '';
      }
    });
  }

  const notesInput = container.querySelector('#vm-notes-input');
  if (notesInput) {
    notesInput.addEventListener('input', e => {
      vmState.notes = e.target.value;
      localStorage.setItem('remote_vm_lab_notes', vmState.notes);
    });
  }
}
