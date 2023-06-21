const windowStateManager = require('electron-window-state');
const { app, Tray, Menu, BrowserWindow, ipcMain, screen, clipboard } = require('electron');
const contextMenu = require('electron-context-menu');
const { TEST } = require('./lib/scripts/electron-lib/index.cjs');
const serve = require('electron-serve');
const path = require('path');
const Store = require('electron-store');
const STORE_SCHEMA = {
  enableMouse: {
    type: 'boolean',
    default: true,
  },
  enableKeyboard: {
    type: 'boolean',
    default: true,
  },
  chapterText: {
    type: 'string',
    default: '',
  },
  chapterIndex: {
    type: 'number',
    default: 0,
  },
  enableChapter: {
    type: 'boolean',
    default: false,
  },
  chapterTimer: {
    type: 'number',
    default: 0,
  },
  chapterPausedTime: {
    type: 'number',
    default: 0,
  },
  chapterLaps: {
    type: 'array',
    default: [],
  },
};
const store = new Store({
  schema: STORE_SCHEMA,
  migrations: {
    '0.0.1': (store) => { 
      store.set('debug', true);
    },
  }
});

const setChapterIndex = (index = 0) => {
  if (index < 0) index = 0;
  const last = store.get('chapterText').split('\n').length - 1;
  if (index > last) index = last;
  const current = store.get('chapterIndex');
  store.set('chapterIndex', index);
  // チャプターが進んだ場合は、その分lapタイムを追加する
  for (let i = current; i < index; i++) {
    addChapterLap();
  }
  // チャプターが戻った場合は、その分lapタイムを削除する
  for (let i = index; i < current; i++) {
    popChapterLap();
  }
  const key = 'change-chapter-index';
  sendMessage(key, index);
  chapterSettingWindow?.webContents.send(key, index);
  return {
    index,
    last,
  };
};

const startChapterTimer = () => {
  const num = store.get('chapterTimer');
  if (num === 0) {
    store.set('chapterTimer', Date.now());
    store.set('chapterLaps', []);
    store.set('chapterPausedTime', 0);
    sendMessage('change-timer-paused', false);
  }
  else {
    const pausedTime = store.get('chapterPausedTime');
    if (pausedTime !== 0) {
      const diff = Date.now() - pausedTime;
      store.set('chapterTimer', num + diff);
      store.set('chapterPausedTime', 0);
      sendMessage('change-timer-paused', false);
    }
  }
};

const pauseChapterTimer = () => {
  const num = store.get('chapterTimer');
  if (num !== 0) {
    store.set('chapterPausedTime', Date.now());
    sendMessage('change-timer-paused', true);
  }
};

const toggleChapterPause = () => {
  if (store.get('chapterPausedTime') === 0) {
    pauseChapterTimer();
  }
  else {
    startChapterTimer();
  }
};

const resetChapterTimer = () => {
  store.set('chapterTimer', 0);
  store.set('chapterPausedTime', 0);
  store.set('chapterLaps', []);
};

const addChapterLap = () => {
  const laps = store.get('chapterLaps');
  const lap = Date.now();
  let timer = store.get('chapterTimer');
  const pausedTime = store.get('chapterPausedTime');
  if (timer === 0) return;
  if (pausedTime !== 0) {
    timer += Date.now() - pausedTime;
  }
  laps.push(lap - timer);
  store.set('chapterLaps', laps);
};

const popChapterLap = () => {
  const timer = store.get('chapterTimer');
  if (timer === 0) return;
  const laps = store.get('chapterLaps');
  const lap = laps.pop();
  store.set('chapterLaps', laps);
  return lap;
};

const getCalculatedChapterLaps = () => {
  const laps = store.get('chapterLaps');
  return [0, ...laps];
};


// TODO: ファイル分けしたい
const { GlobalKeyboardListener } = require('node-global-key-listener');

if (process.platform === 'darwin') {
  // Dockを非表示にする
  app.dock.hide();
}

try {
  require('electron-reloader')(module);
} catch (e) {
  console.error(e);
}

const serveURL = serve({ directory: '.' });
const port = process.env.PORT || 5173;
const dev = !app.isPackaged;
/** @type {BrowserWindow} */
let mainWindow;
const WINDOW_PADDING = 8;

/** @type {Tray} */
let tray = null;

/**
 * send message to mainWindow
 * @param {string} key 
 * @param  {...any} args 
 */
const sendMessage = (key = '', ...args) => {
  mainWindow?.webContents.send(key, ...args);
};

