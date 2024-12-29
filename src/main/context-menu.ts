import { Menu, ipcMain, BrowserWindow, screen, MenuItemConstructorOptions, app } from 'electron'

export function setupContextMenu(onModeChange: (mode: 'window' | 'pet') => void) {
  ipcMain.on('show-context-menu', (event, { micOn }) => {
    console.log('Received micOn state in main process:', micOn)
    const win = BrowserWindow.fromWebContents(event.sender)
    
    if (win) {
      const screenPoint = screen.getCursorScreenPoint()

      const template: MenuItemConstructorOptions[] = [
        {
          label: micOn ? 'Turn Off Microphone' : 'Turn On Microphone',
          click: () => {
            event.sender.send('mic-toggle')
          }
        },
        {
          label: 'Interrupt',
          click: () => {
            event.sender.send('interrupt')
          }
        },
        {
          label: 'Switch to Window Mode',
          click: () => {
            onModeChange('window')
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => {
            app.quit()
          }
        }
      ]

      const menu = Menu.buildFromTemplate(template)
      menu.popup({
        window: win,
        x: Math.round(screenPoint.x),
        y: Math.round(screenPoint.y)
      })
    }
  })
} 