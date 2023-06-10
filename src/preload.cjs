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
  onChangeChapterEnable: (/** @type {(enable: boolean) => void} */ callback) => ipcRenderer.on('change-chapter-enable', (_e, checked) => {
    callback(checked);
  }),
  onChangeTimerPaused: (/** @type {(enable: boolean) => void} */ callback) => ipcRenderer.on('change-timer-paused', (_e, paused) => {
    callback(paused);
  }),
  onChangeChapterText: (/** @type {(text: string) => void} */ callback) => ipcRenderer.on('change-chapter-text', (_e, text) => {
    callback(text);
  }),
  onChangeChapterIndex: (/** @type {(index: number) => void} */ callback) => ipcRenderer.on('change-chapter-index', (_e, index) => {
    callback(index);
  }),
  /** @type {() => Promise<AppData.Settings>} */
  getSettings: () => ipcRenderer.invoke('get-settings'),
  /** @type {() => Promise<string>} */
  getChapterText: () => ipcRenderer.invoke('get-chapter-text'),
  /** @type {(text: string) => Promise<void>} */
  setChapterText: (text = '') => ipcRenderer.invoke('set-chapter-text', text),
  /** @type {() => Promise<number>} */
  getChapterIndex: () => ipcRenderer.invoke('get-chapter-index'),
  /** @type {(index: number) => Promise<{last:number; index: number;}>} */
  setChapterIndex: (index = 0) => ipcRenderer.invoke('set-chapter-index', index),
  /** @type {(index: number) => Promise<{last:number; index: number;}>} */
  addChapterIndex: (num = 0) => ipcRenderer.invoke('add-chapter-index', num),
};

contextBridge.exposeInMainWorld('electron', electronAPI);



/**
 * @typedef {electronAPI} ElectronAPI
 */