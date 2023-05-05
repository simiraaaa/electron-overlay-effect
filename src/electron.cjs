const windowStateManager = require('electron-window-state');
const { app, Tray, Menu, BrowserWindow, ipcMain, screen } = require('electron');
const contextMenu = require('electron-context-menu');
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
};
const store = new Store({
  schema: STORE_SCHEMA,
  migrations: {
    '0.0.1': (store) => { 
      store.set('debug', true);
    },
  }
});

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

// tray
let tray = null;

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
      };
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
        label: 'サブメニューテスト',
        type: 'submenu',
        submenu: [
          {
            type: 'radio',
            label: 'hoge',
          },
          {
            type: 'radio',
            label: 'huga',
          }
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
  })

  mainWindow.setIgnoreMouseEvents(true);

  mainWindow.setWindowButtonVisibility(false);

  mainWindow.setFocusable(false);
  
  // mainWindow.maximize();

  // mainWindow.once('ready-to-show', () => {
  //   mainWindow.show();
  //   mainWindow.focus();
  // });

  // mainWindow.on('close', () => {
  //   windowState.saveState(mainWindow);
  // });
  
  mainWindow.setAlwaysOnTop(true, "screen-saver");

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
