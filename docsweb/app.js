const state = {
  machines: [],
  query: '',
  difficulty: 'all'
};

const grid = document.querySelector('#machine-grid');
const empty = document.querySelector('#empty-state');
const count = document.querySelector('#result-count');
const search = document.querySelector('#search-input');
const modal = document.querySelector('#machine-modal');
const modalContent = document.querySelector('#modal-content');

// MODIFICA LOS COLORES AQUÍ
const colors = {
  Easy: '#50d590',
  Medium: '#ffad5c',
  Hard: '#ff5733'
};

const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#039;',
  '"': '&quot;'
}[c]));

const normalize = v => String(v ?? '').toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const tech = t => t?.version ? `${t.name} ${t.version}` : t?.name;

const description = m => m.description || `Engagement report covering ${[...(m.skills || []).slice(0, 3).map(x => x.name), ...(m.findings || []).slice(0, 1).flatMap(x => x.vulnerability?.search_tags?.slice(0, 1) || [])].join(', ')}.`;

const searchText = m => [
  m.slug,
  m.machine?.name,
  m.machine?.platform,
  m.machine?.operating_system,
  m.machine?.difficulty,
  m.description,
  ...(m.technologies || []).flatMap(x => [x.name, x.version, tech(x)]),
  ...(m.tools || []).flatMap(x => [x.name, x.category]),
  ...(m.skills || []).flatMap(x => [x.name, x.phase]),
  ...(m.findings || []).flatMap(x => [x.category, ...(x.vulnerability?.search_tags || []), ...(x.cwe || []).flatMap(c => [c.id, c.name]), ...(x.cve || []), ...(x.owasp || [])]),
  ...(m.network?.ports || []).flatMap(x => [x.port, x.service, x.technology, ...(x.protocols || [])])
].filter(Boolean).map(normalize).join(' ');

function filtered() {
  const terms = normalize(state.query).split(' ').filter(Boolean);
  return state.machines.filter(m => (state.difficulty === 'all' || m.machine?.difficulty === state.difficulty) && terms.every(t => searchText(m).includes(t)));
}

function visual(m) {
  return m.logomachine ? `<img class="machine-logo" src="${esc(m.logomachine)}" alt="${esc(m.machine?.name)} machine logo" />` : `<div class="machine-icon" aria-hidden="true" style="--level: ${colors[m.machine?.difficulty] || '#59d9a1'}">${esc((m.machine?.name || 'M').charAt(0))}</div>`;
}

function render() {
  const list = filtered();
  count.textContent = `${list.length} ${list.length === 1 ? 'report found' : 'reports found'}`;
  grid.innerHTML = list.map(m => {
    const d = m.machine || {},
      level = d.difficulty || 'Easy',
      tags = [...new Set([...(m.skills || []).map(x => x.name), ...(m.findings || []).flatMap(x => x.vulnerability?.search_tags?.slice(0, 1) || [])])],
      shown = tags.slice(0, 5);
    return `<article class="card" style="--level:${colors[level] || '#59d9a1'}"><div class="card-top"><span class="platform">${esc(d.platform || 'LAB')}</span><span class="level">${esc(level)}</span></div>${visual(m)}<h3>${esc(d.name)}</h3><p class="os">${esc(d.operating_system || 'Unknown OS')}</p><p class="description">${esc(description(m))}</p><div class="tags">${shown.map(x => `<span class="tag">${esc(x)}</span>`).join('')}${tags.length > shown.length ? `<span class="tag more-tag">+${tags.length - shown.length}</span>` : ''}</div><button data-slug="${esc(m.slug)}">View technical report →</button></article>`;
  }).join('');
  empty.hidden = list.length !== 0;
}