app.whenReady().then(() => {
  // ipcMain handle
  {
    ipcMain.handle('get-settings', () => {
      return {
        enableMouse: store.get('enableMouse'),
        enableKeyboard: store.get('enableKeyboard'),
        enableChapter: store.get('enableChapter'),
        timerPaused: store.get('chapterPausedTime') !== 0,
      };
    });

    ipcMain.handle('get-chapter-text', () => {
      return store.get('chapterText');
    });

    ipcMain.handle('set-chapter-text', (e, text) => {
      store.set('chapterText', text);
      // text が変わったら index が最大値を超えてないかチェック
      const last = text.split('\n').length - 1;
      const index = store.get('chapterIndex');
      if (index > last) {
        store.set('chapterIndex', last);
      }
      const key = 'change-chapter-text';
      sendMessage(key, text);
      chapterSettingWindow?.webContents.send(key, text);
    });

    ipcMain.handle('get-chapter-index', () => {
      return store.get('chapterIndex');
    });

    ipcMain.handle('set-chapter-index', (e, index = 0) => {
      return setChapterIndex(index);
    });

    ipcMain.handle('add-chapter-index', (e, num = 0) => {
      return setChapterIndex(store.get('chapterIndex') + num);
    });
  }

  // tray
  {
    tray = new Tray(path.join(__dirname, '../images/tray/tray.png'));
    const menu = Menu.buildFromTemplate([
      {
        label: 'マウスクリックを表示',
        type: 'checkbox',
        click: (e) => {
          store.set('enableMouse', e.checked);
          sendMessage('change-mouse-enable', e.checked);
        },
        checked: store.get('enableMouse'),
      },

      {
        label: 'キー入力を表示',
        type: 'checkbox',
        click: (e) => {
          store.set('enableKeyboard', e.checked);
          sendMessage('change-keyboard-enable', e.checked);
        },
        checked: store.get('enableKeyboard'),
      },

      {
        label: 'チャプターテキスト設定',
        type: 'submenu',
        submenu: [
          {
            type: 'normal',
            label: 'チャプター設定画面を開く',
            click: () => {
              openChapterSettingWindow();
            },
          },
          {
            label: 'チャプターを表示',
            type: 'checkbox',
            click: (e) => {
              store.set('enableChapter', e.checked);
              sendMessage('change-chapter-enable', e.checked);
              if (e.checked) {
                startChapterTimer();
              }
              else {
                pauseChapterTimer();
              }
            },
            checked: store.get('enableChapter'),
          },
          {
            type: 'normal',
            label: '前のチャプター',
            click() {
              setChapterIndex(store.get('chapterIndex') - 1);
            },
          },
          {
            type: 'normal',
            label: '次のチャプター',
            click() {
              setChapterIndex(store.get('chapterIndex') + 1);
            },
          },
          {
            type: 'normal',
            label: 'チャプターを最初から開始する',
            click: () => {
              resetChapterTimer();
              setChapterIndex(0);
              const enableChapter = store.get('enableChapter');
              if (enableChapter) {
                startChapterTimer();
                sendMessage('change-chapter-enable', false);
                sendMessage('change-chapter-enable', true);
              }
            },
          },
          {
            type: 'normal',
            label: 'タイマー一時停止/再開',
            click: () => {
              toggleChapterPause();
            }
          },
          {
            type: 'normal',
            label: 'ラップタイム付きでチャプターテキストをコピー',
            click: () => {
              const formatTime = (time = 0, is_over_hour = false) => {
                time /= 1000;
                const hour = String(Math.floor(time / 60 / 60));
                let minute = String(Math.floor(time / 60) % 60);
                const second = String(Math.floor(time % 60)).padStart(2, '0');
                if (is_over_hour) minute = minute.padStart(2, '0');
                return is_over_hour ? `${hour}:${minute}:${second}` : `${minute}:${second}`;
              };
              const laps = getCalculatedChapterLaps();
              const is_over_hour = laps[laps.length - 1] >= 60 * 60 * 1000;
              const text = store.get('chapterText');
              const lines = text.split('\n');
              const lapText = lines.map((line, i) => {
                const lap = laps[i] || 0;
                return `${formatTime(lap, is_over_hour)} ${i + 1}. ${line}`;
              });
              clipboard.writeText(lapText.join('\n'));
            }
          }
          // {
          //   type: 'radio',
          //   label: 'hoge',
          // },
          // {
          //   type: 'radio',
          //   label: 'huga',
          // }
        ],
      },

      {
        type: 'separator',
      },
      {
        type: 'normal',
        label: '終了する',
        click: () => { app.quit(); },
      },
    ]);
    tray.setContextMenu(menu);
  }

  ipcMain.on('set-title', (e, v) => {
    console.log('set-title', e, v);
  })
  createMainWindow();

  setTimeout(() => {
    sendMessage('log', __dirname);
  }, 2000);

});
app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});
app.on('quit', () => {
  mouse.destroy();
});
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') 
  app.quit();
});

