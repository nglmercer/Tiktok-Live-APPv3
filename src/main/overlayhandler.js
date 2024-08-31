// import { BrowserWindow } from "electron";
// import path, { join } from "path";
// let overlayWindow;
// function createOverlayWindow() {
//   if (!overlayWindow) {
//     overlayWindow = new BrowserWindow({
//         // width: 800,
//         // height: 600,
//         fullscreen: true,  // Configura la ventana en pantalla completa
//         frame: false,
//         transparent: true,
//         alwaysOnTop: true,
//         webPreferences: {
//             nodeIntegration: false,
//             // preload: join(__dirname, "../preload/index.mjs"),
//             webSecurity: false,
//         }
//     });
//     overlayWindow.webContents.setFrameRate(30)
//     overlayWindow.loadFile(join(__dirname, '../renderer/overlay.html'));
//     // overlayWindow.loadURL(`http://localhost:5173/overlay.html`);
//     overlayWindow.on('closed', () => {
//         overlayWindow = null;
//     });

//     overlayWindow.once('ready-to-show', () => {
//         overlayWindow.webContents.send('show-message', 'Hola desde el proceso principal!');
//     });
// }

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
// return overlayWindow;
// }

// export { createOverlayWindow };
