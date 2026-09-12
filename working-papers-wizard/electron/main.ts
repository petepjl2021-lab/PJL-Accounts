import { app, BrowserWindow, shell, Menu, session } from 'electron'
import path from 'path'
import fs from 'fs'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const isDev = process.env.NODE_ENV !== 'production'
let mainWindow: BrowserWindow | null = null

async function getAvailablePort(start = 3100): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(start, () => {
      const addr = server.address() as { port: number }
      server.close(() => resolve(addr.port))
    })
    server.on('error', () => getAvailablePort(start + 1).then(resolve).catch(reject))
  })
}

async function startNextServer(): Promise<number> {
  const port = await getAvailablePort()
  const appDir = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app')

  const nextApp = next({ dev: isDev, dir: appDir, port })
  const handle = nextApp.getRequestHandler()

  await nextApp.prepare()

  return new Promise((resolve) => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url ?? '/', true)
      handle(req, res, parsedUrl)
    }).listen(port, () => {
      resolve(port)
    })
  })
}

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/dashboard`),
        },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}

// When exporting a working papers file, the browser layer appends
// ?folder=<encoded path> to the download link using the client's saved
// folder path. If that folder exists on disk, save straight there instead
// of showing a native dialog every time.
function wireDownloadHandler() {
  session.defaultSession.on('will-download', (_event, item) => {
    try {
      const parsed = new URL(item.getURL())
      const folder = parsed.searchParams.get('folder')
      const filename = item.getFilename()
      if (folder && fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
        item.setSavePath(path.join(folder, filename))
        return
      }
    } catch {
      // fall through to the default Save As dialog
    }
    item.setSaveDialogOptions({ defaultPath: item.getFilename() })
  })
}

async function createWindow() {
  const port = isDev ? 3100 : await startNextServer()
  ;(app as any).__port = port

  Menu.setApplicationMenu(buildMenu())
  wireDownloadHandler()

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'WP Wizard',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
    backgroundColor: '#042f2c',
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    let retries = 0
    const tryLoad = () => {
      const req = require('http').get(`http://localhost:${port}/`, (res: any) => {
        if (res.statusCode === 200 || res.statusCode === 302) {
          mainWindow?.loadURL(`http://localhost:${port}/`)
        } else if (retries < 30) {
          retries++
          setTimeout(tryLoad, 1000)
        }
      })
      req.on('error', () => {
        if (retries < 30) {
          retries++
          setTimeout(tryLoad, 1000)
        }
      })
    }
    tryLoad()
  } else {
    await mainWindow.loadURL(`http://localhost:${port}/`)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