ipcMain.on('to-main', (event, count) => {
  return mainWindow.webContents.send('from-main', `next count is ${count + 1}`);
});

// global mouse hooks
const mouse = require('osx-mouse')();
{
  
  // move, left-down, left-up, left-drag, right-up, right-down and right-drag.
  // mouse.on('move', (x, y) => {
  //   console.log(x, y)
  // });

  const MOUSE_EVENT_NAME = 'global-mouse';

  const types = [
    'down',
    'up',
    'drag',
  ];

  const positions = [
    'left',
    'right',
    // 'middle',
  ];

  types.forEach(type => {
    positions.forEach(position => {
      mouse.on(`${position}-${type}`, (x, y) => { 
        sendMessage(MOUSE_EVENT_NAME, {
          position,
          type,
          x: x + WINDOW_PADDING,
          y: y + WINDOW_PADDING,
        })
      })
    })
  });
}

// keyboard hooks
{

  const key_map = require('native-keymap');
  // console.log(key_map.getKeyMap());
  // setTimeout(() => {
  //   sendMessage('log', Object.keys(key_map.getKeyMap()).join(', '));
  // }, 5000);
  // console.log(key_map.)
  // console.log(key_map.getCurrentKeyboardLayout());

  const gkl = new GlobalKeyboardListener({
    mac: {
      serverPath: app.isPackaged ?
        path.join(__dirname, '../../app.asar.unpacked/node_modules/node-global-key-listener/bin/MacKeyServer') :
        path.join(__dirname, '../node_modules/node-global-key-listener/bin/MacKeyServer'),
    }
  });
  gkl.addListener((e, down) => {
    // console.log(e, down);
    // console.log(
    //   `${e.name} ${e.state == "DOWN" ? "DOWN" : "UP  "} [${e.rawKey?._nameRaw}]`
    // );
    sendMessage('global-key', e, down);
  });

  gkl.addListener((e, down) => {
    if (e.name === 'P' && e.state === 'DOWN'
      && (down['RIGHT ALT'] || down['LEFT ALT'])
      && (down['RIGHT CTRL'] || down['LEFT CTRL'])
    ) {
      toggleChapterPause();
    }
  });

}

// keyboard 設定
// app.whenReady().then(() => {
//   // Register a 'CommandOrControl+X' shortcut listener.
//   const ret = globalShortcut.register('CommandOrControl+X', () => {
//     console.log('CommandOrControl+X is pressed')
//   })

//   if (!ret) {
//     console.log('registration failed')
//   }

//   // Check whether a shortcut is registered.
//   console.log(globalShortcut.isRegistered('CommandOrControl+X'))
// })

// app.on('will-quit', () => {
//   // Unregister a shortcut.
//   globalShortcut.unregister('CommandOrControl+X')

//   // Unregister all shortcuts.
//   globalShortcut.unregisterAll()
// })

function createWindow() {
  const primary_display = screen.getPrimaryDisplay();
  const displaySize = primary_display.size;
  console.log(displaySize);
  console.log(primary_display.workArea);
  // let windowState = windowStateManager({
  //   defaultWidth: displaySize.width,
  //   defaultHeight: displaySize.height,
  // });

  const mainWindow = new BrowserWindow({
    // alwaysOnTop: true,
    hiddenInMissionControl: true,
    type: 'panel',
    // acceptFirstMouse: true,
    enableLargerThanScreen: true,
    // roundedCorners: false,
    // thickFrame: false,
    // autoHideMenuBar: true,
    // backgroundColor: 'white',
    titleBarStyle: 'hidden',
    // autoHideMenuBar: true,
    movable: false,
    resizable: false,
    transparent: true,
    frame: false,
    fullscreen: false,
    // simpleFullscreen:true,
    fullscreenable: false,
    hasShadow: false,
    // minHeight: 450,
    // minWidth: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      enableRemoteModule: true,
      contextIsolation: true,
      nodeIntegration: true,
      spellcheck: false,
      devTools: dev,
      // preload: path.join(__dirname, 'preload.cjs'),
    },
    // x: windowState.x,
    // y: windowState.y,
    // width: windowState.width,
    // height: windowState.height,
    x: -WINDOW_PADDING,
    y: -WINDOW_PADDING,
    width: displaySize.width + WINDOW_PADDING * 2,
    height: displaySize.height + WINDOW_PADDING * 2,
  });

  // windowState.manage(mainWindow);
  
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    // skipTransformProcessType: true
  });

  mainWindow.setIgnoreMouseEvents(true, {
    // mouseenter , mouseleave を発火させるのに必要
    forward: true,
  });

  mainWindow.setWindowButtonVisibility(false);

  // mainWindow.setFocusable(false);
  
  // mainWindow.maximize();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // mainWindow.on('close', () => {
  //   windowState.saveState(mainWindow);
  // });
  
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  // mainWindow.setMinimizable(false);

  return mainWindow;
}

contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  prepend: (defaultActions, params, browserWindow) => [
    {
      label: 'Make App 💻',
      click: () => {
        mainWindow.webContents.openDevTools();
      }
    },
  ],
});

function loadVite(port) {
  mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
    console.log('Error loading URL, retrying', e);
    setTimeout(() => {
      loadVite(port);
    }, 200);
  });
}

function createMainWindow() {
  mainWindow = createWindow();
  mainWindow.once('close', () => {
    mainWindow = null;
  });

  if (dev) loadVite(port);
  else serveURL(mainWindow);
}


// チャプター設定の実装
/** @type {BrowserWindow} */
let chapterSettingWindow;
const CHAPTER_SETTING_PATH = 'chapter-setting';

function loadChapterSettingVite(port) {
  chapterSettingWindow.loadURL(`http://localhost:${port}/${CHAPTER_SETTING_PATH}`).catch((e) => {
    console.log('Error loading URL, retrying', e);
    setTimeout(() => {
      loadChapterSettingVite(port);
    }, 200);
  });
}

function openChapterSettingWindow() {
  if (chapterSettingWindow) {
    chapterSettingWindow.focus();
    return;
  }
  chapterSettingWindow = createChapterSettingWindow();
  chapterSettingWindow.once('close', () => {
    chapterSettingWindow = null;
  });

  if (dev) loadChapterSettingVite(port);
  else chapterSettingWindow.loadFile(`./${CHAPTER_SETTING_PATH}.html`);
}

function createChapterSettingWindow() {
  const primary_display = screen.getPrimaryDisplay();
  const displaySize = primary_display.size;
  console.log(displaySize);
  console.log(primary_display.workArea);
  // let windowState = windowStateManager({
  //   defaultWidth: displaySize.width,
  //   defaultHeight: displaySize.height,
  // });

  const WIDTH = 400;
  const HEIGHT = 500;

  const chapterSettingWindow = new BrowserWindow({
    // alwaysOnTop: true,
    // hiddenInMissionControl: true,
    // type: 'panel',
    // acceptFirstMouse: true,
    // enableLargerThanScreen: true,
    // roundedCorners: false,
    // thickFrame: false,
    // autoHideMenuBar: true,
    // backgroundColor: 'white',
    // titleBarStyle: 'hidden',
    // autoHideMenuBar: true,
    // movable: false,
    // resizable: false,
    // transparent: true,
    // frame: false,
    fullscreen: false,
    // simpleFullscreen:true,
    fullscreenable: false,
    // hasShadow: false,
    // minHeight: 450,
    // minWidth: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      enableRemoteModule: true,
      contextIsolation: true,
      nodeIntegration: true,
      spellcheck: false,
      devTools: dev,
      // preload: path.join(__dirname, 'preload.cjs'),
    },
    // x: windowState.x,
    // y: windowState.y,
    // width: windowState.width,
    // height: windowState.height,
    x: displaySize.width / 2 - WIDTH / 2,
    y: displaySize.height / 2 - HEIGHT / 2,
    width: WIDTH,
    height: HEIGHT,
  });

  chapterSettingWindow.title = 'チャプター設定';
  
  chapterSettingWindow.once('ready-to-show', () => {
    chapterSettingWindow.show();
    chapterSettingWindow.focus();
  });

  chapterSettingWindow.setAlwaysOnTop(true, 'pop-up-menu');

  // mainWindow.on('close', () => {
  //   windowState.saveState(mainWindow);
  // });

  return chapterSettingWindow;
}