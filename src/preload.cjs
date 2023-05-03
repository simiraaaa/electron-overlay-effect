const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  setTitle: (title = '') => ipcRenderer.send('set-title', title),
  onGlobalKeyboard: (/** @type {any} */ callback) => ipcRenderer.on('global-key', callback),
  onLog: (/** @type {(...args: any[]) => void} */callback) => ipcRenderer.on('log', (_e, ...args) => {
    callback(...args);
  }),

};

contextBridge.exposeInMainWorld('electron', electronAPI);



/**
 * @typedef {electronAPI} ElectronAPI
 */