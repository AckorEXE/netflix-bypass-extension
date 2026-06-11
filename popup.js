const storage = globalThis.chrome?.storage?.local;
const dot = document.getElementById('dot');
const lbl = document.getElementById('lbl');
const slbl = document.getElementById('slbl');
const toggleBtn = document.getElementById('sw');
let enabled = true;

function ui(on) {
  dot.className = 'dot ' + (on ? 'on' : 'off');
  toggleBtn.classList.toggle('on', on);
  toggleBtn.setAttribute('aria-pressed', String(on));
  lbl.textContent = on ? 'Estado del Bypass' : 'Estado del Bypass';
  slbl.textContent = on ? 'Extensión habilitada' : 'Extensión deshabilitada';
}

function setEnabled(on) {
  enabled = on;
  ui(on);
  if (storage) {
    storage.set({ enabled: on }).catch?.(() => {});
  }
}

if (storage) {
  storage.get(['enabled'], r => {
    enabled = r.enabled !== false;
    ui(enabled);
  });
}

ui(enabled);

toggleBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  setEnabled(!enabled);
});