const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    titleBarStyle: 'hiddenInset', // clean Mac look
    backgroundColor: '#060810',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Allow local file access for GLB loading
      webSecurity: false
    }
  })

  win.loadFile('index.html')

  // Open DevTools only in development
  // win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
