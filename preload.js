const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  onInput: cb => ipcRenderer.on('input', (_, m) => cb(m)),
  onLock: cb => ipcRenderer.on('lock', (_, v) => cb(v))
});
