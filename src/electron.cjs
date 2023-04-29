const windowStateManager = require('electron-window-state');
const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const contextMenu = require('electron-context-menu');
const serve = require('electron-serve');
const path = require('path');

const { GlobalKeyboardListener } = require('node-global-key-listener');

const sendMessage = (key = '', ...args) => {
  mainWindow?.webContents.send(key, ...args);
};

// keyboard hooks
{
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

function createWindow() {
  const displaySize = screen.getPrimaryDisplay().size;
  console.log(displaySize);
  let windowState = windowStateManager({
    defaultWidth: displaySize.width,
    defaultHeight: displaySize.height,
  });

  const mainWindow = new BrowserWindow({
    backgroundColor: 'whitesmoke',
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    movable: false,
    resizable: false,
    trafficLightPosition: {
      x: -100,
      y: 0,
    },
    frame: false,
    fullscreen: false,
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
    x: 0,
    y: 0,
    width: displaySize.width,
    height: displaySize.height,
  });

  windowState.manage(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', () => {
    windowState.saveState(mainWindow);
  });

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

app.whenReady().then(() => {
  ipcMain.on('set-title', (e,v) => {
    console.log('set-title',e,v);
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
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('to-main', (event, count) => {
  return mainWindow.webContents.send('from-main', `next count is ${count + 1}`);
});