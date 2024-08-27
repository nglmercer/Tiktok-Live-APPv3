import { BrowserWindow, ipcMain } from "electron";
import path, { join } from "path";
let overlayWindow;
function createOverlayWindow() {
  if (!overlayWindow) {
    overlayWindow = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: false,  // Configura la ventana en pantalla completa
        frame: false,
        transparent: true,
        // alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false,
            // preload: join(__dirname, "../preload/index.mjs"),
            webSecurity: false,
        }
    });
    overlayWindow.webContents.setFrameRate(30)
    overlayWindow.loadFile(join(__dirname, '../renderer/overlay.html'));
    // overlayWindow.loadURL(`http://localhost:5173/overlay.html`);
    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });

    overlayWindow.once('ready-to-show', () => {
        overlayWindow.webContents.send('show-message', 'Hola desde el proceso principal!');
    });
}

// overlayWindow.setIgnoreMouseEvents(true);
// overlayWindow.on('mousedown', (event) => {
//     overlayWindow.setIgnoreMouseEvents(true);
// });
// overlayWindow.on('mouseup', (event) => {
//     overlayWindow.setIgnoreMouseEvents(true);
// });
// overlayWindow.on('focus', (event) => {
//     overlayWindow.setIgnoreMouseEvents(true);
// });
return overlayWindow;
}
function sendoverlaydata({ eventType, data, options }) {
  if (overlayWindow) {
    overlayWindow.webContents.send('overlay-event', { eventType, data, options });
    console.log('Overlay event sent', eventType, data, options);
    return { success: true };
  } else {
      return { success: false, error: 'Overlay window not created yet' };
  }
}
ipcMain.handle('send-overlay-data', (_, { eventType, data, options }) => {
  if (overlayWindow) {
      overlayWindow.webContents.send('overlay-event', { eventType, data, options });
      console.log('Overlay event sent', eventType, data, options);
      return { success: true };
  } else {
      return { success: false, error: 'Overlay window not created yet' };
  }
});
export { createOverlayWindow, sendoverlaydata };
