const windowStateManager = require('electron-window-state');
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const contextMenu = require('electron-context-menu');
const serve = require('electron-serve');
const path = require('path');

try {
  require('electron-reloader')(module);
} catch (e) {
  console.error(e);
}

const serveURL = serve({ directory: '.' });
const port = process.env.PORT || 5173;
const dev = !app.isPackaged;
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
    trafficLightPosition: {
      x: 1,
      y: 3,
    },
    minHeight: 450,
    minWidth: 500,
    webPreferences: {
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

app.once('ready', createMainWindow);
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