const { app, BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { uIOhook, UiohookKey } = require('uiohook-napi');

const RATIO = 460 / 320;
let win, unlocked = false;
const stateFile = path.join(app.getPath('userData'), 'ventana.json');

function loadState() { try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { return {}; } }
let saveT;
function saveState() {
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { fs.writeFileSync(stateFile, JSON.stringify(win.getBounds())); } catch {} }, 300);
}

function createWindow() {
  const s = loadState();
  win = new BrowserWindow({
    width: s.width || 460, height: s.height || 320, x: s.x, y: s.y,
    transparent: true, frame: false, hasShadow: false, resizable: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true); // los clics atraviesan al juego
  win.loadFile('index.html');
  win.once('ready-to-show', () => win.showInactive());
  win.on('moved', saveState);
}

function toggleUnlock() {
  unlocked = !unlocked;
  win.setIgnoreMouseEvents(!unlocked);
  win.setFocusable(unlocked);
  win.webContents.send('lock', unlocked);
}

function scale(f) {
  const b = win.getBounds();
  const w = Math.max(200, Math.round(b.width * f));
  win.setBounds({ x: b.x, y: b.y, width: w, height: Math.round(w / RATIO) });
  saveState();
}

// keycode -> nombre
const byCode = {};
for (const [name, code] of Object.entries(UiohookKey)) byCode[code] = name;

function conv(name) {
  if (/^[A-Z]$/.test(name)) return 'Key' + name;
  if (/^[0-9]$/.test(name)) return 'Digit' + name;
  const m = { Alt: 'AltLeft', Meta: 'MetaLeft', Ctrl: 'ControlLeft', CtrlRight: 'ControlRight', Shift: 'ShiftLeft', ShiftRight: 'ShiftRight' };
  return m[name] || name;
}

function startHook() {
  const down = new Set();
  const send = m => { if (win && !win.isDestroyed()) win.webContents.send('input', m); };

  uIOhook.on('keydown', e => {
    if (down.has(e.keycode)) return; // ignora repetición
    down.add(e.keycode);
    send({ type: 'keydown', code: conv(byCode[e.keycode] || ''), ctrl: e.ctrlKey, alt: e.altKey, meta: e.metaKey, shift: e.shiftKey });
  });
  uIOhook.on('keyup', e => {
    down.delete(e.keycode);
    send({ type: 'keyup', code: conv(byCode[e.keycode] || '') });
  });
  uIOhook.on('mousedown', e => send({ type: 'mousedown', button: e.button }));

  let last = 0;
  uIOhook.on('mousemove', () => {
    const t = Date.now();
    if (t - last < 16) return;
    last = t;
    const p = screen.getCursorScreenPoint();
    const b = screen.getDisplayNearestPoint(p).bounds;
    send({ type: 'move', nx: (p.x - b.x) / b.width * 2 - 1, ny: (p.y - b.y) / b.height * 2 - 1 });
  });
  uIOhook.start();
}

app.whenReady().then(() => {
  createWindow();
  startHook();
  globalShortcut.register('CommandOrControl+Shift+G', toggleUnlock);
  globalShortcut.register('CommandOrControl+Shift+Plus', () => scale(1.1));
  globalShortcut.register('CommandOrControl+Shift+=', () => scale(1.1));
  globalShortcut.register('CommandOrControl+Shift+-', () => scale(1 / 1.1));
  globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit());
});
app.on('will-quit', () => { globalShortcut.unregisterAll(); try { uIOhook.stop(); } catch {} });
app.on('window-all-closed', () => app.quit());
