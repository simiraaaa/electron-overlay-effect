const { contextBridge, ipcRenderer, app } = require('electron')

const electronAPI = {
  setTitle: (title = '') => ipcRenderer.send('set-title', title),
  onGlobalKeyboard: (/** @type {any} */ callback) => ipcRenderer.on('global-key', callback),
  onLog: (/** @type {(...args: any[]) => void} */callback) => ipcRenderer.on('log', (_e, ...args) => {
    if (app.isPackaged) return ;
    callback(...args);
  }),
  onGlobalMouse: (/** @type {any} */ callback) => ipcRenderer.on('global-mouse', callback),
  onChangeMouseEnable: (/** @type {(enable: boolean) => void} */ callback) => ipcRenderer.on('change-mouse-enable', (_e, checked) => {
    callback(checked);
  }),
  onChangeKeyboardEnable: (/** @type {(enable: boolean) => void} */ callback) => ipcRenderer.on('change-keyboard-enable', (_e, checked) => {
    callback(checked);
  }),
  /** @type {() => Promise<AppData.Settings>} */
  getSettings: () => ipcRenderer.invoke('get-settings'),
};

contextBridge.exposeInMainWorld('electron', electronAPI);



/**
 * @typedef {electronAPI} ElectronAPI
 */