import { app, BrowserWindow, shell, Menu } from 'electron'
import path from 'path'
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
  const appDir = isDev
    ? path.join(__dirname, '..')
    : path.join(process.resourcesPath, 'app')

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
      submenu: [
        {
          label: 'Sign Out',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/signin`),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
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
        {
          label: 'Clients',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/clients`),
        },
        {
          label: 'Prospects',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/prospects`),
        },
        {
          label: 'Onboarding',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/onboarding`),
        },
        {
          label: 'HMRC Auth',
          accelerator: 'CmdOrCtrl+5',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/hmrc`),
        },
        {
          label: 'Tax Returns',
          accelerator: 'CmdOrCtrl+6',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/tax-returns`),
        },
        {
          label: 'Tasks',
          accelerator: 'CmdOrCtrl+7',
          click: () => mainWindow?.loadURL(`http://localhost:${(app as any).__port}/tasks`),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About PJL Accounts',
          click: () => {
            // Show version info
          },
        },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}

async function createWindow() {
  const port = isDev ? 3000 : await startNextServer()
  ;(app as any).__port = port

  Menu.setApplicationMenu(buildMenu())

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'PJL Accounts',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false, // Show once ready to avoid white flash
    backgroundColor: '#0f172a', // Match sidebar colour while loading
  })

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Wait for next server in dev mode (already started externally)
  if (isDev) {
    // Poll until Next.js dev server is ready
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