function openMachine(slug) {
  const m = state.machines.find(x => x.slug === slug);
  if (!m) return;
  const d = m.machine || {},
    level = d.difficulty || 'Easy',
    skills = (m.skills || []).map(x => x.name),
    tools = (m.tools || []).map(x => x.name),
    ports = m.network?.ports || [],
    techs = m.technologies || [],
    vulns = m.findings || [],
    difficultyColor = colors[level] || '#59d9a1';

  modalContent.innerHTML = `
    <div class="modal-container" style="--level: ${difficultyColor}">
      <!-- Columna Izquierda -->
      <div class="modal-col-left">
        <div class="modal-panel" style="text-align: center;">
          ${visual(m)}
          <h3 style="font-size: 24px; letter-spacing: -.04em; margin: 12px 0 4px;">${esc(d.name)}</h3>
          <p class="os" style="margin-bottom: 14px;">${esc(d.operating_system || 'Unknown OS')}</p>
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 16px;">
            <span class="platform">${esc(d.platform || 'LAB')}</span>
            <span class="level" style="--level:${difficultyColor}">${esc(level)}</span>
          </div>
          ${m.report_url
            ? `<a href="${esc(m.report_url)}" target="_blank" rel="noopener" style="display:block; width: 100%; border: 1px solid var(--line); background: rgba(255,255,255,0.04); border-radius: 10px; color: #e8fff6; padding: 10px 0; font: 600 11px Manrope; text-align: center; text-decoration: none; box-sizing: border-box; cursor: pointer;">View Full Technical Report</a>`
            : `<button type="button" disabled style="width: 100%; border: 1px solid var(--line); background: rgba(255,255,255,0.02); border-radius: 10px; color: #6b827c; padding: 10px 0; font: 600 11px Manrope; cursor: not-allowed;">Report unavailable</button>`}
        </div>

        <div class="modal-panel">
          <div class="modal-panel-header">Description</div>
          <p style="font-size: 12px; line-height: 1.6; color: #c4d0cd; margin: 0;">
            ${esc(description(m))}
          </p>
        </div>

        ${ports.length ? `
        <div class="modal-panel">
          <div class="modal-panel-header">Open Ports</div>
          <div class="modal-ports-grid">
            ${ports.map(p => `
              <div class="modal-port-item">
                <span class="modal-port-num">${esc(p.port)}</span>
                <span class="modal-port-service">${esc(p.service || 'UNKNOWN')}</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      </div>

      <!-- Columna Derecha -->
      <div class="modal-col-right">
        ${vulns.length ? `
        <div class="modal-panel">
          <div class="modal-panel-header">Vulnerabilities Exploited</div>
          ${vulns.map(v => {
            const tag = (v.vulnerability?.search_tags || [])[0] || v.category || 'Vulnerability';
            const cve = (v.cve || [])[0] || '';
            const desc = v.description || v.vulnerability?.description || '';
            return `
              <div class="modal-vuln-item">
                <div class="modal-vuln-top">
                  <span class="modal-vuln-title">${esc(tag)}</span>
                  ${cve ? `<span class="modal-vuln-cve">${esc(cve)}</span>` : ''}
                </div>
                ${desc ? `<p class="modal-vuln-desc">${esc(desc)}</p>` : ''}
              </div>
            `;
          }).join('')}
        </div>` : ''}

        <div class="modal-subgrid">
          ${skills.length ? `
          <div class="modal-panel">
            <div class="modal-panel-header">Skills Applied</div>
            <div class="tags" style="margin: 0;">
              ${skills.map(s => `<span class="tag">${esc(s)}</span>`).join('')}
            </div>
          </div>` : ''}

          ${techs.length ? `
          <div class="modal-panel">
            <div class="modal-panel-header">Target Technologies</div>
            <div>
              ${techs.map(t => `
                <div class="modal-tech-row">
                  <span class="modal-tech-name">${esc(t.name)}</span>
                  <span class="modal-tech-ver">${esc(t.version || '-')}</span>
                </div>
              `).join('')}
            </div>
          </div>` : ''}
        </div>

        ${tools.length ? `
        <div class="modal-panel">
          <div class="modal-panel-header">Tools Utilized</div>
          <div class="tags" style="margin: 0;">
            ${tools.map(tool => `<span class="tag">${esc(tool)}</span>`).join('')}
          </div>
        </div>` : ''}
      </div>
    </div>
  `;
  modal.showModal();
}

document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {
  state.difficulty = b.dataset.filter;
  document.querySelector('.filter.active').classList.remove('active');
  b.classList.add('active');
  render();
}));

search.addEventListener('input', e => {
  state.query = e.target.value;
  render();
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    search.focus();
  }
  if (e.key === 'Escape' && modal.open) modal.close();
});

grid.addEventListener('click', e => {
  const b = e.target.closest('[data-slug]');
  if (b) openMachine(b.dataset.slug);
});

document.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', e => {
  if (e.target === modal) modal.close();
});

fetch('./data/central_database.json')
  .then(r => {
    if (!r.ok) throw Error();
    return r.json();
  })
  .then(d => {
    state.machines = Object.values(d.machines || {});
    render();
  })
  .catch(() => count.textContent = 'Database could not be loaded');

const canvas = document.querySelector('#starfield'),
  ctx = canvas.getContext('2d');
let stars = [];
let comets = [];

function createComet() {
  const w = innerWidth;
  const h = innerHeight;
  const side = Math.floor(Math.random() * 3);
  
  let x, y, angle;
  if (side === 0) {
    x = Math.random() * w;
    y = -50;
    angle = Math.PI / 4 + Math.random() * (Math.PI / 2);
  } else if (side === 1) {
    x = -50;
    y = Math.random() * (h / 2);
    angle = Math.random() * (Math.PI / 3);
  } else {
    x = w + 50;
    y = Math.random() * (h / 2);
    angle = Math.PI - Math.random() * (Math.PI / 3);
  }

  const speed = Math.random() * 4 + 5;
  comets.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed
  });
}

function triggerCometWave() {
  createComet();
  setTimeout(createComet, 2000);
  setTimeout(createComet, 6500);
}

setTimeout(triggerCometWave, 3000);
setInterval(triggerCometWave, 20000);

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  stars = Array.from({
    length: Math.min(150, Math.floor(innerWidth / 9))
  }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.35 + .15,
    a: Math.random(),
    s: Math.random() * .006 + .002,
    dx: (Math.random() - .5) * .06
  }));
}

function animate() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  
  stars.forEach(s => {
    s.a += s.s;
    s.x += s.dx;
    if (s.x < 0 || s.x > innerWidth) s.dx *= -1;
    ctx.beginPath();
    ctx.fillStyle = `rgba(179,255,220,${.14 + (Math.sin(s.a) + 1) * .25})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  comets.forEach(comet => {
    ctx.save();
    const gradient = ctx.createLinearGradient(
      comet.x, comet.y,
      comet.x - comet.vx * 15, comet.y - comet.vy * 15
    );
    gradient.addColorStop(0, 'rgba(157, 217, 196, 0.9)');
    gradient.addColorStop(1, 'rgba(157, 217, 196, 0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(comet.x, comet.y);
    ctx.lineTo(comet.x - comet.vx * 15, comet.y - comet.vy * 15);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    comet.x += comet.vx;
    comet.y += comet.vy;
  });

  comets = comets.filter(comet => 
    comet.x >= -200 && comet.x <= innerWidth + 200 && comet.y <= innerHeight + 200
  );

  requestAnimationFrame(animate);
}

resize();
addEventListener('resize', resize);
animate();